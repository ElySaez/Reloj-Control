import { useState, useEffect } from 'react'
import { getResumen, getResumenMensual } from '../api/index'

export default function Resumen() {
    // Inicializar con una fecha predeterminada en formato correcto
    const fechaHoy = new Date().toISOString().split('T')[0];
    const [fechaInicio, setFechaInicio] = useState(fechaHoy)
    const [fechaFin, setFechaFin] = useState('')
    const [rut, setRut] = useState('')
    const [data, setData] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    
    // Nuevos estados para filtro por mes y año
    const mesActual = new Date().getMonth() + 1;
    const añoActual = new Date().getFullYear();
    const [mes, setMes] = useState(mesActual.toString())
    const [año, setAño] = useState(añoActual.toString())
    const [usarFiltroMensual, setUsarFiltroMensual] = useState(false)

    // Función para buscar datos con mejor manejo de errores
    const fetchData = async () => {
        setLoading(true)
        setError('')
        
        try {
            console.log('Estado usarFiltroMensual:', usarFiltroMensual);
            console.log('Parámetros a usar - mes:', mes, 'año:', año, 'rut:', rut);
            
            if (usarFiltroMensual && mes && año) {
                console.log('Consultando con filtro mensual:', {
                    mes: mes,
                    año: año,
                    rut: rut || undefined
                });
                
                try {
                    // Usar el nuevo endpoint específico para filtro mensual
                    const response = await getResumenMensual(
                        mes,
                        año,
                        rut || undefined
                    );
                    
                    console.log('Respuesta (filtro mensual):', response);
                    setData(response || []);
                } catch (mensualError) {
                    console.error('Error en filtro mensual:', mensualError);
                    setError(`Error al consultar por mes y año: ${mensualError.message}`);
                    setData([]);
                }
            } else if (fechaInicio) {
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
                    const response = await getResumen(
                        inicioParam,
                        finParam,
                        rut || undefined
                    );

                    console.log('Respuesta (rango fechas):', response);
                    setData(response || []);
                } catch (rangoError) {
                    console.error('Error en rango de fechas:', rangoError);
                    setError(`Error al consultar por rango de fechas: ${rangoError.message}`);
                    setData([]);
                }
            } else {
                setError('Debe proporcionar una fecha de inicio o seleccionar mes y año');
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
        fetchData();
    }, []);

    // Solo ejecutar búsqueda cuando el usuario haga clic en buscar, no en cada cambio
    const handleBuscar = (e) => {
        e.preventDefault();
        console.log('Botón buscar presionado, usarFiltroMensual:', usarFiltroMensual);
        console.log('Valores del formulario - mes:', mes, 'año:', año, 'rut:', rut);
        fetchData();
    };
    
    // Alternador para cambiar entre filtro mensual y rango de fechas
    const toggleFiltroMensual = () => {
        setUsarFiltroMensual(!usarFiltroMensual);
    };

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

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-11">
                    <div className="card bg-white shadow-sm">
                        <div className="card-body p-4">
                            <h1 className="h4 mb-4 text-primary">Resumen de Asistencia</h1>

                            {/* Selector de tipo de filtro */}
                            <div className="d-flex justify-content-start mb-3">
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
                            </div>

                            {/* Filtros */}
                            <form onSubmit={handleBuscar}>
                                <div className="row mb-4 g-3">
                                    {!usarFiltroMensual ? (
                                        <>
                                            <div className="col-md-3">
                                                <div className="form-floating">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        id="fechaInicio"
                                                        value={fechaInicio}
                                                        onChange={e => setFechaInicio(e.target.value)}
                                                        required={!usarFiltroMensual}
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
                                        </>
                                    ) : (
                                        <>
                                            <div className="col-md-3">
                                                <div className="form-floating">
                                                    <select
                                                        className="form-select"
                                                        id="mes"
                                                        value={mes}
                                                        onChange={e => setMes(e.target.value)}
                                                        required={usarFiltroMensual}
                                                    >
                                                        <option value="1">Enero</option>
                                                        <option value="2">Febrero</option>
                                                        <option value="3">Marzo</option>
                                                        <option value="4">Abril</option>
                                                        <option value="5">Mayo</option>
                                                        <option value="6">Junio</option>
                                                        <option value="7">Julio</option>
                                                        <option value="8">Agosto</option>
                                                        <option value="9">Septiembre</option>
                                                        <option value="10">Octubre</option>
                                                        <option value="11">Noviembre</option>
                                                        <option value="12">Diciembre</option>
                                                    </select>
                                                    <label htmlFor="mes">Mes</label>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-floating">
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id="año"
                                                        value={año}
                                                        onChange={e => setAño(e.target.value)}
                                                        min="2000"
                                                        max="2050"
                                                        required={usarFiltroMensual}
                                                    />
                                                    <label htmlFor="año">Año</label>
                                                </div>
                                            </div>
                                        </>
                                    )}
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
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Nombre</th>
                                                <th>RUT</th>
                                                <th>Entrada</th>
                                                <th>Salida real</th>
                                                <th>Salida esperada</th>
                                                <th className="text-end">Horas Extras</th>
                                                <th className="text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data && data.length > 0 ? (
                                                data.map((registro, index) => (
                                                    <tr key={index}>
                                                        <td>{registro.nombre}</td>
                                                        <td>{registro.rut}</td>
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
                                                            {registro.horasExtras || '00:00'}
                                                        </td>
                                                        <td className="text-center">
                                                            <span className={`badge ${
                                                                registro.estado === 'AUTORIZADO' 
                                                                    ? 'bg-success' 
                                                                    : registro.estado === 'RECHAZADO' 
                                                                        ? 'bg-danger' 
                                                                        : 'bg-warning'
                                                            }`}>
                                                                {registro.estado || 'PENDIENTE'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center text-muted py-4">
                                                        No hay registros para mostrar
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
