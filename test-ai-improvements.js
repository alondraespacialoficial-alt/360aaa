// Test rápido para verificar las mejoras de la IA
import { aiAssistant } from './services/aiAssistant.js';

async function testAIImprovements() {
  console.log('🧪 Probando mejoras de la IA...\n');
  
  try {
    // Test 1: Barra de elotes (debe devolver Snacks Charlitron)
    console.log('Test 1: "Necesito una barra de elotes para 100 personas en San Luis Potosí"');
    const response1 = await aiAssistant.askQuestion(
      'Necesito una barra de elotes para 100 personas en San Luis Potosí'
    );
    console.log('Respuesta 1:', response1);
    console.log('✅ Debe mencionar Snacks Charlitron\n');
    
    // Test 2: Video (debe devolver Charlie Production)
    console.log('Test 2: "¿Tienen video para bodas?"');
    const response2 = await aiAssistant.askQuestion('¿Tienen video para bodas?');
    console.log('Respuesta 2:', response2);
    console.log('✅ Debe mencionar Charlie Production\n');
    
    // Test 3: Carro de elotes (debe devolver Snacks Charlitron)
    console.log('Test 3: "Busco carro de elotes"');
    const response3 = await aiAssistant.askQuestion('Busco carro de elotes');
    console.log('Respuesta 3:', response3);
    console.log('✅ Debe mencionar Snacks Charlitron (no "no tengo proveedores")\n');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

testAIImprovements().then(() => {
  console.log('🎉 Pruebas completadas!');
}).catch(console.error);