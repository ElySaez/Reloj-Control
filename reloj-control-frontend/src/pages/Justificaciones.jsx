import { useState, useEffect } from 'react'
import { crearJustificacion, getJustificacionesPorRutEmpleado, API_URL } from '../api'

export default function Justificaciones() {
    const [formData, setFormData] = useState({
        rutEmpleado: '',
        tipoPermiso: '',
        fechaInicio: '',
        fechaTermino: '',
        motivo: ''
    })
    const [archivo, setArchivo] = useState(null)
    const [mensajeFormulario, setMensajeFormulario] = useState('')
    const [loadingFormulario, setLoadingFormulario] = useState(false)

    const [vistaActual, setVistaActual] = useState('buscador')
    const [rutBusqueda, setRutBusqueda] = useState('')
    const [justificacionesEncontradas, setJustificacionesEncontradas] = useState([])
    const [loadingBusqueda, setLoadingBusqueda] = useState(false)
    const [errorBusqueda, setErrorBusqueda] = useState('')
    const [mensajeBusqueda, setMensajeBusqueda] = useState('')

    const handleSubmitNuevaJustificacion = async (e) => {
        e.preventDefault()
        setLoadingFormulario(true)
        setMensajeFormulario('')
        const justificacionData = { ...formData }
        if (justificacionData.rutEmpleado && typeof justificacionData.rutEmpleado === 'string') {
            // Aquí podrías añadir validación/formateo de RUT si es necesario antes de enviar
        }

        try {
            const data = new FormData()
            data.append('rutEmpleado', justificacionData.rutEmpleado)
            data.append('tipoPermiso', justificacionData.tipoPermiso)
            data.append('fechaInicio', justificacionData.fechaInicio)
            data.append('fechaTermino', justificacionData.fechaTermino)
            data.append('motivo', justificacionData.motivo)
            
            if (archivo) {
                data.append('archivo', archivo)
            }

            await crearJustificacion(data)
            
            setMensajeFormulario('Justificación enviada correctamente')
            setFormData({
                rutEmpleado: '',
                tipoPermiso: '',
                fechaInicio: '',
                fechaTermino: '',
                motivo: ''
            })
            setArchivo(null)
            if (document.getElementById('archivo-input')) {
                document.getElementById('archivo-input').value = ''
            }
            // Opcional: Volver al buscador después de enviar exitosamente
            // setVistaActual('buscador')
        } catch (error) {
            setMensajeFormulario('Error: ' + (error.response?.data?.message || error.message || 'Error al enviar justificación'))
        } finally {
            setLoadingFormulario(false)
        }
    }

    const handleChangeFormulario = (e) => {
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

    const handleBuscarJustificaciones = async (e) => {
        e.preventDefault()
        if (!rutBusqueda.trim()) {
            setErrorBusqueda('Por favor, ingrese un RUT para buscar.')
            setJustificacionesEncontradas([])
            setMensajeBusqueda('')
            return
        }
        setLoadingBusqueda(true)
        setErrorBusqueda('')
        setMensajeBusqueda('')
        setJustificacionesEncontradas([])
        try {
            const resultado = await getJustificacionesPorRutEmpleado(rutBusqueda)
            if (resultado && resultado.length > 0) {
                setJustificacionesEncontradas(resultado)
            } else {
                setMensajeBusqueda('No se encontraron justificaciones para el RUT proporcionado.')
            }
        } catch (error) {
            setErrorBusqueda('Error al buscar justificaciones: ' + (error.response?.data?.message || error.message))
            setJustificacionesEncontradas([])
        } finally {
            setLoadingBusqueda(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
            {vistaActual === 'buscador' && (
                <div id="vista-buscador">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Buscar Justificaciones</h2>
                    <form onSubmit={handleBuscarJustificaciones} className="space-y-4 mb-6">
                        <div>
                            <label htmlFor="rutBusqueda" className="block text-gray-700 text-sm font-bold mb-2">
                                RUT de Empleado
                            </label>
                            <input
                                id="rutBusqueda"
                                type="text"
                                name="rutBusqueda"
                                value={rutBusqueda}
                                onChange={(e) => setRutBusqueda(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Ingrese RUT para buscar"
                                disabled={loadingBusqueda}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto disabled:bg-blue-300"
                            disabled={loadingBusqueda}
                        >
                            {loadingBusqueda ? 'Buscando...' : 'Buscar'}
                        </button>
                    </form>

                    {errorBusqueda && (
                        <div className="mt-4 p-4 rounded bg-red-100 text-red-700">
                            {errorBusqueda}
                        </div>
                    )}
                    {mensajeBusqueda && (
                         <div className="mt-4 p-4 rounded bg-blue-100 text-blue-700">
                            {mensajeBusqueda}
                        </div>
                    )}

                    {justificacionesEncontradas.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Resultados de la Búsqueda</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">ID Justificación</th>
                                            <th scope="col" className="px-6 py-3">Tipo Permiso</th>
                                            <th scope="col" className="px-6 py-3">Fecha Inicio</th>
                                            <th scope="col" className="px-6 py-3">Fecha Término</th>
                                            <th scope="col" className="px-6 py-3">Motivo</th>
                                            <th scope="col" className="px-6 py-3">Estado</th>
                                            <th scope="col" className="px-6 py-3">Archivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {justificacionesEncontradas.map((just, index) => (
                                            <tr key={just.idJustificacion || index} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">{just.idJustificacion || 'N/A'}</td>
                                                <td className="px-6 py-4">{just.tipoPermiso ? just.tipoPermiso.descripcion : 'N/A'}</td>
                                                <td className="px-6 py-4">{new Date(just.fechaInicio).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">{new Date(just.fechaTermino).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 truncate max-w-xs">{just.motivo}</td>
                                                <td className="px-6 py-4">{just.estado || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    {just.archivo ? (
                                                        <a 
                                                            href={`${API_URL}/justificaciones/${just.idJustificacion}/archivo`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-blue-600 hover:underline flex items-center"
                                                            title="Descargar archivo adjunto"
                                                        >
                                                            <span role="img" aria-label="Descargar archivo" style={{ fontSize: '1.2em' }}>📥</span>
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => setVistaActual('formularioSolicitud')}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Solicitar Nueva Justificación
                        </button>
                    </div>
                </div>
            )}

            {vistaActual === 'formularioSolicitud' && (
                <div id="vista-formulario">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Solicitar Nueva Justificación</h2>
                        <button 
                            onClick={() => {
                                setVistaActual('buscador')
                                setMensajeFormulario('')
                            }}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            &larr; Volver al Buscador
                        </button>
                    </div>
                    <form onSubmit={handleSubmitNuevaJustificacion} className="space-y-6">
                        <div>
                            <label htmlFor="rutEmpleadoForm" className="block text-gray-700 text-sm font-bold mb-2">
                                RUT de Empleado
                            </label>
                            <input
                                id="rutEmpleadoForm"
                                type="text"
                                name="rutEmpleado"
                                value={formData.rutEmpleado}
                                onChange={handleChangeFormulario}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                                disabled={loadingFormulario}
                                placeholder="Ej: 12345678-9"
                            />
                        </div>

                        <div>
                            <label htmlFor="tipoPermisoForm" className="block text-gray-700 text-sm font-bold mb-2">
                                Tipo de Permiso
                            </label>
                            <select
                                id="tipoPermisoForm"
                                name="tipoPermiso"
                                value={formData.tipoPermiso}
                                onChange={handleChangeFormulario}
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                                disabled={loadingFormulario}
                            >
                                <option value="">Selecciona un tipo</option>
                                <option value="Licencia Medica">Licencia Medica</option>
                                <option value="Feriado Legal">Feriado Legal</option>
                                <option value="Permiso Administrativo">Permiso Administrativo</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="fechaInicioForm" className="block text-gray-700 text-sm font-bold mb-2">
                                    Fecha Inicio
                                </label>
                                <input
                                    id="fechaInicioForm"
                                    type="date"
                                    name="fechaInicio"
                                    value={formData.fechaInicio}
                                    onChange={handleChangeFormulario}
                                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={loadingFormulario}
                                />
                            </div>

                            <div>
                                <label htmlFor="fechaTerminoForm" className="block text-gray-700 text-sm font-bold mb-2">
                                    Fecha Término
                                </label>
                                <input
                                    id="fechaTerminoForm"
                                    type="date"
                                    name="fechaTermino"
                                    value={formData.fechaTermino}
                                    onChange={handleChangeFormulario}
                                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={loadingFormulario}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="motivoForm" className="block text-gray-700 text-sm font-bold mb-2">
                                Motivo
                            </label>
                            <textarea
                                id="motivoForm"
                                name="motivo"
                                value={formData.motivo}
                                onChange={handleChangeFormulario}
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                rows="4"
                                required
                                disabled={loadingFormulario}
                            ></textarea>
                        </div>

                        <div>
                            <label htmlFor="archivo-inputForm" className="block text-gray-700 text-sm font-bold mb-2">
                                Adjuntar Archivo (Opcional)
                            </label>
                            <input
                                id="archivo-inputForm"
                                type="file"
                                name="archivo"
                                onChange={handleChangeFormulario}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                disabled={loadingFormulario}
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-blue-300"
                            disabled={loadingFormulario}
                        >
                            {loadingFormulario ? 'Enviando...' : 'Enviar Justificación'}
                        </button>
                    </form>

                    {mensajeFormulario && (
                        <div className={`mt-4 p-4 rounded ${
                            mensajeFormulario.startsWith('Error') 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                        }`}>
                            {mensajeFormulario}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
} 