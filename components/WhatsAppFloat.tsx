import React, { useState, useEffect } from 'react';

const WhatsAppFloat: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    // Mostrar después de 2 segundos para no ser intrusivo
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    const message = encodeURIComponent(
      "� ¡Hola Charlitron Eventos 360!\n\n📋 Solicito más informes sobre su directorio de proveedores para eventos.\n\n📌 Me interesa conocer:\n• Servicios disponibles en el directorio\n• Cobertura de proveedores por región\n• Proceso de registro y membresías\n• Beneficios para organizadores de eventos\n\n📍 Ubicación de mi evento: [Ciudad, Estado]\n� Tipo de evento: [Especificar]\n\n� Deseo información profesional para tomar la mejor decisión.\n\n🙏 Gracias por su atención profesional."
    );
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=%2B524444237092&text=${message}&type=phone_number&app_absent=0`;
    window.open(whatsappUrl, '_blank');
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Botón flotante WhatsApp - Posición optimizada para pulgar */}
      <div 
        className={`fixed z-50 transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
        style={{
          bottom: '20px',
          right: '20px',
          // Posición accesible con pulgar en móvil
        }}
      >
        <button
          onClick={handleClick}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          className={`
            group relative flex items-center justify-center
            w-14 h-14 sm:w-16 sm:h-16
            bg-gradient-to-r from-green-500 to-green-600
            hover:from-green-600 hover:to-green-700
            rounded-full shadow-lg hover:shadow-2xl
            transform transition-all duration-300
            ${isPressed ? 'scale-95' : 'hover:scale-110'}
            focus:outline-none focus:ring-4 focus:ring-green-300
            animate-pulse
          `}
          aria-label="Contactar por WhatsApp"
        >
          {/* Efecto de ondas */}
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
          
          {/* Icono WhatsApp */}
          <div className="relative z-10 text-white text-2xl sm:text-3xl font-bold">
            📱
          </div>

          {/* Tooltip en hover - Desktop */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block">
            Informes del Directorio
            <div className="absolute top-1/2 left-full transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-800 border-y-4 border-y-transparent"></div>
          </div>
        </button>
      </div>

      {/* Banner móvil inferior adicional - Solo móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-gradient-to-r from-green-500 to-green-600 text-white p-3 transform transition-all duration-500 translate-y-full opacity-0" id="whatsapp-banner">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🏢</span>
            <div>
              <div className="font-bold text-sm">Informes del Directorio</div>
              <div className="text-xs opacity-90">Consulta profesional por WhatsApp</div>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="bg-white text-green-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            Consultar
          </button>
        </div>
      </div>

      {/* Script para mostrar banner ocasionalmente en móvil */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (window.innerWidth < 640) {
              setTimeout(() => {
                const banner = document.getElementById('whatsapp-banner');
                if (banner) {
                  banner.classList.remove('translate-y-full', 'opacity-0');
                  setTimeout(() => {
                    banner.classList.add('translate-y-full', 'opacity-0');
                  }, 5000);
                }
              }, 10000);
            }
          `
        }}
      />
    </>
  );
};

export default WhatsAppFloat;