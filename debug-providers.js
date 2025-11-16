// Script rápido para verificar la estructura de la tabla providers
import { supabase } from './services/supabaseClient.js';

async function debugProviders() {
  console.log('🔍 Verificando estructura de tabla providers...');
  
  try {
    // Obtener un proveedor de ejemplo
    const { data: providers, error } = await supabase
      .from('providers')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (providers && providers.length > 0) {
      console.log('✅ Proveedor encontrado:', providers[0].name);
      console.log('📋 Campos disponibles:', Object.keys(providers[0]));
      console.log('📞 Campo contact:', providers[0].contact);
      console.log('📱 Campo whatsapp:', providers[0].whatsapp);
      console.log('☎️ Campo phone:', providers[0].phone);
    } else {
      console.log('⚠️ No se encontraron proveedores');
    }
  } catch (err) {
    console.error('🚨 Error:', err);
  }
}

debugProviders();