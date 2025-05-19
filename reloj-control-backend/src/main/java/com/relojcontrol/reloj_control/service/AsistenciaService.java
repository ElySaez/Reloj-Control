package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private final EmpleadoRepository empleadoRepository;

    public AsistenciaService(AsistenciaRepository repo,
                             ParametroSistemaService paramSvc,
                             FeriadoService feriadoSvc,
                             EmpleadoRepository empleadoRepository) {
        this.repo = repo;
        this.paramSvc = paramSvc;
        this.feriadoSvc = feriadoSvc;
        this.empleadoRepository = empleadoRepository;
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
     * @param entrada Hora de entrada del empleado
     * @return Hora de salida esperada
     */
    @Override
    public LocalTime calcularSalidaEsperada(LocalDateTime entrada) {
        int horasSemanales = getIntParam("horas_semanales");   // 44 horas por semana
        int minutosTol = getIntParam("minutos_tolerancia");    // Tolerancia en minutos

        // Si es fin de semana o feriado, no hay horario esperado
        LocalDate fecha = entrada.toLocalDate();
        LocalTime horaEntrada = entrada.toLocalTime();
        if (feriadoSvc.esFinDeSemanaOFeriado(fecha)) {
            return horaEntrada;
        }

        // Cálculo de minutos de jornada diaria
        int minutosJornada = horasSemanales * 60 / 5;  // 5 días laborales

        horaEntrada = horaEntrada.isBefore(LocalTime.of(8, 0)) ? LocalTime.of(8, 0) : horaEntrada;
        return horaEntrada
                .plusMinutes(minutosJornada)
                .plusMinutes(minutosTol);
    }

    @Override
    public Asistencia crearAsistencia(String empleadoId, String tipo, LocalDateTime fecha, boolean esOficial) {
        Empleado emp = empleadoRepository.findByRut(empleadoId)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
        if(repo.existsAsistenciaOficialEnFecha(emp.getIdEmpleado(), fecha.toLocalDate(), tipo)){
            repo.findAsistenciaOficialEnFecha(emp.getIdEmpleado(), fecha.toLocalDate(), tipo)
                    .ifPresent(marca -> {
                        marca.setEsOficial(false);
                        repo.save(marca);
                    });
        }
        Asistencia asistencia = new Asistencia(emp, fecha, tipo, esOficial);

        return repo.save(asistencia);
    }

    /**
     * Registro interno para almacenar los minutos extras calculados.
     */
    private record MinutosExtras(long extra25, long extra50) {
    }

    /**
     * Calcula los minutos extras trabajados, diferenciando entre 25% y 50%.
     *
     * @param entrada        Hora de entrada
     * @param salida         Hora de salida
     * @param salidaEsperada Hora de salida esperada
     * @param fecha          Fecha del registro
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
    @Transactional(readOnly = false)
    public List<ResumenAsistenciaDTO> resumenPorDia(LocalDate dia) {
        List<Asistencia> asistencias = repo.findAllByFecha(dia);
        return procesarMarcasAsistencia(asistencias);
    }

    /**
     * Devuelve el resumen de asistencia de un empleado por RUT para un día específico
     */
    @Transactional(readOnly = false)
    public List<ResumenAsistenciaDTO> resumenPorRutYDia(String rut, LocalDate dia) {
        LocalDateTime desde = dia.atStartOfDay();
        LocalDateTime hasta = dia.plusDays(1).atStartOfDay();

        List<Asistencia> marcas = repo.findAllByEmpleadoRutAndFechaBetween(rut, desde, hasta);
        return procesarMarcasAsistencia(marcas);
    }

    /**
     * Devuelve el resumen de asistencia de un empleado por RUT para un rango de fechas
     */
    @Transactional(readOnly = false)
    public List<ResumenAsistenciaDTO> resumenPorRutYRangoFechas(String rut, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime desde = fechaInicio.atStartOfDay();
        LocalDateTime hasta = fechaFin.plusDays(1).atStartOfDay();

        List<Asistencia> marcas = repo.findAllByEmpleadoRutAndFechaBetween(rut, desde, hasta);
        return procesarMarcasAsistencia(marcas);
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

        return procesarMarcasAsistencia(marcas);
    }

    /**
     * Método privado para procesar las marcas y convertirlas en DTOs
     */
    private List<ResumenAsistenciaDTO> procesarMarcasAsistencia(List<Asistencia> marcas) {
        if (marcas == null || marcas.isEmpty()) {
            return new ArrayList<>();
        }

        // Agrupar por empleado y fecha para asegurar que no se mezclen datos de diferentes empleados
        Map<Long, Map<LocalDate, List<Asistencia>>> agrupadoPorEmpleado = marcas.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getEmpleado().getIdEmpleado(),
                        Collectors.groupingBy(a -> a.getFechaHora().toLocalDate())
                ));

        List<ResumenAsistenciaDTO> resumen = new ArrayList<>();

        agrupadoPorEmpleado.forEach((empleadoId, marcasPorFecha) -> {
            // Para cada empleado, procesar sus marcas por fecha
            marcasPorFecha.forEach((fecha, marcasDelDia) -> {
                try {
                    // Verificar si hay al menos una marca válida para este empleado
                    if (marcasDelDia.isEmpty()) {
                        return;
                    }

                    // Obtener datos del empleado (usando la primera marca como referencia)
                    String nombreEmpleado = marcasDelDia.get(0).getEmpleado().getNombreCompleto();
                    String rutEmpleado = marcasDelDia.get(0).getEmpleado().getRut();
                    Long idEmpleado = marcasDelDia.get(0).getEmpleado().getIdEmpleado();
                    Asistencia entrada = null;
                    Asistencia salida = null;
                    if(repo.existsAsistenciaOficialEnFecha(idEmpleado, fecha,"ENTRADA")){
                        entrada = repo.findAsistenciaOficialEnFecha(idEmpleado, fecha, "ENTRADA").get();
                    } else {
                        List<Asistencia> entradas = marcasDelDia.stream()
                                .filter(a -> "ENTRADA".equals(a.getTipo()))
                                .sorted((a, b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                                .toList();
                        entrada = getAsistenciaFromList(entradas);
                    }

                    if(repo.existsAsistenciaOficialEnFecha(idEmpleado, fecha,"SALIDA")){
                        salida = repo.findAsistenciaOficialEnFecha(idEmpleado, fecha, "SALIDA").get();
                    } else {
                        List<Asistencia> entradas = marcasDelDia.stream()
                                .filter(a -> "SALIDA".equals(a.getTipo()))
                                .sorted((a, b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                                .toList();
                        salida = getAsistenciaFromList(entradas);
                    }


                    // Verificar si es un día especial (feriado o fin de semana)
                    boolean esDiaEspecial = feriadoSvc.esFinDeSemanaOFeriado(fecha);

                    // Convertir la fecha a formato más legible
                    String fechaFormateada = fecha.getDayOfMonth() + "/" +
                            fecha.getMonthValue() + "/" +
                            fecha.getYear();

                    createResumenForMarcas(fecha, fechaFormateada, esDiaEspecial, entrada, salida, resumen);

                } catch (Exception e) {
                    System.err.println("Error al procesar marcas para la fecha " + fecha + ": " + e.getMessage());
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
        LocalTime horaSalEsp = horaEnt != null ? calcularSalidaEsperada(entrada.getFechaHora()) : null;

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
        dto.setEntrada(horaEnt != null ? getFormattedTimeDateString(horaEnt) : null);
        dto.setSalida(horaSalReal != null ? getFormattedTimeDateString(horaSalReal) : null);
        dto.setSalidaEsperada(horaSalEsp != null ? getFormattedTimeDateString(horaSalEsp) : null);

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
    @Transactional(readOnly = false)
    public List<ResumenAsistenciaDTO> resumenPorRutParcialYRangoFechas(String rutParcial, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime desde = fechaInicio.atStartOfDay();
        LocalDateTime hasta = fechaFin.plusDays(1).atStartOfDay();

        // Logs para depuración
        System.out.println("==================== INICIO DEPURACIÓN ====================");
        System.out.println("Buscando asistencias con RUT parcial: " + rutParcial);
        System.out.println("Fechas: " + desde + " a " + hasta);

        // Verificar si el RUT existe
        List<Empleado> empleados = repo.findAll().stream()
                .map(Asistencia::getEmpleado)
                .distinct()
                .filter(e -> e.getRut().startsWith(rutParcial))
                .collect(Collectors.toList());

        System.out.println("Empleados encontrados con RUT que comienza con " + rutParcial + ": " +
                empleados.stream().map(e -> e.getNombreCompleto() + " (" + e.getRut() + ")").collect(Collectors.joining(", ")));

        // Buscar marcas con el repositorio
        List<Asistencia> marcas = repo.findAllByRutParcialAndFechaBetween(rutParcial, desde, hasta);

        System.out.println("Marcas encontradas con repositorio: " + marcas.size());
        if (!marcas.isEmpty()) {
            System.out.println("Primera marca - Empleado: " + marcas.get(0).getEmpleado().getNombreCompleto() +
                    ", RUT: " + marcas.get(0).getEmpleado().getRut());
        }

        System.out.println("==================== FIN DEPURACIÓN ====================");

        return procesarMarcasAsistencia(marcas);
    }

    /**
     * Actualiza el estado de una asistencia.
     *
     * @param id     ID de la asistencia
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

    /**
     * Actualiza el campo es oficial de una asistencia.
     *
     * @param id     ID de la asistencia
     * @param esOficial
     * @return true si se actualizó correctamente, false si no se encontró la asistencia
     */
    @Transactional
    public Asistencia actualizarEsOficialDeUnaAsistencia(Long id, Boolean esOficial) {
        Optional<Asistencia> asistenciaOpt = repo.findById(id);

        if(asistenciaOpt.isEmpty()){
            return null;
        }
        Asistencia asistencia = asistenciaOpt.get();
        asistencia.setEsOficial(esOficial);
        return repo.save(asistencia);
    }

    private String getFormattedTimeDateString(LocalTime hora){
        if(hora.getSecond() == 0){
            return hora.toString() + ":00";
        }
        return hora.toString();
    }

    private Asistencia getAsistenciaFromList(List<Asistencia> asistencias){
        if (asistencias.isEmpty()){
            return null;
        }
        Asistencia asistencia = asistencias.get(0);

        return actualizarEsOficialDeUnaAsistencia(asistencia.getId(), true);
    }
}
