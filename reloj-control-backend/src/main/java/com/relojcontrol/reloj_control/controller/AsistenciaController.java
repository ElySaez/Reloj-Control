package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.dto.EmpleadoAtrasosDTO;
import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import com.relojcontrol.reloj_control.repository.UsuarioRepository;
import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import com.relojcontrol.reloj_control.service.AsistenciaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controlador para gestionar las asistencias de los empleados.
 * Proporciona endpoints para marcar entradas/salidas y obtener resúmenes de asistencia.
 */
@RestController
@RequestMapping("/api/asistencias")
@CrossOrigin(origins = "*")
@Tag(name = "Asistencias", description = "API para gestión de asistencias")
public class AsistenciaController {
    private static final Logger logger = LoggerFactory.getLogger(AsistenciaController.class);

    private final AsistenciaRepository asRepo;
    private final EmpleadoRepository eRepo;
    private final AsistenciaService asistenciaService;
    private final UsuarioRepository uRepo;

    public AsistenciaController(AsistenciaRepository asRepo,
                                EmpleadoRepository eRepo,
                                AsistenciaService asistenciaService,
                                UsuarioRepository uRepo) {
        this.asRepo = asRepo;
        this.eRepo = eRepo;
        this.asistenciaService = asistenciaService;
        this.uRepo = uRepo;
    }

    /**
     * Registra una marca de entrada o salida para un empleado.
     *
     * @param empleadoId ID del empleado
     * @param tipo       Tipo de marca ("ENTRADA" o "SALIDA")
     * @return La asistencia registrada
     */
    @Operation(summary = "Registrar marca de asistencia",
            description = "Registra una marca de entrada o salida para un empleado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Marca registrada exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Empleado no encontrado")
    })
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    @PostMapping
    public ResponseEntity<?> marcar(
            @Parameter(description = "ID del empleado") @RequestParam String empleadoId,
            @Parameter(description = "Tipo de marca (ENTRADA o SALIDA)") @RequestParam String tipo,
            @Parameter(description = "Hora de marca") @RequestParam String fecha) {
        try {
            Asistencia asistencia = asistenciaService.crearAsistencia(empleadoId, tipo, LocalDateTime.parse(fecha), true);
            return ResponseEntity.ok(asistencia);
        } catch (Exception e) {
            logger.error("Error al marcar asistencia", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Obtener listado de empleados cuyo ingreso es despues de un horario
     *
     * @return Lista de asistencias del empleado
     */
    @Operation(summary = "Obtener listado de empleados cuyo ingreso es despues de un horario",
            description = "Obtiene todas los empleados cuyo ingreso es despues de un horario")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    @GetMapping("/resumen/atrasos")
    public ResponseEntity<?> despuesdeHorario(@RequestParam(required = false) LocalDate inicio,
                                              @RequestParam(required = false) LocalDate fin,
                                              @RequestParam(required = false) LocalTime horario) {
        try {
            List<Asistencia> asistencias = asRepo.findAsistenciasEnRangoFechasYDespuesDeHoraLimiteNativa(inicio, fin, horario);
            HashMap<Empleado, Integer> empleados = new HashMap<>();
            asistencias.forEach(asistencia -> {
                if(asistencia.getTipo().equals("ENTRADA") && asistencia.getEsOficial()){
                    if (empleados.containsKey(asistencia.getEmpleado())){
                        empleados.put(asistencia.getEmpleado(), empleados.get(asistencia.getEmpleado())+1);
                    } else {
                        empleados.put(asistencia.getEmpleado(), 1);
                    }
                }
            });
            List<EmpleadoAtrasosDTO> empleadoAtrasos =empleados.keySet().stream().map(empleado -> new EmpleadoAtrasosDTO(empleado, empleados.get(empleado))).toList();

            return ResponseEntity.ok(empleadoAtrasos);
        } catch (Exception e) {
            logger.error("Error al obtener asistencias por empleado", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Obtiene todas las asistencias de un empleado.
     *
     * @param id ID del empleado
     * @return Lista de asistencias del empleado
     */
    @Operation(summary = "Obtener asistencias por empleado",
            description = "Obtiene todas las asistencias de un empleado específico")
    @PreAuthorize(
            "hasRole('ADMIN') or @securityHelper.isEmpleadoOwner(authentication.name, #id)"
    )
    @GetMapping("/empleado/{id}")
    public ResponseEntity<?> obtieneAsistenciasPorEmpleado(@PathVariable("id") Long id) {
        try {
            return ResponseEntity.ok(asRepo.findAllByEmpleadoIdEmpleado(id));
        } catch (Exception e) {
            logger.error("Error al obtener asistencias por empleado", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Obtiene el resumen de asistencias para una fecha específica.
     *
     * @param inicio Fecha inicio (formato: yyyy-MM-dd)
     * @param fin    Fecha fin (formato: yyyy-MM-dd)
     * @param rut    RUT del empleado (parcial o completo)
     * @return Lista de resúmenes de asistencia
     */
    @Operation(summary = "Obtener resumen de asistencias",
            description = "Obtiene el resumen de asistencias para una fecha específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resumen obtenido exitosamente"),
            @ApiResponse(responseCode = "400", description = "Fecha inválida")
    })
    @PreAuthorize(
            "hasRole('ADMIN') or #rut == authentication.principal.username"
    )
    @GetMapping("/resumen")
    public ResponseEntity<?> obtenerResumen(
            @RequestParam(required = false) LocalDate inicio,
            @RequestParam(required = false) LocalDate fin,
            @RequestParam(required = false) String rut) {
        try {
            logger.info("Obteniendo resumen para fechas: {} a {}, RUT: {}", inicio, fin, rut);

            if (inicio == null) {
                return ResponseEntity.badRequest().body("La fecha de inicio es requerida");
            }

            // Si no se especifica fecha fin, usar la misma fecha inicio
            if (fin == null) {
                fin = inicio;
            }

            // Validar que el RUT tenga al menos 4 caracteres si se proporciona
            if (rut != null && !rut.isEmpty()) {
                // Eliminar puntos y guiones para contar solo dígitos
                String rutLimpio = rut.replace(".", "").replace("-", "");
                if (rutLimpio.length() < 4) {
                    return ResponseEntity.badRequest().body("El RUT debe tener al menos 4 dígitos para realizar la búsqueda");
                }
            }

            List<ResumenAsistenciaDTO> resumen = asistenciaService.resumenPorRutParcialYRangoFechas(rut, inicio, fin);

            // Ordenar resumen por fecha y luego por nombre de empleado
            if (!resumen.isEmpty()) {
                resumen.sort((a, b) -> {
                    int fechaComp = a.getFecha().compareTo(b.getFecha());
                    if (fechaComp == 0) {
                        return a.getNombre().compareTo(b.getNombre());
                    }
                    return fechaComp;
                });

                logger.info("Resumen generado exitosamente con {} registros", resumen.size());
                return ResponseEntity.ok(resumen);
            } else {
                // Si no hay resultados, enviar respuesta clara
                Map<String, Object> respuestaVacia = new HashMap<>();
                respuestaVacia.put("mensaje", "No se encontraron registros para los filtros seleccionados");
                respuestaVacia.put("filtros", Map.of(
                        "inicio", inicio,
                        "fin", fin,
                        "rut", rut == null ? "" : rut
                ));
                respuestaVacia.put("data", new ArrayList<>());

                return ResponseEntity.ok(respuestaVacia);
            }

        } catch (Exception e) {
            logger.error("Error al generar resumen", e);
            return ResponseEntity.badRequest().body("Error al generar resumen: " + e.getMessage());
        }
    }

    /**
     * Actualiza el estado de una asistencia.
     *
     * @param id     ID de la asistencia
     * @param estado Nuevo estado (AUTORIZADO, RECHAZADO, PENDIENTE)
     * @return Asistencia actualizada
     */
    @Operation(summary = "Actualizar estado de asistencia",
            description = "Actualiza el estado de una asistencia (AUTORIZADO, RECHAZADO, PENDIENTE)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Estado actualizado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Asistencia no encontrada")
    })
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    @PutMapping("/estado/{id}")
    public ResponseEntity<?> actualizarEstado(
            @PathVariable("id") Long id,
            @RequestParam String estado) {
        try {
            logger.info("Actualizando estado de asistencia: id={}, estado={}", id, estado);

            // Validar que el estado sea uno de los permitidos
            if (!estado.equals("AUTORIZADO") && !estado.equals("RECHAZADO") && !estado.equals("PENDIENTE")) {
                return ResponseEntity.badRequest()
                        .body("Estado inválido. Debe ser AUTORIZADO, RECHAZADO o PENDIENTE");
            }

            // Buscar la asistencia
            boolean actualizado = asistenciaService.actualizarEstado(id, estado);

            if (actualizado) {
                return ResponseEntity.ok().body("Estado actualizado correctamente");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error al actualizar estado de asistencia", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Obtiene las marcas originales (sin procesar) para un empleado y rango de fechas.
     * Útil para la pantalla de edición.
     *
     * @param rut         RUT del empleado
     * @param fechaInicio Fecha inicio (formato: yyyy-MM-dd)
     * @param fechaFin    Fecha fin (formato: yyyy-MM-dd)
     * @return Lista de marcas de asistencia
     */
    @Operation(summary = "Obtener marcas por empleado y rango de fechas",
            description = "Obtiene las marcas originales para un empleado en un rango de fechas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Marcas obtenidas exitosamente"),
            @ApiResponse(responseCode = "400", description = "Parámetros inválidos")
    })
    @PreAuthorize(
            "hasRole('ADMIN') or #rut == authentication.principal.username"
    )
    public ResponseEntity<?> getMarcasPorEmpleadoYFechas(
            @RequestParam String rut,
            @RequestParam LocalDate fechaInicio,
            @RequestParam(required = false) LocalDate fechaFin) {
        try {
            logger.info("Obteniendo marcas para empleado RUT: {}, desde: {}, hasta: {}", rut, fechaInicio, fechaFin);

            if (rut == null || rut.isEmpty()) {
                return ResponseEntity.badRequest().body("El RUT del empleado es requerido");
            }

            if (fechaInicio == null) {
                return ResponseEntity.badRequest().body("La fecha de inicio es requerida");
            }

            // Si no se proporciona fecha fin, usar fecha inicio + 2 días
            LocalDate fechaFinReal = (fechaFin != null) ? fechaFin : fechaInicio.plusDays(2);

            // Convertir a LocalDateTime para el rango completo
            LocalDateTime desde = fechaInicio.atStartOfDay();
            LocalDateTime hasta = fechaFinReal.plusDays(1).atStartOfDay();

            List<Asistencia> marcas;

            // Buscar por RUT exacto o parcial
            if (rut.contains("-")) {
                // RUT completo
                marcas = asRepo.findAllByEmpleadoRutAndFechaBetween(rut, desde, hasta);
            } else {
                // RUT parcial
                marcas = asRepo.findAllByRutParcialAndFechaBetween(rut, desde, hasta);
            }

            // Ordenar marcas por fecha y hora
            marcas.sort((a, b) -> a.getFechaHora().compareTo(b.getFechaHora()));

            // Agrupar marcas por día
            Map<String, List<Asistencia>> marcasPorDia = new HashMap<>();

            for (Asistencia marca : marcas) {
                String fecha = marca.getFechaHora().toLocalDate().toString();
                if (!marcasPorDia.containsKey(fecha)) {
                    marcasPorDia.put(fecha, new ArrayList<>());
                }
                marcasPorDia.get(fecha).add(marca);
            }

            // Crear respuesta
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("empleadoRut", rut);
            respuesta.put("fechaInicio", fechaInicio.toString());
            respuesta.put("fechaFin", fechaFinReal.toString());
            respuesta.put("marcasPorDia", marcasPorDia);
            respuesta.put("marcas", marcas);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            logger.error("Error al obtener marcas por empleado y fechas", e);
            return ResponseEntity.badRequest().body("Error al obtener marcas: " + e.getMessage());
        }
    }
}
