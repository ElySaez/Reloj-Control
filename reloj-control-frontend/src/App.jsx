import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Importar from './pages/Importar'
import Resumen from './pages/Resumen'
import Justificaciones from './pages/Justificaciones'
import Configuraciones from './pages/Configuraciones'

export default function App() {
    return (
        <div className="min-vh-100 d-flex flex-column bg-light text-dark">
            <Navbar />
            <main className="flex-grow-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/importar" element={<Importar />} />
                    <Route path="/resumen" element={<Resumen />} />
                    <Route path="/justificaciones" element={<Justificaciones />} />
                    <Route path="/configuraciones" element={<Configuraciones />} />
                </Routes>
            </main>
        </div>
    )
}
