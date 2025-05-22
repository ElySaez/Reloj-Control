import { useState, useEffect } from 'react';
import { getActividadPorRun } from '../api';

export default function ActividadPage() {
    const [runBusqueda, setRunBusqueda] = useState('');
    const [actividad, setActividad] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    // Efecto para limpiar mensajes cuando la búsqueda cambia o se limpia
    useEffect(() => {
        if (runBusqueda.trim() === '' || actividad.length > 0) {
            setError('');
            setMensaje('');
        }
    }, [runBusqueda, actividad]);

    const handleBuscarActividad = async (e) => {
        if (e) e.preventDefault();
        if (!runBusqueda.trim()) {
            setError('Por favor, ingrese un RUN para buscar.');
            setActividad([]);
            setMensaje('');
            return;
        }
        setLoading(true);
        setError('');
        setMensaje('');
        setActividad([]);

        try {
            const resultado = await getActividadPorRun(runBusqueda);
            if (resultado && resultado.length > 0) {
                setActividad(resultado);
            } else {
                setMensaje('No se encontró actividad para el RUN proporcionado.');
            }
        } catch (err) {
            setError(err.message || 'Error al buscar actividad.');
            console.error("Error en handleBuscarActividad:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatearFechaHora = (fechaHoraISO) => {
        if (!fechaHoraISO) return 'N/A';
        try {
            const fecha = new Date(fechaHoraISO);
            return fecha.toLocaleString('es-CL', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
        } catch (e) {
            console.error("Error formateando fecha:", e);
            return fechaHoraISO; // Devolver original si falla
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Registro de Actividad del Sistema</h1>

            <form onSubmit={handleBuscarActividad} className="mb-8 p-6 bg-white shadow-lg rounded-lg">
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="runBusquedaInput" className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar por RUN de Usuario
                        </label>
                        <input
                            type="text"
                            id="runBusquedaInput"
                            value={runBusqueda}
                            onChange={(e) => setRunBusqueda(e.target.value)}
                            placeholder="Ingrese RUN (ej: 12345678)"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out disabled:bg-gray-400"
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm animate-spin inline-block w-4 h-4 border-2 rounded-full mr-2" role="status"></span>
                                Buscando...
                            </>
                        ) : 'Buscar'}
                    </button>
                </div>
                {error && <p className="mt-3 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            </form>

            {loading && !actividad.length && (
                <div className="text-center py-4">
                    <p className="text-gray-500">Cargando actividad...</p>
                     {/* Podrías añadir un spinner más grande aquí si lo deseas */}
                </div>
            )}

            {!loading && mensaje && !actividad.length && (
                 <div className="mt-6 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
                    <p className="font-bold">Información</p>
                    <p>{mensaje}</p>
                </div>
            )}

            {actividad.length > 0 && (
                <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Usuario</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Origen</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {actividad.map((log) => (
                                <tr key={log.idLog} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.idUsuario}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.accion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.modulo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ipOrigen}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatearFechaHora(log.fechaHora)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
} 