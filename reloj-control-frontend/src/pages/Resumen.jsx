import { useState, useEffect, useCallback } from 'react'
import { getResumen, getResumenMensual, actualizarEstadoAsistencia, getMarcasPorEmpleadoYFechas, marcarAsistencia } from '../api/index'

// Imports para generación de reportes en frontend
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx'; // Para Excel

// Helper para verificar si es un string de hora simple
const esFormatoHoraSimple = (valor) => {
    if (typeof valor !== 'string') return false;
    return /^\d{2}:\d{2}(:\d{2})?$/.test(valor);
};

export default function Resumen() {
    // Inicializar con una fecha predeterminada en formato correcto
    const fechaHoy = new Date().toISOString().split('T')[0];
    const [fechaInicio, setFechaInicio] = useState(fechaHoy)
    const [fechaFin, setFechaFin] = useState('')
    const [rut, setRut] = useState('')
    const [data, setData] = useState([]) // Datos originales de la API
    const [registrosFiltrados, setRegistrosFiltrados] = useState([]); // Datos para mostrar y exportar
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [savingState, setSavingState] = useState(false)
    const [savingStateId, setSavingStateId] = useState(null)
    
    const [showModal, setShowModal] = useState(false)
    const [registroSeleccionado, setRegistroSeleccionado] = useState(null)
    const [entradaManual, setEntradaManual] = useState('08:00')
    const [salidaManual, setSalidaManual] = useState('17:00')
    const [guardandoMarcas, setGuardandoMarcas] = useState(false)
    
    const [guardandoEntrada, setGuardandoEntrada] = useState(false);
    const [guardandoSalida, setGuardandoSalida] = useState(false);
    const [errorHora, setErrorHora] = useState('');

    const [resumen, setResumen] = useState({
        AUTORIZADO: { minutos25: 0, minutos50: 0 },
        RECHAZADO: { minutos25: 0, minutos50: 0 },
        PENDIENTE: { minutos25: 0, minutos50: 0 },
    });
    const [totalGeneral25, setTotalGeneral25] = useState(0);
    const [totalGeneral50, setTotalGeneral50] = useState(0);

    const formatearTiempo = useCallback((minutos) => {
        if (minutos === undefined || minutos === null || isNaN(minutos)) return '00:00:00';
        if (minutos === 0) return '00:00:00';
        const esNegativo = minutos < 0;
        const absMinutos = Math.abs(minutos);
        const horas = Math.floor(absMinutos / 60);
        const mins = absMinutos % 60;
        return `${esNegativo ? '-' : ''}${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
    }, []);

    const formatearHora = useCallback((fechaISO) => {
        if (!fechaISO) return 'N/A';
        try {
            const fechaObj = new Date(fechaISO);
            if (isNaN(fechaObj.getTime())) { // Verificar si la fecha es válida
                // Intentar parsear formatos comunes si la conversión directa falla
                const parts = fechaISO.split(/[-/ :T]/);
                let reformattedDate;
                if (parts.length >= 3) {
                    // Suponiendo DD/MM/YYYY o YYYY-MM-DD
                    if (parts[0].length === 4) { // YYYY-MM-DD
                        reformattedDate = new Date(parts[0], parts[1] - 1, parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0);
                    } else { // DD/MM/YYYY
                         reformattedDate = new Date(parts[2], parts[1] - 1, parts[0], parts[3] || 0, parts[4] || 0, parts[5] || 0);
                    }
                     if (isNaN(reformattedDate.getTime())) return 'N/A';
                     const horas = String(reformattedDate.getHours()).padStart(2, '0');
                     const minutos = String(reformattedDate.getMinutes()).padStart(2, '0');
                     const segundos = String(reformattedDate.getSeconds()).padStart(2, '0');
                     return `${horas}:${minutos}:${segundos}`;
                }
                return 'N/A';
            }
            const horas = String(fechaObj.getHours()).padStart(2, '0');
            const minutos = String(fechaObj.getMinutes()).padStart(2, '0');
            const segundos = String(fechaObj.getSeconds()).padStart(2, '0');
            return `${horas}:${minutos}:${segundos}`;
        } catch (error) {
            console.error("Error formateando hora:", fechaISO, error);
            return 'N/A';
        }
    }, []);
    
    const fetchData = async () => {
        setLoading(true);
        setError('');
        setData([]);
        setRegistrosFiltrados([]); // Limpiar registros filtrados también

        try {
            if (rut && !validarRutMinimo(rut)) {
                setError('El RUT debe tener al menos 4 dígitos para realizar la búsqueda');
                setLoading(false);
                return;
            }
            
            const inicioParam = fechaInicio;
            const finParam = fechaFin || undefined;
            
            const respuesta = await getResumen(
                inicioParam,
                finParam,
                rut || undefined
            );
            
            if (respuesta && !Array.isArray(respuesta) && respuesta.mensaje) {
                setError(respuesta.mensaje);
                // setData([]); // Ya se limpió arriba
                // setRegistrosFiltrados([]); // Ya se limpió arriba
            } else {
                const datosArray = Array.isArray(respuesta) ? respuesta : (respuesta && respuesta.data ? respuesta.data : []);
                if (datosArray.length > 0) {
                    const datosConEstadoDefecto = datosArray.map(item => ({
                        ...item,
                        estado: item.estado || 'AUTORIZADO' 
                    }));
                    
                    datosConEstadoDefecto.sort((a, b) => {
                        if (!a.fecha || !b.fecha) return 0;
                        const fechaComp = a.fecha.localeCompare(b.fecha);
                        if (fechaComp === 0) {
                            return (a.nombre || '').localeCompare(b.nombre || '');
                        }
                        return fechaComp;
                    });
                    
                    setData(datosConEstadoDefecto); // Guardar datos originales
                    setRegistrosFiltrados(datosConEstadoDefecto); // Establecer para la tabla y exportación
                } else {
                    // setData([]); // Ya se limpió
                    // setRegistrosFiltrados([]); // Ya se limpió
                    setError('No se encontraron resultados para los filtros seleccionados');
                }
            }
        } catch (err) {
            console.error('Error general en fetchData:', err);
            setError(err.message || 'Error al cargar los datos');
            // setData([]); // Ya se limpió
            // setRegistrosFiltrados([]); // Ya se limpió
        } finally {
            setLoading(false);
        }
    };

    const calcularResumenDetallado = useCallback(() => {
        let resumenCalculado = {
            AUTORIZADO: { minutos25: 0, minutos50: 0 },
            RECHAZADO: { minutos25: 0, minutos50: 0 },
            PENDIENTE: { minutos25: 0, minutos50: 0 },
        };
        let total25 = 0;
        let total50 = 0;

        registrosFiltrados.forEach(registro => {
            const estado = registro.estado || 'PENDIENTE';
            const minutos25 = parseInt(registro.minutosExtra25 || 0);
            const minutos50 = parseInt(registro.minutosExtra50 || 0);

            if (resumenCalculado[estado]) {
                resumenCalculado[estado].minutos25 += minutos25;
                resumenCalculado[estado].minutos50 += minutos50;
            }
            total25 += minutos25;
            total50 += minutos50;
        });
        setResumen(resumenCalculado);
        setTotalGeneral25(total25);
        setTotalGeneral50(total50);
    }, [registrosFiltrados]); // No necesita dependencias de setResumen, etc.

    useEffect(() => {
        // Recalcular resumen cuando los registros filtrados cambian
        calcularResumenDetallado();
    }, [registrosFiltrados, calcularResumenDetallado]);

    // Solo ejecutar búsqueda cuando el usuario haga clic en buscar, no en cada cambio
    const handleBuscar = (e) => {
        e.preventDefault();
        
        // Verificar que el RUT tenga al menos 4 caracteres si no está vacío
        if (rut && !validarRutMinimo(rut)) {
            setError('El RUT debe tener al menos 4 dígitos para realizar la búsqueda');
            return;
        }
        
        console.log('Botón buscar presionado');
        console.log('Valores del formulario - inicio:', fechaInicio, 'fin:', fechaFin, 'rut:', rut);
        fetchData();
    };
    
    // Formatear RUT mientras se escribe - permitir búsqueda por números parciales
    const formatearRut = (value) => {
        // Si es solo números, permitir la búsqueda parcial
        if (/^\d+$/.test(value)) {
            return value; // Devolver tal cual sin formatear
        }
        
        // Si tiene formato de RUT chileno, formatearlo normalmente
        let rutLimpio = value.replace(/[^0-9kK]/g, '')
        if (rutLimpio.length === 0) return ''
        
        if (rutLimpio.length > 1) {
            const dv = rutLimpio.slice(-1)
            const numeros = rutLimpio.slice(0, -1)
            rutLimpio = numeros.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv
        }
        
        return rutLimpio
    }

    // Validar que el RUT tenga al menos 4 caracteres para buscar
    const validarRutMinimo = (rutValue) => {
        if (!rutValue) return true; // Si está vacío, es válido (no se filtra por RUT)
        
        // Quitar puntos y guiones para contar solo dígitos
        const rutLimpio = rutValue.replace(/[^0-9kK]/g, '');
        return rutLimpio.length >= 4;
    }

    const formatearHorasExtras = (minutos25 = 0, minutos50 = 0) => {
        const totalMinutos = minutos25 + minutos50
        if (totalMinutos === 0) return '00:00'
        
        const horas = Math.floor(totalMinutos / 60)
        const minutos = totalMinutos % 60
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    }

    const calcularResumenTotal = () => {
        const resumen = {
            autorizadas: 0,
            rechazadas: 0,
            pendientes: 0
        }

        data.forEach(registro => {
            const totalMinutos = registro.minutosExtra25 + registro.minutosExtra50
            switch (registro.estado) {
                case 'AUTORIZADO':
                    resumen.autorizadas += totalMinutos
                    break
                case 'RECHAZADO':
                    resumen.rechazadas += totalMinutos
                    break
                case 'PENDIENTE':
                    resumen.pendientes += totalMinutos
                    break
            }
        })

        return resumen
    }

    const getEstadoClass = (estado) => {
        switch (estado) {
            case 'AUTORIZADO':
                return 'bg-success'
            case 'RECHAZADO':
                return 'bg-danger'
            case 'PENDIENTE':
                return 'bg-warning'
            default:
                return 'bg-secondary'
        }
    }

    // Función para manejar el cambio de estado
    const handleEstadoChange = async (id, nuevoEstado) => {
        try {
            setSavingState(true);
            setSavingStateId(id);
            await actualizarEstadoAsistencia(id, nuevoEstado);
            
            const updatedData = data.map(item => {
                if (item.idAsistencia === id) {
                    return { ...item, estado: nuevoEstado };
                }
                return item;
            });
            setData(updatedData);

            // Actualizar también registrosFiltrados para disparar el recálculo del resumen
            const updatedRegistrosFiltrados = registrosFiltrados.map(item => {
                if (item.idAsistencia === id) {
                   return { ...item, estado: nuevoEstado };
               }
               return item;
           });
           setRegistrosFiltrados(updatedRegistrosFiltrados);
            
            setError('');
        } catch (err) {
            console.error('Error al cambiar el estado:', err);
            setError(`Error al actualizar el estado: ${err.message}`);
        } finally {
            setSavingState(false);
            setSavingStateId(null);
        }
    };

    // Función para abrir el modal y cargar las marcas del día
    const handleOpenModal = async (registro) => {
        try {
            // Depurar el registro para ver todas sus propiedades
            console.log('Registro seleccionado:', registro);
            console.log('Propiedades del registro:', Object.keys(registro));
            
            // Buscar propiedades que podrían contener el ID
            console.log('Posible ID empleado:', {
                idEmpleado: registro.idEmpleado,
                empleadoId: registro.empleadoId,
                id: registro.id,
                idAsistencia: registro.idAsistencia,
                idMarca: registro.idMarca,
                rut: registro.rut
            });
            
            // Asegurarnos de tener el ID del empleado
            const idEmpleado = registro.idEmpleado || 
                              registro.empleadoId || 
                              null;
            
            // Si no hay ID, pero tenemos RUT, podríamos buscar el empleado por RUT
            if (!idEmpleado && registro.rut) {
                console.log('No se encontró ID de empleado directamente, usando RUT:', registro.rut);
                
                // Intentar extraer números del RUT para usarlo como identificador
                const rutSoloNumeros = registro.rut.replace(/\D/g, '');
                
                // Enriquecer el objeto registro con el ID del empleado
                registro.idEmpleadoCalculado = registro.idEmpleado || 
                                              registro.empleadoId || 
                                              Number(rutSoloNumeros) || // Usar el RUT numérico como ID temporal
                                              null;
                
                console.log('ID empleado calculado:', registro.idEmpleadoCalculado);
            }
            
            // Guardar el registro seleccionado (posiblemente enriquecido)
            setRegistroSeleccionado(registro);
            
            // Obtener fecha en formato YYYY-MM-DD
            const partesFecha = registro.fecha.split('/');
            const fechaFormateada = `${partesFecha[2]}-${partesFecha[1].padStart(2, '0')}-${partesFecha[0].padStart(2, '0')}`;
            
            // Inicializar valores por defecto para datetime-local
            // Formato necesario: YYYY-MM-DDThh:mm
            const fechaHoraEntrada = `${fechaFormateada}T${registro.entrada || '08:00'}`;
            const fechaHoraSalida = `${fechaFormateada}T${registro.salida || '17:00'}`;
            
            setEntradaManual(fechaHoraEntrada);
            setSalidaManual(fechaHoraSalida);
            
            // Mostrar modal
            setShowModal(true);
            
        } catch (error) {
            console.error('Error al abrir modal:', error);
            setError('Error al abrir el editor de marcas: ' + error.message);
        }
    };
    
    // Función para formatear fecha para backend (YYYY-MM-DDThh:mm:ss.SSS)
    const formatearFechaCompleta = (fechaStr) => {
        // Si ya tiene segundos y milisegundos, retornarla tal cual
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(fechaStr)) {
            return fechaStr;
        }
        
        // Si es formato datetime-local (YYYY-MM-DDThh:mm), añadir segundos y milisegundos
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fechaStr)) {
            return `${fechaStr}:00.000`;
        }
        
        // Cualquier otro caso, usar el objeto Date
        try {
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) {
                throw new Error(`Fecha inválida: ${fechaStr}`);
            }
            
            const anio = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            const hora = String(fecha.getHours()).padStart(2, '0');
            const minutos = String(fecha.getMinutes()).padStart(2, '0');
            const segundos = String(fecha.getSeconds()).padStart(2, '0');
            const milisegundos = String(fecha.getMilliseconds()).padStart(3, '0');
            
            return `${anio}-${mes}-${dia}T${hora}:${minutos}:${segundos}.${milisegundos}`;
        } catch (e) {
            console.error('Error al formatear fecha:', e);
            throw e;
        }
    };

    // Función para guardar solo la marca de entrada
    const handleGuardarEntrada = async () => {
        setErrorHora('');
        const horaEntrada = entradaManual.slice(11,16);
        const horaSalida = salidaManual.slice(11,16);
        if (horaEntrada >= horaSalida) {
            setErrorHora('La hora de entrada debe ser menor a la hora de salida.');
            return;
        }
        try {
            setGuardandoEntrada(true);
            
            // Verificar si tenemos el empleado ID
            if (!registroSeleccionado) {
                throw new Error('No se pudo identificar al empleado');
            }
            
            // Verificar todas las posibles propiedades que contengan el ID del empleado
            const empleadoId = registroSeleccionado.empleadoId || 
                              registroSeleccionado.idEmpleado || 
                              registroSeleccionado.idEmpleadoCalculado ||
                              registroSeleccionado.id || 
                              null;
                              
            if (!empleadoId) {
                // Si no hay ID empleado, intentar depurar qué hay en el objeto
                console.error('Propiedades disponibles en registroSeleccionado:', Object.keys(registroSeleccionado));
                throw new Error('No se encontró el ID del empleado en el registro seleccionado');
            }
            
            console.log('Usando empleadoId:', empleadoId);
            
            if (entradaManual) {
                // Formatear la fecha según requerido por el backend
                const fechaHoraEntrada = formatearFechaCompleta(entradaManual);
                console.log(`Registrando entrada manual: ${fechaHoraEntrada} para empleado ID: ${empleadoId}`);
                await marcarAsistencia(empleadoId, 'ENTRADA', fechaHoraEntrada);
            }
            
            // Refrescar datos después de guardar
            await fetchData();
            
            // Mostrar mensaje de éxito
            setError('');
        } catch (error) {
            console.error('Error al guardar marca de entrada:', error);
            setError('Error al guardar la marca de entrada: ' + error.message);
        } finally {
            setGuardandoEntrada(false);
        }
    };
    
    // Función para guardar solo la marca de salida
    const handleGuardarSalida = async () => {
        setErrorHora('');
        const horaEntrada = entradaManual.slice(11,16);
        const horaSalida = salidaManual.slice(11,16);
        if (horaEntrada >= horaSalida) {
            setErrorHora('La hora de entrada debe ser menor a la hora de salida.');
            return;
        }
        try {
            setGuardandoSalida(true);
            
            // Verificar si tenemos el empleado ID
            if (!registroSeleccionado) {
                throw new Error('No se pudo identificar al empleado');
            }
            
            // Verificar todas las posibles propiedades que contengan el ID del empleado
            const empleadoId = registroSeleccionado.empleadoId || 
                              registroSeleccionado.idEmpleado || 
                              registroSeleccionado.idEmpleadoCalculado ||
                              registroSeleccionado.id || 
                              null;
                              
            if (!empleadoId) {
                // Si no hay ID empleado, intentar depurar qué hay en el objeto
                console.error('Propiedades disponibles en registroSeleccionado:', Object.keys(registroSeleccionado));
                throw new Error('No se encontró el ID del empleado en el registro seleccionado');
            }
            
            console.log('Usando empleadoId:', empleadoId);
            
            if (salidaManual) {
                // Formatear la fecha según requerido por el backend
                const fechaHoraSalida = formatearFechaCompleta(salidaManual);
                console.log(`Registrando salida manual: ${fechaHoraSalida} para empleado ID: ${empleadoId}`);
                await marcarAsistencia(empleadoId, 'SALIDA', fechaHoraSalida);
            }
            
            // Refrescar datos después de guardar
            await fetchData();
            
            // Mostrar mensaje de éxito
            setError('');
        } catch (error) {
            console.error('Error al guardar marca de salida:', error);
            setError('Error al guardar la marca de salida: ' + error.message);
        } finally {
            setGuardandoSalida(false);
        }
    };
    
    // Función para guardar ambas marcas (mantener para compatibilidad)
    const handleGuardarMarcas = async () => {
        try {
            setGuardandoMarcas(true);
            
            // Ejecutar ambas funciones
            await handleGuardarEntrada();
            await handleGuardarSalida();
            
            // Cerrar modal después de guardar
            setShowModal(false);
        } catch (error) {
            console.error('Error al guardar marcas:', error);
            setError('Error al guardar las marcas: ' + error.message);
        } finally {
            setGuardandoMarcas(false);
        }
    };
    
    // Función para cerrar el modal
    const handleCloseModal = () => {
        setShowModal(false);
        setRegistroSeleccionado(null);
    };

    // Guardar la fecha del resumen seleccionada
    const fechaResumen = registroSeleccionado?.fecha || '';
    const fechaFormateada = fechaResumen.includes('/') ? `${fechaResumen.split('/')[2]}-${fechaResumen.split('/')[1].padStart(2, '0')}-${fechaResumen.split('/')[0].padStart(2, '0')}` : fechaResumen;

    const handleDescargarPDF = () => {
        if (registrosFiltrados.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            const doc = new jsPDF({ orientation: 'landscape' });
            const dataToExport = obtenerDatosParaReporte();

            doc.setFontSize(18);
            doc.text("Reporte de Asistencia", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

            doc.setFontSize(10);
            doc.text(`Filtros: Desde: ${dataToExport.filtros.fechaInicio} - Hasta: ${dataToExport.filtros.fechaFin} - ${dataToExport.filtros.rut}`, 14, 25);

            doc.setFontSize(12);
            doc.text("Resumen de Horas Extras", 14, 35);
            const resumenTableHeaders = [["Estado", "Minutos al 25%", "Minutos al 50%", "Total Horas Extras"]];
            const resumenTableBody = [
                ["Aprobadas", dataToExport.resumenTabla.aprobadas.minutos25, dataToExport.resumenTabla.aprobadas.minutos50, dataToExport.resumenTabla.aprobadas.total],
                ["Rechazadas", dataToExport.resumenTabla.rechazadas.minutos25, dataToExport.resumenTabla.rechazadas.minutos50, dataToExport.resumenTabla.rechazadas.total],
                ["Pendientes", dataToExport.resumenTabla.pendientes.minutos25, dataToExport.resumenTabla.pendientes.minutos50, dataToExport.resumenTabla.pendientes.total],
                [{ content: "Total General", styles: { fontStyle: 'bold' } },
                 { content: dataToExport.resumenTabla.totalGeneral.minutos25, styles: { fontStyle: 'bold' } },
                 { content: dataToExport.resumenTabla.totalGeneral.minutos50, styles: { fontStyle: 'bold' } },
                 { content: dataToExport.resumenTabla.totalGeneral.total, styles: { fontStyle: 'bold' } }]
            ];
            autoTable(doc, {
                startY: 40,
                head: resumenTableHeaders,
                body: resumenTableBody,
                theme: 'striped',
                headStyles: { fillColor: [22, 160, 133] },
                styles: { fontSize: 9 },
            });

            let finalYResumen = doc.lastAutoTable.finalY || 40;
            doc.setFontSize(12);
            doc.text("Detalle de Registros", 14, finalYResumen + 10);
            const registrosTableHeaders = [["RUT", "Nombre", "Fecha", "Entrada", "Salida", "H.E. 25%", "H.E. 50%", "Estado"]];
            const registrosTableBody = dataToExport.registros.map(r => [
                r.rut, r.nombre, r.fecha, r.entrada, r.salida, r.horasExtra25, r.horasExtra50, r.estado
            ]);
            autoTable(doc, {
                startY: finalYResumen + 15,
                head: registrosTableHeaders,
                body: registrosTableBody,
                theme: 'striped',
                headStyles: { fillColor: [22, 160, 133] },
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 25 },
                    7: { cellWidth: 30 },
                }
            });

            doc.save("reporte_asistencia.pdf");

        } catch (err) {
            console.error("Error al generar PDF:", err);
            setError("Error al generar PDF: " + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const obtenerDatosParaReporte = () => {
        let rutDisplay = "Todos";
        if (rut) {
            rutDisplay = `RUT: ${rut}`;
            const primerRegistro = registrosFiltrados && registrosFiltrados.length > 0 ? registrosFiltrados[0] : null;
            if (primerRegistro && primerRegistro.nombre) {
                rutDisplay += ` (${primerRegistro.nombre})`;
            }
        }

        return {
            resumenTabla: {
                aprobadas: {
                    minutos25: formatearTiempo(resumen.AUTORIZADO.minutos25),
                    minutos50: formatearTiempo(resumen.AUTORIZADO.minutos50),
                    total: formatearTiempo(resumen.AUTORIZADO.minutos25 + resumen.AUTORIZADO.minutos50)
                },
                rechazadas: {
                    minutos25: formatearTiempo(resumen.RECHAZADO.minutos25),
                    minutos50: formatearTiempo(resumen.RECHAZADO.minutos50),
                    total: formatearTiempo(resumen.RECHAZADO.minutos25 + resumen.RECHAZADO.minutos50)
                },
                pendientes: {
                    minutos25: formatearTiempo(resumen.PENDIENTE.minutos25),
                    minutos50: formatearTiempo(resumen.PENDIENTE.minutos50),
                    total: formatearTiempo(resumen.PENDIENTE.minutos25 + resumen.PENDIENTE.minutos50)
                },
                totalGeneral: {
                    minutos25: formatearTiempo(totalGeneral25),
                    minutos50: formatearTiempo(totalGeneral50),
                    total: formatearTiempo(totalGeneral25 + totalGeneral50)
                }
            },
            registros: registrosFiltrados.map(r => ({
                fecha: r.fecha,
                rut: r.rut || 'N/A',
                nombre: r.nombre || 'N/A',
                entrada: esFormatoHoraSimple(r.entrada) ? r.entrada : (r.entrada ? formatearHora(r.entrada) : 'N/A'),
                salida: esFormatoHoraSimple(r.salida) ? r.salida : (r.salida ? formatearHora(r.salida) : 'N/A'),
                horasExtra25: formatearTiempo(r.minutosExtra25),
                horasExtra50: formatearTiempo(r.minutosExtra50),
                estado: r.estado
            })),
            filtros: {
                fechaInicio: fechaInicio || "N/A",
                fechaFin: fechaFin || "N/A",
                rut: rutDisplay
            }
        };
    };

    const handleDescargarExcel = () => {
        if (registrosFiltrados.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            const dataToExport = obtenerDatosParaReporte();
            
            const wsResumen = XLSX.utils.json_to_sheet([
                { Seccion: "Resumen de Horas Extras" },
                { Estado: "Aprobadas", "Minutos al 25%": dataToExport.resumenTabla.aprobadas.minutos25, "Minutos al 50%": dataToExport.resumenTabla.aprobadas.minutos50, "Total Horas Extras": dataToExport.resumenTabla.aprobadas.total },
                { Estado: "Rechazadas", "Minutos al 25%": dataToExport.resumenTabla.rechazadas.minutos25, "Minutos al 50%": dataToExport.resumenTabla.rechazadas.minutos50, "Total Horas Extras": dataToExport.resumenTabla.rechazadas.total },
                { Estado: "Pendientes", "Minutos al 25%": dataToExport.resumenTabla.pendientes.minutos25, "Minutos al 50%": dataToExport.resumenTabla.pendientes.minutos50, "Total Horas Extras": dataToExport.resumenTabla.pendientes.total },
                { Estado: "Total General", "Minutos al 25%": dataToExport.resumenTabla.totalGeneral.minutos25, "Minutos al 50%": dataToExport.resumenTabla.totalGeneral.minutos50, "Total Horas Extras": dataToExport.resumenTabla.totalGeneral.total }
            ], { skipHeader: true });
            XLSX.utils.sheet_add_aoa(wsResumen, [
                ["Estado", "Minutos al 25%", "Minutos al 50%", "Total Horas Extras"]
            ], { origin: "A2" });

            const wsRegistros = XLSX.utils.json_to_sheet(dataToExport.registros.map(r => ({
                "RUT": r.rut,
                "Nombre": r.nombre,
                "Fecha": r.fecha,
                "Entrada": r.entrada,
                "Salida": r.salida,
                "H.E. 25%": r.horasExtra25,
                "H.E. 50%": r.horasExtra50,
                "Estado": r.estado
            })));

            // Hoja de información general (sin empresa)
            const wsInfo = XLSX.utils.aoa_to_sheet([
                ["Reporte de Asistencia"],
                [],
                ["Filtros Aplicados:"],
                ["Fecha Inicio:", dataToExport.filtros.fechaInicio],
                ["Fecha Fin:", dataToExport.filtros.fechaFin],
                [dataToExport.filtros.rut]
            ]);
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, wsInfo, "Información");
            XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Horas Extras");
            XLSX.utils.book_append_sheet(wb, wsRegistros, "Detalle Registros");

            XLSX.writeFile(wb, "reporte_asistencia.xlsx");

        } catch (err) {
            console.error("Error al generar Excel:", err);
            setError("Error al generar Excel: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-11">
                    <div className="card bg-white shadow-sm">
                        <div className="card-body p-4">
                            <h1 className="h4 mb-4 text-primary">Resumen de Asistencia</h1>

                            {/* Filtros */}
                            <form onSubmit={handleBuscar}>
                                <div className="row mb-4 g-3">
                                    <div className="col-md-3">
                                        <div className="form-floating">
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="fechaInicio"
                                                value={fechaInicio}
                                                onChange={e => setFechaInicio(e.target.value)}
                                                required
                                            />
                                            <label htmlFor="fechaInicio">Fecha inicio *</label>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-floating">
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="fechaFin"
                                                value={fechaFin}
                                                onChange={e => setFechaFin(e.target.value)}
                                            />
                                            <label htmlFor="fechaFin">Fecha fin</label>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="rut"
                                                value={rut}
                                                onChange={e => setRut(formatearRut(e.target.value))}
                                                placeholder="RUT empleado"
                                                maxLength="12"
                                            />
                                            <label htmlFor="rut">RUT empleado</label>
                                        </div>
                                    </div>
                                    <div className="col-md-3 d-flex align-items-center">
                                        <button type="submit" className="btn btn-primary w-100">
                                            Buscar
                                        </button>
                                    </div>
                                </div>
                            </form>

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
                            ) : data && data.length > 0 ? (
                                <div>
                                    {/* Información del empleado */}
                                    <div className="card mb-4 bg-light">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <h5 className="card-title">Empleado</h5>
                                                    <p className="card-text"><strong>Nombre:</strong> {data[0].nombre}</p>
                                                    <p className="card-text"><strong>RUT:</strong> {data[0].rut}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Tabla de asistencias */}
                                    <div className="table-responsive mb-4">
                                        <table className="table table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Entrada</th>
                                                    <th>Salida real</th>
                                                    <th>Salida esperada</th>
                                                    <th className="text-end">H.E. 25%</th>
                                                    <th className="text-end">H.E. 50%</th>
                                                    <th className="text-center">Estado</th>
                                                    <th>Observaciones</th>
                                                    <th className="text-center">Editar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((registro, index) => {
                                                    // Asegurar que el estado sea AUTORIZADO por defecto
                                                    registro.estado = registro.estado || 'AUTORIZADO';
                                                    
                                                    // Convertir minutos a formato horas:minutos
                                                    const horasExtra25 = registro.minutosExtra25 > 0 
                                                        ? `${String(Math.floor(registro.minutosExtra25 / 60)).padStart(2, '0')}:${String(registro.minutosExtra25 % 60).padStart(2, '0')}`
                                                        : '00:00';
                                                    
                                                    const horasExtra50 = registro.minutosExtra50 > 0 
                                                        ? `${String(Math.floor(registro.minutosExtra50 / 60)).padStart(2, '0')}:${String(registro.minutosExtra50 % 60).padStart(2, '0')}`
                                                        : '00:00';
                                                    
                                                    return (
                                                        <tr key={index}>
                                                            <td>
                                                                <span className="badge bg-light text-dark">
                                                                    {registro.fecha}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-success bg-opacity-10 text-success">
                                                                    {esFormatoHoraSimple(registro.entrada) ? registro.entrada : formatearHora(registro.entrada)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {registro.salida ? (
                                                                    <span className="badge bg-primary bg-opacity-10 text-primary">
                                                                        {esFormatoHoraSimple(registro.salida) ? registro.salida : formatearHora(registro.salida)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                                        Pendiente
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-info bg-opacity-10 text-info">
                                                                    {esFormatoHoraSimple(registro.salidaEsperada) ? registro.salidaEsperada : formatearHora(registro.salidaEsperada)}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                {horasExtra25}
                                                            </td>
                                                            <td className="text-end">
                                                                {horasExtra50}
                                                            </td>
                                                            <td className="text-center">
                                                                {savingState && registro.idAsistencia === savingStateId ? (
                                                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                                        <span className="visually-hidden">Guardando...</span>
                                                                    </div>
                                                                ) : (
                                                                    <select 
                                                                        className={`form-select form-select-sm w-auto mx-auto ${
                                                                            registro.estado === 'AUTORIZADO' 
                                                                                ? 'text-success border-success' 
                                                                                : registro.estado === 'RECHAZADO' 
                                                                                    ? 'text-danger border-danger' 
                                                                                    : 'text-warning border-warning'
                                                                        }`}
                                                                        value={registro.estado || 'AUTORIZADO'}
                                                                        onChange={(e) => handleEstadoChange(registro.idAsistencia, e.target.value)}
                                                                    >
                                                                        <option value="AUTORIZADO">AUTORIZADO</option>
                                                                        <option value="RECHAZADO">RECHAZADO</option>
                                                                        <option value="PENDIENTE">PENDIENTE</option>
                                                                    </select>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <small className="text-muted">
                                                                    {registro.observaciones || ''}
                                                                </small>
                                                            </td>
                                                            <td className="text-center">
                                                                <button 
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => handleOpenModal(registro)}
                                                                >
                                                                    <i className="bi bi-pencil-square"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Resumen de horas extras */}
                                    <div className="card mb-4">
                                        <div className="card-header bg-primary text-white">
                                            <h5 className="card-title text-center mb-3">Resumen de Horas Extras</h5>
                                        </div>
                                        <div className="table-responsive">
                                            <table className="table table-sm table-bordered table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th scope="col" className="text-center">Estado</th>
                                                        <th scope="col" className="text-center">Minutos al 25%</th>
                                                        <th scope="col" className="text-center">Minutos al 50%</th>
                                                        <th scope="col" className="text-center fw-bold">Total Horas Extras</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="table-group-divider">
                                                    <tr>
                                                        <td>Aprobadas</td>
                                                        <td className="text-center">{formatearTiempo(resumen.AUTORIZADO.minutos25)}</td>
                                                        <td className="text-center">{formatearTiempo(resumen.AUTORIZADO.minutos50)}</td>
                                                        <td className="text-center fw-bold">{formatearTiempo(resumen.AUTORIZADO.minutos25 + resumen.AUTORIZADO.minutos50)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Rechazadas</td>
                                                        <td className="text-center">{formatearTiempo(resumen.RECHAZADO.minutos25)}</td>
                                                        <td className="text-center">{formatearTiempo(resumen.RECHAZADO.minutos50)}</td>
                                                        <td className="text-center fw-bold">{formatearTiempo(resumen.RECHAZADO.minutos25 + resumen.RECHAZADO.minutos50)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Pendientes</td>
                                                        <td className="text-center">{formatearTiempo(resumen.PENDIENTE.minutos25)}</td>
                                                        <td className="text-center">{formatearTiempo(resumen.PENDIENTE.minutos50)}</td>
                                                        <td className="text-center fw-bold">{formatearTiempo(resumen.PENDIENTE.minutos25 + resumen.PENDIENTE.minutos50)}</td>
                                                    </tr>
                                                    <tr className="table-primary">
                                                        <td className="fw-bold">Total General</td>
                                                        <td className="text-center fw-bold">{formatearTiempo(totalGeneral25)}</td>
                                                        <td className="text-center fw-bold">{formatearTiempo(totalGeneral50)}</td>
                                                        <td className="text-center fw-bold">{formatearTiempo(totalGeneral25 + totalGeneral50)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    {/* Botones de exportación */}
                                    {registrosFiltrados && registrosFiltrados.length > 0 && (
                                        <div className="mt-3">
                                            <div className="row mb-2">
                                                <div className="col">
                                                    <button className="btn btn-success w-100" onClick={handleDescargarPDF} disabled={loading}>
                                                        <i className="bi bi-file-pdf me-2"></i> DESCARGAR PDF
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col">
                                                    <button className="btn btn-success w-100" onClick={handleDescargarExcel} disabled={loading}>
                                                        <i className="bi bi-file-excel me-2"></i> DESCARGAR EXCEL
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="alert alert-info text-center py-4">
                                    <i className="bi bi-info-circle me-2"></i>
                                    No hay registros para mostrar para los filtros seleccionados
                                    {fechaInicio && (
                                        <div className="mt-2 small text-muted">
                                            <strong>Filtros aplicados:</strong> {fechaInicio && `Desde: ${fechaInicio}`} {fechaFin && ` | Hasta: ${fechaFin}`} {rut && ` | RUT: ${rut}`}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para editar marcas */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Ingresar asistencia manualmente
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={handleCloseModal}
                                ></button>
                            </div>
                            <div className="text-center fw-bold text-primary mt-3 mb-2" style={{fontSize: '1.2rem'}}>
                                Edición manual{fechaResumen ? ` - ${fechaResumen}` : ''}
                            </div>
                            {errorHora && (
                                <div className="alert alert-danger text-center mx-5" role="alert">
                                    {errorHora}
                                </div>
                            )}
                            <div className="modal-body">
                                {/* Sección de marca de entrada */}
                                <div className="mb-3 border rounded p-2">
                                    <h6 className="mb-2">Marca de Entrada</h6>
                                    <div className="mb-1">
                                        <strong>Fecha:</strong> {fechaFormateada}
                                    </div>
                                    <div className="form-group mb-2">
                                        <label htmlFor="entradaManual">Hora de entrada:</label>
                                        <input
                                            type="time"
                                            id="entradaManual"
                                            className="form-control"
                                            value={entradaManual.slice(11,16)}
                                            onChange={e => setEntradaManual(fechaFormateada + 'T' + e.target.value)}
                                        />
                                    </div>
                                    <div className="d-flex justify-content-end mt-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-primary"
                                            onClick={handleGuardarEntrada}
                                            disabled={guardandoEntrada}
                                        >
                                            {guardandoEntrada ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Guardando...
                                                </>
                                            ) : 'Guardar Entrada'}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Sección de marca de salida */}
                                <div className="mb-3 border rounded p-2">
                                    <h6 className="mb-2">Marca de Salida</h6>
                                    <div className="mb-1">
                                        <strong>Fecha:</strong> {fechaFormateada}
                                    </div>
                                    <div className="form-group mb-2">
                                        <label htmlFor="salidaManual">Hora de salida:</label>
                                        <input
                                            type="time"
                                            id="salidaManual"
                                            className="form-control"
                                            value={salidaManual.slice(11,16)}
                                            onChange={e => setSalidaManual(fechaFormateada + 'T' + e.target.value)}
                                        />
                                    </div>
                                    <div className="d-flex justify-content-end mt-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-primary"
                                            onClick={handleGuardarSalida}
                                            disabled={guardandoSalida}
                                        >
                                            {guardandoSalida ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Guardando...
                                                </>
                                            ) : 'Guardar Salida'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
