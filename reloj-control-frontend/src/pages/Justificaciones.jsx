import { useState, useEffect } from 'react'
import { crearJustificacion, getJustificacionesPorRutEmpleado, API_URL, actualizarEstadoJustificacion } from '../api'

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

    const [showSolicitudModal, setShowSolicitudModal] = useState(false)

    const [rutBusqueda, setRutBusqueda] = useState('')
    const [justificacionesEncontradas, setJustificacionesEncontradas] = useState([])
    const [loadingBusqueda, setLoadingBusqueda] = useState(false)
    const [errorBusqueda, setErrorBusqueda] = useState('')
    const [mensajeBusqueda, setMensajeBusqueda] = useState('')
    const [loadingAccion, setLoadingAccion] = useState(null)
    const [loadingDescarga, setLoadingDescarga] = useState(null);

    // Obtener rol y RUN del usuario para lógica condicional
    const userRole = localStorage.getItem('userRole');
    const loggedInUserRun = localStorage.getItem('run');

    useEffect(() => {
        // Si es ROLE_USER y tenemos su RUN, lo establecemos en el estado 'rutBusqueda' para la búsqueda.
        if (userRole === 'ROLE_USER' && loggedInUserRun) {
            setRutBusqueda(loggedInUserRun);
        }
    }, []); // Solo al montar

    const abrirModalSolicitud = () => {
        setMensajeFormulario('')
        // Si es ROLE_USER, pre-cargar su RUN en el formulario del modal
        if (userRole === 'ROLE_USER' && loggedInUserRun) {
            setFormData(prev => ({
                ...prev,
                rutEmpleado: loggedInUserRun,
                // Resetear otros campos si es necesario al abrir
                tipoPermiso: '',
                fechaInicio: '',
                fechaTermino: '',
                motivo: ''
            }));
        } else {
            // Para otros roles, o si no hay RUN, resetear el campo RUT también
            setFormData({
                rutEmpleado: '',
                tipoPermiso: '',
                fechaInicio: '',
                fechaTermino: '',
                motivo: ''
            });
        }
        setArchivo(null); // Resetear archivo siempre
        if (document.getElementById('archivo-inputForm')) {
            document.getElementById('archivo-inputForm').value = ''
        }
        setShowSolicitudModal(true)
    }

    const cerrarModalSolicitud = () => {
        setShowSolicitudModal(false)
        setMensajeFormulario('')
        // Si había un RUT buscado (o es ROLE_USER con su RUT cargado),
        // refrescar la lista de justificaciones.
        if (rutBusqueda.trim() !== '') {
            handleBuscarJustificaciones();
        }
    }

    const handleSubmitNuevaJustificacion = async (e) => {
        console.log('handleSubmitNuevaJustificacion INICIADO')
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
            
            setMensajeFormulario('Justificación enviada correctamente. El modal se cerrará en unos segundos...')
            setFormData({
                rutEmpleado: '',
                tipoPermiso: '',
                fechaInicio: '',
                fechaTermino: '',
                motivo: ''
            })
            setArchivo(null)
            if (document.getElementById('archivo-inputForm')) {
                document.getElementById('archivo-inputForm').value = ''
            }
            setTimeout(() => {
                cerrarModalSolicitud()
            }, 2500)
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
        if (e) e.preventDefault(); // Prevenir default solo si es llamado por un evento de formulario
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
                setJustificacionesEncontradas([])
                setMensajeBusqueda('No se encontraron justificaciones para el RUT proporcionado.')
            }
        } catch (error) {
            setErrorBusqueda('Error al buscar justificaciones: ' + (error.response?.data?.message || error.message))
            setJustificacionesEncontradas([])
        } finally {
            setLoadingBusqueda(false)
        }
    }

    useEffect(() => {
        // Carga automática de justificaciones para ROLE_USER cuando rutBusqueda (ya seteado con su RUN) está listo.
        if (userRole === 'ROLE_USER' && rutBusqueda === loggedInUserRun && rutBusqueda.trim() !== '') {
            handleBuscarJustificaciones(); // No pasamos 'e' ya que no es un evento de formulario
        }
        // Para otros roles, la búsqueda es manual a través del botón.
    }, [rutBusqueda, userRole, loggedInUserRun]); // Dependencias clave

    const handleActualizarEstado = async (idJustificacion, nuevoEstado) => {
        setLoadingAccion(idJustificacion + '-' + nuevoEstado)
        setErrorBusqueda('')
        setMensajeBusqueda('')

        try {
            await actualizarEstadoJustificacion(idJustificacion, nuevoEstado)
            if (rutBusqueda) {
                const resultado = await getJustificacionesPorRutEmpleado(rutBusqueda)
                if (resultado && resultado.length > 0) {
                    setJustificacionesEncontradas(resultado)
                } else {
                    setJustificacionesEncontradas([])
                    setMensajeBusqueda('No se encontraron justificaciones después de la actualización.')
                }
            }
        } catch (error) {
            console.error("Error al actualizar estado:", error)
            setErrorBusqueda(`Error al actualizar estado: ${error.response?.data?.message || error.message}`)
        } finally {
            setLoadingAccion(null)
        }
    }

    const handleDescargarArchivo = async (idJustificacion, nombreArchivoSugerido = 'archivo_adjunto') => {
        setLoadingDescarga(idJustificacion);
        setErrorBusqueda(''); // Limpiar errores previos
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/justificaciones/${idJustificacion}/archivo`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Error del servidor: ${response.status}`);
            }

            const blob = await response.blob();
            let fileName = nombreArchivoSugerido;
            const disposition = response.headers.get('content-disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    fileName = matches[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al descargar archivo:", error);
            setErrorBusqueda(`Error al descargar archivo: ${error.message}`);
        } finally {
            setLoadingDescarga(null);
        }
    };

    const modalBackdropStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1040,
    }

    const modalDialogStyle = {
        zIndex: 1050,
    }

    return (
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
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
                            onChange={(e) => userRole !== 'ROLE_USER' && setRutBusqueda(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Ingrese RUT para buscar"
                            disabled={loadingBusqueda || userRole === 'ROLE_USER'}
                        />
                    </div>
                    {userRole !== 'ROLE_USER' && (
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto disabled:bg-blue-300"
                            disabled={loadingBusqueda}
                        >
                            {loadingBusqueda ? 'Buscando...' : 'Buscar'}
                        </button>
                    )}
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
                        <div>
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
                                        {userRole !== 'ROLE_USER' && <th scope="col" className="px-6 py-3">Acciones</th>}
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
                                                    <button 
                                                        onClick={() => handleDescargarArchivo(just.idJustificacion, `justificacion_${just.idJustificacion}_${just.rutEmpleado || 'archivo'}`)}
                                                        className="font-medium text-blue-600 hover:underline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Descargar archivo adjunto"
                                                        disabled={loadingDescarga === just.idJustificacion}
                                                    >
                                                        {loadingDescarga === just.idJustificacion ? (
                                                            <div className="spinner-border spinner-border-sm text-blue-600" role="status"><span className="visually-hidden">Descargando...</span></div>
                                                        ) : (
                                                            <span role="img" aria-label="Descargar archivo" style={{ fontSize: '1.2em' }}>📥</span>
                                                        )}
                                                    </button>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            {userRole !== 'ROLE_USER' && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {just.estado === 'Pendiente' ? (
                                                        <div className="flex items-center space-x-2">
                                                            {loadingAccion === (just.idJustificacion + '-APROBADO') ? (
                                                                <div className="spinner-border spinner-border-sm text-success" role="status"><span className="visually-hidden">Cargando...</span></div>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleActualizarEstado(just.idJustificacion, 'APROBADO')}
                                                                    className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                                                    title="Aprobar justificación"
                                                                    disabled={loadingAccion !== null}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {loadingAccion === (just.idJustificacion + '-RECHAZADO') ? (
                                                                <div className="spinner-border spinner-border-sm text-danger" role="status"><span className="visually-hidden">Cargando...</span></div>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleActualizarEstado(just.idJustificacion, 'RECHAZADO')}
                                                                    className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                                                                    title="Rechazar justificación"
                                                                    disabled={loadingAccion !== null}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button 
                        onClick={abrirModalSolicitud}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Solicitar Nueva Justificación
                    </button>
                </div>
            </div>

            {showSolicitudModal && (
                <>
                    <div style={modalBackdropStyle} onClick={cerrarModalSolicitud}></div>
                    <div className="modal fade show" id="solicitudJustificacionModal" tabIndex="-1" aria-labelledby="solicitudJustificacionModalLabel" style={{ display: 'block', ...modalDialogStyle }} aria-modal="true" role="dialog">
                        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title text-2xl font-bold text-gray-900" id="solicitudJustificacionModalLabel">Solicitar Nueva Justificación</h5>
                                    <button type="button" className="btn-close" onClick={cerrarModalSolicitud} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={handleSubmitNuevaJustificacion} id="solicitudForm" className="space-y-6">
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
                                                disabled={loadingFormulario || userRole === 'ROLE_USER'}
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
                                                accept=".pdf,.docx"
                                            />
                                        </div>

                                        {mensajeFormulario && (
                                            <div className={`p-3 rounded text-sm ${
                                                mensajeFormulario.startsWith('Error') 
                                                    ? 'bg-red-100 text-red-700' 
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                {mensajeFormulario}
                                            </div>
                                        )}
                                    </form>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary me-2"
                                        onClick={cerrarModalSolicitud}
                                        disabled={loadingFormulario}
                                    >
                                        Cerrar
                                    </button>
                                    <button 
                                        type="submit" 
                                        form="solicitudForm"
                                        className="btn btn-primary"
                                        disabled={loadingFormulario}
                                    >
                                        {loadingFormulario ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Enviando...
                                            </>
                                        ) : (
                                            'Enviar Justificación'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
} 