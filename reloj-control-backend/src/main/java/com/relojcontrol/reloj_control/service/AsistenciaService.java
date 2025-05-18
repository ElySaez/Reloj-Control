package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Set;

/**
 * Servicio para gestionar las asistencias de los empleados.
 * Maneja la lógica de negocio relacionada con el control de asistencia,
 * incluyendo el cálculo de horas extras y la generación de resúmenes.
 */
@Service
public class AsistenciaService implements IAsistenciaService {

    // Constantes para los horarios estándar
    private static final LocalTime HORA_ENTRADA_NORMAL = LocalTime.of(8, 0);
    private static final LocalTime HORA_SALIDA_NORMAL = LocalTime.of(18, 0);
    private static final LocalTime INICIO_HORARIO_50 = LocalTime.of(21, 0);
    private static final LocalTime FIN_HORARIO_50 = LocalTime.of(6, 0);

    private final AsistenciaRepository repo;
    private final ParametroSistemaService paramSvc;
    private final FeriadoService feriadoSvc;

    public AsistenciaService(AsistenciaRepository repo,
                           ParametroSistemaService paramSvc,
                           FeriadoService feriadoSvc) {
        this.repo = repo;
        this.paramSvc = paramSvc;
        this.feriadoSvc = feriadoSvc;
    }

    /**
     * Obtiene el valor de un parámetro del sistema como entero.
     * 
     * @param clave Clave del parámetro
     * @return Valor del parámetro convertido a entero
     */
    private int getIntParam(String clave) {
        return Integer.parseInt(paramSvc.getValor(clave));
    }

    /**
     * Calcula la hora de salida esperada para una hora de entrada dada.
     * Considera las horas semanales configuradas y la tolerancia permitida.
     * 
     * @param horaEntrada Hora de entrada del empleado
     * @return Hora de salida esperada
     */
    @Override
    public LocalTime calcularSalidaEsperada(LocalTime horaEntrada) {
        int horasSemanales = getIntParam("horas_semanales");   // 44 horas por semana
        int minutosTol = getIntParam("minutos_tolerancia");    // Tolerancia en minutos

        // Si es fin de semana o feriado, no hay horario esperado
        LocalDate fecha = LocalDate.now();
        if (feriadoSvc.esFinDeSemanaOFeriado(fecha)) {
            return horaEntrada;
        }

        // Cálculo de minutos de jornada diaria
        int minutosJornada = horasSemanales * 60 / 5;  // 5 días laborales

        // Normalizar hora de entrada (no antes de las 8:00)
        LocalTime entradaNormalizada = horaEntrada.isBefore(HORA_ENTRADA_NORMAL) 
            ? HORA_ENTRADA_NORMAL 
            : horaEntrada;

        return entradaNormalizada
                .plusMinutes(minutosJornada)
                .plusMinutes(minutosTol);
    }

    /**
     * Registro interno para almacenar los minutos extras calculados.
     */
    private record MinutosExtras(long extra25, long extra50) {}

    /**
     * Calcula los minutos extras trabajados, diferenciando entre 25% y 50%.
     * 
     * @param entrada Hora de entrada
     * @param salida Hora de salida
     * @param salidaEsperada Hora de salida esperada
     * @param fecha Fecha del registro
     * @return Registro con los minutos extras al 25% y 50%
     */
    private MinutosExtras calcularMinutosExtra(LocalTime entrada, LocalTime salida, 
                                             LocalTime salidaEsperada, LocalDate fecha) {
        if (salida == null) return new MinutosExtras(0, 0);

        // En feriados o fines de semana, todo es extra al 50%
        if (feriadoSvc.esFinDeSemanaOFeriado(fecha)) {
            long totalMinutos = Duration.between(entrada, salida).toMinutes();
            return new MinutosExtras(0, Math.max(0, totalMinutos));
        }

        // Para días normales
        if (salida.isBefore(salidaEsperada)) {
            return new MinutosExtras(0, 0);
        }

        long totalMinutosExtra = Duration.between(salidaEsperada, salida).toMinutes();
        
        // Después de las 21:00 o antes de las 6:00 es 50%
        if (salida.isAfter(INICIO_HORARIO_50) || salida.isBefore(FIN_HORARIO_50)) {
            return new MinutosExtras(0, Math.max(0, totalMinutosExtra));
        } else {
            return new MinutosExtras(Math.max(0, totalMinutosExtra), 0);
        }
    }

    /**
     * Genera el resumen de asistencia para un día específico.
     * 
     * @param dia Fecha para la cual se quiere el resumen
     * @return Lista de resúmenes de asistencia
     */
    @Override
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorDia(LocalDate dia) {
        List<Asistencia> asistencias = repo.findAllByFecha(dia);
        return procesarMarcasAsistencia(asistencias, null);
    }

    /**
     * Devuelve el resumen de asistencia de todos los empleados para un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime desde = fechaInicio.atStartOfDay();
        LocalDateTime hasta = fechaFin.plusDays(1).atStartOfDay();

        List<Asistencia> marcas = repo.findAllByFechaHoraBetween(desde, hasta);
        return procesarMarcasAsistencia(marcas, null);
    }

    /**
     * Devuelve el resumen de asistencia de un empleado por RUT para un día específico
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRutYDia(String rut, LocalDate dia) {
        LocalDateTime desde = dia.atStartOfDay();
        LocalDateTime hasta = dia.plusDays(1).atStartOfDay();

        List<Asistencia> marcas = repo.findAllByEmpleadoRutAndFechaBetween(rut, desde, hasta);
        return procesarMarcasAsistencia(marcas, null);
    }

    /**
     * Devuelve el resumen de asistencia de un empleado por RUT para un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRutYRangoFechas(String rut, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime desde = fechaInicio.atStartOfDay();
        LocalDateTime hasta = fechaFin.plusDays(1).atStartOfDay();

        List<Asistencia> marcas = repo.findAllByEmpleadoRutAndFechaBetween(rut, desde, hasta);
        return procesarMarcasAsistencia(marcas, null);
    }

    /**
     * Devuelve el resumen de asistencia filtrando por RUT parcial para un rango de fechas (búsqueda flexible)
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRutParcialFlexibleYRangoFechas(String rutParcial, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime desde = fechaInicio.atStartOfDay();
        LocalDateTime hasta = fechaFin.plusDays(1).atStartOfDay();

        // Logs para depuración
        System.out.println("Buscando asistencias con RUT parcial (flexible): " + rutParcial);
        System.out.println("Fechas: " + desde + " a " + hasta);
        
        List<Asistencia> marcas = repo.findAllByRutParcialFlexibleAndFechaBetween(rutParcial, desde, hasta);
        
        System.out.println("Marcas encontradas (búsqueda flexible): " + marcas.size());
        if (!marcas.isEmpty()) {
            System.out.println("Primera marca (flexible) - Empleado: " + marcas.get(0).getEmpleado().getNombreCompleto() + 
                              ", RUT: " + marcas.get(0).getEmpleado().getRut());
        }
        
        return procesarMarcasAsistencia(marcas, null);
    }

    /**
     * Método privado para procesar las marcas y convertirlas en DTOs
     */
    private List<ResumenAsistenciaDTO> procesarMarcasAsistencia(List<Asistencia> marcas, LocalDate unused) {
        if (marcas == null || marcas.isEmpty()) {
            return new ArrayList<>();
        }
        
        Map<Long, Map<LocalDate, List<Asistencia>>> agrupadoPorFecha = marcas.stream()
                .collect(Collectors.groupingBy(
                    a -> a.getEmpleado().getIdEmpleado(),
                    Collectors.groupingBy(a -> a.getFechaHora().toLocalDate())
                ));

        List<ResumenAsistenciaDTO> resumen = new ArrayList<>();
        
        agrupadoPorFecha.forEach((empleadoId, marcasPorFecha) -> {
            marcasPorFecha.forEach((fecha, marcasDelDia) -> {
                try {
                    // Obtener todas las entradas y salidas para esta fecha
                    List<Asistencia> entradasDelDia = marcasDelDia.stream()
                            .filter(a -> "ENTRADA".equals(a.getTipo()))
                            .sorted((a, b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                            .collect(Collectors.toList());
                            
                    List<Asistencia> salidasDelDia = marcasDelDia.stream()
                            .filter(a -> "SALIDA".equals(a.getTipo()))
                            .sorted((a, b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                            .collect(Collectors.toList());
                    
                    // Si no hay entradas ni salidas, no procesamos este día
                    if (entradasDelDia.isEmpty() && salidasDelDia.isEmpty()) {
                        return;
                    }
                    
                    // Verificar si es un día especial (feriado o fin de semana)
                    boolean esDiaEspecial = feriadoSvc.esFinDeSemanaOFeriado(fecha);
                    
                    // Convertir la fecha a formato más legible
                    String fechaFormateada = fecha.getDayOfMonth() + "/" + 
                                           fecha.getMonthValue() + "/" + 
                                           fecha.getYear();
                    
                    // Si hay más entradas que salidas o viceversa, necesitamos procesar cada marca individualmente
                    int maxMarcas = Math.max(entradasDelDia.size(), salidasDelDia.size());
                    
                    // Para cada par potencial de entrada/salida
                    if (maxMarcas == 0) {
                        // Caso especial: si solo hay un tipo de marca (todas entradas o todas salidas)
                        if (!entradasDelDia.isEmpty()) {
                            // Solo hay entradas
                            for (Asistencia entrada : entradasDelDia) {
                                createResumenForMarcas(fecha, fechaFormateada, esDiaEspecial, entrada, null, resumen);
                            }
                        } else {
                            // Solo hay salidas
                            for (Asistencia salida : salidasDelDia) {
                                createResumenForMarcas(fecha, fechaFormateada, esDiaEspecial, null, salida, resumen);
                            }
                        }
                    } else {
                        // Procesamos cada par de entrada/salida o marcas individuales
                        for (int i = 0; i < maxMarcas; i++) {
                            Asistencia entrada = i < entradasDelDia.size() ? entradasDelDia.get(i) : null;
                            Asistencia salida = null;
                            
                            // Buscar la salida correspondiente (posterior a esta entrada)
                            if (entrada != null) {
                                for (Asistencia potencialSalida : salidasDelDia) {
                                    if (potencialSalida.getFechaHora().isAfter(entrada.getFechaHora())) {
                                        salida = potencialSalida;
                                        // Remover esta salida para no usarla nuevamente
                                        salidasDelDia.remove(potencialSalida);
                                        break;
                                    }
                                }
                            } else if (i < salidasDelDia.size()) {
                                // No hay entrada correspondiente, pero hay una salida
                                salida = salidasDelDia.get(i);
                            }
                            
                            // Crear el DTO para este par o marca individual
                            if (entrada != null || salida != null) {
                                createResumenForMarcas(fecha, fechaFormateada, esDiaEspecial, entrada, salida, resumen);
                            }
                        }
                    }
                } catch (Exception e) {
                    // Registrar el error pero continuar con otros días/empleados
                    System.err.println("Error procesando marcas: " + e.getMessage());
                    e.printStackTrace();
                }
            });
        });

        return resumen;
    }
    
    /**
     * Método auxiliar para crear un DTO de resumen para un par de marcas o marcas individuales
     */
    private void createResumenForMarcas(LocalDate fecha, String fechaFormateada, boolean esDiaEspecial, 
                                       Asistencia entrada, Asistencia salida, List<ResumenAsistenciaDTO> resumen) {
        
        LocalTime horaEnt = entrada != null ? entrada.getFechaHora().toLocalTime() : null;
        LocalTime horaSalReal = salida != null ? salida.getFechaHora().toLocalTime() : null;
        
        // Calcular salida esperada solo si hay entrada
        LocalTime horaSalEsp = horaEnt != null ? calcularSalidaEsperada(horaEnt) : null;
        
        // Calcular extras solo si hay entrada y salida
        MinutosExtras extras = new MinutosExtras(0, 0);
        if (horaEnt != null && horaSalReal != null) {
            extras = calcularMinutosExtra(horaEnt, horaSalReal, horaSalEsp, fecha);
        }
        
        ResumenAsistenciaDTO dto = new ResumenAsistenciaDTO();
        
        // Asignar el ID de la asistencia de entrada o salida, priorizando la de salida para edición de estado
        if (salida != null) {
            dto.setIdAsistencia(salida.getId());
            dto.setEstado(salida.getEstado());
        } else if (entrada != null) {
            dto.setIdAsistencia(entrada.getId());
            dto.setEstado(entrada.getEstado());
        }
        
        dto.setFecha(fechaFormateada); // Fecha formateada DD/MM/YYYY
        
        // Usar empleado de la entrada o salida, el que esté disponible
        if (entrada != null) {
            dto.setNombre(entrada.getEmpleado().getNombreCompleto());
            dto.setRut(entrada.getEmpleado().getRut());
        } else if (salida != null) {
            dto.setNombre(salida.getEmpleado().getNombreCompleto());
            dto.setRut(salida.getEmpleado().getRut());
        }
        
        // Establecer horas de entrada y salida
        dto.setEntrada(horaEnt != null ? horaEnt.toString() : null);
        dto.setSalida(horaSalReal != null ? horaSalReal.toString() : null);
        dto.setSalidaEsperada(horaSalEsp != null ? horaSalEsp.toString() : null);
        
        dto.setMinutosExtra25((int) extras.extra25());
        dto.setMinutosExtra50((int) extras.extra50());
        
        // Establecer si es día especial
        dto.setEsDiaEspecial(esDiaEspecial);
        
        // Agregar observaciones según las condiciones
        StringBuilder observaciones = new StringBuilder();
        
        if (esDiaEspecial) {
            observaciones.append("Día no laborable. ");
            
            if (extras.extra50() > 0) {
                observaciones.append("Horas extras calculadas al 50%. ");
            }
        }
        
        if (entrada == null) {
            observaciones.append("Falta marca de entrada. ");
        }
        
        if (salida == null) {
            observaciones.append("Falta marca de salida. ");
        }
        
        // Verificar inconsistencias entre entrada y salida
        if (horaEnt != null && horaSalReal != null && horaSalReal.isBefore(horaEnt)) {
            observaciones.append("Inconsistencia: Salida anterior a entrada. ");
        }
        
        dto.setObservaciones(observaciones.toString().trim());
        
        resumen.add(dto);
    }
    
    /**
     * Devuelve el resumen de asistencia filtrando por RUT parcial para un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRutParcialYRangoFechas(String rutParcial, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime desde = fechaInicio.atStartOfDay();
        LocalDateTime hasta = fechaFin.plusDays(1).atStartOfDay();

        // Logs para depuración
        System.out.println("==================== INICIO DEPURACIÓN ====================");
        System.out.println("Buscando asistencias con RUT parcial: " + rutParcial);
        System.out.println("Fechas: " + desde + " a " + hasta);
        System.out.println("Formato de fecha: " + fechaInicio + " a " + fechaFin);
        
        // Verificar si el RUT existe
        List<Asistencia> todasMarcas = repo.findAll();
        Set<String> rutDisponibles = todasMarcas.stream()
            .map(a -> a.getEmpleado().getRut())
            .collect(Collectors.toSet());
        System.out.println("RUTs disponibles en la base de datos: " + rutDisponibles);
        
        // Verificar fechas disponibles
        Set<LocalDate> fechasDisponibles = todasMarcas.stream()
            .map(a -> a.getFechaHora().toLocalDate())
            .collect(Collectors.toSet());
        System.out.println("Fechas disponibles en la base de datos: " + fechasDisponibles);
        
        List<Asistencia> marcas = repo.findAllByRutParcialAndFechaBetween(rutParcial, desde, hasta);
        
        System.out.println("Marcas encontradas: " + marcas.size());
        if (!marcas.isEmpty()) {
            System.out.println("Primera marca - Empleado: " + marcas.get(0).getEmpleado().getNombreCompleto() + 
                              ", RUT: " + marcas.get(0).getEmpleado().getRut());
        } else {
            System.out.println("No se encontraron marcas para RUT: " + rutParcial + " en fechas " + desde + " a " + hasta);
        }
        System.out.println("==================== FIN DEPURACIÓN ====================");
        
        return procesarMarcasAsistencia(marcas, null);
    }

    /**
     * Devuelve el resumen de asistencia de todos los empleados para un mes y año específicos
     * 
     * @param mes Mes (1-12)
     * @param año Año (ej: 2025)
     * @return Lista de resúmenes de asistencia del mes
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorMesYAño(int mes, int año) {
        // Validar mes
        if (mes < 1 || mes > 12) {
            throw new IllegalArgumentException("El mes debe estar entre 1 y 12");
        }
        
        // Calcular primer y último día del mes
        LocalDate primerDiaMes = LocalDate.of(año, mes, 1);
        LocalDate ultimoDiaMes = primerDiaMes.plusMonths(1).minusDays(1);
        
        // Usar el método existente de rango de fechas
        return resumenPorRangoFechas(primerDiaMes, ultimoDiaMes);
    }
    
    /**
     * Devuelve el resumen de asistencia de un empleado por RUT para un mes y año específicos
     * 
     * @param rut RUT del empleado (completo o parcial)
     * @param mes Mes (1-12)
     * @param año Año (ej: 2025)
     * @return Lista de resúmenes de asistencia del mes para el empleado
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRutMesYAño(String rut, int mes, int año) {
        // Validar mes
        if (mes < 1 || mes > 12) {
            throw new IllegalArgumentException("El mes debe estar entre 1 y 12");
        }
        
        // Calcular primer y último día del mes
        LocalDate primerDiaMes = LocalDate.of(año, mes, 1);
        LocalDate ultimoDiaMes = primerDiaMes.plusMonths(1).minusDays(1);
        
        // Usar métodos existentes según formato de RUT
        if (rut != null && !rut.isEmpty()) {
            if (rut.contains("-")) {
                // RUT completo
                return resumenPorRutYRangoFechas(rut, primerDiaMes, ultimoDiaMes);
            } else {
                // RUT parcial, intentar búsqueda exacta primero
                List<ResumenAsistenciaDTO> resumen = resumenPorRutParcialYRangoFechas(rut, primerDiaMes, ultimoDiaMes);
                
                // Si no hay resultados, intentar búsqueda flexible
                if (resumen.isEmpty()) {
                    return resumenPorRutParcialFlexibleYRangoFechas(rut, primerDiaMes, ultimoDiaMes);
                }
                
                return resumen;
            }
        } else {
            // Sin RUT, devolver todo el mes
            return resumenPorRangoFechas(primerDiaMes, ultimoDiaMes);
        }
    }

    /**
     * Actualiza el estado de una asistencia.
     * 
     * @param id ID de la asistencia
     * @param estado Nuevo estado (AUTORIZADO, RECHAZADO, PENDIENTE)
     * @return true si se actualizó correctamente, false si no se encontró la asistencia
     */
    @Transactional
    public boolean actualizarEstado(Long id, String estado) {
        Asistencia asistencia = repo.findById(id).orElse(null);
        
        if (asistencia == null) {
            return false;
        }
        
        // Actualizar el estado
        asistencia.setEstado(estado);
        repo.save(asistencia);
        
        return true;
    }
}
