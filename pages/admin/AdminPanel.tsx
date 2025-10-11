
import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from '../../services/supabaseClient';



// Sub-componente para gestionar planes de proveedores
const ManagePlans: React.FC = () => {

    // Cargar planes desde Supabase
    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('provider_plans').select('*').order('price', { ascending: true });
            if (error) setError(error.message);
            else setPlans(data || []);
            setLoading(false);
        };
        fetchPlans();
    }, []);

    // Actualizar estado de edición por plan
    const handleEditChange = (id: string, field: string, value: any) => {
        setEditStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    // Guardar cambios de un plan
    const handleSave = async (id: string) => {
        const plan = editStates[id];
        if (!plan) return;
        const { error } = await supabase.from('provider_plans').update({
            name: plan.name,
            description: plan.description,
            price: plan.price,
            services_included: plan.services_included,
            updated_at: new Date().toISOString()
        }).eq('id', id);
        if (error) setError(error.message);
        else {
            setError(null);
            setEditStates(prev => ({ ...prev, [id]: undefined }));
            // Recargar planes
            const { data } = await supabase.from('provider_plans').select('*').order('price', { ascending: true });
            setPlans(data || []);
        }
    };

    // Eliminar plan
    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('provider_plans').delete().eq('id', id);
        if (error) setError(error.message);
        else {
            setError(null);
            setPlans(plans.filter(p => p.id !== id));
        }
    };

    // Agregar nuevo plan
    const handleAdd = async () => {
        if (!addName || !addPrice) {
            setError('Nombre y precio son obligatorios');
            return;
        }
        const { error } = await supabase.from('provider_plans').insert({
            name: addName,
            description: addDesc,
            price: addPrice,
            services_included: addServices,
            is_active: true
        });
        if (error) setError(error.message);
        else {
            setError(null);
            setAddName("");
            setAddDesc("");
            setAddPrice("");
            setAddServices("");
            // Recargar planes
            const { data } = await supabase.from('provider_plans').select('*').order('price', { ascending: true });
            setPlans(data || []);
        }
    };
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editStates, setEditStates] = useState<{[id: string]: any}>({});
    const [addName, setAddName] = useState("");
    const [addDesc, setAddDesc] = useState("");
    const [addPrice, setAddPrice] = useState("");
    const [addServices, setAddServices] = useState("");
    const [error, setError] = useState<string | null>(null);


    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-purple-700 text-center">Planes para Proveedores</h2>
            {loading ? <p className="text-center text-gray-500">Cargando...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {plans.map(plan => {
                        const edit = editStates[plan.id] || plan;
                        return (
                            <div key={plan.id} className="bg-white rounded-xl shadow-lg border border-purple-100 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <input type="text" value={edit.name} onChange={e => handleEditChange(plan.id, 'name', e.target.value)} className="font-bold text-lg text-purple-700 bg-transparent border-b border-purple-200 focus:outline-none w-2/3" />
                                        <input type="number" value={edit.price} onChange={e => handleEditChange(plan.id, 'price', e.target.value)} className="text-xl font-bold text-green-700 bg-transparent border-b border-green-200 focus:outline-none w-1/3 text-right" />
                                    </div>
                                    <textarea value={edit.description} onChange={e => handleEditChange(plan.id, 'description', e.target.value)} className="w-full mb-2 p-2 border rounded focus:outline-purple-400 resize-none" rows={2} />
                                    <input type="text" value={edit.services_included} onChange={e => handleEditChange(plan.id, 'services_included', e.target.value)} className="w-full mb-2 p-2 border rounded focus:outline-purple-400" placeholder="Servicios incluidos" />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition" onClick={() => handleSave(plan.id)}>Guardar</button>
                                    <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition" onClick={() => handleDelete(plan.id)}>Eliminar</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-purple-100 max-w-xl mx-auto">
                <h3 className="font-bold mb-4 text-lg text-purple-600">Agregar nuevo plan</h3>
                {error && <div className="mb-2 text-red-600 font-semibold">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Nombre" className="p-3 border rounded-lg w-full focus:outline-purple-400" maxLength={100} />
                    <input value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="Precio" className="p-3 border rounded-lg w-full focus:outline-purple-400" maxLength={20} />
                </div>
                <textarea value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Descripción" className="mb-4 p-3 border rounded-lg w-full focus:outline-purple-400" maxLength={500} rows={2} />
                <input value={addServices} onChange={e => setAddServices(e.target.value)} placeholder="Servicios incluidos (separados por coma)" className="mb-4 p-3 border rounded-lg w-full focus:outline-purple-400" maxLength={200} />
                <button onClick={handleAdd} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition">Agregar</button>
            </div>
        </div>
    );
};

// Sub-componente para gestionar proveedores
const ManageSuppliers: React.FC = () => {

    // Estados para el formulario de proveedor
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
        const [serviceName, setServiceName] = useState(""); 
    const [serviceDesc, setServiceDesc] = useState("");
    const [servicePrice, setServicePrice] = useState("");
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [name, setName] = useState("");
    const [contactName, setContactName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [description, setDescription] = useState("");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [website, setWebsite] = useState("");
    const [instagram, setInstagram] = useState("");
    const [facebook, setFacebook] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
    const [featured, setFeatured] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar categorías y proveedores al montar
    useEffect(() => {
        const fetchData = async () => {
            const { data: catData } = await supabase.from('categories').select('*').order('name');
            setCategories(catData || []);
            const { data: provData } = await supabase.from('providers').select('*').order('name');
            setSuppliers(provData || []);
        };
        fetchData();
    }, []);

    // Manejar alta de proveedor
    const handleAddSupplier = async () => {
        if (!name || selectedCategories.length === 0) {
            setError('Nombre y categoría son obligatorios');
            return;
        }
        let profileImageUrl = null;
        if (profileImage) {
            const { data, error } = await supabase.storage.from('provider-media').upload(`profile/${Date.now()}_${profileImage.name}`, profileImage);
            if (!error && data?.path) {
                profileImageUrl = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
            }
        }
        const { data: provData, error: provError } = await supabase.from('providers').insert({
            name,
            contact_name: contactName,
            email,
            phone,
            whatsapp,
            address,
            city,
            state,
            description,
            profile_image_url: profileImageUrl,
            website,
            instagram,
            facebook,
            is_active: isActive,
            is_premium: isPremium,
            featured
        }).select();
        if (provError) {
            setError('Error al guardar proveedor: ' + provError.message);
            return;
        }
        const provider = provData?.[0];
        if (!provider) {
            setError('No se pudo crear el proveedor.');
            return;
        }
        // Guardar categorías
        await supabase.from('provider_categories').insert(selectedCategories.map(catId => ({ provider_id: provider.id, category_id: catId })));
        // Guardar servicios
        if (services.length > 0) {
            await supabase.from('provider_services').insert(services.map(s => ({ ...s, provider_id: provider.id })));
        }
        // Guardar imágenes extra
        if (mediaFiles.length > 0) {
            for (let i = 0; i < mediaFiles.length; i++) {
                const file = mediaFiles[i];
                const { data, error } = await supabase.storage.from('provider-media').upload(`gallery/${Date.now()}_${file.name}`, file);
                if (!error && data?.path) {
                    const url = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                    await supabase.from('provider_media').insert({ provider_id: provider.id, kind: 'image', url, sort_order: i });
                }
            }
        }
        setName(""); setContactName(""); setEmail(""); setPhone(""); setWhatsapp(""); setAddress(""); setCity(""); setState(""); setDescription(""); setProfileImage(null); setWebsite(""); setInstagram(""); setFacebook(""); setIsActive(true); setIsPremium(false); setFeatured(false); setSelectedCategories([]); setServices([]); setMediaFiles([]); setError(null);
        // Recargar proveedores
        const { data: provData2 } = await supabase.from('providers').select('*').order('name');
        setSuppliers(provData2 || []);
    };

    // Formulario de alta de proveedor y gestión de servicios
    return (
        <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Proveedores</h2>
            <div className="mb-6 p-4 bg-gray-50 rounded shadow">
                <h3 className="font-bold mb-2">Agregar nuevo proveedor</h3>
                {error && <div className="mb-2 text-red-600 font-semibold">{error}</div>}
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contacto" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Teléfono" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ciudad" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={state} onChange={e => setState(e.target.value)} placeholder="Estado" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" className="mb-2 p-2 border rounded w-full" maxLength={500} rows={2} />
                <div className="mb-2">
                    <label className="block mb-1">Imagen de perfil</label>
                    <input type="file" accept="image/*" onChange={e => setProfileImage(e.target.files?.[0] || null)} />
                </div>
                <div className="mb-2">
                    <label className="block mb-1">Imágenes extra (máx. 5)</label>
                    <input type="file" accept="image/*" multiple onChange={e => setMediaFiles(Array.from(e.target.files || []).slice(0, 5))} />
                </div>
                <div className="mb-2">
                    <label className="block mb-1">Categorías</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-1">
                                <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={e => {
                                    if (e.target.checked) setSelectedCategories([...selectedCategories, cat.id]);
                                    else setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                                }} />
                                <span>{cat.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="mb-2">
                    <label className="block mb-1">Servicios</label>
                    <div className="mb-2 flex gap-2">
                        <input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Nombre del servicio" className="p-2 border rounded w-1/3" />
                        <input value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} placeholder="Descripción" className="p-2 border rounded w-1/3" />
                        <input value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="Precio" className="p-2 border rounded w-1/4" />
                        <button type="button" className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => {
                            if (serviceName) {
                                setServices([...services, { name: serviceName, description: serviceDesc, price: parseFloat(servicePrice) || 0 }]);
                                setServiceName("");
                                setServiceDesc("");
                                setServicePrice("");
                            }
                        }}>Agregar servicio</button>
                    </div>
                    <div className="mb-2">
                        {services.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{s.name}</span>
                                <span>{s.description}</span>
                                <span className="text-green-700 font-bold">${s.price}</span>
                                <button className="text-red-500" onClick={() => setServices(services.filter((_, i) => i !== idx))}>Eliminar</button>
                            </div>
                        ))}
                    </div>
                </div>
                <label className="flex items-center mb-2">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="mr-2" /> Activo
                </label>
                <label className="flex items-center mb-2">
                    <input type="checkbox" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} className="mr-2" /> Premium
                </label>
                <label className="flex items-center mb-2">
                    <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="mr-2" /> Destacado
                </label>
                <button onClick={handleAddSupplier} className="px-4 py-2 bg-blue-600 text-white rounded mr-2">Agregar proveedor</button>
            </div>
            {/* Tabla/lista de proveedores con edición y borrado */}
            <div className="bg-white shadow rounded-lg mt-8">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {suppliers.map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.is_active ? 'Sí' : 'No'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-indigo-600 hover:text-indigo-900" onClick={() => alert('Funcionalidad de edición en proceso')}>Editar</button>
                                    <button className="ml-2 text-red-600 hover:text-red-900" onClick={() => alert('Funcionalidad de borrado en proceso')}>Borrar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Componente principal que renderiza los subcomponentes
const AdminPanel: React.FC = () => {
    return (
        <div className="p-6">
            <ManageSuppliers />
            <ManagePlans />
        </div>
    );
};

export default AdminPanel;
