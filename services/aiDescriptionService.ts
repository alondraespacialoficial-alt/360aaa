import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabaseClient';

// Inicializar Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

interface BusinessContext {
  businessName?: string;
  category?: string;
  services?: string[];
  city?: string;
  state?: string;
}

/**
 * Genera una descripción profesional para un proveedor de eventos
 * usando Google Gemini AI
 */
export async function generateProviderDescription(
  context: BusinessContext
): Promise<string> {
  const startTime = Date.now();

  try {
    // Validar que tengamos datos mínimos
    if (!context.businessName || !context.category) {
      throw new Error('Se requiere nombre del negocio y categoría');
    }

    // Construir prompt con contexto
    const prompt = buildDescriptionPrompt(context);

    // Configurar modelo
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.95, // Mayor creatividad y variedad
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 400, // Más espacio para descripciones detalladas
        candidateCount: 1,
      },
    });

    // Generar descripción
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text().trim();

    // Calcular métricas
    const processingTime = Date.now() - startTime;
    const tokenCount = await countTokens(model, prompt, generatedText);

    // Registrar uso en Supabase
    await logAIUsage({
      feature: 'provider_description',
      prompt,
      response: generatedText,
      tokensUsed: tokenCount.totalTokens,
      processingTime,
      context: context
    });

    return generatedText;

  } catch (error: any) {
    console.error('Error generating description:', error);
    
    // Registrar error
    await logAIError({
      feature: 'provider_description',
      error: error.message,
      context
    });

    throw new Error('No pudimos generar la descripción. Por favor, intenta de nuevo o escribe tu propia descripción.');
  }
}

/**
 * Construye el prompt para generar descripción
 */
function buildDescriptionPrompt(context: BusinessContext): string {
  const { businessName, category, services, city, state } = context;

  let prompt = `Eres un experto redactor de contenido para negocios de eventos en México, especializado en crear descripciones persuasivas y memorables.

TAREA: Escribe una descripción profesional, creativa y atractiva para un proveedor de eventos.

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${businessName}
- Categoría: ${category}`;

  if (city || state) {
    prompt += `\n- Ubicación: ${[city, state].filter(Boolean).join(', ')}`;
  }

  if (services && services.length > 0) {
    prompt += `\n- Servicios: ${services.join(', ')}`;
  }

  prompt += `

INSTRUCCIONES CLAVE:
1. **Voz:** Primera persona plural ("Somos", "Creamos", "Nos especializamos", "Transformamos")
2. **Extensión:** Entre 250-400 caracteres (50-70 palabras) - usa todo el espacio disponible
3. **Tono:** Profesional pero emocional, cálido y cercano, que inspire confianza
4. **Estructura:**
   - Frase de impacto inicial (qué hace especial al negocio)
   - Especialidad y experiencia (usa verbos de acción)
   - Beneficio emocional para el cliente (cómo transforma su evento)
   - Ubicación si está disponible (naturalizada en el texto)
   - Llamado a la acción inspirador (no genérico)

5. **Estilo:**
   - Usa metáforas sutiles relacionadas con eventos/celebraciones
   - Incluye palabras emocionales positivas (memorables, únicos, especiales, perfectos, soñados)
   - Evita clichés obvios ("alta calidad", "los mejores", "excelente servicio")
   - Sé específico según la categoría (ej: "ambientes" para decoración, "momentos" para fotografía)

6. **Prohibido:**
   - Inventar datos no proporcionados
   - Usar comillas, asteriscos o símbolos especiales
   - Frases genéricas sin personalidad
   - Ser demasiado corto o básico

EJEMPLOS DE DIFERENTES CATEGORÍAS:

**Fotografía:**
"Capturamos la esencia de tu gran día a través de nuestro lente. En ${businessName}, convertimos instantes fugaces en recuerdos eternos con un estilo artístico y auténtico. Cada imagen cuenta una historia, cada detalle importa. Desde ${city || 'nuestra ciudad'}, creamos álbumes que revivirás con emoción por siempre. ¡Hagamos juntos la magia visual de tu evento!"

**Catering:**
"Deleitamos paladares y creamos experiencias gastronómicas inolvidables. En ${businessName}, cada platillo es una celebración del sabor, preparado con ingredientes frescos y pasión por la cocina. Transformamos tu evento en un festín memorable donde tus invitados disfrutarán cada bocado. Ubicados en ${city || 'tu ciudad'}, llevamos la alta cocina a tu celebración."

**Decoración:**
"Diseñamos ambientes que cuentan historias y despiertan emociones. En ${businessName}, cada espacio se transforma en el escenario perfecto para tu celebración. Combinamos creatividad, estilo y atención al detalle para crear la atmósfera exacta que has imaginado. Desde ${city || 'nuestra ciudad'}, hacemos realidad tus sueños decorativos."

**Música:**
"Ponemos el ritmo y la energía que tu evento necesita. En ${businessName}, creamos la banda sonora perfecta para cada momento de tu celebración. Con repertorio versátil y lectura de audiencia impecable, garantizamos que tus invitados vivan una fiesta inolvidable. Basados en ${city || 'la región'}, llevamos la mejor música a tu evento."

AHORA, APLICA ESTOS PRINCIPIOS Y GENERA UNA DESCRIPCIÓN MEMORABLE PARA ${businessName}:`;

  return prompt;
}

/**
 * Cuenta tokens del prompt y respuesta
 */
async function countTokens(model: any, prompt: string, response: string): Promise<{
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
}> {
  try {
    const promptResult = await model.countTokens(prompt);
    const responseResult = await model.countTokens(response);

    return {
      promptTokens: promptResult.totalTokens,
      responseTokens: responseResult.totalTokens,
      totalTokens: promptResult.totalTokens + responseResult.totalTokens
    };
  } catch (error) {
    // Si falla el conteo, estimar (aproximadamente 1 token = 4 caracteres en español)
    const estimatedPromptTokens = Math.ceil(prompt.length / 4);
    const estimatedResponseTokens = Math.ceil(response.length / 4);
    
    return {
      promptTokens: estimatedPromptTokens,
      responseTokens: estimatedResponseTokens,
      totalTokens: estimatedPromptTokens + estimatedResponseTokens
    };
  }
}

/**
 * Registra uso de IA en Supabase
 */
async function logAIUsage(data: {
  feature: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  processingTime: number;
  context: any;
}) {
  try {
    // Calcular costo aproximado (Gemini 2.0 Flash: ~$0.075 per 1M input tokens, $0.30 per 1M output)
    const estimatedCost = (data.tokensUsed / 1000000) * 0.15; // Promedio

    await supabase.from('ai_usage_tracking').insert({
      user_query: `Generate description for ${data.context.businessName}`,
      ai_response: data.response,
      tokens_used: data.tokensUsed,
      processing_time_ms: data.processingTime,
      cost_usd: estimatedCost,
      metadata: {
        feature: data.feature,
        context: data.context,
        model: 'gemini-2.0-flash-exp'
      }
    });
  } catch (error) {
    console.error('Error logging AI usage:', error);
    // No lanzar error para no afectar UX
  }
}

/**
 * Registra errores de IA
 */
async function logAIError(data: {
  feature: string;
  error: string;
  context: any;
}) {
  try {
    await supabase.from('ai_usage_tracking').insert({
      user_query: `Generate description for ${data.context.businessName || 'unknown'}`,
      ai_response: `ERROR: ${data.error}`,
      tokens_used: 0,
      processing_time_ms: 0,
      cost_usd: 0,
      metadata: {
        feature: data.feature,
        error: data.error,
        context: data.context,
        success: false
      }
    });
  } catch (error) {
    console.error('Error logging AI error:', error);
  }
}

/**
 * Valida que la descripción generada sea apropiada
 */
export function validateGeneratedDescription(text: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (text.length < 50) {
    errors.push('Descripción demasiado corta');
  }

  if (text.length > 550) {
    errors.push('Descripción demasiado larga');
  }

  // Detectar contenido inapropiado básico
  const inappropriateWords = ['spam', 'scam', 'fraude'];
  if (inappropriateWords.some(word => text.toLowerCase().includes(word))) {
    errors.push('Contenido inapropiado detectado');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
