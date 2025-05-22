import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAtrasos } from '../api';

export default function Home() {
    const [rotation, setRotation] = useState(0)
    const [fechaInicio, setFechaInicio] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [horaLimite, setHoraLimite] = useState('09:00');
    const [atrasos, setAtrasos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Obtener el rol del usuario
    const userRole = localStorage.getItem('userRole');
    console.log("Rol en Home:", userRole);

    useEffect(() => {
        const interval = setInterval(() => {
            const date = new Date()
            const minutes = date.getMinutes()
            const degrees = ((minutes / 60) * 360) + 180
            setRotation(degrees)
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const fetchAtrasos = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAtrasos(fechaInicio, fechaFin, horaLimite);
            setAtrasos(data);
        } catch (e) {
            setError(e.message);
            setAtrasos([]); // Limpiar atrasos en caso de error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAtrasos();
    }, [fechaInicio, fechaFin, horaLimite]); // Vuelve a cargar los datos si las fechas o la hora cambian

    return (
        <div className="container-fluid bg-light text-dark py-4">
            <div className="row justify-content-center align-items-center mt-3">
                <div className="col-md-10 col-lg-8">
                    <div className="text-center mb-5">
                        <h1 className="h2 mb-2">Control de Asistencia Inteligente</h1>
                        <p className="text-muted">Soluciones empresariales para la gestión de personal</p>
                    </div>

                    <div className="row justify-content-center g-4">
                        {userRole !== 'ROLE_USER' && (
                            <div className="col-md-4">
                                <Link to="/importar" className="text-decoration-none">
                                    <div className="card text-dark border-primary h-100 shadow-sm bg-primary-subtle">
                                        <div className="card-body text-center p-4">
                                            <div className="text-primary mb-3">
                                                <svg className="w-6 h-6" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                                </svg>
                                            </div>
                                            <h3 className="h5 mb-1 card-title">Importar Marcas</h3>
                                            <p className="small text-muted mb-0">Importa registros .dat</p>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}

                        <div className="col-md-4">
                            <Link to="/resumen" className="text-decoration-none">
                                <div className="card text-dark border-success h-100 shadow-sm bg-success-subtle">
                                    <div className="card-body text-center p-4">
                                        <div className="text-success mb-3">
                                            <svg className="w-6 h-6" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                        </div>
                                        <h3 className="h5 mb-1 card-title">Resumen</h3>
                                        <p className="small text-muted mb-0">Visualiza registros</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="col-md-4">
                            <Link to="/justificaciones" className="text-decoration-none">
                                <div className="card text-dark border-info h-100 shadow-sm bg-info-subtle">
                                    <div className="card-body text-center p-4">
                                        <div className="text-info mb-3">
                                            <svg className="w-6 h-6" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                        <h3 className="h5 mb-1 card-title">Justificaciones</h3>
                                        <p className="small text-muted mb-0">Gestiona ausencias</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Nueva sección de Atrasos */}
                    {userRole !== 'ROLE_USER' && (
                        <div className="mt-5 pt-5 border-top border-light-subtle rounded bg-white shadow p-3 p-md-4">
                            <h2 className="h3 mb-4 text-center text-primary">Empleados con Atrasos</h2>

                            <div className="row g-3 mb-4 px-md-3 justify-content-center align-items-end">
                                <div className="col-md-4 col-lg-3">
                                    <label htmlFor="fechaInicio" className="form-label small text-muted">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm border-secondary"
                                        id="fechaInicio"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 col-lg-3">
                                    <label htmlFor="fechaFin" className="form-label small text-muted">Fecha Fin</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm border-secondary"
                                        id="fechaFin"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 col-lg-3">
                                    <label htmlFor="horaLimite" className="form-label small text-muted">Hora Límite</label>
                                    <input
                                        type="time"
                                        className="form-control form-control-sm border-secondary"
                                        id="horaLimite"
                                        value={horaLimite}
                                        onChange={(e) => setHoraLimite(e.target.value)}
                                    />
                                </div>
                            </div>

                            {loading && <p className="text-center py-3 text-primary">Cargando datos...</p>}
                            {error && <div className="alert alert-danger w-75 mx-auto text-center small" role="alert">Error al cargar: {error}</div>}
                            {!loading && !error && atrasos.length === 0 && (
                                <p className="text-center py-3 text-muted">No se encontraron atrasos para el período y hora seleccionados.</p>
                            )}
                            {!loading && !error && atrasos.length > 0 && (
                                <div className="table-responsive px-md-3">
                                    <table className="table table-striped table-hover table-sm small table-bordered border-light-subtle">
                                        <thead className="bg-white">
                                            <tr>
                                                <th scope="col">RUT</th>
                                                <th scope="col">Nombre Completo</th>
                                                <th scope="col">Cantidad de Atrasos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {atrasos.map((atraso) => (
                                                <tr key={atraso.idEmpleado}>
                                                    <td>{atraso.rut}</td>
                                                    <td>{atraso.nombreCompleto || <span className="text-muted fst-italic">No disponible</span>}</td>
                                                    <td className="text-center">{atraso.atrasos}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 