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
        temperature: 0.8, // Un poco de creatividad pero coherente
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 300, // ~500 caracteres en español
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

  let prompt = `Eres un experto redactor de contenido para negocios de eventos en México.

TAREA: Escribe una descripción profesional y atractiva para un proveedor de eventos.

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

INSTRUCCIONES:
1. Escribe en primera persona del plural ("Somos", "Ofrecemos", "Nos especializamos")
2. Máximo 400 caracteres (aproximadamente 60-70 palabras)
3. Tono profesional pero cálido y cercano
4. Incluye:
   - Especialidad principal
   - Experiencia o calidad del servicio
   - Ubicación si está disponible
   - Llamado a la acción sutil (ej: "Contáctanos")
5. NO inventes datos que no fueron proporcionados
6. NO uses comillas ni asteriscos
7. Escribe en español de México

EJEMPLO DE ESTILO:
"Somos especialistas en fotografía de bodas en Monterrey, con más de 5 años capturando los momentos más especiales de tu gran día. Utilizamos equipo profesional de última generación para garantizar imágenes de alta calidad que conservarás por siempre. ¡Contáctanos y hagamos realidad el álbum de tus sueños!"

AHORA GENERA LA DESCRIPCIÓN:`;

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
