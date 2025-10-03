
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Category, Supplier, Service } from '../../types';

type AdminSection = 'categories' | 'suppliers' | 'services';

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<AdminSection>('suppliers');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };
    
    const renderSection = () => {
        switch (activeSection) {
            case 'suppliers':
                return <ManageSuppliers />;
            // Future sections can be added here
            // case 'categories':
            //     return <ManageCategories />;
            // case 'services':
            //     return <ManageServices />;
            default:
                return <ManageSuppliers />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800">
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-purple-700">Panel de Administración</h1>
                <div className="flex items-center">
                    <span className="mr-4 text-sm">{user?.email}</span>
                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                        Cerrar Sesión
                    </button>
                </div>
            </header>
            <main className="p-8">
                {/* For now, we only have one section. A navigation could be added here later.
                <nav className="mb-8">
                    <button onClick={() => setActiveSection('suppliers')}>Proveedores</button>
                </nav>
                */}
                {renderSection()}
            </main>
        </div>
    );
};

// Sub-component for managing suppliers
const ManageSuppliers: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('suppliers').select('*, categories(name)').order('name');
        if (error) console.error("Error fetching suppliers", error);
        else setSuppliers(data as any);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Gestionar Proveedores</h2>
            {/* Add supplier button can be implemented here */}
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.categories?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.is_active ? 'Sí' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.is_featured ? 'Sí' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900">Editar</button>
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
