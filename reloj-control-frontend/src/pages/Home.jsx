import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Home() {
    const [rotation, setRotation] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            const date = new Date()
            const minutes = date.getMinutes()
            const degrees = ((minutes / 60) * 360) + 180
            setRotation(degrees)
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="container-fluid bg-dark text-white">
            <div className="row justify-content-center align-items-center mt-3">
                <div className="col-md-8">
                    <div className="text-center mb-4">
                        <h1 className="h3 mb-2">Control de Asistencia Inteligente</h1>
                        <p className="text-muted">Soluciones empresariales para la gestión de personal</p>
                    </div>

                    <div className="row justify-content-center g-3">
                        <div className="col-md-4">
                            <Link to="/importar" className="text-decoration-none">
                                <div className="card bg-dark text-white border-primary h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="text-primary mb-2">
                                            <svg className="w-5 h-5" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                            </svg>
                                        </div>
                                        <h3 className="h6 mb-2">Importar Marcas</h3>
                                        <p className="small text-muted mb-0">Importa registros .dat</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="col-md-4">
                            <Link to="/resumen" className="text-decoration-none">
                                <div className="card bg-dark text-white border-primary h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="text-primary mb-2">
                                            <svg className="w-5 h-5" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                        </div>
                                        <h3 className="h6 mb-2">Resumen</h3>
                                        <p className="small text-muted mb-0">Visualiza registros</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="col-md-4">
                            <Link to="/justificaciones" className="text-decoration-none">
                                <div className="card bg-dark text-white border-primary h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="text-primary mb-2">
                                            <svg className="w-5 h-5" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                        <h3 className="h6 mb-2">Justificaciones</h3>
                                        <p className="small text-muted mb-0">Gestiona ausencias</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 