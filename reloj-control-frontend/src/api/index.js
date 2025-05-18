const API_URL = '/api'

// Función básica para realizar peticiones GET
const hacerPeticionGet = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }
    return response.json();
};

export const getResumen = async (fechaInicio, fechaFin, rut) => {
    try {
        // Validar fecha inicio (siempre requerida por el backend)
        if (!fechaInicio) {
            throw new Error('La fecha de inicio es requerida');
        }

        // Formatear las fechas para asegurar que tienen el formato YYYY-MM-DD
        const formatearFecha = (fecha) => {
            if (!fecha) return undefined;
            
            // Si ya es un string con formato yyyy-MM-dd, devolverlo tal cual
            if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                return fecha;
            }
            
            try {
                // Intentar convertir a fecha válida
                const dateObj = new Date(fecha);
                if (isNaN(dateObj.getTime())) {
                    throw new Error(`Fecha inválida: ${fecha}`);
                }
                return dateObj.toISOString().split('T')[0]; // Formato yyyy-MM-dd
            } catch (e) {
                console.error("Error al formatear fecha:", e);
                throw new Error(`Formato de fecha inválido: ${fecha}`);
            }
        };

        // Formatear fechas
        const inicioFormateado = formatearFecha(fechaInicio);
        const finFormateado = fechaFin ? formatearFecha(fechaFin) : undefined;

        // Construir URL con los parámetros encodificados correctamente
        let url = `${API_URL}/asistencias/resumen?inicio=${encodeURIComponent(inicioFormateado)}`;
        
        if (finFormateado) {
            url += `&fin=${encodeURIComponent(finFormateado)}`;
        }
        
        if (rut) {
            url += `&rut=${encodeURIComponent(rut)}`;
        }

        console.log('URL de petición:', url);
        
        // Realizar la petición con el API nativo fetch
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
        console.error('Error en getResumen:', error);
        throw error;
    }
};

export const getResumenMensual = async (mes, año, rut) => {
    try {
        console.log('Ejecutando getResumenMensual con parámetros:', { mes, año, rut });
        
        // Validar parámetros
        if (!mes || !año) {
            throw new Error('El mes y año son obligatorios');
        }
        
        // Convertir a números para validar
        const mesNum = parseInt(mes);
        const añoNum = parseInt(año);
        
        if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
            throw new Error('El mes debe ser un número entre 1 y 12');
        }
        
        if (isNaN(añoNum) || añoNum < 2000 || añoNum > 2100) {
            throw new Error('El año debe ser un número válido');
        }
        
        // Construir URL con los parámetros
        let url = `${API_URL}/asistencias/resumen/mensual?mes=${mesNum}&año=${añoNum}`;
        
        if (rut) {
            url += `&rut=${encodeURIComponent(rut)}`;
        }
        
        console.log('URL de petición resumen mensual:', url);
        
        // Realizar la petición con el API nativo fetch
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
        console.error('Error en getResumenMensual:', error);
        throw error;
    }
};

export const marcarAsistencia = async (empleadoId, tipo) => {
    try {
        const params = new URLSearchParams()
        params.append('empleadoId', empleadoId)
        params.append('tipo', tipo)

        const response = await fetch(`${API_URL}/asistencias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error('Error en marcarAsistencia:', error)
        throw error
    }
}

export const importarArchivo = async (file) => {
    try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_URL}/importar`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error('Error en importarArchivo:', error)
        throw error
    }
}

// Función para actualizar el estado de una asistencia
export const actualizarEstadoAsistencia = async (id, estado) => {
    try {
        const url = `${API_URL}/asistencias/estado/${id}?estado=${encodeURIComponent(estado)}`;
        
        console.log('Actualizando estado:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }
        
        return await response.text();
    } catch (error) {
        console.error("Error al actualizar el estado de la asistencia:", error);
        throw error;
    }
}; 