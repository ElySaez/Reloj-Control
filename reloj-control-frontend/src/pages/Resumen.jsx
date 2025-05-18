import { useState, useEffect } from 'react'
import { getResumen } from '../api'

export default function Resumen() {
    const [fecha, setFecha]   = useState(new Date().toISOString().slice(0,10))
    const [data, setData]     = useState([])
    const [error, setError]   = useState('')

    useEffect(() => {
        setError('')
        getResumen(fecha)
            .then(res => setData(res.data))
            .catch(err => setError(err.message))
    }, [fecha])

    return (
        <div className="max-w-3xl mx-auto mt-10 p-4 bg-white rounded shadow">
            <h1 className="text-xl font-bold mb-4">Resumen diario</h1>
            <div className="mb-4">
                <label className="block">Fecha:</label>
                <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="border p-2 rounded"
                />
            </div>
            {error && <p className="text-red-600">{error}</p>}
            <table className="w-full table-auto border-collapse">
                <thead>
                <tr className="bg-gray-200">
                    <th className="border px-2 py-1">Nombre</th>
                    <th className="border px-2 py-1">Entrada</th>
                    <th className="border px-2 py-1">Salida real</th>
                    <th className="border px-2 py-1">Salida esperada</th>
                    <th className="border px-2 py-1">Min Extra</th>
                </tr>
                </thead>
                <tbody>
                {data.map((r,i) => (
                    <tr key={i} className={i%2?'bg-white':'bg-gray-50'}>
                        <td className="border px-2 py-1">{r.nombre}</td>
                        <td className="border px-2 py-1">{r.entrada}</td>
                        <td className="border px-2 py-1">{r.salida || '-'}</td>
                        <td className="border px-2 py-1">{r.salidaEsperada}</td>
                        <td className="border px-2 py-1">{r.minutosExtra}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
