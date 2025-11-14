import React, { useState, useEffect } from 'react';
import SmartLocationInput from './SmartLocationInput';
import AIDescriptionHelper from './AIDescriptionHelper';

interface Service {
  name: string;
  description: string;
  price: number;
}

interface FormData {
  // Paso 1: Datos básicos
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string;
  
  // Paso 2: Ubicación
  location: {
    address: string;
    city: string;
    state: string;
    mapsUrl?: string;
  };
  
  // Paso 3: Descripción
  description: string;
  
  // Paso 4: Categorías y servicios
  categories: string[];
  services: Service[];
  
  // Paso 5: Fotos
  profileImage: File | null;
  galleryImages: File[];
  
  // Paso 6: Redes sociales (opcionales)
  instagram?: string;
  instagramUrl?: string;
  facebook?: string;
  facebookUrl?: string;
  website?: string;
}

const CATEGORIES = [
  { value: "Autos", label: "🚗 Autos" },
  { value: "Transporte", label: "🚐 Transporte" },
  { value: "Música y Entretenimiento", label: "🎵 Música y Entretenimiento" },
  { value: "Fotografía y Video", label: "📸 Fotografía y Video" },
  { value: "Entretenimiento", label: "🎪 Entretenimiento" },
  { value: "Maquillaje", label: "💄 Maquillaje" },
  { value: "Repostería y dulces", label: "🍰 Repostería y dulces" },
  { value: "Mobiliario", label: "🪑 Mobiliario" },
  { value: "Peluquería", label: "💇 Peluquería" },
  { value: "Organizadores", label: "📋 Organizadores" },
  { value: "Vestuario", label: "👗 Vestuario" },
  { value: "Banquetes y Catering", label: "🍽️ Banquetes y Catering" },
  { value: "Personal", label: "👤 Personal" },
  { value: "Salones", label: "🏛️ Salones" },
  { value: "Comida y bebidas", label: "🍕 Comida y bebidas" },
  { value: "Lugares y Salones", label: "🏰 Lugares y Salones" },
  { value: "Decoración y Ambientación", label: "🎨 Decoración y Ambientación" },
  { value: "Flores y decoración", label: "🌸 Flores y decoración" }
];

const ProviderRegistrationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    whatsapp: '',
    location: {
      address: '',
      city: '',
      state: '',
      mapsUrl: undefined
    },
    description: '',
    categories: [],
    services: [],
    profileImage: null,
    galleryImages: [],
    instagram: '',
    instagramUrl: '',
    facebook: '',
    facebookUrl: '',
    website: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Limpiar localStorage si es una versión antigua (migración única)
  useEffect(() => {
    const version = localStorage.getItem('form_version');
    if (version !== '2.0') {
      localStorage.removeItem('provider_registration_draft');
      localStorage.setItem('form_version', '2.0');
    }
  }, []);

  // Cargar borrador desde localStorage
  useEffect(() => {
    const draft = localStorage.getItem('provider_registration_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Guardar borrador automáticamente
  useEffect(() => {
    const timer = setTimeout(() => {
      const dataToSave = {
        ...formData,
        profileImage: null, // No guardamos Files en localStorage
        galleryImages: []
      };
      localStorage.setItem('provider_registration_draft', JSON.stringify(dataToSave));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [formData]);

  // Validación por paso
  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch(step) {
      case 1: // Datos básicos
        if (!formData.businessName.trim()) newErrors.businessName = 'El nombre del negocio es requerido';
        if (!formData.contactName.trim()) newErrors.contactName = 'El nombre de contacto es requerido';
        if (!formData.email.trim()) newErrors.email = 'El email es requerido';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
        if (!formData.whatsapp.trim()) newErrors.whatsapp = 'El WhatsApp es requerido';
        break;
        
      case 2: // Categorías
        if (formData.categories.length === 0) newErrors.categories = 'Selecciona al menos una categoría';
        break;
        
      case 3: // Descripción con IA
        if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
        else if (formData.description.length < 50) newErrors.description = 'La descripción debe tener al menos 50 caracteres';
        break;
        
      case 4: // Ubicación
        if (!formData.location.mapsUrl && !formData.location.address) {
          newErrors.location = 'Debes proporcionar una ubicación (dirección o link de Maps)';
        }
        if (!formData.location.mapsUrl) {
          if (!formData.location.city.trim()) newErrors.city = 'La ciudad es requerida';
          if (!formData.location.state.trim()) newErrors.state = 'El estado es requerido';
        }
        break;
        
      case 5: // Servicios
        if (formData.services.length === 0) newErrors.services = 'Agrega al menos un servicio';
        break;
        
      case 6: // Fotos (opcional - sin validación)
        break;
        
      case 7: // Redes sociales (opcional - sin validación)
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const resetForm = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el formulario? Se perderán todos los datos.')) {
      localStorage.removeItem('provider_registration_draft');
      window.location.reload();
    }
  };

  const handleSubmit = async () => {
    // TODO: Enviar a Supabase cuando esté listo
    console.log('Form data:', formData);
    
    // Marcar que el formulario se completó
    sessionStorage.setItem('form_completed', 'true');
    
    // Limpiar localStorage después de enviar
    localStorage.removeItem('provider_registration_draft');
    
    alert('¡Formulario enviado exitosamente! Nos pondremos en contacto pronto.\n\nNota: La integración con Supabase está pendiente.');
    
    // Recargar página para limpiar formulario
    window.location.reload();
  };

  // Agregar servicio
  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', description: '', price: 0 }]
    }));
  };

  // Remover servicio
  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  // Actualizar servicio
  const updateService = (index: number, field: keyof Service, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Botón para limpiar formulario */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition flex items-center gap-2 border border-red-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpiar formulario
        </button>
      </div>
      
      {/* Barra de progreso */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map(step => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                currentStep === step 
                  ? 'bg-purple-600 text-white scale-110' 
                  : currentStep > step 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? '✓' : step}
              </div>
              <span className="text-xs mt-1 text-gray-600 hidden sm:block">
                {step === 1 && 'Datos'}
                {step === 2 && 'Categorías'}
                {step === 3 && 'Descripción'}
                {step === 4 && 'Ubicación'}
                {step === 5 && 'Servicios'}
                {step === 6 && 'Fotos'}
                {step === 7 && 'Redes'}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {/* Paso 1: Datos básicos */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Datos Básicos</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del negocio *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                placeholder="Ej: Florería Gómez"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                  errors.businessName ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
              />
              {errors.businessName && <p className="text-red-600 text-sm mt-1">{errors.businessName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de contacto *
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                placeholder="Ej: María Gómez"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                  errors.contactName ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
              />
              {errors.contactName && <p className="text-red-600 text-sm mt-1">{errors.contactName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Ej: maria@floreriagomez.com"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Ej: 521444237092"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                  }`}
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  WhatsApp *
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  placeholder="Ej: 521444237092"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                    errors.whatsapp ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                  }`}
                />
                {errors.whatsapp && <p className="text-red-600 text-sm mt-1">{errors.whatsapp}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Categorías */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🏷️ Categorías</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Selecciona tus categorías * (puedes elegir varias)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {CATEGORIES.map(cat => (
                  <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(cat.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, categories: [...formData.categories, cat.value]});
                        } else {
                          setFormData({...formData, categories: formData.categories.filter(c => c !== cat.value)});
                        }
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm">{cat.label}</span>
                  </label>
                ))}
              </div>
              {errors.categories && <p className="text-red-600 text-sm mt-1">{errors.categories}</p>}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                💡 <strong>Tip:</strong> Selecciona todas las categorías que apliquen a tu negocio. 
                Esto ayudará a que los clientes te encuentren más fácilmente.
              </p>
            </div>
          </div>
        )}

        {/* Paso 3: Descripción con IA */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✍️ Descripción del Negocio</h2>
            <AIDescriptionHelper
              value={formData.description}
              onChange={(newDesc) => setFormData({...formData, description: newDesc})}
              businessContext={{
                businessName: formData.businessName,
                category: formData.categories[0],
                services: formData.services.map(s => s.name),
                city: formData.location.city,
                state: formData.location.state
              }}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>
        )}

        {/* Paso 4: Ubicación */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📍 Ubicación</h2>
            <SmartLocationInput
              value={formData.location}
              onChange={(newLocation) => setFormData({...formData, location: newLocation})}
              error={errors.location || errors.city || errors.state}
            />
          </div>
        )}

        {/* Paso 5: Servicios */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💼 Servicios que Ofreces</h2>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Servicios *
                </label>
                <button
                  type="button"
                  onClick={addService}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  + Agregar servicio
                </button>
              </div>

              {formData.services.map((service, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-700">Servicio {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      placeholder="Nombre del servicio (Ej: Barra de Snacks)"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    
                    <textarea
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      placeholder="Descripción (Ej: 50 personas, 15 variedades)"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      rows={2}
                    />
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Precio (aparecerá en cotizador)</label>
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formData.services.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 mb-3">No has agregado servicios todavía</p>
                  <button
                    type="button"
                    onClick={addService}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                  >
                    + Agregar primer servicio
                  </button>
                </div>
              )}
              
              {errors.services && <p className="text-red-600 text-sm mt-1">{errors.services}</p>}
            </div>
          </div>
        )}

        {/* Paso 6: Fotos */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📸 Fotos de tu Negocio</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Logo o imagen de perfil (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({...formData, profileImage: e.target.files?.[0] || null})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              />
              {formData.profileImage && (
                <p className="text-sm text-green-600 mt-2">✓ {formData.profileImage.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Galería de fotos (opcional, máximo 5)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 5);
                  setFormData({...formData, galleryImages: files});
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              />
              {formData.galleryImages.length > 0 && (
                <div className="mt-3 space-y-1">
                  {formData.galleryImages.map((file, index) => (
                    <p key={index} className="text-sm text-green-600">✓ {file.name}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Las fotos ayudan a que los clientes conozcan tu trabajo. 
                Puedes subirlas después si lo prefieres.
              </p>
            </div>
          </div>
        )}

        {/* Paso 7: Redes sociales */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🌐 Redes Sociales (Opcional)</h2>
            
            <p className="text-gray-600">Estos campos son opcionales. Solo llena los que tengas.</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram (usuario)
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  placeholder="Ej: @miempresa"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})}
                  placeholder="https://instagram.com/miempresa"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook (nombre)
                </label>
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                  placeholder="Ej: Mi Empresa"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData({...formData, facebookUrl: e.target.value})}
                  placeholder="https://facebook.com/miempresa"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio web
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://miempresa.com"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold text-green-900 mb-2">
                ✅ ¡Listo para enviar!
              </h3>
              <p className="text-green-700">
                Revisa que toda la información esté correcta y envía tu solicitud. 
                Nuestro equipo la revisará y te contactará pronto.
              </p>
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            ← Anterior
          </button>

          <div className="text-sm text-gray-500">
            Paso {currentStep} de 7
          </div>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
            >
              🚀 Enviar Solicitud
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderRegistrationForm;
