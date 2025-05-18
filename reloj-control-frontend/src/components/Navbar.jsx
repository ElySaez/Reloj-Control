import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
    const location = useLocation()

    return (
        <nav className="navbar navbar-expand-lg" style={{background: 'linear-gradient(135deg, #1a1c2d 0%, #2d1b42 100%)'}}>
            <div className="container">
                <Link to="/" className="navbar-brand d-flex align-items-center text-info">
                    <svg className="me-2" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white">Reloj Control</span>
                </Link>

                <div className="navbar-nav ms-auto flex-row gap-4">
                    <Link 
                        to="/importar" 
                        className={`nav-link d-flex align-items-center ${location.pathname === '/importar' ? 'text-info' : 'text-white-50'} hover-lift`}
                        style={{transition: 'all 0.3s ease'}}
                    >
                        <svg className="me-2" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                        </svg>
                        Importar
                    </Link>

                    <Link 
                        to="/resumen" 
                        className={`nav-link d-flex align-items-center ${location.pathname === '/resumen' ? 'text-info' : 'text-white-50'} hover-lift`}
                        style={{transition: 'all 0.3s ease'}}
                    >
                        <svg className="me-2" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Resumen
                    </Link>

                    <Link 
                        to="/justificaciones" 
                        className={`nav-link d-flex align-items-center ${location.pathname === '/justificaciones' ? 'text-info' : 'text-white-50'} hover-lift`}
                        style={{transition: 'all 0.3s ease'}}
                    >
                        <svg className="me-2" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Justificaciones
                    </Link>
                </div>
            </div>
        </nav>
    )
} 