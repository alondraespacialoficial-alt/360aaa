// Sub-componente para gestionar reseñas
const ManageReviews: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('provider_reviews')
                .select('id, provider_id, user_id, rating, comment, created_at');
            setReviews(data || []);
            setLoading(false);
        };
        fetchReviews();
    }, []);
    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas borrar esta reseña?')) return;
        await supabase.from('provider_reviews').delete().eq('id', id);
        setReviews(reviews.filter(r => r.id !== id));
    };
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Reseñas de Proveedores</h2>
            {loading ? <p>Cargando...</p> : (
                <div className="bg-white shadow rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reviews.map(r => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.provider_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.user_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-bold">{r.rating}★</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.comment}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(r.id)}>Eliminar</button>
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

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Category, Supplier, Service } from '../../types';

// Definición única de AdminSection
type AdminSection = 'categories' | 'suppliers' | 'services' | 'reviews';

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
    navigate('/');
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'suppliers':
                return <ManageSuppliers />;
            case 'reviews':
                return <ManageReviews />;
            default:
                return <ManageSuppliers />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800">
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-purple-700">Panel de Administración</h1>
                <div className="flex gap-2 items-center">
                  <button onClick={() => navigate('/')} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">Ir a página principal</button>
                  <button onClick={() => navigate('/embed')} className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition">Regresar a portada</button>
                  <button onClick={() => setActiveSection('reviews')} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">Reseñas</button>
                </div>
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
    // ...existing code...
    // Funciones para guardar emoji en categoría
    const handleSaveCategoryEmoji = async (catId: string, emoji: string) => {
        await supabase.from('categories').update({ emoji }).eq('id', catId);
        const { data } = await supabase.from('categories').select('*').order('name');
        setCategories(data || []);
    };
    // Selector de emoji para categoría
    const emojiList = ['🍽️','🎧','🎂','🎈','📸','🎥','🚌','🏨','🎤','🍹','✉️','🎁','🎉','🕺','👗','👑','🎮','🧁','🍕','🍔','🍦','🍷','🍺','🚗','🏕️','🎭','🎨','🎬','🎲','🎳','🎡','🎢','🎠','🎪','🎻','🎸','🎷','🥁','🎺','🪗','🪕','🧑‍🍳','🧑‍🎤','🧑‍🎨','🧑‍🚀','🧑‍🏫','🧑‍⚕️','🧑‍🔬','🧑‍💻','🧑‍🔧','🧑‍🏭','🧑‍🌾','🧑‍🍳'];
    const [selectedEmoji, setSelectedEmoji] = useState('');
    // Categorías
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('*').order('name');
            setCategories(data || []);
        };
        fetchCategories();
    }, []);
    const [addError, setAddError] = useState<string | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editActive, setEditActive] = useState(true);
    // Eliminado: const [editContact, setEditContact] = useState("");
    const [editFeatured, setEditFeatured] = useState(false);
    const [editSelectedCategories, setEditSelectedCategories] = useState<string[]>([]);
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
    const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('providers')
            .select('*')
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
            // Eliminado: setEditContact("");
            setEditFeatured(!!s.is_featured);
            // Obtener categorías seleccionadas
            const { data: catData } = await supabase.from('provider_categories').select('category_id').eq('provider_id', s.id);
            setEditSelectedCategories(catData ? catData.map((c: any) => c.category_id) : []);
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
                    is_featured: editFeatured,
                    ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {})
                })
                .eq('id', editId);
            // Actualizar categorías
            await supabase.from('provider_categories').delete().eq('provider_id', editId);
            if (editSelectedCategories.length > 0) {
                await supabase.from('provider_categories').insert(editSelectedCategories.map(catId => ({ provider_id: editId, category_id: catId })));
            }
            // 3. Actualizar servicios
            await supabase.from('provider_services').delete().eq('provider_id', editId);
            if (editServices.length > 0) {
                await supabase.from('provider_services').insert(editServices.map(s => ({ ...s, provider_id: editId })));
            }
            // Limitar imágenes a 5
            if (editGallery.length > 5) {
                // Eliminar las imágenes extra
                const extraImgs = editGallery.slice(5);
                for (const img of extraImgs) {
                    await supabase.from('provider_media').delete().eq('id', img.id);
                }
                setEditGallery(editGallery.slice(0, 5));
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
                <div className="mb-2">
                    <label className="block mb-1">Categorías</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(cat.id)}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setSelectedCategories([...selectedCategories, cat.id]);
                                        } else {
                                            setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                                        }
                                    }}
                                />
                                <span>{cat.name}</span>
                                <span className="text-2xl ml-2">{cat.emoji || '🎉'}</span>
                                <button
                                    type="button"
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs ml-2"
                                    onClick={() => handleSaveCategoryEmoji(cat.id)}
                                >Guardar emoji</button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2">
                        <label className="block mb-1">Emoji para la categoría</label>
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{cat.name}</span>
                                <div className="flex flex-wrap gap-2">
                                    {emojiList.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className={`text-2xl px-2 py-1 rounded ${cat.emoji === emoji ? 'bg-purple-200' : 'bg-gray-100'} hover:bg-purple-100`}
                                            onClick={() => handleSaveCategoryEmoji(cat.id, emoji)}
                                        >{emoji}</button>
                                    ))}
                                    <input
                                        type="text"
                                        value={cat.emoji || ''}
                                        onChange={e => handleSaveCategoryEmoji(cat.id, e.target.value)}
                                        placeholder="O pega tu emoji aquí"
                                        className="p-2 border rounded w-16 text-2xl"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {addError && <div className="mb-2 text-red-600 font-semibold">{addError}</div>}
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
                    <label className="block mb-1">Agregar imágenes (máx. 5)</label>
                    <input type="file" accept="image/*" multiple onChange={e => {
                        const files = Array.from(e.target.files || []);
                        setNewMediaFiles(files.slice(0, 5));
                    }} />
                    <div className="flex gap-2 mt-2">
                        {newMediaFiles.map((file, idx) => (
                            <span key={idx} className="text-xs bg-gray-200 px-2 py-1 rounded">{file.name}</span>
                        ))}
                    </div>
                </div>
                <button
                    onClick={async () => {
                        if (selectedCategories.length === 0) {
                            setAddError('Debes seleccionar al menos una categoría.');
                            return;
                        }
                        setAddError(null);
                        if (!newName) {
                            setAddError('El nombre es obligatorio.');
                            return;
                        }
                        // 1. Subir imagen de perfil si existe
                        let profileImageUrl = null;
                        if (newProfileImage) {
                            const { data, error } = await supabase.storage.from('provider-media').upload(`profile/${Date.now()}_${newProfileImage.name}`, newProfileImage);
                            if (error) {
                                setAddError('Error al subir la imagen de perfil: ' + error.message);
                                return;
                            }
                            if (data?.path) {
                                profileImageUrl = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                            }
                        }
                        // 2. Crear proveedor
                        const { data: provData, error: provError } = await supabase
                            .from('providers')
                            .insert({
                                name: newName,
                                description: newDesc,
                                email: newEmail,
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
                        if (provError) {
                            setAddError('Error al guardar proveedor: ' + provError.message);
                            return;
                        }
                        const provider = provData?.[0];
                        if (!provider) {
                            setAddError('No se pudo crear el proveedor.');
                            return;
                        }
                        // Guardar relación proveedor-categoría
                        const { error: catError } = await supabase
                            .from('provider_categories')
                            .insert(selectedCategories.map(catId => ({ provider_id: provider.id, category_id: catId })));
                        if (catError) {
                            setAddError('Error al guardar categorías: ' + catError.message);
                            return;
                        }
                        // 3. Agregar servicios
                        if (newServices.length > 0) {
                            const { error: servError } = await supabase
                                .from('provider_services')
                                .insert(newServices.map(s => ({ ...s, provider_id: provider.id })));
                            if (servError) {
                                setAddError('Error al guardar servicios: ' + servError.message);
                                return;
                            }
                        }
                        // 4. Subir imágenes extra si existen
                        if (newMediaFiles.length > 0) {
                            for (let i = 0; i < newMediaFiles.length; i++) {
                                const file = newMediaFiles[i];
                                const { data, error } = await supabase.storage.from('provider-media').upload(`gallery/${Date.now()}_${file.name}`, file);
                                if (error) {
                                    setAddError('Error al subir imagen extra: ' + error.message);
                                    return;
                                }
                                if (data?.path) {
                                    const url = supabase.storage.from('provider-media').getPublicUrl(data.path).data.publicUrl;
                                    const { error: mediaError } = await supabase
                                        .from('provider_media')
                                        .insert({ provider_id: provider.id, kind: 'image', url, sort_order: i });
                                    if (mediaError) {
                                        setAddError('Error al guardar imagen extra: ' + mediaError.message);
                                        return;
                                    }
                                }
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
                        setNewMediaFiles([]);
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
                    {/* Eliminado input de contacto */}
                    <div className="mb-2">
                        <label className="block mb-1">Categorías</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <label key={cat.id} className="flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={editSelectedCategories.includes(cat.id)}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setEditSelectedCategories([...editSelectedCategories, cat.id]);
                                            } else {
                                                setEditSelectedCategories(editSelectedCategories.filter(id => id !== cat.id));
                                            }
                                        }}
                                    />
                                    <span>{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <label className="flex items-center mb-2">
                        <input type="checkbox" checked={editFeatured} onChange={e => setEditFeatured(e.target.checked)} className="mr-2" /> Destacado
                    </label>
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
                        {editGallery.slice(0, 5).map((img, idx) => (
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
                            {/* Mostrar destacados arriba, básicos abajo */}
                            {[...suppliers.filter(s => s.is_featured), ...suppliers.filter(s => !s.is_featured)].map(s => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {s.is_featured && <span title="Destacado" className="text-yellow-500 mr-1">★</span>}
                                        {s.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* Mostrar nombres de categorías */}
                                        {categories.length > 0 && s.id ? (
                                            (() => {
                                                const cats = categories.filter(cat =>
                                                    s.provider_categories?.some((c: any) => c.category_id === cat.id)
                                                );
                                                return cats.length > 0 ? cats.map(c => c.name).join(', ') : 'N/A';
                                            })()
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.is_active ? 'Sí' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button
                                            className={`px-2 py-1 rounded ${s.is_featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'} mr-2`}
                                            onClick={async () => {
                                                await supabase.from('providers').update({ is_featured: !s.is_featured }).eq('id', s.id);
                                                fetchSuppliers();
                                            }}
                                        >
                                            {s.is_featured ? 'Destacado ★' : 'Básico'}
                                        </button>
                                    </td>
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
