import { Routes, Route, Link } from 'react-router-dom'
import Importar from './pages/Importar'
import Resumen   from './pages/Resumen'

export default function App() {
    return (
        <>
            <nav>
                <Link to="/importar">Importar</Link>
                <Link to="/resumen">Resumen</Link>
            </nav>
            <Routes>
                <Route path="/importar" element={<Importar />} />
                <Route path="/resumen"   element={<Resumen />} />
                <Route path="*"          element={<Importar />} />
            </Routes>
        </>
    )
}
