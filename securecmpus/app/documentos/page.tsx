'use client';
import React, { useState } from 'react';

export default function DocumentosPage() {
  const [descargando, setDescargando] = useState(false);

  const handleDescargarPDF = async () => {
    setDescargando(true);
    // Aquí se llama a la ruta de la API que genera el PDF con el folio criptográfico
    try {
      // const response = await fetch('/api/generar-constancia', { method: 'POST' });
      alert("Generando documento seguro con código QR...");
    } catch (error) {
      console.error("Error al generar el documento");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Documentos Oficiales</h1>
      <p className="text-slate-400 mb-8">Descarga constancias validadas institucionalmente.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-2">Constancia de Estudios</h2>
          <p className="text-sm text-slate-400 mb-6 flex-grow">
            Incluye el avance reticular actualizado, promedio ponderado y código QR de validación.
          </p>
          <button 
            onClick={handleDescargarPDF}
            disabled={descargando}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {descargando ? 'Procesando....' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  ); 
}