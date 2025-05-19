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
        
        // Verificar el tipo de respuesta
        if (Array.isArray(data)) {
            // Si es un array, devolverlo directamente (respuesta normal)
            return data;
        } else if (typeof data === 'object' && data !== null) {
            // Si es un objeto (posiblemente con mensaje y data), devolverlo tal cual
            return data;
        }
        
        // Si no es ni array ni objeto, convertir a array vacío por defecto
        return [];
        
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
        
        // Verificar el tipo de respuesta
        if (Array.isArray(data)) {
            // Si es un array, devolverlo directamente (respuesta normal)
            return data;
        } else if (typeof data === 'object' && data !== null) {
            // Si es un objeto (posiblemente con mensaje y data), devolverlo tal cual
            return data;
        }
        
        // Si no es ni array ni objeto, convertir a array vacío por defecto
        return [];
        
    } catch (error) {
        console.error('Error en getResumenMensual:', error);
        throw error;
    }
};

// Función para formatear una fecha sin zona horaria con milisegundos
const formatearFechaSinZonaHoraria = (fecha) => {
    if (!fecha) return null;
    
    try {
        const fechaObj = new Date(fecha);
        if (isNaN(fechaObj.getTime())) {
            throw new Error(`Fecha inválida: ${fecha}`);
        }
        
        // Formatear la fecha sin zona horaria (YYYY-MM-DDThh:mm:ss.SSS)
        const anio = fechaObj.getFullYear();
        const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        const hora = String(fechaObj.getHours()).padStart(2, '0');
        const minutos = String(fechaObj.getMinutes()).padStart(2, '0');
        const segundos = String(fechaObj.getSeconds()).padStart(2, '0');
        const milisegundos = String(fechaObj.getMilliseconds()).padStart(3, '0');
        
        return `${anio}-${mes}-${dia}T${hora}:${minutos}:${segundos}.${milisegundos}`;
    } catch (e) {
        console.error("Error al formatear fecha:", e);
        throw e;
    }
};

// Actualizar la función marcarAsistencia para aceptar una fecha específica
export const marcarAsistencia = async (empleadoId, tipo, fecha = null) => {
    try {
        const params = new URLSearchParams()
        params.append('empleadoId', empleadoId)
        params.append('tipo', tipo)
        
        // Si se proporciona una fecha, incluirla en la petición
        if (fecha) {
            let fechaFormateada = null;
            
            // Para un valor datetime-local (formato: YYYY-MM-DDThh:mm) o cualquier otro formato de fecha
            try {
                // Si solo se proporciona una hora HH:MM
                if (typeof fecha === 'string' && /^\d{2}:\d{2}$/.test(fecha)) {
                    // Obtener la fecha actual
                    const hoy = new Date();
                    const [horas, minutos] = fecha.split(':').map(Number);
                    
                    // Crear una fecha con la hora proporcionada
                    hoy.setHours(horas, minutos, 0, 0);
                    fechaFormateada = formatearFechaSinZonaHoraria(hoy);
                } 
                // Para valores datetime-local o cualquier otra fecha
                else {
                    // Si ya es una cadena con formato YYYY-MM-DDThh:mm, añadir los segundos y milisegundos
                    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fecha)) {
                        fechaFormateada = `${fecha}:00.000`;
                    } else {
                        // Cualquier otro formato, intentar convertir
                        fechaFormateada = formatearFechaSinZonaHoraria(fecha);
                    }
                }
            } catch (e) {
                console.error('Error al formatear fecha:', e);
                throw new Error(`Formato de fecha inválido: ${fecha}`);
            }
            
            if (fechaFormateada) {
                console.log('Fecha formateada:', fechaFormateada);
                params.append('fecha', fechaFormateada);
            }
        }

        console.log('Enviando parámetros:', params.toString());

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

// Función para obtener las marcas originales de un día específico
export const getMarcasPorFecha = async (fecha, rut) => {
    try {
        if (!fecha) {
            throw new Error('La fecha es requerida');
        }

        // Formatear la fecha para asegurar formato YYYY-MM-DD
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

        const fechaFormateada = formatearFecha(fecha);
        
        // Construir URL con los parámetros
        let url = `${API_URL}/asistencias/marcas?fecha=${encodeURIComponent(fechaFormateada)}`;
        
        if (rut) {
            url += `&rut=${encodeURIComponent(rut)}`;
        }
        
        console.log('URL de petición para obtener marcas:', url);
        
        // Realizar la petición
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
        
        return await response.json();
        
    } catch (error) {
        console.error('Error en getMarcasPorFecha:', error);
        throw error;
    }
};

// Función para obtener marcas de un empleado por RUT y rango de fechas
export const getMarcasPorEmpleadoYFechas = async (rut, fechaInicio, fechaFin = null) => {
    try {
        if (!rut) {
            throw new Error('El RUT del empleado es requerido');
        }
        
        if (!fechaInicio) {
            throw new Error('La fecha de inicio es requerida');
        }

        // Formatear las fechas para asegurar formato YYYY-MM-DD
        const formatearFecha = (fecha) => {
            if (!fecha) return undefined;
            
            if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                return fecha;
            }
            
            try {
                const dateObj = new Date(fecha);
                if (isNaN(dateObj.getTime())) {
                    throw new Error(`Fecha inválida: ${fecha}`);
                }
                return dateObj.toISOString().split('T')[0];
            } catch (e) {
                console.error("Error al formatear fecha:", e);
                throw new Error(`Formato de fecha inválido: ${fecha}`);
            }
        };

        const inicioFormateado = formatearFecha(fechaInicio);
        const finFormateado = fechaFin ? formatearFecha(fechaFin) : undefined;
        
        // Construir URL con los parámetros
        let url = `${API_URL}/asistencias/marcas/empleado?rut=${encodeURIComponent(rut)}&fechaInicio=${encodeURIComponent(inicioFormateado)}`;
        
        if (finFormateado) {
            url += `&fechaFin=${encodeURIComponent(finFormateado)}`;
        }
        
        console.log('URL de petición para obtener marcas por empleado:', url);
        
        // Realizar la petición
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
        
        return await response.json();
        
    } catch (error) {
        console.error('Error en getMarcasPorEmpleadoYFechas:', error);
        throw error;
    }
}; 