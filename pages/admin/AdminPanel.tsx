// Sección de reseñas para el panel de administrador
const AdminReviews: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    useEffect(() => {
        const fetchReviews = async () => {
            const { data } = await supabase.from('provider_reviews').select('*').order('created_at', { ascending: false });
            setReviews(data || []);
        };
        fetchReviews();
    }, []);

    const handleDeleteReview = async (id: number) => {
        if (window.confirm('¿Seguro que quieres borrar esta reseña?')) {
            await supabase.from('provider_reviews').delete().eq('id', id);
            setReviews(reviews.filter(r => r.id !== id));
        }
    };

    return (
        <div className="mt-10 p-6 bg-theme-secondary border border-theme-primary rounded shadow">
            <h2 className="text-xl font-bold mb-4 text-purple-700">Reseñas de Proveedores</h2>
            {reviews.length === 0 ? (
                <p className="text-theme-tertiary">No hay reseñas aún.</p>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Usuario</th>
                            <th className="px-4 py-2 text-left">Comentario</th>
                            <th className="px-4 py-2 text-left">Estrellas</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map(r => (
                            <tr key={r.id}>
                                <td className="px-4 py-2">{r.user_id}</td>
                                <td className="px-4 py-2">{r.comment}</td>
                                <td className="px-4 py-2">{'★'.repeat(r.rating)}</td>
                                <td className="px-4 py-2 text-right">
                                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteReview(r.id)}>Borrar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import VideoAdmin from "./VideoAdmin";
import ThemeToggle from "../../components/ThemeToggle";



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
                                        <label className="font-bold text-lg text-purple-700">Nombre:</label>
                                        <input type="text" value={edit.name} onChange={e => handleEditChange(plan.id, 'name', e.target.value)} className="font-bold text-lg text-purple-700 bg-transparent border-b border-purple-200 focus:outline-none w-2/3" />
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xl font-bold text-green-700">Precio:</label>
                                        <input type="number" value={edit.price} onChange={e => handleEditChange(plan.id, 'price', e.target.value)} className="text-xl font-bold text-green-700 bg-transparent border-b border-green-200 focus:outline-none w-1/3 text-right" />
                                    </div>
                                    <div className="mb-2">
                                        <label className="font-semibold">Descripción:</label>
                                        <textarea value={edit.description} onChange={e => handleEditChange(plan.id, 'description', e.target.value)} className="w-full mb-2 p-2 border rounded focus:outline-purple-400 resize-none" rows={2} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="font-semibold">Beneficios / Servicios incluidos:</label>
                                        <input type="text" value={edit.services_included} onChange={e => handleEditChange(plan.id, 'services_included', e.target.value)} className="w-full mb-2 p-2 border rounded focus:outline-purple-400" placeholder="Servicios incluidos" />
                                    </div>
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
            {/* Formulario de agregar plan oculto intencionalmente para evitar duplicados */}
            <div className="mb-8 p-6 bg-gray-100 rounded-xl shadow-lg border border-purple-100 max-w-xl mx-auto text-center">
                <span className="text-purple-700 font-semibold">Solo puedes editar los planes existentes. Si necesitas agregar más, contacta al administrador.</span>
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
    const [instagram_url, setInstagramUrl] = useState("");
    const [facebook_url, setFacebookUrl] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
    const [featured, setFeatured] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editId, setEditId] = useState<string|null>(null);
    const [editValues, setEditValues] = useState<any>({});

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
            instagram_url,
            facebook_url,
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

    // Iniciar edición de proveedor
    const handleStartEdit = async (supplier: any) => {
        // Consultar imágenes del proveedor en provider_media
        const { data: mediaData } = await supabase.from('provider_media').select('*').eq('provider_id', supplier.id);
        const profileImage = mediaData?.find((img: any) => img.kind === 'profile')?.url || supplier.profile_image;
        const extraImages = mediaData?.filter((img: any) => img.kind === 'image').map((img: any) => img.url) || [];
        setEditId(supplier.id);
        setEditValues({
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            whatsapp: supplier.whatsapp,
            facebook_url: supplier.facebook_url,
            instagram_url: supplier.instagram_url,
            website_url: supplier.website_url,
            description: supplier.description,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            profile_image: profileImage,
            extra_images: extraImages,
            services: supplier.services || [],
        });
    };

    // Manejar cambio en los campos de edición
    const handleEditChange = async (field: string, value: any) => {
        if (field === 'remove_profile_image') {
            // ...borrado de imagen de perfil...
            const { data: mediaData } = await supabase.from('provider_media').select('id').eq('provider_id', editId).eq('kind', 'profile');
            if (mediaData && mediaData.length > 0) {
                await supabase.from('provider_media').delete().eq('id', mediaData[0].id);
            }
            setEditValues((prev: any) => ({ ...prev, profile_image: null }));
            return;
        }
        if (field === 'remove_extra_image') {
            // ...borrado de imagen extra...
            const idx = value;
            const url = editValues.extra_images[idx];
            const { data: mediaData } = await supabase.from('provider_media').select('id').eq('provider_id', editId).eq('url', url);
            if (mediaData && mediaData.length > 0) {
                await supabase.from('provider_media').delete().eq('id', mediaData[0].id);
            }
            setEditValues((prev: any) => ({ ...prev, extra_images: prev.extra_images.filter((_: any, i: number) => i !== idx) }));
            return;
        }
        if (field === 'remove_service') {
            // Borrar servicio en provider_services
            const idx = value;
            const service = editValues.services[idx];
            if (service && service.id) {
                await supabase.from('provider_services').delete().eq('id', service.id);
            }
            setEditValues((prev: any) => ({ ...prev, services: prev.services.filter((_: any, i: number) => i !== idx) }));
            return;
        }
        if (field === 'add_service') {
            // Agregar servicio en provider_services
            const name = editValues.newServiceName;
            const description = editValues.newServiceDesc;
            const price = parseFloat(editValues.newServicePrice) || 0;
            if (name && description) {
                const { data, error } = await supabase.from('provider_services').insert({ provider_id: editId, name, description, price }).select();
                if (!error && data && data.length > 0) {
                    setEditValues((prev: any) => ({
                        ...prev,
                        services: [...prev.services, data[0]],
                        newServiceName: '',
                        newServiceDesc: '',
                        newServicePrice: ''
                    }));
                }
            }
            return;
        }
        setEditValues((prev: any) => ({ ...prev, [field]: value }));
    };

    // Guardar cambios de edición
    const handleSaveEdit = async (id: string) => {
        // Guardar datos en formato contact para la página pública
        const contact = {
            name: editValues.contact_name,
            email: editValues.email,
            phone: editValues.phone,
            whatsapp: editValues.whatsapp,
            address: editValues.address,
            city: editValues.city,
            state: editValues.state,
            instagram: editValues.instagram,
            instagram_url: editValues.instagram_url,
            facebook: editValues.facebook,
            facebook_url: editValues.facebook_url,
            website: editValues.website_url
        };
        const { error } = await supabase.from('providers').update({
            name: editValues.name,
            contact_name: editValues.contact_name,
            description: editValues.description,
            instagram: editValues.instagram,
            facebook: editValues.facebook,
            instagram_url: editValues.instagram_url,
            facebook_url: editValues.facebook_url,
            contact,
        }).eq('id', id);
        // Guardar nuevas imágenes extra
        if (editValues.add_extra_images && editValues.add_extra_images.length > 0) {
            for (let i = 0; i < editValues.add_extra_images.length; i++) {
                const file = editValues.add_extra_images[i];
                const { data, error: uploadError } = await supabase.storage.from('provider-media').upload(`gallery/${Date.now()}_${file.name}`, file);
                if (!uploadError && data?.path) {
                    const url = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                    await supabase.from('provider_media').insert({ provider_id: id, kind: 'image', url, sort_order: i });
                }
            }
        }
        // Guardar imagen de perfil si se cargó nueva
        if (editValues.profile_image instanceof File) {
            const { data, error: uploadError } = await supabase.storage.from('provider-media').upload(`profile/${Date.now()}_${editValues.profile_image.name}`, editValues.profile_image);
            if (!uploadError && data?.path) {
                const url = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                await supabase.from('provider_media').insert({ provider_id: id, kind: 'profile', url });
            }
        }
        // Guardar servicios editados/agregados
        // (Aquí podrías agregar lógica para actualizar la tabla provider_services)
        if (!error) {
            alert('Proveedor actualizado');
            setEditId(null);
            setEditValues({});
            // Recargar proveedores
            const { data: provData2 } = await supabase.from('providers').select('*').order('name');
            setSuppliers(provData2 || []);
        } else {
            alert('Error al actualizar: ' + error.message);
        }
    };

    // Cancelar edición
    const handleCancelEdit = () => {
        setEditId(null);
        setEditValues({});
    };

    // Eliminar proveedor
    const handleDeleteSupplier = async (id: string, name: string) => {
        if (window.confirm('¿Seguro que quieres borrar el proveedor ' + name + '?')) {
            const { error } = await supabase.from('providers').delete().eq('id', id);
            if (!error) {
                alert('Proveedor borrado');
                setSuppliers(prev => prev.filter(p => p.id !== id));
            } else {
                alert('Error al borrar: ' + error.message);
            }
        }
    };

    // Formulario de alta de proveedor y gestión de servicios
    return (
        <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Proveedores</h2>
                <a href="/" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Salir a página principal</a>
            </div>
            <div className="mb-6 p-4 bg-gray-50 rounded shadow">
                <h3 className="font-bold mb-2">Agregar nuevo proveedor</h3>
                {/* Inputs de >lta de provo */}
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contacto" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Teléfono" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ciudad" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={state} onChange={e => setState(e.target.value)} placeholder="Estado" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" className="mb-2 p-2 border rounded w-full" maxLength={500} rows={2} />
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={instagram_url} onChange={e => setInstagramUrl(e.target.value)} placeholder="Instagram URL" className="mb-2 p-2 border rounded w-full" maxLength={200} />
                <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook" className="mb-2 p-2 border rounded w-full" maxLength={100} />
                <input value={facebook_url} onChange={e => setFacebookUrl(e.target.value)} placeholder="Facebook URL" className="mb-2 p-2 border rounded w-full" maxLength={200} />
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
                        {suppliers.filter(s => s.is_active).map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div className="flex flex-col gap-2">
                                        {editId === s.id ? (
                                            <div className="p-4 bg-gray-50 rounded shadow">
                                                <h3 className="font-bold text-lg mb-2">Editar proveedor</h3>
                                                <div className="mb-2"><b>Nombre:</b> <input type="text" value={editValues.name ?? ''} onChange={e => handleEditChange('name', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Contacto:</b> <input type="text" value={editValues.contact_name ?? ''} onChange={e => handleEditChange('contact_name', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Email:</b> <input type="email" value={editValues.email ?? ''} onChange={e => handleEditChange('email', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Teléfono:</b> <input type="text" value={editValues.phone ?? ''} onChange={e => handleEditChange('phone', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>WhatsApp:</b> <input type="text" value={editValues.whatsapp ?? ''} onChange={e => handleEditChange('whatsapp', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Dirección:</b> <input type="text" value={editValues.address ?? ''} onChange={e => handleEditChange('address', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Ciudad:</b> <input type="text" value={editValues.city ?? ''} onChange={e => handleEditChange('city', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Estado:</b> <input type="text" value={editValues.state ?? ''} onChange={e => handleEditChange('state', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Descripción:</b> <textarea value={editValues.description ?? ''} onChange={e => handleEditChange('description', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Web:</b> <input type="text" value={editValues.website_url ?? ''} onChange={e => handleEditChange('website_url', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Instagram:</b> <input type="text" value={editValues.instagram ?? ''} onChange={e => handleEditChange('instagram', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Instagram URL:</b> <input type="text" value={editValues.instagram_url ?? ''} onChange={e => handleEditChange('instagram_url', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Facebook:</b> <input type="text" value={editValues.facebook ?? ''} onChange={e => handleEditChange('facebook', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Facebook URL:</b> <input type="text" value={editValues.facebook_url ?? ''} onChange={e => handleEditChange('facebook_url', e.target.value)} className="border-b w-full" /></div>
                                                <div className="mb-2"><b>Imagen de perfil:</b><br />
                                                    {editValues.profile_image && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <img src={editValues.profile_image} alt="Perfil" className="h-16 rounded shadow" />
                                                            <button className="text-red-500" onClick={() => handleEditChange('remove_profile_image', null)}>Borrar</button>
                                                        </div>
                                                    )}
                                                    <input type="file" accept="image/*" onChange={e => handleEditChange('profile_image', e.target.files?.[0] || null)} />
                                                </div>
                                                <div className="mb-2"><b>Imágenes extra:</b><br />
                                                    {Array.isArray(editValues.extra_images) && editValues.extra_images.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {editValues.extra_images.map((img: string, idx: number) => (
                                                                <div key={idx} className="flex flex-col items-center">
                                                                    <img src={img} alt={`Extra ${idx+1}`} className="h-16 rounded shadow mb-1" />
                                                                    <button className="text-red-500 text-xs" onClick={() => handleEditChange('remove_extra_image', idx)}>Borrar</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <input type="file" accept="image/*" multiple onChange={e => handleEditChange('add_extra_images', Array.from(e.target.files || []).slice(0, 5))} />
                                                </div>
                                                <div className="mb-2"><b>Servicios:</b>
                                                    {s.services && s.services.map((serv: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 mb-1">
                                                            <input type="text" value={editValues[`service_name_${idx}`] ?? serv.name} onChange={e => handleEditChange(`service_name_${idx}`, e.target.value)} placeholder="Nombre" className="border-b w-1/3" />
                                                            <input type="text" value={editValues[`service_desc_${idx}`] ?? serv.description} onChange={e => handleEditChange(`service_desc_${idx}`, e.target.value)} placeholder="Descripción" className="border-b w-1/3" />
                                                            <input type="number" value={editValues[`service_price_${idx}`] ?? serv.price} onChange={e => handleEditChange(`service_price_${idx}`, e.target.value)} placeholder="Precio" className="border-b w-1/4" />
                                                            <button className="text-red-500" onClick={() => handleEditChange('remove_service', idx)}>Eliminar</button>
                                                        </div>
                                                    ))}
                                                    <div className="mb-2 flex gap-2">
                                                        <input type="text" value={editValues.newServiceName ?? ''} onChange={e => handleEditChange('newServiceName', e.target.value)} placeholder="Nombre del servicio" className="border-b w-1/3" />
                                                        <input type="text" value={editValues.newServiceDesc ?? ''} onChange={e => handleEditChange('newServiceDesc', e.target.value)} placeholder="Descripción" className="border-b w-1/3" />
                                                        <input type="number" value={editValues.newServicePrice ?? ''} onChange={e => handleEditChange('newServicePrice', e.target.value)} placeholder="Precio" className="border-b w-1/4" />
                                                        <button type="button" className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => handleEditChange('add_service', null)}>Agregar servicio</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {s.name && <div><b>Nombre:</b> {s.name}</div>}
                                                {s.contact_name && <div><b>Contacto:</b> {s.contact_name}</div>}
                                                {s.description && <div><b>Info:</b> {s.description}</div>}
                                                {s.email && <div><b>Correo:</b> {s.email}</div>}
                                                {s.phone && <div><b>Teléfono:</b> {s.phone}</div>}
                                                {s.whatsapp && <div><b>WhatsApp:</b> {s.whatsapp}</div>}
                                                {s.facebook_url && <div><b>Facebook:</b> {s.facebook_url}</div>}
                                                {s.instagram_url && <div><b>Instagram:</b> {s.instagram_url}</div>}
                                                {s.website_url && <div><b>Web:</b> {s.website_url}</div>}
                                                {s.profile_image && <div><b>Imagen 1:</b> {s.profile_image}</div>}
                                                {s.cover_image && <div><b>Imagen 2:</b> {s.cover_image}</div>}
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {s.is_active ? 'Sí' : 'No'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {editId === s.id ? (
                                        <>
                                            <button className="text-green-600 hover:text-green-900 mr-2" onClick={() => handleSaveEdit(s.id)}>Guardar</button>
                                            <button className="text-gray-600 hover:text-gray-900" onClick={handleCancelEdit}>Cancelar</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="text-indigo-600 hover:text-indigo-900" onClick={() => handleStartEdit(s)}>Editar</button>
                                            <button className="ml-2 text-red-600 hover:text-red-900" onClick={() => handleDeleteSupplier(s.id, s.name)}>Borrar</button>
                                        </>
                                    )}
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
        <div className="p-6 bg-theme-primary min-h-screen relative">
            {/* Theme Toggle - Posición fija superior derecha */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle size="md" />
            </div>
            
            <ManageSuppliers />
            <ManagePlans />
            
            {/* Gestión de Videos */}
            <div className="mt-10 border-t pt-10">
                <VideoAdmin />
            </div>
            
            <AdminReviews />
            <div className="mt-8 flex justify-center">
                <a href="/admin/blog" className="inline-block px-5 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition font-semibold">
                    ✍️ Publicar artículo en Blog
                </a>
            </div>
        </div>
    );
};

export default AdminPanel;
