import { useState } from 'react'

export default function Justificaciones() {
    const [formData, setFormData] = useState({
        empleadoId: '',
        tipoPermiso: '',
        fechaInicio: '',
        fechaTermino: '',
        motivo: ''
    })
    const [mensaje, setMensaje] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        try {
            const res = await fetch('/api/justificaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Error al enviar justificación')
            
            setMensaje('Justificación enviada correctamente')
            setFormData({
                empleadoId: '',
                tipoPermiso: '',
                fechaInicio: '',
                fechaTermino: '',
                motivo: ''
            })
        } catch (error) {
            setMensaje('Error: ' + error.message)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Justificación</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        ID de Empleado
                    </label>
                    <input
                        type="number"
                        name="empleadoId"
                        value={formData.empleadoId}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Tipo de Permiso
                    </label>
                    <select
                        name="tipoPermiso"
                        value={formData.tipoPermiso}
                        onChange={handleChange}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                        <option value="">Selecciona un tipo</option>
                        <option value="MEDICO">Médico</option>
                        <option value="PERSONAL">Personal</option>
                        <option value="VACACIONES">Vacaciones</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            name="fechaInicio"
                            value={formData.fechaInicio}
                            onChange={handleChange}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Fecha Término
                        </label>
                        <input
                            type="date"
                            name="fechaTermino"
                            value={formData.fechaTermino}
                            onChange={handleChange}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Motivo
                    </label>
                    <textarea
                        name="motivo"
                        value={formData.motivo}
                        onChange={handleChange}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        rows="4"
                        required
                    ></textarea>
                </div>

                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                >
                    Enviar Justificación
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