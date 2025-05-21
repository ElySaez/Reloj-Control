import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Importar from './pages/Importar'
import Resumen from './pages/Resumen'
import Justificaciones from './pages/Justificaciones'
import Configuraciones from './pages/Configuraciones'
import LoginPage from './pages/LoginPage'

// Componente para proteger rutas
const ProtectedRoute = () => {
    const token = localStorage.getItem('token')
    // Aquí podrías añadir validación de expiración del token si lo deseas
    return token ? <Outlet /> : <Navigate to="/login" replace />
}

// Componente para rutas públicas (como login) cuando el usuario ya está logueado
const PublicRoute = () => {
    const token = localStorage.getItem('token')
    return !token ? <Outlet /> : <Navigate to="/" replace />
}

export default function App() {
    // Determinar si el Navbar se debe mostrar. No en LoginPage.
    const location = useLocation();
    const shouldShowNavbar = location.pathname !== '/login';

    return (
        <div className="min-vh-100 d-flex flex-column bg-light text-dark">
            {shouldShowNavbar && <Navbar />}
            <main className="flex-grow-1">
                <Routes>
                    {/* Rutas Públicas */}
                    <Route path="/login" element={<PublicRoute />}>
                        <Route index element={<LoginPage />} />
                    </Route>

                    {/* Rutas Protegidas */}
                    <Route path="/" element={<ProtectedRoute />}>
                        <Route index element={<Home />} /> {/* Home como ruta protegida principal */}
                        <Route path="importar" element={<Importar />} />
                        <Route path="resumen" element={<Resumen />} />
                        <Route path="justificaciones" element={<Justificaciones />} />
                        <Route path="configuraciones" element={<Configuraciones />} />
                    </Route>
                    
                    {/* Fallback o página 404 si es necesario */}
                    <Route path="*" element={<Navigate to={localStorage.getItem('token') ? "/" : "/login"} replace />} />
                </Routes>
            </main>
        </div>
    )
}
