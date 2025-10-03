
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Supplier, Service } from '../../types';
import { ChevronLeftIcon, WhatsAppIcon, PlusCircleIcon, MinusCircleIcon, ShoppingCartIcon } from '../../components/icons';

const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);

      const { data: supData, error: supError } = await supabase
        .from('suppliers')
        .select('*, categories(slug)')
        .eq('id', id)
        .single();
      
      if (supError || !supData) {
        setError('Proveedor no encontrado.');
        setLoading(false);
        return;
      }
      setSupplier(supData);

      const { data: servData, error: servError } = await supabase
        .from('services')
        .select('*')
        .eq('supplier_id', id)
        .eq('is_active', true)
        .order('name');
      
      if (servError) {
        setError('Error al cargar servicios.');
        console.error(servError);
      } else {
        setServices(servData);
      }
      setLoading(false);
    };

    fetchDetails();
  }, [id]);

  const toggleCartItem = (service: Service) => {
    setCart(prevCart => 
      prevCart.some(item => item.id === service.id)
        ? prevCart.filter(item => item.id !== service.id)
        : [...prevCart, service]
    );
  };

  const totalCost = useMemo(() => {
    return cart.reduce((total, item) => total + item.cost, 0);
  }, [cart]);

  const buildWALink = () => {
    if (!supplier || !supplier.contact.whatsapp) return '#';
    const whatsNumber = supplier.contact.whatsapp.replace(/\D/g, '');
    const lines = [
      'Hola, te contacto desde Charlitron Eventos 360.',
      `Proveedor: ${supplier.name}`,
      'Servicios de interés:',
      ...cart.map(i => `• ${i.name} – $${i.cost.toFixed(2)}`),
      '------------------',
      `Total aproximado: $${totalCost.toFixed(2)}`
    ];
    return `https://wa.me/${whatsNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div></div>;
  }

  if (error || !supplier) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }
  
  const goBackUrl = supplier.categories ? `/categoria/${(supplier.categories as any).slug}` : '/embed';

  return (
    <div className="max-w-7xl mx-auto font-sans bg-white">
       <div className="p-4 md:p-6 flex items-center bg-gray-50 border-b">
         <button onClick={() => navigate(goBackUrl)} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition">
           <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
         </button>
         <div className="flex items-center">
            <img src={supplier.logo_url || `https://picsum.photos/seed/${supplier.id}/100`} alt={supplier.name} className="h-12 w-12 rounded-full object-cover mr-4" />
            <h1 className="text-2xl font-bold text-gray-800">{supplier.name}</h1>
         </div>
       </div>
      
       <div className="p-4 md:p-6">
        <p className="text-gray-600 mb-6">{supplier.description}</p>
        
        {supplier.gallery && supplier.gallery.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Galería</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {supplier.gallery.map((url, index) => (
                <img key={index} src={url} alt={`Gallery image ${index + 1}`} className="w-full h-40 object-cover rounded-lg shadow-md" />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Servicios</h2>
          <div className="space-y-4">
            {services.map(service => (
              <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-bold text-gray-800">{service.name}</h4>
                  <p className="text-sm text-gray-500">{service.description}</p>
                  <p className="font-semibold text-purple-600 mt-1">${service.cost.toFixed(2)}</p>
                </div>
                <button onClick={() => toggleCartItem(service)} className="transition-transform duration-200 ease-in-out hover:scale-110">
                  {cart.some(item => item.id === service.id) 
                    ? <MinusCircleIcon className="h-8 w-8 text-red-500" />
                    : <PlusCircleIcon className="h-8 w-8 text-green-500" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {cart.length > 0 && (
        <div className="sticky bottom-0 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-6 w-6 text-purple-600"/>
                <span className="font-semibold text-gray-700">{cart.length} servicio(s) seleccionado(s)</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">Total: ${totalCost.toFixed(2)}</p>
            </div>
            <a href={buildWALink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-green-500 text-white font-bold py-3 px-6 rounded-full hover:bg-green-600 transition-colors shadow-lg">
              <WhatsAppIcon className="h-6 w-6 mr-2"/>
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDetail;
