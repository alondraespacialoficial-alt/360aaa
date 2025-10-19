import { supabase } from './supabaseClient';

// Configuración de la IA
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Tipos TypeScript
interface AISettings {
  is_enabled: boolean;
  daily_budget_usd: number;
  monthly_budget_usd: number;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  max_tokens_per_question: number;
  max_conversation_length: number;
  welcome_message: string;
}

interface AIUsage {
  session_id: string;
  user_ip: string;
  user_id?: string;
  question: string;
  response: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  processing_time_ms: number;
}

interface RateLimitResult {
  allowed: boolean;
  current_count?: number;
  limit?: number;
  window_reset?: string;
  error?: string;
}

// Cache para respuestas comunes (evitar tokens innecesarios)
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Preguntas frecuentes con respuestas pre-definidas
const FAQ_RESPONSES: Record<string, string> = {
  'hola': '¡Hola! 👋 Bienvenido a Charlitron Eventos 360. Puedo ayudarte a encontrar proveedores de eventos. ¿Qué tipo de servicio necesitas?',
  'ayuda': 'Puedo ayudarte con: 🔍 Buscar proveedores, ⭐ Ver reseñas y calificaciones, 💰 Comparar precios, 📍 Encontrar proveedores por ubicación. ¿Qué necesitas?',
  'horarios': 'Nuestro directorio está disponible 24/7. Los proveedores tienen sus propios horarios de atención que puedes consultar en sus perfiles.',
  'costo': 'El directorio de Charlitron Eventos 360 es completamente gratuito para usuarios. Los precios de servicios varían por proveedor.',
  'como funciona': 'Charlitron Eventos 360 es un directorio de proveedores de eventos verificados. Puedes buscar por categoría, ubicación, ver reseñas y contactar directamente a los proveedores.',
};

class AIAssistantService {
  private sessionId: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private getCacheKey(question: string): string {
    return question.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').slice(0, 50);
  }

  private isInCache(question: string): string | null {
    const key = this.getCacheKey(question);
    const cached = responseCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.response;
    }
    
    return null;
  }

  private addToCache(question: string, response: string): void {
    const key = this.getCacheKey(question);
    responseCache.set(key, { response, timestamp: Date.now() });
  }

  private getFAQResponse(question: string): string | null {
    const lowerQuestion = question.toLowerCase();
    
    for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerQuestion.includes(key)) {
        return response;
      }
    }
    
    return null;
  }

  private async getAISettings(): Promise<AISettings> {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      // Configuración por defecto si no hay en BD
      return {
        is_enabled: true,
        daily_budget_usd: 2.00,
        monthly_budget_usd: 50.00,
        rate_limit_per_minute: 2,
        rate_limit_per_hour: 3,
        rate_limit_per_day: 5,
        max_tokens_per_question: 300,
        max_conversation_length: 10,
        welcome_message: '¡Hola! Soy tu asistente virtual de Charlitron Eventos 360. ¿En qué puedo ayudarte?'
      };
    }

    return data;
  }

  private async checkRateLimit(userIdentifier: string, identifierType: 'ip' | 'user_id'): Promise<RateLimitResult> {
    try {
      // Verificar límites para minuto, hora y día
      const windows = ['minute', 'hour', 'day'];
      
      for (const window of windows) {
        const { data, error } = await supabase.rpc('check_ai_rate_limit', {
          p_user_identifier: userIdentifier,
          p_identifier_type: identifierType,
          p_window_type: window
        });

        if (error) {
          console.error('Error checking rate limit:', error);
          continue;
        }

        if (!data.allowed) {
          return data;
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // En caso de error, permitir (fail-open)
      return { allowed: true };
    }
  }

  private async buildDynamicContext(): Promise<string> {
    try {
      // Obtener datos en tiempo real de Supabase
      const [
        { data: providers },
        { data: categories }, 
        { data: reviews },
        { data: recentAnalytics },
        { data: services }
      ] = await Promise.all([
        supabase.from('providers').select('id, name, city, is_premium, featured, description, whatsapp').eq('is_active', true),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('provider_reviews').select('provider_id, rating, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('provider_analytics').select('provider_id, event_type').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).limit(100),
        supabase.from('provider_services').select('provider_id, category_id, service_name, price_range, description').limit(200)
      ]);

      // Calcular estadísticas
      const totalProviders = providers?.length || 0;
      const categoriesCount = categories?.length || 0;
      const totalReviews = reviews?.length || 0;
      
      // Calcular promedios de rating por proveedor
      const ratingsByProvider: Record<string, number[]> = {};
      reviews?.forEach(review => {
        if (!ratingsByProvider[review.provider_id]) {
          ratingsByProvider[review.provider_id] = [];
        }
        ratingsByProvider[review.provider_id].push(review.rating);
      });

      const topRatedProviders = Object.entries(ratingsByProvider)
        .map(([providerId, ratings]) => ({
          providerId,
          avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          reviewCount: ratings.length
        }))
        .filter(p => p.reviewCount >= 2)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5);

      // Proveedores más visitados (última semana)
      const visitsByProvider: Record<string, number> = {};
      recentAnalytics?.forEach(event => {
        if (event.event_type === 'profile_view') {
          visitsByProvider[event.provider_id] = (visitsByProvider[event.provider_id] || 0) + 1;
        }
      });

      const mostVisited = Object.entries(visitsByProvider)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      // Obtener nombres de proveedores para las estadísticas
      const providerNames: Record<string, string> = {};
      providers?.forEach(p => {
        providerNames[p.id] = p.name;
      });

      // Ciudades disponibles
      const cities = [...new Set(providers?.map(p => p.city).filter(Boolean))];

      // Agrupar servicios por categoría con precios
      const servicesByCategory: Record<string, Array<{ provider_name: string; service: string; price_range: string; city: string }>> = {};
      services?.forEach(service => {
        const provider = providers?.find(p => p.id === service.provider_id);
        if (provider && service.price_range) {
          const categoryName = categories?.find(c => c.id === service.category_id)?.name || 'Otros';
          if (!servicesByCategory[categoryName]) {
            servicesByCategory[categoryName] = [];
          }
          servicesByCategory[categoryName].push({
            provider_name: provider.name,
            service: service.service_name || service.description || 'Servicio',
            price_range: service.price_range,
            city: provider.city || 'No especificada'
          });
        }
      });

      return `
CHARLITRON EVENTOS 360 - DIRECTORIO DE PROVEEDORES
=================================================

ESTADÍSTICAS ACTUALES:
- Total de proveedores activos: ${totalProviders}
- Categorías disponibles: ${categoriesCount}
- Total de reseñas: ${totalReviews}
- Ciudades con proveedores: ${cities.join(', ')}

CATEGORÍAS DISPONIBLES:
${categories?.map(c => `- ${c.name} (${c.slug})`).join('\n') || 'No hay categorías'}

IMPORTANTE - ESPECIALIDADES POR CATEGORÍA:
🎥 VIDEO/FOTOGRAFÍA: Bodas, eventos, corporativos, quinceañeras
🎵 MÚSICA/DJ: DJs, sonido, grupos musicales, mariachis
🍽️ BANQUETES/CATERING: Comida, bebidas, servicio de meseros
🎪 DECORACIÓN: Flores, centros de mesa, ambientación, mobiliario
🎂 REPOSTERÍA: Pasteles, dulces, candy bar, postres
🚌 TRANSPORTE: Camiones, autos, limousinas
🏨 VENUES: Salones, jardines, hoteles para eventos

PROVEEDORES MEJOR CALIFICADOS:
${topRatedProviders.map(p => `- ${providerNames[p.providerId] || 'Proveedor'}: ${p.avgRating.toFixed(1)}⭐ (${p.reviewCount} reseñas)`).join('\n') || 'No hay suficientes reseñas'}

PROVEEDORES MÁS VISITADOS (última semana):
${mostVisited.map(([id, visits]) => `- ${providerNames[id] || 'Proveedor'}: ${visits} visitas`).join('\n') || 'No hay datos de visitas'}

CIUDADES PRINCIPALES: ${cities.slice(0, 5).join(', ')}

PROVEEDORES Y SERVICIOS POR CATEGORÍA:
${Object.entries(servicesByCategory).slice(0, 5).map(([category, serviceList]) => 
  `${category.toUpperCase()}:
${serviceList.slice(0, 3).map(s => `- ${s.provider_name} (${s.city}): ${s.service} - ${s.price_range}`).join('\n')}`
).join('\n\n') || 'Información de servicios no disponible'}

RANGOS DE PRECIOS TÍPICOS:
🎥 Video/Fotografía: $2,000 - $15,000 MXN
🎵 Música/DJ: $1,500 - $8,000 MXN  
🍽️ Banquetes: $150 - $500 MXN por persona
🎪 Decoración: $3,000 - $20,000 MXN
🎂 Repostería: $800 - $5,000 MXN

SERVICIOS PLATFORM:
- Búsqueda de proveedores por categoría y ubicación
- Reseñas y calificaciones verificadas
- Información de contacto directo (WhatsApp, teléfono)
- Galería de trabajos de cada proveedor
- Comparación de servicios y precios

INSTRUCCIONES PARA EL ASISTENTE:
- Responde siempre en español de México
- SÉ BREVE Y CONCISO: Máximo 3-4 líneas por respuesta
- Usa emojis para hacer las respuestas más atractivas
- CUANDO PREGUNTEN POR PRESUPUESTO: Menciona rangos específicos basados en la info disponible
- CUANDO PREGUNTEN POR UBICACIÓN: Filtra proveedores de esa ciudad específica
- Si solicitan presupuesto + ubicación: Da 2-3 recomendaciones específicas de esa ciudad con rangos de precio
- Incluye una llamada a la acción para contactar proveedores
- Si no tienes datos exactos, da rangos aproximados pero indica que contacten para cotización
- NO des explicaciones largas ni contexto extra
`;
    } catch (error) {
      console.error('Error building context:', error);
      return `
CHARLITRON EVENTOS 360 - DIRECTORIO DE PROVEEDORES
=================================================

Soy el asistente virtual de Charlitron Eventos 360, un directorio de proveedores de eventos verificados en México.

Puedo ayudarte con:
- Búsqueda de proveedores por categoría (banquetes, fotografía, decoración, música, etc.)
- Información sobre reseñas y calificaciones
- Recomendaciones personalizadas
- Datos de contacto y ubicación de proveedores

¿En qué puedo ayudarte hoy?
`;
    }
  }

  private async callGeminiAPI(prompt: string, context: string): Promise<{ response: string; tokensUsed: { input: number; output: number } }> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    // Detectar si la pregunta incluye presupuesto, ubicación y categoría
    const hasBudget = /\$\d+|\d+\s*(pesos?|mx|mxn|mil|miles)/i.test(prompt);
    const hasLocation = /en\s+[\w\s]+|de\s+[\w\s]+|potosí|guadalajara|cdmx|méxico|monterrey/i.test(prompt);
    const hasCategory = /(video|fotograf|music|dj|banquet|catering|decorac|pastel|flores|sonido)/i.test(prompt);
    
    let specificInstructions = '';
    if (hasBudget && hasLocation && hasCategory) {
      specificInstructions = '\n\nESPECIAL: El usuario menciona presupuesto, ubicación Y categoría específica. SOLO recomienda proveedores que coincidan EXACTAMENTE con esa categoría en esa ciudad con ese presupuesto. NO recomiendes proveedores de otras categorías.';
    } else if (hasBudget && hasLocation) {
      specificInstructions = '\n\nESPECIAL: El usuario menciona presupuesto Y ubicación. Da 2-3 recomendaciones específicas de proveedores de esa ciudad con rangos de precio que se ajusten a su presupuesto. Sé muy específico y práctico.';
    } else if (hasCategory) {
      specificInstructions = '\n\nESPECIAL: El usuario busca una categoría específica. SOLO recomienda proveedores de esa categoría exacta, no de otras.';
    } else if (hasBudget) {
      specificInstructions = '\n\nESPECIAL: El usuario menciona un presupuesto. Recomienda opciones que se ajusten a ese rango de precio específico.';
    } else if (hasLocation) {
      specificInstructions = '\n\nESPECIAL: El usuario pregunta por una ubicación específica. Filtra solo proveedores de esa ciudad.';
    }

    const fullPrompt = `${context}\n\nPREGUNTA DEL USUARIO: ${prompt}${specificInstructions}\n\nResponde de manera útil, amigable y específica usando la información del contexto. Máximo 300 caracteres.`;

    const requestBody = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Error de la API de Gemini: ${response.status}`);
    }

    const data = await response.json();
    
    // Validación más robusta de la respuesta
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('❌ Error: No hay candidatos en la respuesta:', data);
      throw new Error('No se recibieron candidatos de respuesta de Gemini');
    }

    const candidate = data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('❌ Error: Estructura de respuesta inválida:', candidate);
      throw new Error('Estructura de respuesta inválida de Gemini');
    }

    const textPart = candidate.content.parts[0];
    if (!textPart || !textPart.text) {
      console.error('❌ Error: No hay texto en la respuesta:', textPart);
      throw new Error('No se recibió texto en la respuesta de Gemini');
    }

    const generatedText = textPart.text;
    
    // Estimar tokens (aproximación: 1 token ≈ 4 caracteres)
    const inputTokens = Math.ceil(fullPrompt.length / 4);
    const outputTokens = Math.ceil(generatedText.length / 4);

    return {
      response: generatedText,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens
      }
    };
  }

  private calculateCost(tokensInput: number, tokensOutput: number): number {
    // Precios de Gemini 1.5 Flash (aproximados)
    const inputCostPer1K = 0.00015;  // $0.15 per 1M tokens
    const outputCostPer1K = 0.0006;  // $0.60 per 1M tokens
    
    const inputCost = (tokensInput / 1000) * inputCostPer1K;
    const outputCost = (tokensOutput / 1000) * outputCostPer1K;
    
    return inputCost + outputCost;
  }

  private async logUsage(usage: Omit<AIUsage, 'cost_usd'> & { cost_usd?: number }): Promise<void> {
    try {
      await supabase.rpc('log_ai_usage', {
        p_session_id: usage.session_id,
        p_user_ip: usage.user_ip,
        p_user_id: usage.user_id || null,
        p_question: usage.question,
        p_response: usage.response,
        p_tokens_input: usage.tokens_input,
        p_tokens_output: usage.tokens_output,
        p_cost_usd: usage.cost_usd || 0,
        p_processing_time_ms: usage.processing_time_ms
      });
    } catch (error) {
      console.error('Error logging AI usage:', error);
    }
  }

  async askQuestion(
    question: string,
    userIP: string,
    userId?: string
  ): Promise<{ response: string; usage: AIUsage }> {
    const startTime = Date.now();

    try {
      // 1. Verificar si la IA está habilitada
      const settings = await this.getAISettings();
      if (!settings.is_enabled) {
        throw new Error('El asistente virtual está temporalmente no disponible. Inténtalo más tarde.');
      }

      // 2. Verificar rate limits
      const rateLimitResult = await this.checkRateLimit(userIP, 'ip');
      if (!rateLimitResult.allowed) {
        const resetTime = rateLimitResult.window_reset ? new Date(rateLimitResult.window_reset) : new Date();
        const minutesUntilReset = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60)));
        
        let timeMessage = '';
        if (minutesUntilReset <= 60) {
          timeMessage = `${minutesUntilReset} minuto${minutesUntilReset > 1 ? 's' : ''}`;
        } else {
          const hours = Math.ceil(minutesUntilReset / 60);
          timeMessage = `${hours} hora${hours > 1 ? 's' : ''}`;
        }
        
        throw new Error(`Has alcanzado el límite de preguntas. Inténtalo nuevamente en ${timeMessage}.`);
      }

      // 3. Verificar cache
      const cachedResponse = this.isInCache(question);
      if (cachedResponse) {
        const usage: AIUsage = {
          session_id: this.sessionId,
          user_ip: userIP,
          user_id: userId,
          question,
          response: cachedResponse,
          tokens_input: 0,
          tokens_output: 0,
          cost_usd: 0,
          processing_time_ms: Date.now() - startTime
        };
        
        await this.logUsage(usage);
        return { response: cachedResponse, usage };
      }

      // 4. Verificar FAQ
      const faqResponse = this.getFAQResponse(question);
      if (faqResponse) {
        this.addToCache(question, faqResponse);
        
        const usage: AIUsage = {
          session_id: this.sessionId,
          user_ip: userIP,
          user_id: userId,
          question,
          response: faqResponse,
          tokens_input: 0,
          tokens_output: 0,
          cost_usd: 0,
          processing_time_ms: Date.now() - startTime
        };
        
        await this.logUsage(usage);
        return { response: faqResponse, usage };
      }

      // 5. Validar longitud de pregunta
      if (question.length > settings.max_tokens_per_question * 4) {
        throw new Error('Tu pregunta es muy larga. Por favor, hazla más específica.');
      }

      // 6. Construir contexto dinámico
      const context = await this.buildDynamicContext();

      // 7. Llamar a Gemini API
      const { response, tokensUsed } = await this.callGeminiAPI(question, context);
      
      // 8. Calcular costo
      const cost = this.calculateCost(tokensUsed.input, tokensUsed.output);

      // 9. Agregar al cache
      this.addToCache(question, response);

      // 10. Registrar uso
      const usage: AIUsage = {
        session_id: this.sessionId,
        user_ip: userIP,
        user_id: userId,
        question,
        response,
        tokens_input: tokensUsed.input,
        tokens_output: tokensUsed.output,
        cost_usd: cost,
        processing_time_ms: Date.now() - startTime
      };

      await this.logUsage(usage);

      return { response, usage };

    } catch (error: any) {
      console.error('AI Assistant error:', error);
      
      // Registrar error también
      const errorUsage: AIUsage = {
        session_id: this.sessionId,
        user_ip: userIP,
        user_id: userId,
        question,
        response: `Error: ${error.message}`,
        tokens_input: 0,
        tokens_output: 0,
        cost_usd: 0,
        processing_time_ms: Date.now() - startTime
      };
      
      await this.logUsage(errorUsage);

      throw error;
    }
  }

  getWelcomeMessage(): string {
    return FAQ_RESPONSES['hola'];
  }
}

// Singleton instance
export const aiAssistant = new AIAssistantService();

// Funciones para admin
export async function getAIStats(period: 'today' | 'week' | 'month' = 'today') {
  try {
    const { data, error } = await supabase.rpc('get_ai_stats', { p_period: period });
    
    if (error) {
      console.error('Error calling get_ai_stats RPC:', error);
      // Devolver estructura por defecto en caso de error
      return {
        period: period,
        total_questions: 0,
        total_cost_usd: 0,
        avg_processing_time_ms: 0,
        total_tokens_input: 0,
        total_tokens_output: 0,
        unique_users: 0,
        top_questions: []
      };
    }
    
    // Validar que data no sea null
    if (!data) {
      console.warn('get_ai_stats returned null data');
      return {
        period: period,
        total_questions: 0,
        total_cost_usd: 0,
        avg_processing_time_ms: 0,
        total_tokens_input: 0,
        total_tokens_output: 0,
        unique_users: 0,
        top_questions: []
      };
    }
    
    console.log(`AI Stats for ${period}:`, data);
    return data;
  } catch (error) {
    console.error('Error getting AI stats:', error);
    // Devolver estructura por defecto en caso de error
    return {
      period: period,
      total_questions: 0,
      total_cost_usd: 0,
      avg_processing_time_ms: 0,
      total_tokens_input: 0,
      total_tokens_output: 0,
      unique_users: 0,
      top_questions: []
    };
  }
}

export async function updateAISettings(settings: Partial<AISettings>) {
  try {
    // Obtener el id existente de configuración
    const idRes = await supabase.from('ai_settings').select('id').limit(1).single();
    if (idRes.error || !idRes.data) {
      throw new Error('No se encontró la configuración de IA en la base de datos');
    }

    const settingsId = idRes.data.id;

    // Hacer update y obtener solo una fila
    const { data, error } = await supabase
      .from('ai_settings')
      .update({ 
        ...settings, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', settingsId)
      .select('*')
      .single(); // ESTO ES CLAVE - single() asegura una sola fila

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Error actualizando configuración: ${error.message}`);
    }

    console.log('AI Settings updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating AI settings:', error);
    throw error;
  }
}

export async function getAISettings() {
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting AI settings:', error);
    return null;
  }
}