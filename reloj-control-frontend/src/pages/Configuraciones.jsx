import { useState, useEffect } from 'react';

// Ya no usaremos initialParametros, se cargarán desde la API
// const initialParametros = [
//     { idParametro: 1, clave: 'flexibilidad_llegada', valor: '60', descripcion: 'Minutos después de 8:00 que se consideran llegada a tiempo' },
//     ...
// ];

export default function Configuraciones() {
    const [parametros, setParametros] = useState([]); // Iniciar vacío, se cargará desde la API
    const [loading, setLoading] = useState(true); // Iniciar en true para la carga inicial
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
      const fetchParametros = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/parametros'); 
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`No se pudieron cargar los parámetros: ${response.status} ${errorData || ''}`);
          }
          const data = await response.json();
          // Asegurarse de que el valor sea string para consistencia con el input
          setParametros(data.map(p => ({ ...p, valor: String(p.valor) }))); 
        } catch (err) {
          setError(err.message);
          setParametros([]); // Limpiar en caso de error
        } finally {
          setLoading(false);
        }
      };
      fetchParametros();
    }, []);

    const handleChange = (id, nuevoValor) => {
        if (nuevoValor === '' || /^[0-9]+$/.test(nuevoValor)) {
            setParametros(parametros.map(p =>
                p.idParametro === id ? { ...p, valor: nuevoValor } : p
            ));
            if (successMessage) setSuccessMessage('');
            if (error) setError(null); // Limpiar error si se empieza a editar
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const algunValorVacio = parametros.some(p => p.valor.trim() === '');
        if (algunValorVacio) {
            setError('Todos los campos de valor son requeridos y deben estar completos.');
            setSuccessMessage('');
            return;
        }
        setError(null);
        setLoading(true);
        setSuccessMessage('');

        // Ajustar el mapeo aquí: el estado interno usa idParametro (del GET)
        // pero el POST espera "id".
        const parametrosParaEnviar = parametros.map(p => ({
            id: p.idParametro, // Mapear idParametro del estado a "id" para el POST
            valor: p.valor, 
            clave: p.clave 
        }));

        try {
          const response = await fetch('/api/parametros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parametrosParaEnviar),
          });
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error al guardar los parámetros: ${response.status} ${errorData || ''}`);
          }
          const result = await response.json(); // El backend devuelve la lista actualizada
          setParametros(result.map(p => ({ ...p, valor: String(p.valor) }))); // Actualizar con los datos del backend
          setSuccessMessage('¡Parámetros guardados con éxito!');
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
    };

    if (loading && !parametros.length) return <p className="text-center p-4 text-gray-600">Cargando configuraciones...</p>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50"> {/* Fondo ligeramente gris */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center">Configuración del Sistema</h1>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}
            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Éxito</p>
                    <p>{successMessage}</p>
                </div>
            )}

            {parametros.length > 0 ? (
                <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg p-6 md:p-8">
                    <div className="space-y-8">
                        {parametros.map(param => (
                            <div key={param.idParametro} className="md:grid md:grid-cols-3 md:gap-6 items-center border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                                <div className="md:col-span-1 mb-3 md:mb-0">
                                    <label 
                                        htmlFor={`param-${param.idParametro}`} 
                                        className="block text-md font-medium text-gray-700 capitalize"
                                    >
                                        {param.clave.replace(/_/g, ' ')}
                                    </label>
                                    <p className="text-sm text-gray-500 mt-1">{param.descripcion}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <input 
                                        type="text"
                                        id={`param-${param.idParametro}`}
                                        value={param.valor}
                                        onChange={(e) => handleChange(param.idParametro, e.target.value)}
                                        className="form-input block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
                                        placeholder="Valor numérico"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 pt-6 border-t border-gray-200 text-right">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            ) : (
                !loading && <p className="text-center text-gray-500">No hay parámetros para mostrar o no se pudieron cargar.</p>
            )}
        </div>
    );
} 