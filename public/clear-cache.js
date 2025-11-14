// Script para limpiar localStorage de formularios antiguos
// Se ejecuta automáticamente al cargar cualquier página

(function() {
  try {
    // Versión actual del formulario
    const CURRENT_VERSION = '2.0';
    const storedVersion = localStorage.getItem('form_version');
    
    // Si la versión no coincide, limpiar todo
    if (storedVersion !== CURRENT_VERSION) {
      console.log('Limpiando datos de formulario antiguo...');
      localStorage.removeItem('provider_registration_draft');
      localStorage.setItem('form_version', CURRENT_VERSION);
      console.log('✓ Datos limpios. Versión actual:', CURRENT_VERSION);
    }
  } catch (error) {
    console.error('Error limpiando cache:', error);
  }
})();
