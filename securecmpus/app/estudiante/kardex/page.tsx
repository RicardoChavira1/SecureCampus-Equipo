import React from 'react';

export default function KardexPage() {
  // Aquí se realizaría la consulta a Firebase o a tu API.
  // Ejemplo de datos estructurados:
  const avance = {
    creditosCursados: 225,
    creditosTotales: 260,
    porcentaje: 86,
    promedioPonderado: 88.78
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Kárdex y Avance Reticular</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400">Avance de Créditos</p>
          <p className="text-xl font-semibold text-white">{avance.creditosCursados} / {avance.creditosTotales} ({avance.porcentaje}%)</p>
        </div>
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400">Promedio Histórico</p>
          <p className="text-xl font-semibold text-white">{avance.promedioPonderado}</p>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-700 rounded-lg">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="p-4">Semestre</th>
              <th className="p-4">Materia</th>
              <th className="p-4">Calificación</th>
              <th className="p-4">Estatus</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 text-slate-200 divide-y divide-slate-700">
            <tr>
              <td className="p-4">9</td>
              <td className="p-4">Desarrollo Seguro</td>
              <td className="p-4">100</td>
              <td className="p-4 text-emerald-400">Aprobada</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}