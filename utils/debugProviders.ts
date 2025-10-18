import { supabase } from '../services/supabaseClient';

// Función para verificar que tenemos proveedores en la base de datos
export async function debugProviders() {
  console.log('🔧 DEBUGGER DE PROVEEDORES');
  console.log('==========================');

  try {
    // 1. Verificar conexión básica
    const { data: testData, error: testError } = await supabase
      .from('providers')
      .select('count(*)', { count: 'exact' })
      .limit(1);
    
    console.log('📊 Total de proveedores en BD:', testData);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError);
      return;
    }

    // 2. Obtener lista de proveedores
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, name, description, is_active')
      .limit(10);

    if (providersError) {
      console.error('❌ Error obteniendo proveedores:', providersError);
      return;
    }

    console.log('📋 Proveedores encontrados:');
    providers?.forEach((p, index) => {
      console.log(`${index + 1}. ID: ${p.id} | Nombre: ${p.name} | Activo: ${p.is_active}`);
    });

    // 3. Verificar estructura de tablas relacionadas
    const tables = ['provider_services', 'provider_reviews', 'provider_media', 'provider_categories'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.warn(`⚠️ Tabla ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ Tabla ${table}: ${data?.[0]?.count || 0} registros`);
      }
    }

    return providers;

  } catch (error) {
    console.error('🚨 Error en debugger:', error);
    return null;
  }
}

// Función para crear un proveedor de prueba si no existe ninguno
export async function createTestProvider() {
  console.log('🧪 Creando proveedor de prueba...');
  
  const testProvider = {
    name: 'Banquetes Test Charlitron',
    description: 'Proveedor de prueba para testing del sistema de analytics',
    city: 'San Luis Potosí',
    state: 'San Luis Potosí',
    phone: '+52 444 123 4567',
    whatsapp: '+52 444 123 4567',
    email: 'test@charlitron.com',
    is_active: true,
    is_premium: false,
    featured: true
  };

  try {
    const { data, error } = await supabase
      .from('providers')
      .insert([testProvider])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando proveedor de prueba:', error);
      return null;
    }

    console.log('✅ Proveedor de prueba creado:', data);
    return data;

  } catch (error) {
    console.error('🚨 Error en createTestProvider:', error);
    return null;
  }
}