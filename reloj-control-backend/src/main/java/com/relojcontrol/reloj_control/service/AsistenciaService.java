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
        
        // Agrupar por empleado
        Map<Long, List<Asistencia>> asistenciasPorEmpleado = asistencias.stream()
            .collect(Collectors.groupingBy(a -> a.getEmpleado().getIdEmpleado()));

        List<ResumenAsistenciaDTO> resumen = new ArrayList<>();
        
        asistenciasPorEmpleado.forEach((empleadoId, asistenciasEmpleado) -> {
            // Encontrar la primera entrada y última salida del día
            Asistencia entrada = asistenciasEmpleado.stream()
                .filter(a -> "ENTRADA".equals(a.getTipo()))
                .min((a, b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                .orElse(null);

            Asistencia salida = asistenciasEmpleado.stream()
                .filter(a -> "SALIDA".equals(a.getTipo()))
                .max((a, b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                .orElse(null);

            if (entrada != null) {
                ResumenAsistenciaDTO dto = new ResumenAsistenciaDTO();
                dto.setNombre(entrada.getEmpleado().getNombreCompleto());
                dto.setEntrada(entrada.getFechaHora().toLocalTime().toString());
                
                LocalTime horaSalidaEsperada = calcularSalidaEsperada(
                    entrada.getFechaHora().toLocalTime()
                );
                dto.setSalidaEsperada(horaSalidaEsperada.toString());

                if (salida != null) {
                    dto.setSalida(salida.getFechaHora().toLocalTime().toString());
                    
                    MinutosExtras extras = calcularMinutosExtra(
                        entrada.getFechaHora().toLocalTime(),
                        salida.getFechaHora().toLocalTime(),
                        horaSalidaEsperada,
                        dia
                    );
                    
                    dto.setMinutosExtra25((int) extras.extra25());
                    dto.setMinutosExtra50((int) extras.extra50());
                }

                resumen.add(dto);
            }
        });

        return resumen;
    }

    /**
     * Devuelve el resumen de asistencia de todos los empleados para un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime desde = fechaInicio.atStartOfDay();
        LocalDateTime hasta = fechaFin.plusDays(1).atStartOfDay();

        List<Asistencia> marcas = repo.findAllByFechaHoraBetween(desde, hasta);
        return procesarMarcasAsistencia(marcas, fechaInicio);
    }

    /**
     * Devuelve el resumen de asistencia de un empleado por RUT para un día específico
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRutYDia(String rut, LocalDate dia) {
        LocalDateTime desde = dia.atStartOfDay();
        LocalDateTime hasta = dia.plusDays(1).atStartOfDay();

        List<Asistencia> marcas = repo.findAllByEmpleadoRutAndFechaBetween(rut, desde, hasta);
        return procesarMarcasAsistencia(marcas, dia);
    }

    /**
     * Devuelve el resumen de asistencia de un empleado por RUT para un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorRutYRangoFechas(String rut, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime desde = fechaInicio.atStartOfDay();
        LocalDateTime hasta = fechaFin.plusDays(1).atStartOfDay();

        List<Asistencia> marcas = repo.findAllByEmpleadoRutAndFechaBetween(rut, desde, hasta);
        return procesarMarcasAsistencia(marcas, fechaInicio);
    }

    /**
     * Método privado para procesar las marcas y convertirlas en DTOs
     */
    private List<ResumenAsistenciaDTO> procesarMarcasAsistencia(List<Asistencia> marcas, LocalDate dia) {
        Map<Long, List<Asistencia>> agrupado = marcas.stream()
                .collect(Collectors.groupingBy(a -> a.getEmpleado().getIdEmpleado()));

        return agrupado.values().stream().map(lista -> {
            Asistencia ent = lista.stream()
                    .filter(a -> "ENTRADA".equals(a.getTipo()))
                    .min((a,b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                    .orElseThrow();
            Asistencia sal = lista.stream()
                    .filter(a -> "SALIDA".equals(a.getTipo()) &&
                            a.getFechaHora().isAfter(ent.getFechaHora()))
                    .max((a,b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                    .orElse(null);

            LocalTime horaEnt = ent.getFechaHora().toLocalTime();
            LocalTime horaSalReal = sal != null
                    ? sal.getFechaHora().toLocalTime()
                    : null;

            LocalTime horaSalEsp = calcularSalidaEsperada(horaEnt);
            
            MinutosExtras extras = calcularMinutosExtra(horaEnt, horaSalReal, horaSalEsp, dia);

            ResumenAsistenciaDTO dto = new ResumenAsistenciaDTO();
            dto.setNombre(ent.getEmpleado().getNombreCompleto());
            dto.setEntrada(horaEnt.toString());
            dto.setSalida(horaSalReal != null ? horaSalReal.toString() : null);
            dto.setSalidaEsperada(horaSalEsp.toString());
            dto.setMinutosExtra25(extras.extra25());
            dto.setMinutosExtra50(extras.extra50());

            return dto;
        }).collect(Collectors.toList());
    }
}
