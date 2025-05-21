import { useState, useEffect } from 'react';

// Datos simulados (deberían venir de una API en una aplicación real)
const initialParametros = [
    { id_parametro: 1, clave: 'flexibilidad_llegada', valor: '60', descripcion: 'Minutos después de 8:00 que se consideran llegada a tiempo' },
    { id_parametro: 2, clave: 'horas_laborales', valor: '9', descripcion: 'Horas que debe trabajar cada día' },
    { id_parametro: 3, clave: 'horas_semanales', valor: '44', descripcion: 'Total de horas laborales por semana' },
    { id_parametro: 4, clave: 'minutos_colacion', valor: '30', descripcion: 'Minutos de colación diarios' },
    { id_parametro: 5, clave: 'minutos_tolerancia', valor: '12', descripcion: 'Minutos extra permitidos por contraloría' },
];

export default function Configuraciones() {
    const [parametros, setParametros] = useState(initialParametros);
    const [loading, setLoading] = useState(false); // Podría usarse si se cargaran datos de una API
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // En una aplicación real, aquí harías un fetch a tu API para obtener los parámetros
    // useEffect(() => {
    //   const fetchParametros = async () => {
    //     setLoading(true);
    //     try {
    //       const response = await fetch('/api/parametros'); // Endpoint de ejemplo
    //       if (!response.ok) throw new Error('No se pudieron cargar los parámetros');
    //       const data = await response.json();
    //       setParametros(data);
    //     } catch (err) {
    //       setError(err.message);
    //     } finally {
    //       setLoading(false);
    //     }
    //   };
    //   fetchParametros();
    // }, []);

    const handleChange = (id, nuevoValor) => {
        // Permitir solo números enteros o cadena vacía para edición
        if (nuevoValor === '' || /^[0-9]+$/.test(nuevoValor)) {
            setParametros(parametros.map(p =>
                p.id_parametro === id ? { ...p, valor: nuevoValor } : p
            ));
            if (successMessage) setSuccessMessage(''); // Limpiar mensaje de éxito si se empieza a editar de nuevo
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage('');

        // Validar que ningún valor esté vacío antes de "guardar"
        const algunValorVacio = parametros.some(p => p.valor.trim() === '');
        if (algunValorVacio) {
            setError('Todos los campos de valor deben estar completos.');
            setLoading(false);
            return;
        }

        console.log('Guardando parámetros:', parametros.map(p => ({ ...p, valor: parseInt(p.valor, 10) }) ));
        // Aquí iría la lógica para enviar los datos a la API
        // try {
        //   const response = await fetch('/api/parametros', { // Endpoint de ejemplo
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(parametros.map(p => ({ ...p, valor: parseInt(p.valor, 10) }))),
        //   });
        //   if (!response.ok) throw new Error('Error al guardar los parámetros');
        //   const result = await response.json();
        //   setSuccessMessage('¡Parámetros guardados con éxito!');
        //   // Opcionalmente, volver a cargar los parámetros o actualizar el estado con la respuesta
        // } catch (err) {
        //   setError(err.message);
        // } finally {
        //   setLoading(false);
        // }

        // Simulación de guardado para el frontend
        setTimeout(() => {
            setSuccessMessage('¡Parámetros guardados con éxito! (Simulación)');
            setLoading(false);
        }, 1000);
    };

    if (loading && !parametros.length) return <p className="text-center p-4">Cargando configuraciones...</p>;
    // if (error) return <p className="text-center text-red-500 p-4">Error al cargar configuraciones: {error}</p>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-light">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">Configuración del Sistema</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Éxito: </strong>
                    <span className="block sm:inline">{successMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 md:p-8">
                <div className="space-y-6">
                    {parametros.map(param => (
                        <div key={param.id_parametro} className="md:flex md:items-center border-b border-gray-200 pb-6 mb-6">
                            <div className="md:w-1/3 mb-2 md:mb-0">
                                <label 
                                    htmlFor={`param-${param.id_parametro}`} 
                                    className="block text-gray-700 font-semibold capitalize"
                                >
                                    {param.clave.replace(/_/g, ' ')}
                                </label>
                                <p className="text-xs text-gray-500 mt-1">{param.descripcion}</p>
                            </div>
                            <div className="md:w-2/3">
                                <input 
                                    type="text" // Cambiado a text para permitir validación manual y string vacío
                                    id={`param-${param.id_parametro}`}
                                    value={param.valor}
                                    onChange={(e) => handleChange(param.id_parametro, e.target.value)}
                                    className="form-input mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 py-2 px-3"
                                    placeholder="Ingrese un valor numérico"
                                    inputMode="numeric" // Sugiere teclado numérico en móviles
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 text-right">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-150 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
} 