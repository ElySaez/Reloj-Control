const API_URL = '/api'

export const getResumen = async (fecha) => {
    if (!fecha) {
        throw new Error('La fecha es requerida')
    }

    try {
        const response = await fetch(`${API_URL}/asistencias/resumen?inicio=${fecha}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error('Error en getResumen:', error)
        throw error
    }
}

export const marcarAsistencia = async (empleadoId, tipo) => {
    const formData = new URLSearchParams()
    formData.append('empleadoId', empleadoId)
    formData.append('tipo', tipo)

    const response = await fetch(`${API_URL}/asistencias`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    })

    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
    }

    return await response.json()
}

export const importarArchivo = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/importar`, {
        method: 'POST',
        body: formData
    })

    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
    }

    return await response.json()
} 