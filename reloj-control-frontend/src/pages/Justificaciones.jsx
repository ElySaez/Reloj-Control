import { useState } from 'react'
import { crearJustificacion } from '../api' // Asumiendo que la función estará en api/index.js

export default function Justificaciones() {
    const [formData, setFormData] = useState({
        rutEmpleado: '',
        tipoPermiso: '',
        fechaInicio: '',
        fechaTermino: '',
        motivo: ''
    })
    const [archivo, setArchivo] = useState(null)
    const [mensaje, setMensaje] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMensaje('')

        const justificacionData = { ...formData };

        try {
            const data = new FormData();
            
            data.append('rutEmpleado', justificacionData.rutEmpleado);
            data.append('tipoPermiso', justificacionData.tipoPermiso);
            data.append('fechaInicio', justificacionData.fechaInicio);
            data.append('fechaTermino', justificacionData.fechaTermino);
            data.append('motivo', justificacionData.motivo);
            
            if (archivo) {
                data.append('archivo', archivo);
            }

            await crearJustificacion(data); 
            
            setMensaje('Justificación enviada correctamente')
            setFormData({
                rutEmpleado: '',
                tipoPermiso: '',
                fechaInicio: '',
                fechaTermino: '',
                motivo: ''
            })
            setArchivo(null)
            if (document.getElementById('archivo-input')) {
                document.getElementById('archivo-input').value = '';
            }
        } catch (error) {
            setMensaje('Error: ' + (error.response?.data?.message || error.message || 'Error al enviar justificación'))
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value, files } = e.target
        if (name === "archivo") {
            setArchivo(files[0])
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Justificación</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="rutEmpleado" className="block text-gray-700 text-sm font-bold mb-2">
                        RUT de Empleado
                    </label>
                    <input
                        id="rutEmpleado"
                        type="text"
                        name="rutEmpleado"
                        value={formData.rutEmpleado}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        disabled={loading}
                        placeholder="Ej: 12345678-9"
                    />
                </div>

                <div>
                    <label htmlFor="tipoPermiso" className="block text-gray-700 text-sm font-bold mb-2">
                        Tipo de Permiso
                    </label>
                    <select
                        id="tipoPermiso"
                        name="tipoPermiso"
                        value={formData.tipoPermiso}
                        onChange={handleChange}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        disabled={loading}
                    >
                        <option value="">Selecciona un tipo</option>
                        <option value="Licencia Medica">Licencia Medica</option>
                        <option value="Feriado Legal">Feriado Legal</option>
                        <option value="Permiso Administrativo">Permiso Administrativo</option>
                        {/* Considerar cargar tipos desde el backend si son dinámicos en el futuro */}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="fechaInicio" className="block text-gray-700 text-sm font-bold mb-2">
                            Fecha Inicio
                        </label>
                        <input
                            id="fechaInicio"
                            type="date"
                            name="fechaInicio"
                            value={formData.fechaInicio}
                            onChange={handleChange}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="fechaTermino" className="block text-gray-700 text-sm font-bold mb-2">
                            Fecha Término
                        </label>
                        <input
                            id="fechaTermino"
                            type="date"
                            name="fechaTermino"
                            value={formData.fechaTermino}
                            onChange={handleChange}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="motivo" className="block text-gray-700 text-sm font-bold mb-2">
                        Motivo
                    </label>
                    <textarea
                        id="motivo"
                        name="motivo"
                        value={formData.motivo}
                        onChange={handleChange}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        rows="4"
                        required
                        disabled={loading}
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="archivo-input" className="block text-gray-700 text-sm font-bold mb-2">
                        Adjuntar Archivo (Opcional)
                    </label>
                    <input
                        id="archivo-input"
                        type="file"
                        name="archivo"
                        onChange={handleChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-blue-300"
                    disabled={loading}
                >
                    {loading ? 'Enviando...' : 'Enviar Justificación'}
                </button>
            </form>

            {mensaje && (
                <div className={`mt-4 p-4 rounded ${
                    mensaje.startsWith('Error') 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                }`}>
                    {mensaje}
                </div>
            )}
        </div>
    )
} 