
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Category, Supplier, Service } from '../../types';

type AdminSection = 'categories' | 'suppliers' | 'services';

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<{ role?: string } | null>(null);
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<AdminSection>('suppliers');

    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.id) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
                if (!data || data.role !== 'admin') {
                    navigate('/admin');
                }
            } else {
                navigate('/admin');
            }
        };
        fetchProfile();
    }, [user, navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'suppliers':
                return <ManageSuppliers />;
            default:
                return <ManageSuppliers />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800">
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-purple-700">Panel de Administración</h1>
                <button onClick={() => navigate('/embed')} className="ml-4 px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition">Regresar a portada</button>
                <div className="flex items-center">
                    <span className="mr-4 text-sm">{user?.email}</span>
                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                        Cerrar Sesión
                    </button>
                </div>
            </header>
            <main className="p-8">
                {profile?.role === 'admin' ? renderSection() : <p className="text-center text-red-500">Acceso restringido. Solo administradores pueden gestionar proveedores.</p>}
            </main>
        </div>
    );
};

// Sub-component for managing suppliers
const ManageSuppliers: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editActive, setEditActive] = useState(true);
    const [editContact, setEditContact] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editWhatsapp, setEditWhatsapp] = useState("");
    const [editWebsite, setEditWebsite] = useState("");
    const [editFacebook, setEditFacebook] = useState("");
    const [editInstagram, setEditInstagram] = useState("");
    const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
    const [editServices, setEditServices] = useState<any[]>([]);
    const [editServiceName, setEditServiceName] = useState("");
    const [editServiceDesc, setEditServiceDesc] = useState("");
    const [editServicePrice, setEditServicePrice] = useState("");
    const [editMedia, setEditMedia] = useState<File | null>(null);
    const [editGallery, setEditGallery] = useState<any[]>([]);
    // Nuevo proveedor
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newActive, setNewActive] = useState(true);
    const [newContact, setNewContact] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newWhatsapp, setNewWhatsapp] = useState("");
    const [newWebsite, setNewWebsite] = useState("");
    const [newFacebook, setNewFacebook] = useState("");
    const [newInstagram, setNewInstagram] = useState("");
    const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
    const [newServiceName, setNewServiceName] = useState("");
    const [newServiceDesc, setNewServiceDesc] = useState("");
    const [newServicePrice, setNewServicePrice] = useState("");
    const [newServices, setNewServices] = useState<any[]>([]);
    const [newMedia, setNewMedia] = useState<File | null>(null);

    const fetchSuppliers = useCallback(async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('providers')
                    .select(`id, name, is_active, featured, profile_image_url, provider_categories!inner(category_id)`)
                    .order('name');
                if (error) console.error("Error fetching suppliers", error);
                else setSuppliers(data as any);
                setLoading(false);
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

        // Editar proveedor
        const handleEdit = async (s: Supplier) => {
            setEditId(s.id);
            setEditName(s.name);
            setEditDesc(s.description || "");
            setEditActive(!!s.is_active);
            setEditContact("");
            setEditEmail(s.contact?.email || "");
            setEditPhone(s.contact?.phone || "");
            setEditWhatsapp(s.contact?.whatsapp || "");
            setEditWebsite(s.contact?.maps_url || "");
            setEditFacebook(s.contact?.facebook || "");
            setEditInstagram(s.contact?.instagram || "");
            // Cargar servicios
            const { data: servs } = await supabase.from('provider_services').select('*').eq('provider_id', s.id);
            setEditServices(servs || []);
            // Cargar galería
            const { data: gallery } = await supabase.from('provider_media').select('*').eq('provider_id', s.id);
            setEditGallery(gallery || []);
        };

        const handleSave = async () => {
            if (!editId) return;
            // 1. Subir imagen de perfil si existe
            let profileImageUrl = null;
            if (editProfileImage) {
                const { data, error } = await supabase.storage.from('provider-media').upload(`profile/${Date.now()}_${editProfileImage.name}`, editProfileImage);
                if (!error && data?.path) {
                    profileImageUrl = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                }
            }
            // 2. Actualizar proveedor
            await supabase
                .from('providers')
                .update({
                    name: editName,
                    description: editDesc,
                    contact: {
                        email: editEmail,
                        phone: editPhone,
                        whatsapp: editWhatsapp,
                        instagram: editInstagram,
                        maps_url: editWebsite,
                        facebook: editFacebook
                    },
                    is_active: editActive,
                    ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {})
                })
                .eq('id', editId);
            // 3. Actualizar servicios
            await supabase.from('provider_services').delete().eq('provider_id', editId);
            if (editServices.length > 0) {
                await supabase.from('provider_services').insert(editServices.map(s => ({ ...s, provider_id: editId })));
            }
            setEditId(null);
            fetchSuppliers();
        };

        const handleDelete = async (id: string) => {
            if (!window.confirm('¿Seguro que deseas borrar este proveedor?')) return;
            const { error } = await supabase
                .from('providers')
                .delete()
                .eq('id', id);
            if (!error) fetchSuppliers();
        };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Gestionar Proveedores</h2>
            <div className="mb-6 p-4 bg-gray-50 rounded shadow">
                <h3 className="font-bold mb-2">Agregar nuevo proveedor</h3>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre" className="mb-2 p-2 border rounded w-full" />
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripción" className="mb-2 p-2 border rounded w-full" />
                <input value={newContact} onChange={e => setNewContact(e.target.value)} placeholder="Contacto" className="mb-2 p-2 border rounded w-full" />
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email" className="mb-2 p-2 border rounded w-full" />
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Teléfono" className="mb-2 p-2 border rounded w-full" />
                <input value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)} placeholder="WhatsApp" className="mb-2 p-2 border rounded w-full" />
                <input value={newWebsite} onChange={e => setNewWebsite(e.target.value)} placeholder="Web" className="mb-2 p-2 border rounded w-full" />
                <input value={newFacebook} onChange={e => setNewFacebook(e.target.value)} placeholder="Facebook" className="mb-2 p-2 border rounded w-full" />
                <input value={newInstagram} onChange={e => setNewInstagram(e.target.value)} placeholder="Instagram" className="mb-2 p-2 border rounded w-full" />
                <label className="flex items-center mb-2">
                    <input type="checkbox" checked={newActive} onChange={e => setNewActive(e.target.checked)} className="mr-2" /> Activo
                </label>
                <div className="mb-2">
                    <label className="block mb-1">Imagen de perfil</label>
                    <input type="file" accept="image/*" onChange={e => setNewProfileImage(e.target.files?.[0] || null)} />
                </div>
                <div className="mb-2">
                    <label className="block mb-1">Agregar servicio</label>
                    <input value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder="Nombre del servicio" className="mb-1 p-2 border rounded w-full" />
                    <input value={newServiceDesc} onChange={e => setNewServiceDesc(e.target.value)} placeholder="Descripción del servicio" className="mb-1 p-2 border rounded w-full" />
                    <input value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} placeholder="Precio" className="mb-1 p-2 border rounded w-full" />
                    <button type="button" className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => {
                        if (newServiceName) {
                            setNewServices([...newServices, { name: newServiceName, description: newServiceDesc, price: parseFloat(newServicePrice) || 0 }]);
                            setNewServiceName("");
                            setNewServiceDesc("");
                            setNewServicePrice("");
                        }
                    }}>Agregar servicio</button>
                </div>
                <div className="mb-2">
                    <label className="block mb-1">Agregar imagen</label>
                    <input type="file" accept="image/*" onChange={e => setNewMedia(e.target.files?.[0] || null)} />
                </div>
                <button
                    onClick={async () => {
                        if (!newName) return;
                        // 1. Subir imagen de perfil si existe
                        let profileImageUrl = null;
                        if (newProfileImage) {
                            const { data, error } = await supabase.storage.from('provider-media').upload(`profile/${Date.now()}_${newProfileImage.name}`, newProfileImage);
                            if (!error && data?.path) {
                                profileImageUrl = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                            }
                        }
                        // 2. Crear proveedor
                        const { data: provData, error: provError } = await supabase
                            .from('providers')
                            .insert({
                                name: newName,
                                description: newDesc,
                                contact: {
                                    email: newEmail,
                                    phone: newPhone,
                                    whatsapp: newWhatsapp,
                                    instagram: newInstagram,
                                    maps_url: newWebsite,
                                    facebook: newFacebook
                                },
                                is_active: newActive,
                                profile_image_url: profileImageUrl
                            })
                            .select();
                        const provider = provData?.[0];
                        // 3. Agregar servicios
                        if (provider && newServices.length > 0) {
                            await supabase
                                .from('provider_services')
                                .insert(newServices.map(s => ({ ...s, provider_id: provider.id })));
                        }
                        // 4. Subir imagen extra si existe
                        if (provider && newMedia) {
                            const { data, error } = await supabase.storage.from('provider-media').upload(`gallery/${Date.now()}_${newMedia.name}`, newMedia);
                            if (!error && data?.path) {
                                const url = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                                await supabase
                                    .from('provider_media')
                                    .insert({ provider_id: provider.id, kind: 'image', url, sort_order: 0 });
                            }
                        }
                        // 5. Limpiar y recargar
                        setNewName("");
                        setNewDesc("");
                        setNewContact("");
                        setNewEmail("");
                        setNewPhone("");
                        setNewWhatsapp("");
                        setNewWebsite("");
                        setNewFacebook("");
                        setNewInstagram("");
                        setNewProfileImage(null);
                        setNewServices([]);
                        setNewMedia(null);
                        fetchSuppliers();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
                >Agregar</button>
            </div>
            {editId && (
                <div className="mb-6 p-4 bg-yellow-50 rounded shadow">
                    <h3 className="font-bold mb-2">Editar proveedor</h3>
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" className="mb-2 p-2 border rounded w-full" />
                    <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Descripción" className="mb-2 p-2 border rounded w-full" />
                    <input value={editContact} onChange={e => setEditContact(e.target.value)} placeholder="Contacto" className="mb-2 p-2 border rounded w-full" />
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" className="mb-2 p-2 border rounded w-full" />
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Teléfono" className="mb-2 p-2 border rounded w-full" />
                    <input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} placeholder="WhatsApp" className="mb-2 p-2 border rounded w-full" />
                    <input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="Web" className="mb-2 p-2 border rounded w-full" />
                    <input value={editFacebook} onChange={e => setEditFacebook(e.target.value)} placeholder="Facebook" className="mb-2 p-2 border rounded w-full" />
                    <input value={editInstagram} onChange={e => setEditInstagram(e.target.value)} placeholder="Instagram" className="mb-2 p-2 border rounded w-full" />
                    <label className="flex items-center mb-2">
                        <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} className="mr-2" /> Activo
                    </label>
                    <div className="mb-2">
                        <label className="block mb-1">Imagen de perfil</label>
                        <input type="file" accept="image/*" onChange={e => setEditProfileImage(e.target.files?.[0] || null)} />
                    </div>
                    <div className="mb-2">
                        <label className="block mb-1">Servicios</label>
                        {editServices.map((s, idx) => (
                            <div key={idx} className="flex items-center mb-1">
                                <span className="mr-2">{s.name} (${s.price})</span>
                                <button className="text-red-500" onClick={() => setEditServices(editServices.filter((_, i) => i !== idx))}>Eliminar</button>
                            </div>
                        ))}
                        <input value={editServiceName} onChange={e => setEditServiceName(e.target.value)} placeholder="Nombre del servicio" className="mb-1 p-2 border rounded w-full" />
                        <input value={editServiceDesc} onChange={e => setEditServiceDesc(e.target.value)} placeholder="Descripción del servicio" className="mb-1 p-2 border rounded w-full" />
                        <input value={editServicePrice} onChange={e => setEditServicePrice(e.target.value)} placeholder="Precio" className="mb-1 p-2 border rounded w-full" />
                        <button type="button" className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => {
                            if (editServiceName) {
                                setEditServices([...editServices, { name: editServiceName, description: editServiceDesc, price: parseFloat(editServicePrice) || 0 }]);
                                setEditServiceName("");
                                setEditServiceDesc("");
                                setEditServicePrice("");
                            }
                        }}>Agregar servicio</button>
                    </div>
                    <div className="mb-2">
                        <label className="block mb-1">Imágenes</label>
                        {editGallery.map((img, idx) => (
                            <div key={idx} className="flex items-center mb-1">
                                <img src={img.url} alt="img" className="w-16 h-16 object-cover mr-2" />
                                <button className="text-red-500" onClick={async () => {
                                    await supabase.from('provider_media').delete().eq('id', img.id);
                                    setEditGallery(editGallery.filter((_, i) => i !== idx));
                                }}>Eliminar</button>
                            </div>
                        ))}
                        <input type="file" accept="image/*" onChange={e => setEditMedia(e.target.files?.[0] || null)} />
                        <button type="button" className="px-2 py-1 bg-blue-500 text-white rounded" onClick={async () => {
                            if (editMedia && editId) {
                                const { data, error } = await supabase.storage.from('provider-media').upload(`gallery/${Date.now()}_${editMedia.name}`, editMedia);
                                if (!error && data?.path) {
                                    const url = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                                    const { data: mediaData } = await supabase.from('provider_media').insert({ provider_id: editId, kind: 'image', url, sort_order: 0 }).select();
                                    setEditGallery([...editGallery, mediaData?.[0]]);
                                    setEditMedia(null);
                                }
                            }
                        }}>Agregar imagen</button>
                    </div>
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded mr-2">Guardar</button>
                    <button onClick={() => setEditId(null)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancelar</button>
                </div>
            )}
            {loading ? <p>Cargando...</p> : (
                <div className="bg-white shadow rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destacado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {suppliers.map(s => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Array.isArray(s.provider_categories) ? s.provider_categories.map((c: any) => c.category_id).join(', ') : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.is_active ? 'Sí' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.featured ? 'Sí' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900" onClick={() => handleEdit(s)}>Editar</button>
                                        <button className="ml-2 text-red-600 hover:text-red-900" onClick={() => handleDelete(s.id)}>Borrar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


export default AdminPanel;
