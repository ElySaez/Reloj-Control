import { useState, useEffect } from 'react'
import { getResumen, getResumenMensual, actualizarEstadoAsistencia, getMarcasPorEmpleadoYFechas, marcarAsistencia } from '../api/index'

export default function Resumen() {
    // Inicializar con una fecha predeterminada en formato correcto
    const fechaHoy = new Date().toISOString().split('T')[0];
    const [fechaInicio, setFechaInicio] = useState(fechaHoy)
    const [fechaFin, setFechaFin] = useState('')
    const [rut, setRut] = useState('')
    const [data, setData] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [savingState, setSavingState] = useState(false) // Para indicar cambios de estado en proceso
    const [savingStateId, setSavingStateId] = useState(null)
    
    // Estados para modal de edición
    const [showModal, setShowModal] = useState(false)
    const [registroSeleccionado, setRegistroSeleccionado] = useState(null)
    const [marcasDia, setMarcasDia] = useState([])
    const [marcasAnterior, setMarcasAnterior] = useState([])
    const [marcasSiguiente, setMarcasSiguiente] = useState([])
    const [tabActivo, setTabActivo] = useState('marcasDisponibles')
    const [marcaEntradaSeleccionada, setMarcaEntradaSeleccionada] = useState(null)
    const [marcaSalidaSeleccionada, setMarcaSalidaSeleccionada] = useState(null)
    const [entradaManual, setEntradaManual] = useState('08:00')
    const [salidaManual, setSalidaManual] = useState('17:00')
    const [guardandoMarcas, setGuardandoMarcas] = useState(false)
    
    // Eliminar estados para filtro por mes y año
    // const mesActual = new Date().getMonth() + 1;
    // const añoActual = new Date().getFullYear();
    // const [mes, setMes] = useState(mesActual.toString())
    // const [año, setAño] = useState(añoActual.toString())
    // const [usarFiltroMensual, setUsarFiltroMensual] = useState(false)

    // Función para buscar datos con mejor manejo de errores y más opciones de filtrado
    const fetchData = async () => {
        setLoading(true)
        setError('')
        setData([]) // Limpiar datos anteriores
        
        try {
            // Verificar que el RUT tenga al menos 4 caracteres si no está vacío
            if (rut && !validarRutMinimo(rut)) {
                setError('El RUT debe tener al menos 4 dígitos para realizar la búsqueda');
                setLoading(false);
                return;
            }
            
            // Usar filtro por rango de fechas
            const inicioParam = fechaInicio;
            const finParam = fechaFin || undefined;
            
            console.log('Consultando con rango de fechas:', {
                inicio: inicioParam,
                fin: finParam,
                rut: rut || undefined
            });
            
            try {
                // Usar el método normal con fechas
                const respuesta = await getResumen(
                    inicioParam,
                    finParam,
                    rut || undefined
                );
                
                console.log('Respuesta recibida:', respuesta);
                
                // Verificar si la respuesta es un objeto con mensaje (sin resultados)
                if (respuesta && !Array.isArray(respuesta) && respuesta.mensaje) {
                    setError(respuesta.mensaje);
                    setData([]);
                    setLoading(false);
                    return;
                }
                
                // Asegurarse de que respuesta sea un array
                const datosArray = Array.isArray(respuesta) ? respuesta : (respuesta && respuesta.data ? respuesta.data : []);
                
                // Procesar y ordenar los resultados
                if (datosArray.length > 0) {
                    // Establecer estado AUTORIZADO por defecto si no está definido
                    const datosConEstadoDefecto = datosArray.map(item => ({
                        ...item,
                        estado: item.estado || 'AUTORIZADO'
                    }));
                    
                    // Ordenar por fecha y nombre
                    datosConEstadoDefecto.sort((a, b) => {
                        if (!a.fecha || !b.fecha) return 0;
                        const fechaComp = a.fecha.localeCompare(b.fecha);
                        if (fechaComp === 0) {
                            return a.nombre.localeCompare(b.nombre);
                        }
                        return fechaComp;
                    });
                    
                    setData(datosConEstadoDefecto);
                } else {
                    setData([]);
                    setError('No se encontraron resultados para los filtros seleccionados');
                }
            } catch (rangoError) {
                console.error('Error en rango de fechas:', rangoError);
                setError(`Error al consultar por rango de fechas: ${rangoError.message}`);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error('Error general:', err);
            setError(err.message || 'Error al cargar los datos');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar datos cuando se monta el componente
    useEffect(() => {
        // No cargamos datos automáticamente al montar el componente
        // Dejamos que el usuario inicie la búsqueda
    }, []);

    // Solo ejecutar búsqueda cuando el usuario haga clic en buscar, no en cada cambio
    const handleBuscar = (e) => {
        e.preventDefault();
        
        // Verificar que el RUT tenga al menos 4 caracteres si no está vacío
        if (rut && !validarRutMinimo(rut)) {
            setError('El RUT debe tener al menos 4 dígitos para realizar la búsqueda');
            return;
        }
        
        console.log('Botón buscar presionado');
        console.log('Valores del formulario - inicio:', fechaInicio, 'fin:', fechaFin, 'rut:', rut);
        fetchData();
    };
    
    // Eliminar función para alternar entre tipos de filtro
    // const toggleFiltroMensual = () => {
    //     setUsarFiltroMensual(!usarFiltroMensual);
    // };

    // Formatear RUT mientras se escribe - permitir búsqueda por números parciales
    const formatearRut = (value) => {
        // Si es solo números, permitir la búsqueda parcial
        if (/^\d+$/.test(value)) {
            return value; // Devolver tal cual sin formatear
        }
        
        // Si tiene formato de RUT chileno, formatearlo normalmente
        let rutLimpio = value.replace(/[^0-9kK]/g, '')
        if (rutLimpio.length === 0) return ''
        
        if (rutLimpio.length > 1) {
            const dv = rutLimpio.slice(-1)
            const numeros = rutLimpio.slice(0, -1)
            rutLimpio = numeros.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv
        }
        
        return rutLimpio
    }

    // Validar que el RUT tenga al menos 4 caracteres para buscar
    const validarRutMinimo = (rutValue) => {
        if (!rutValue) return true; // Si está vacío, es válido (no se filtra por RUT)
        
        // Quitar puntos y guiones para contar solo dígitos
        const rutLimpio = rutValue.replace(/[^0-9kK]/g, '');
        return rutLimpio.length >= 4;
    }

    const formatearHorasExtras = (minutos25 = 0, minutos50 = 0) => {
        const totalMinutos = minutos25 + minutos50
        if (totalMinutos === 0) return '00:00'
        
        const horas = Math.floor(totalMinutos / 60)
        const minutos = totalMinutos % 60
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    }

    const calcularResumenTotal = () => {
        const resumen = {
            autorizadas: 0,
            rechazadas: 0,
            pendientes: 0
        }

        data.forEach(registro => {
            const totalMinutos = registro.minutosExtra25 + registro.minutosExtra50
            switch (registro.estado) {
                case 'AUTORIZADO':
                    resumen.autorizadas += totalMinutos
                    break
                case 'RECHAZADO':
                    resumen.rechazadas += totalMinutos
                    break
                case 'PENDIENTE':
                    resumen.pendientes += totalMinutos
                    break
            }
        })

        return resumen
    }

    const getEstadoClass = (estado) => {
        switch (estado) {
            case 'AUTORIZADO':
                return 'bg-success'
            case 'RECHAZADO':
                return 'bg-danger'
            case 'PENDIENTE':
                return 'bg-warning'
            default:
                return 'bg-secondary'
        }
    }

    // Función para manejar el cambio de estado
    const handleEstadoChange = async (id, nuevoEstado) => {
        try {
            setSavingState(true)
            setSavingStateId(id)
            await actualizarEstadoAsistencia(id, nuevoEstado)
            
            // Actualizar el estado en los datos locales
            const newData = data.map(item => {
                if (item.idAsistencia === id) {
                    return { ...item, estado: nuevoEstado }
                }
                return item
            })
            setData(newData)
            
            // Mostrar mensaje de éxito
            setError('')
        } catch (err) {
            console.error('Error al cambiar el estado:', err)
            setError(`Error al actualizar el estado: ${err.message}`)
        } finally {
            setSavingState(false)
            setSavingStateId(null)
        }
    }

    // Función para abrir el modal y cargar las marcas del día
    const handleOpenModal = async (registro) => {
        try {
            // Guardar el registro seleccionado
            setRegistroSeleccionado(registro);
            
            // Obtener fecha en formato YYYY-MM-DD
            const partesFecha = registro.fecha.split('/');
            const fechaFormateada = `${partesFecha[2]}-${partesFecha[1].padStart(2, '0')}-${partesFecha[0].padStart(2, '0')}`;
            
            // Inicializar valores por defecto para datetime-local
            // Formato necesario: YYYY-MM-DDThh:mm
            const fechaHoraEntrada = `${fechaFormateada}T${registro.entrada || '08:00'}`;
            const fechaHoraSalida = `${fechaFormateada}T${registro.salida || '17:00'}`;
            
            setEntradaManual(fechaHoraEntrada);
            setSalidaManual(fechaHoraSalida);
            setMarcaEntradaSeleccionada(null);
            setMarcaSalidaSeleccionada(null);
            
            // Mostrar modal mientras cargamos los datos
            setShowModal(true);
            
            // Intentar obtener las marcas del empleado para un rango de 3 días
            try {
                // Usamos el nuevo endpoint que filtra por RUT y fecha
                const marcasData = await getMarcasPorEmpleadoYFechas(
                    registro.rut,
                    fechaFormateada,
                    // No pasamos fecha fin, el backend calculará automáticamente 2 días después
                );
                
                console.log('Marcas recibidas:', marcasData);
                
                // Agrupar marcas por día y tipo
                const marcasPorDia = marcasData.marcasPorDia || {};
                
                // Obtener marcas del día seleccionado
                const marcasDelDia = marcasPorDia[fechaFormateada] || [];
                const entradasDia = marcasDelDia.filter(m => m.tipo === 'ENTRADA');
                const salidasDia = marcasDelDia.filter(m => m.tipo === 'SALIDA');
                
                // Obtener las fechas de los días anterior y siguiente
                const fechaAnterior = new Date(fechaFormateada);
                fechaAnterior.setDate(fechaAnterior.getDate() - 1);
                const fechaAnteriorStr = fechaAnterior.toISOString().split('T')[0];
                
                const fechaSiguiente = new Date(fechaFormateada);
                fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
                const fechaSiguienteStr = fechaSiguiente.toISOString().split('T')[0];
                
                // Obtener marcas de los días anterior y siguiente
                const marcasDiaAnterior = marcasPorDia[fechaAnteriorStr] || [];
                const marcasDiaSiguiente = marcasPorDia[fechaSiguienteStr] || [];
                
                const entradasAnterior = marcasDiaAnterior.filter(m => m.tipo === 'ENTRADA');
                const salidasAnterior = marcasDiaAnterior.filter(m => m.tipo === 'SALIDA');
                const entradasSiguiente = marcasDiaSiguiente.filter(m => m.tipo === 'ENTRADA');
                const salidasSiguiente = marcasDiaSiguiente.filter(m => m.tipo === 'SALIDA');
                
                // Guardar marcas clasificadas
                setMarcasDia({
                    entradas: entradasDia,
                    salidas: salidasDia
                });
                
                setMarcasAnterior({
                    entradas: entradasAnterior,
                    salidas: salidasAnterior
                });
                
                setMarcasSiguiente({
                    entradas: entradasSiguiente,
                    salidas: salidasSiguiente
                });
                
            } catch (error) {
                console.error('Error al cargar marcas:', error);
                setError('No se pudieron cargar las marcas. ' + error.message);
            }
            
        } catch (error) {
            console.error('Error al abrir modal:', error);
            setError('Error al abrir el editor de marcas: ' + error.message);
        }
    };
    
    // Función para formatear fecha para backend (YYYY-MM-DDThh:mm:ss.SSS)
    const formatearFechaCompleta = (fechaStr) => {
        // Si ya tiene segundos y milisegundos, retornarla tal cual
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(fechaStr)) {
            return fechaStr;
        }
        
        // Si es formato datetime-local (YYYY-MM-DDThh:mm), añadir segundos y milisegundos
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fechaStr)) {
            return `${fechaStr}:00.000`;
        }
        
        // Cualquier otro caso, usar el objeto Date
        try {
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) {
                throw new Error(`Fecha inválida: ${fechaStr}`);
            }
            
            const anio = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            const hora = String(fecha.getHours()).padStart(2, '0');
            const minutos = String(fecha.getMinutes()).padStart(2, '0');
            const segundos = String(fecha.getSeconds()).padStart(2, '0');
            const milisegundos = String(fecha.getMilliseconds()).padStart(3, '0');
            
            return `${anio}-${mes}-${dia}T${hora}:${minutos}:${segundos}.${milisegundos}`;
        } catch (e) {
            console.error('Error al formatear fecha:', e);
            throw e;
        }
    };

    // Función para guardar los cambios de marcas
    const handleGuardarMarcas = async () => {
        try {
            setGuardandoMarcas(true);
            
            // Verificar si tenemos el empleado ID
            if (!registroSeleccionado || !registroSeleccionado.rut) {
                throw new Error('No se pudo identificar al empleado');
            }
            
            // Obtener fecha en formato YYYY-MM-DD
            const partesFecha = registroSeleccionado.fecha.split('/');
            const fechaFormateada = `${partesFecha[2]}-${partesFecha[1].padStart(2, '0')}-${partesFecha[0].padStart(2, '0')}`;
            
            // Registrar marca de entrada si se seleccionó manual
            if (tabActivo === 'edicionManual') {
                // Obtener el ID del empleado
                const empleadoId = registroSeleccionado.empleadoId || 1; // ID por defecto si no existe
                
                // Crear una marca de entrada con la fecha y hora específicas
                if (entradaManual) {
                    // Formatear la fecha según requerido por el backend
                    const fechaHoraEntrada = formatearFechaCompleta(entradaManual);
                    console.log(`Registrando entrada manual: ${fechaHoraEntrada}`);
                    await marcarAsistencia(empleadoId, 'ENTRADA', fechaHoraEntrada);
                }
                
                // También registrar la salida si está disponible
                if (salidaManual) {
                    // Formatear la fecha según requerido por el backend
                    const fechaHoraSalida = formatearFechaCompleta(salidaManual);
                    console.log(`Registrando salida manual: ${fechaHoraSalida}`);
                    await marcarAsistencia(empleadoId, 'SALIDA', fechaHoraSalida);
                }
            } else {
                // Usar las marcas existentes seleccionadas
                if (marcaEntradaSeleccionada) {
                    // Actualizar estado a AUTORIZADO de la marca seleccionada
                    if (marcaEntradaSeleccionada.id) {
                        console.log(`Autorizando marca de entrada: ${marcaEntradaSeleccionada.id}`);
                        await actualizarEstadoAsistencia(marcaEntradaSeleccionada.id, 'AUTORIZADO');
                    }
                }
                
                if (marcaSalidaSeleccionada) {
                    // Actualizar estado a AUTORIZADO de la marca seleccionada
                    if (marcaSalidaSeleccionada.id) {
                        console.log(`Autorizando marca de salida: ${marcaSalidaSeleccionada.id}`);
                        await actualizarEstadoAsistencia(marcaSalidaSeleccionada.id, 'AUTORIZADO');
                    }
                }
            }
            
            // Cerrar modal y refrescar datos
            setShowModal(false);
            await fetchData();
            
        } catch (error) {
            console.error('Error al guardar marcas:', error);
            setError('Error al guardar las marcas: ' + error.message);
        } finally {
            setGuardandoMarcas(false);
        }
    };
    
    // Función para cerrar el modal
    const handleCloseModal = () => {
        setShowModal(false);
        setRegistroSeleccionado(null);
        setMarcasDia([]);
        setMarcasAnterior([]);
        setMarcasSiguiente([]);
    };
    
    // Función para cambiar el tab activo
    const handleChangeTab = (tab) => {
        setTabActivo(tab);
    };
    
    // Función para seleccionar una marca de entrada
    const handleSelectEntrada = (marca) => {
        setMarcaEntradaSeleccionada(marca);
    };
    
    // Función para seleccionar una marca de salida
    const handleSelectSalida = (marca) => {
        setMarcaSalidaSeleccionada(marca);
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-11">
                    <div className="card bg-white shadow-sm">
                        <div className="card-body p-4">
                            <h1 className="h4 mb-4 text-primary">Resumen de Asistencia</h1>

                            {/* Eliminar selector de tipo de filtro */}
                            {/* <div className="d-flex justify-content-start mb-3">
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="tipoFiltro"
                                        id="filtroFechas"
                                        checked={!usarFiltroMensual}
                                        onChange={toggleFiltroMensual}
                                    />
                                    <label className="form-check-label" htmlFor="filtroFechas">
                                        Filtro por rango de fechas
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="tipoFiltro"
                                        id="filtroMensual"
                                        checked={usarFiltroMensual}
                                        onChange={toggleFiltroMensual}
                                    />
                                    <label className="form-check-label" htmlFor="filtroMensual">
                                        Filtro por mes y año
                                    </label>
                                </div>
                            </div> */}

                            {/* Filtros */}
                            <form onSubmit={handleBuscar}>
                                <div className="row mb-4 g-3">
                                    <div className="col-md-3">
                                        <div className="form-floating">
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="fechaInicio"
                                                value={fechaInicio}
                                                onChange={e => setFechaInicio(e.target.value)}
                                                required
                                            />
                                            <label htmlFor="fechaInicio">Fecha inicio *</label>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-floating">
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="fechaFin"
                                                value={fechaFin}
                                                onChange={e => setFechaFin(e.target.value)}
                                            />
                                            <label htmlFor="fechaFin">Fecha fin</label>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="rut"
                                                value={rut}
                                                onChange={e => setRut(formatearRut(e.target.value))}
                                                placeholder="RUT empleado"
                                                maxLength="12"
                                            />
                                            <label htmlFor="rut">RUT empleado</label>
                                        </div>
                                    </div>
                                    <div className="col-md-3 d-flex align-items-center">
                                        <button type="submit" className="btn btn-primary w-100">
                                            Buscar
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Mensaje de error */}
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            {/* Estado de carga */}
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                </div>
                            ) : data && data.length > 0 ? (
                                <div>
                                    {/* Información del empleado */}
                                    <div className="card mb-4 bg-light">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <h5 className="card-title">Empleado</h5>
                                                    <p className="card-text"><strong>Nombre:</strong> {data[0].nombre}</p>
                                                    <p className="card-text"><strong>RUT:</strong> {data[0].rut}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Tabla de asistencias */}
                                    <div className="table-responsive mb-4">
                                        <table className="table table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Entrada</th>
                                                    <th>Salida real</th>
                                                    <th>Salida esperada</th>
                                                    <th className="text-end">H.E. 25%</th>
                                                    <th className="text-end">H.E. 50%</th>
                                                    <th className="text-center">Estado</th>
                                                    <th>Observaciones</th>
                                                    <th className="text-center">Editar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((registro, index) => {
                                                    // Asegurar que el estado sea AUTORIZADO por defecto
                                                    registro.estado = registro.estado || 'AUTORIZADO';
                                                    
                                                    // Convertir minutos a formato horas:minutos
                                                    const horasExtra25 = registro.minutosExtra25 > 0 
                                                        ? `${String(Math.floor(registro.minutosExtra25 / 60)).padStart(2, '0')}:${String(registro.minutosExtra25 % 60).padStart(2, '0')}`
                                                        : '00:00';
                                                    
                                                    const horasExtra50 = registro.minutosExtra50 > 0 
                                                        ? `${String(Math.floor(registro.minutosExtra50 / 60)).padStart(2, '0')}:${String(registro.minutosExtra50 % 60).padStart(2, '0')}`
                                                        : '00:00';
                                                    
                                                    return (
                                                        <tr key={index}>
                                                            <td>
                                                                <span className="badge bg-light text-dark">
                                                                    {registro.fecha}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-success bg-opacity-10 text-success">
                                                                    {registro.entrada}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {registro.salida ? (
                                                                    <span className="badge bg-primary bg-opacity-10 text-primary">
                                                                        {registro.salida}
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                                        Pendiente
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-info bg-opacity-10 text-info">
                                                                    {registro.salidaEsperada}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                {horasExtra25}
                                                            </td>
                                                            <td className="text-end">
                                                                {horasExtra50}
                                                            </td>
                                                            <td className="text-center">
                                                                {savingState && registro.idAsistencia === savingStateId ? (
                                                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                                        <span className="visually-hidden">Guardando...</span>
                                                                    </div>
                                                                ) : (
                                                                    <select 
                                                                        className={`form-select form-select-sm w-auto mx-auto ${
                                                                            registro.estado === 'AUTORIZADO' 
                                                                                ? 'text-success border-success' 
                                                                                : registro.estado === 'RECHAZADO' 
                                                                                    ? 'text-danger border-danger' 
                                                                                    : 'text-warning border-warning'
                                                                        }`}
                                                                        value={registro.estado || 'AUTORIZADO'}
                                                                        onChange={(e) => handleEstadoChange(registro.idAsistencia, e.target.value)}
                                                                    >
                                                                        <option value="AUTORIZADO">AUTORIZADO</option>
                                                                        <option value="RECHAZADO">RECHAZADO</option>
                                                                        <option value="PENDIENTE">PENDIENTE</option>
                                                                    </select>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <small className="text-muted">
                                                                    {registro.observaciones || ''}
                                                                </small>
                                                            </td>
                                                            <td className="text-center">
                                                                <button 
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => handleOpenModal(registro)}
                                                                >
                                                                    <i className="bi bi-pencil-square"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Resumen de horas extras */}
                                    <div className="card mb-4">
                                        <div className="card-header bg-primary text-white">
                                            Resumen de Horas Extras
                                        </div>
                                        <div className="table-responsive">
                                            <table className="table mb-0">
                                                <thead>
                                                    <tr className="table-light">
                                                        <th>Estado</th>
                                                        <th className="text-center">H.E. 25%</th>
                                                        <th className="text-center">H.E. 50%</th>
                                                        <th className="text-center">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Calcular resumen por estado */}
                                                    {(() => {
                                                        // Agrupar por estado y calcular totales
                                                        const resumen = {
                                                            AUTORIZADO: { minutos25: 0, minutos50: 0 },
                                                            RECHAZADO: { minutos25: 0, minutos50: 0 },
                                                            PENDIENTE: { minutos25: 0, minutos50: 0 }
                                                        };
                                                        
                                                        // Total general de todas las horas extras
                                                        let totalGeneral25 = 0;
                                                        let totalGeneral50 = 0;
                                                        
                                                        data.forEach(registro => {
                                                            // Asegurar que siempre haya un estado válido
                                                            const estado = registro.estado || 'AUTORIZADO';
                                                            
                                                            // Asegurar que los valores de minutos sean números
                                                            const minutos25 = parseInt(registro.minutosExtra25 || 0);
                                                            const minutos50 = parseInt(registro.minutosExtra50 || 0);
                                                            
                                                            if (resumen[estado]) {
                                                                resumen[estado].minutos25 += minutos25;
                                                                resumen[estado].minutos50 += minutos50;
                                                            }
                                                            
                                                            // Sumar al total general
                                                            totalGeneral25 += minutos25;
                                                            totalGeneral50 += minutos50;
                                                        });
                                                        
                                                        // Convertir minutos a formato horas:minutos:segundos
                                                        const formatearTiempo = (minutos) => {
                                                            if (minutos === 0) return '00:00:00';
                                                            const horas = Math.floor(Math.abs(minutos) / 60);
                                                            const mins = Math.abs(minutos) % 60;
                                                            return `${minutos < 0 ? '-' : ''}${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
                                                        };
                                                        
                                                        return (
                                                            <>
                                                                <tr>
                                                                    <td>Aprobadas</td>
                                                                    <td className="text-center">{formatearTiempo(resumen.AUTORIZADO.minutos25)}</td>
                                                                    <td className="text-center">{formatearTiempo(resumen.AUTORIZADO.minutos50)}</td>
                                                                    <td className="text-center fw-bold">{formatearTiempo(resumen.AUTORIZADO.minutos25 + resumen.AUTORIZADO.minutos50)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>Rechazadas</td>
                                                                    <td className="text-center">{formatearTiempo(resumen.RECHAZADO.minutos25)}</td>
                                                                    <td className="text-center">{formatearTiempo(resumen.RECHAZADO.minutos50)}</td>
                                                                    <td className="text-center fw-bold">{formatearTiempo(resumen.RECHAZADO.minutos25 + resumen.RECHAZADO.minutos50)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>Pendientes</td>
                                                                    <td className="text-center">{formatearTiempo(resumen.PENDIENTE.minutos25)}</td>
                                                                    <td className="text-center">{formatearTiempo(resumen.PENDIENTE.minutos50)}</td>
                                                                    <td className="text-center fw-bold">{formatearTiempo(resumen.PENDIENTE.minutos25 + resumen.PENDIENTE.minutos50)}</td>
                                                                </tr>
                                                                <tr className="table-primary">
                                                                    <td className="fw-bold">Total General</td>
                                                                    <td className="text-center fw-bold">{formatearTiempo(totalGeneral25)}</td>
                                                                    <td className="text-center fw-bold">{formatearTiempo(totalGeneral50)}</td>
                                                                    <td className="text-center fw-bold">{formatearTiempo(totalGeneral25 + totalGeneral50)}</td>
                                                                </tr>
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    {/* Botones de exportación */}
                                    <div className="row mb-2">
                                        <div className="col">
                                            <button className="btn btn-success w-100">
                                                <i className="bi bi-file-pdf me-2"></i> DESCARGAR PDF
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col">
                                            <button className="btn btn-success w-100">
                                                <i className="bi bi-file-excel me-2"></i> DESCARGAR EXCEL
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-info text-center py-4">
                                    <i className="bi bi-info-circle me-2"></i>
                                    No hay registros para mostrar para los filtros seleccionados
                                    {fechaInicio && (
                                        <div className="mt-2 small text-muted">
                                            <strong>Filtros aplicados:</strong> {fechaInicio && `Desde: ${fechaInicio}`} {fechaFin && ` | Hasta: ${fechaFin}`} {rut && ` | RUT: ${rut}`}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para editar marcas */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Editar Marcas - {registroSeleccionado?.fecha}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={handleCloseModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Sección de marca de entrada */}
                                <div className="mb-4">
                                    <h6>Marca de Entrada</h6>
                                    <ul className="nav nav-tabs">
                                        <li className="nav-item">
                                            <button 
                                                className={`nav-link ${tabActivo === 'marcasDisponibles' ? 'active' : ''}`}
                                                onClick={() => handleChangeTab('marcasDisponibles')}
                                            >
                                                Marcas Disponibles
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button 
                                                className={`nav-link ${tabActivo === 'edicionManual' ? 'active' : ''}`}
                                                onClick={() => handleChangeTab('edicionManual')}
                                            >
                                                Edición Manual
                                            </button>
                                        </li>
                                    </ul>
                                    <div className="tab-content border border-top-0 p-3">
                                        {tabActivo === 'marcasDisponibles' ? (
                                            <div className="list-group">
                                                {marcasDia?.entradas?.map((marca, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${marcaEntradaSeleccionada?.id === marca.id ? 'active' : ''}`}
                                                        onClick={() => handleSelectEntrada(marca)}
                                                    >
                                                        <span>{new Date(marca.fechaHora).toLocaleDateString()}</span>
                                                        <span className="badge bg-primary rounded-pill">
                                                            {new Date(marca.fechaHora).toLocaleTimeString()}
                                                        </span>
                                                    </button>
                                                ))}
                                                {(!marcasDia?.entradas || marcasDia.entradas.length === 0) && (
                                                    <div className="text-center p-3">
                                                        No hay marcas de entrada disponibles
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="form-group">
                                                <label htmlFor="entradaManual">Fecha y hora de entrada:</label>
                                                <input
                                                    type="datetime-local"
                                                    id="entradaManual"
                                                    className="form-control"
                                                    value={entradaManual}
                                                    onChange={(e) => setEntradaManual(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Sección de marca de salida */}
                                <div className="mb-4">
                                    <h6>Marca de Salida</h6>
                                    <ul className="nav nav-tabs">
                                        <li className="nav-item">
                                            <button 
                                                className={`nav-link ${tabActivo === 'marcasDisponibles' ? 'active' : ''}`}
                                                onClick={() => handleChangeTab('marcasDisponibles')}
                                            >
                                                Marcas Disponibles
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button 
                                                className={`nav-link ${tabActivo === 'edicionManual' ? 'active' : ''}`}
                                                onClick={() => handleChangeTab('edicionManual')}
                                            >
                                                Edición Manual
                                            </button>
                                        </li>
                                    </ul>
                                    <div className="tab-content border border-top-0 p-3">
                                        {tabActivo === 'marcasDisponibles' ? (
                                            <div className="list-group">
                                                {marcasDia?.salidas?.map((marca, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${marcaSalidaSeleccionada?.id === marca.id ? 'active' : ''}`}
                                                        onClick={() => handleSelectSalida(marca)}
                                                    >
                                                        <span>{new Date(marca.fechaHora).toLocaleDateString()}</span>
                                                        <span className="badge bg-primary rounded-pill">
                                                            {new Date(marca.fechaHora).toLocaleTimeString()}
                                                        </span>
                                                    </button>
                                                ))}
                                                {(!marcasDia?.salidas || marcasDia.salidas.length === 0) && (
                                                    <div className="text-center p-3">
                                                        No hay marcas de salida disponibles
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="form-group">
                                                <label htmlFor="salidaManual">Fecha y hora de salida:</label>
                                                <input
                                                    type="datetime-local"
                                                    id="salidaManual"
                                                    className="form-control"
                                                    value={salidaManual}
                                                    onChange={(e) => setSalidaManual(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={handleGuardarMarcas}
                                    disabled={guardandoMarcas}
                                >
                                    {guardandoMarcas ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Guardando...
                                        </>
                                    ) : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
