import { useState, useEffect } from 'react'
import { getResumen } from '../api'

export default function Resumen() {
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10))
    const [data, setData] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (!fecha) return;

            setLoading(true)
            setError('')
            
            try {
                console.log('Consultando resumen para fecha:', fecha)
                const response = await getResumen(fecha)
                console.log('Datos recibidos:', response)
                
                // Asegurarse de que data sea un array
                const resumenData = Array.isArray(response.data) ? response.data : [response.data]
                setData(resumenData.filter(Boolean)) // Filtrar valores nulos
            } catch (err) {
                console.error('Error en la petición:', err)
                setError(err.message || 'Error al cargar los datos')
                setData([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [fecha])

    const formatearHorasExtras = (minutos25 = 0, minutos50 = 0) => {
        const totalMinutos = minutos25 + minutos50
        if (totalMinutos === 0) return '00:00'
        
        const horas = Math.floor(totalMinutos / 60)
        const minutos = totalMinutos % 60
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    }

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-11">
                    <div className="card bg-white shadow-sm">
                        <div className="card-body p-4">
                            <h1 className="h4 mb-4 text-primary">Resumen de Asistencia</h1>

                            {/* Selector de fecha */}
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <div className="form-floating">
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="fecha"
                                            value={fecha}
                                            onChange={e => setFecha(e.target.value)}
                                            required
                                        />
                                        <label htmlFor="fecha">Fecha *</label>
                                    </div>
                                </div>
                            </div>

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
                                /* Tabla de resultados */
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Entrada</th>
                                                <th>Salida real</th>
                                                <th>Salida esperada</th>
                                                <th className="text-end">Horas Extras</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data && data.length > 0 ? (
                                                data.map((registro, index) => (
                                                    <tr key={index}>
                                                        <td>{registro.nombre}</td>
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
                                                            {formatearHorasExtras(registro.minutosExtra25, registro.minutosExtra50)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted py-4">
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
