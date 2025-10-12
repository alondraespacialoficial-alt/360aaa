import React from 'react';
import { Link } from 'react-router-dom';

const LegalNotice: React.FC = () => (
  <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
    <h1 className="text-2xl font-bold mb-4 text-purple-800">Aviso de Privacidad y Legal</h1>
    <p><strong>Charlitron® Eventos 360 Directorio de Proveedores</strong></p>
    <p className="mt-2">Charlitron® Eventos 360 informa que los datos publicados en este directorio de proveedores son utilizados únicamente con el objetivo de dar a conocer los productos y servicios ofrecidos por cada proveedor dentro de nuestra plataforma. La información proporcionada no se comparte, transfiere ni vende a terceros; su uso se limita a la exhibición pública dentro del directorio para facilitar el contacto comercial.</p>
    <p className="mt-2">Charlitron® Eventos 360 actúa únicamente como un directorio digital de visualización y promoción; cada proveedor es independiente y responsable exclusivo de sus productos, servicios y cumplimiento. Charlitron® Eventos 360 no interviene ni responde por acuerdos, garantías, entregas, calidad, pagos, incumplimientos, reclamaciones o controversias derivadas de la relación directa entre proveedor y cliente.</p>
    <p className="mt-2">Al registrarse o aparecer en este directorio, el proveedor acepta y reconoce que Charlitron® Eventos 360 se deslinda expresamente de toda responsabilidad por actos, omisiones o conductas posteriores, siendo únicamente un medio de exposición y contacto visual.</p>
    <p className="mt-2">Para dudas, aclaraciones o ejercicio de derechos sobre datos personales (acceso, rectificación, cancelación u oposición), comuníquese a: <a href="mailto:ventas@charlitron.com" className="text-indigo-600 underline">ventas@charlitron.com</a></p>
    <p className="mt-2">Este aviso puede actualizarse en cualquier momento, notificándose en esta misma página.</p>
    <em className="block mt-2">Última actualización: 12 de octubre de 2025</em>
    <div className="mt-6">
      <Link to="/" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-semibold shadow">
        ← Regresar a la página principal
      </Link>
    </div>
  </div>
);

export default LegalNotice;
