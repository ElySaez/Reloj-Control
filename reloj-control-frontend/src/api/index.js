export const API_URL = '/api'

// Función auxiliar para obtener el token
const getToken = () => localStorage.getItem('token');

// Función para formatear las fechas para asegurar que tienen el formato YYYY-MM-DD
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

// Función básica para realizar peticiones GET, ahora con token
const hacerPeticionGet = async (urlPath, includeAuth = true) => {
    const token = getToken();
    const headers = {
        'Accept': 'application/json',
    };
    if (includeAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${urlPath}`, { headers });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error HTTP: ${response.status}`);
    }
    return response.json();
};

export const getResumen = async (fechaInicio, fechaFin, rut) => {
    try {
        // Validar fecha inicio (siempre requerida por el backend)
        if (!fechaInicio) {
            throw new Error('La fecha de inicio es requerida');
        }

        // Formatear fechas usando la función global
        const inicioFormateado = formatearFecha(fechaInicio);
        const finFormateado = fechaFin ? formatearFecha(fechaFin) : undefined;

        // Construir URL con los parámetros encodificados correctamente
        let queryString = `?inicio=${encodeURIComponent(inicioFormateado)}`;
        
        if (finFormateado) {
            queryString += `&fin=${encodeURIComponent(finFormateado)}`;
        }
        
        if (rut) {
            queryString += `&rut=${encodeURIComponent(rut)}`;
        }

        console.log('URL de petición getResumen:', `${API_URL}/asistencias/resumen${queryString}`);
        
        return hacerPeticionGet(`/asistencias/resumen${queryString}`);
        
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
        let queryString = `?mes=${mesNum}&año=${añoNum}`;
        
        if (rut) {
            queryString += `&rut=${encodeURIComponent(rut)}`;
        }
        
        console.log('URL de petición resumen mensual:', `${API_URL}/asistencias/resumen/mensual${queryString}`);
        
        return hacerPeticionGet(`/asistencias/resumen/mensual${queryString}`);
        
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
    const token = getToken();
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
        headers,
        body: params.toString()
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Error ${response.status}: ${response.statusText}`)
    }

    return await response.json()
}

export const importarArchivo = async (file) => {
    const token = getToken();
    const headers = {}; // FormData se encarga del Content-Type
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/importar`, {
        method: 'POST',
        headers,
        body: formData
    })

    const responseText = await response.text(); // Leer como texto

    if (!response.ok) {
        // Usar el texto de la respuesta en el error si está disponible
        throw new Error(responseText || `Error ${response.status}: ${response.statusText}`)
    }

    return responseText; // Devolver el texto directamente
}

// Función para actualizar el estado de una asistencia
export const actualizarEstadoAsistencia = async (id, estado) => {
    const token = getToken();
    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/asistencias/estado/${id}?estado=${encodeURIComponent(estado)}`, {
        method: 'PUT',
        headers
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
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
        let queryString = `/asistencias/marcas?fecha=${encodeURIComponent(fechaFormateada)}`;
        
        if (rut) {
            queryString += `&rut=${encodeURIComponent(rut)}`;
        }
        
        console.log('URL de petición para obtener marcas:', queryString);
        
        return hacerPeticionGet(queryString);
        
    } catch (error) {
        console.error('Error en getMarcasPorFecha:', error);
        throw error;
    }
};

// Función para obtener marcas de un empleado por RUT y rango de fechas
export const getMarcasPorEmpleadoYFechas = async (rut, fechaInicio, fechaFin = null) => {
    try {
        if (!rut || !fechaInicio) {
            throw new Error('El RUT del empleado y la fecha de inicio son obligatorios.');
        }

        // Formatear fechas usando la función global
        const inicioFormateado = formatearFecha(fechaInicio);
        const finFormateado = fechaFin ? formatearFecha(fechaFin) : undefined;
        
        // Construir URL con los parámetros
        let queryString = `/asistencias/marcas/empleado?rut=${encodeURIComponent(rut)}&fechaInicio=${encodeURIComponent(inicioFormateado)}`;
        
        if (finFormateado) {
            queryString += `&fechaFin=${encodeURIComponent(finFormateado)}`;
        }
        
        console.log('URL de petición para obtener marcas por empleado:', queryString);
        
        return hacerPeticionGet(queryString);
        
    } catch (error) {
        console.error('Error en getMarcasPorEmpleadoYFechas:', error);
        throw error;
    }
};

// Nueva función para crear una justificación
export const crearJustificacion = async (formData) => {
    const token = getToken();
    const headers = {}; // FormData se encarga del Content-Type
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/justificaciones`, {
        method: 'POST',
        headers,
        body: formData, 
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null); 
        const errorMessage = errorData?.message || response.statusText || `Error HTTP: ${response.status}`;
        const error = new Error(errorMessage);
        error.response = {
            status: response.status,
            data: errorData || { message: errorMessage }, 
        };
        throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json(); 
    }
    return { success: true, message: 'Justificación creada exitosamente' };
};

export const getJustificacionesPorRutEmpleado = async (rutEmpleado) => {
    return hacerPeticionGet(`/justificaciones/empleado/${encodeURIComponent(rutEmpleado.trim())}`);
};

// Nueva función para obtener justificaciones por estado (para ROLE_ADMIN)
export const getJustificacionesPorEstado = async (estado) => {
    if (!estado || typeof estado !== 'string' || estado.trim() === '') {
        throw new Error('El estado es requerido para buscar las justificaciones.');
    }
    return hacerPeticionGet(`/justificaciones?estado=${encodeURIComponent(estado.trim())}`);
};

// Nueva función para actualizar el estado de una justificación
export const actualizarEstadoJustificacion = async (idJustificacion, nuevoEstado) => {
    const token = getToken();
    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/justificaciones/${idJustificacion}?estado=${nuevoEstado}`, {
        method: 'PUT',
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || response.statusText || `Error HTTP: ${response.status}`;
        const error = new Error(errorMessage);
        error.response = {
            status: response.status,
            data: errorData || { message: errorMessage },
        };
        throw error;
    }

    // El backend devuelve la justificación actualizada
    return response.json(); 
};

// --- Funciones para Parámetros (ahora protegidas) ---
export const fetchParametrosAPI = async () => { // Renombrada para claridad
    return hacerPeticionGet('/parametros');
};

export const saveParametrosAPI = async (parametrosParaEnviar) => { // Renombrada para claridad
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/parametros`, {
        method: 'POST',
        headers,
        body: JSON.stringify(parametrosParaEnviar),
    });
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error al guardar los parámetros: ${response.status} ${errorData || ''}`);
    }
    return response.json(); 
};

//Atrasos
export const getAtrasos = async (fechaInicio, fechaFin, horario) => {
    try {
        if (!fechaInicio || !horario) {
            throw new Error('La fecha de inicio y el horario son requeridos para obtener los atrasos.');
        }

        // Formatear fechas usando la función global
        const inicioFormateado = formatearFecha(fechaInicio);
        const finFormateado = fechaFin ? formatearFecha(fechaFin) : undefined;

        // Corregir nombres de parámetros para que coincidan con el backend
        let queryString = `?inicio=${encodeURIComponent(inicioFormateado)}&horario=${encodeURIComponent(horario)}`;
        if (finFormateado) {
            queryString += `&fin=${encodeURIComponent(finFormateado)}`;
        }
        
        console.log('URL de petición getAtrasos:', `${API_URL}/asistencias/resumen/atrasos${queryString}`);
        return hacerPeticionGet(`/asistencias/resumen/atrasos${queryString}`);
    } catch (error) {
        console.error('Error en getAtrasos:', error);
        throw error;
    }
};

// Nueva función para obtener logs de actividad por RUN
export const getActividadPorRun = async (run) => {
    if (!run || typeof run !== 'string' || run.trim() === '') {
        throw new Error('El RUN es requerido para buscar la actividad.');
    }
    // El token ya se incluye automáticamente por hacerPeticionGet
    return hacerPeticionGet(`/actividad/${encodeURIComponent(run.trim())}`);
}; 