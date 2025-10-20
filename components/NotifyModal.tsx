import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ReviewLoginModal from './ReviewLoginModal';

interface NotifyModalProps {
  open: boolean;
  onClose: () => void;
  city?: string | null;
  category?: string | null;
  onSuccess?: (data?: any) => void;
}

const NotifyModal: React.FC<NotifyModalProps> = ({ open, onClose, city = '', category = '', onSuccess }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // simple email validation
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        alert('Ingresa un correo válido o déjalo vacío.');
        setLoading(false);
        return;
      }

      // require auth (RLS policy expects authenticated role)
      if (!user) {
        alert('Necesitas iniciar sesión antes de enviar la solicitud.');
        setLoading(false);
        setLoginOpen(true);
        return;
      }

      // call RPC insert_notify_request
      // @ts-ignore
      const { data, error } = await supabase.rpc('insert_notify_request', {
        p_email: email || null,
        p_phone: phone || null,
        p_city: city || null,
        p_category: category || null,
        p_notes: notes || null,
      });

      if (error) {
        console.error('Error inserting notify request', error);
        alert('Error guardando la solicitud. Intenta de nuevo.');
      } else {
        if (onSuccess) onSuccess(data);
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Error inesperado. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-4 w-80">
        <h3 className="font-semibold mb-2">Avisarme cuando haya proveedores</h3>
        <p className="text-sm text-gray-600 mb-3">Te notificaremos cuando agreguemos proveedores en {city || 'esta ciudad'}.</p>

        {!user && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-100 rounded">
            <p className="text-sm text-yellow-800">Necesitas iniciar sesión para registrarte y evitar spam.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setLoginOpen(true)} className="px-3 py-1 bg-purple-600 text-white rounded text-sm">Iniciar sesión</button>
              <button onClick={() => onClose()} className="px-3 py-1 border rounded text-sm">Cancelar</button>
            </div>
          </div>
        )}

        <label className="text-xs">Correo (opcional)</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-2 py-1 rounded mb-2 text-sm" />

        <label className="text-xs">Teléfono (opcional)</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border px-2 py-1 rounded mb-2 text-sm" />

        <label className="text-xs">Notas (opcional)</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border px-2 py-1 rounded mb-3 text-sm" />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !user} className="px-3 py-1 bg-purple-600 text-white rounded text-sm">{loading ? 'Enviando...' : 'Avisarme'}</button>
        </div>
      </div>
      <ReviewLoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={() => setLoginOpen(false)} providerName="Charlitron - Avisarme" />
    </div>
  );
};

export default NotifyModal;
