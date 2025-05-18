package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import com.relojcontrol.reloj_control.service.AsistenciaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

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

    public AsistenciaController(AsistenciaRepository asRepo,
                               EmpleadoRepository eRepo,
                               AsistenciaService asistenciaService) {
        this.asRepo = asRepo;
        this.eRepo = eRepo;
        this.asistenciaService = asistenciaService;
    }

    /**
     * Registra una marca de entrada o salida para un empleado.
     *
     * @param empleadoId ID del empleado
     * @param tipo Tipo de marca ("ENTRADA" o "SALIDA")
     * @return La asistencia registrada
     */
    @Operation(summary = "Registrar marca de asistencia",
              description = "Registra una marca de entrada o salida para un empleado")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Marca registrada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "404", description = "Empleado no encontrado")
    })
    @PostMapping
    public ResponseEntity<?> marcar(
            @Parameter(description = "ID del empleado") @RequestParam Long empleadoId,
            @Parameter(description = "Tipo de marca (ENTRADA o SALIDA)") @RequestParam String tipo) {
        try {
            Empleado emp = eRepo.findById(Math.toIntExact(empleadoId))
                    .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
            Asistencia a = new Asistencia(emp, LocalDateTime.now(), tipo);
            return ResponseEntity.ok(asRepo.save(a));
        } catch (Exception e) {
            logger.error("Error al marcar asistencia", e);
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
    @GetMapping("/empleado/{id}")
    public ResponseEntity<?> porEmpleado(@PathVariable("id") Long id) {
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
     * @param rut Fecha para la cual se quiere obtener el resumen
     * @return Lista de resúmenes de asistencia
     */
    @Operation(summary = "Obtener resumen de asistencias",
              description = "Obtiene el resumen de asistencias para una fecha específica")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Resumen obtenido exitosamente"),
        @ApiResponse(responseCode = "400", description = "Fecha inválida")
    })
    @GetMapping("/resumen")
    public ResponseEntity<?> resumen(
            @Parameter(description = "Fecha inicio (formato: yyyy-MM-dd)")
            @RequestParam(name = "inicio") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate inicio,
            
            @Parameter(description = "Fecha fin (formato: yyyy-MM-dd)")
            @RequestParam(name = "fin", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fin,
            
            @Parameter(description = "RUT empleado (parcial o completo)")
            @RequestParam(name = "rut", required = false) String rut) {
        try {
            logger.info("Obteniendo resumen para fechas: {} a {}, RUT: {}", inicio, fin, rut);
            
            if (inicio == null) {
                return ResponseEntity.badRequest().body("La fecha de inicio es requerida");
            }

            // Si no se especifica fecha fin, usar la misma fecha inicio
            if (fin == null) {
                fin = inicio;
            }

            List<ResumenAsistenciaDTO> resumen;
            
            // Sin RUT, solo filtrar por fechas
            if (rut == null || rut.isEmpty()) {
                resumen = asistenciaService.resumenPorRangoFechas(inicio, fin);
            }
            // Con RUT, intentar diferentes estrategias de búsqueda
            else {
                if (rut.contains("-")) {
                    // RUT exacto con formato (ej: 12.345.678-9)
                    resumen = asistenciaService.resumenPorRutYRangoFechas(rut, inicio, fin);
                } else {
                    // Intentar primero búsqueda exacta al principio del RUT
                    resumen = asistenciaService.resumenPorRutParcialYRangoFechas(rut, inicio, fin);
                    
                    // Si no hay resultados, intentar búsqueda flexible
                    if (resumen.isEmpty()) {
                        logger.info("No se encontraron resultados con búsqueda estándar, intentando búsqueda flexible");
                        resumen = asistenciaService.resumenPorRutParcialFlexibleYRangoFechas(rut, inicio, fin);
                    }
                }
            }
            
            logger.info("Resumen generado exitosamente con {} registros", resumen.size());
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            logger.error("Error al generar resumen", e);
            return ResponseEntity.badRequest().body("Error al generar resumen: " + e.getMessage());
        }
    }

    /**
     * Obtiene el resumen de asistencias filtrado por mes y año.
     *
     * @param mes Mes (1-12)
     * @param año Año (ej: 2025)
     * @param rut RUT del empleado (opcional)
     * @return Lista de resúmenes de asistencia
     */
    @Operation(summary = "Obtener resumen de asistencias por mes y año",
              description = "Obtiene el resumen de asistencias filtrado por mes, año y opcionalmente por RUT de empleado")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Resumen obtenido exitosamente"),
        @ApiResponse(responseCode = "400", description = "Parámetros inválidos")
    })
    @GetMapping("/resumen/mensual")
    public ResponseEntity<?> resumenMensual(
            @Parameter(description = "Mes (1-12)")
            @RequestParam(name = "mes") int mes,
            
            @Parameter(description = "Año (ej: 2025)")
            @RequestParam(name = "año") int año,
            
            @Parameter(description = "RUT empleado (parcial o completo, opcional)")
            @RequestParam(name = "rut", required = false) String rut) {
        try {
            logger.info("Obteniendo resumen mensual: mes={}, año={}, RUT={}", mes, año, rut);
            
            // Validar parámetros
            if (mes < 1 || mes > 12) {
                return ResponseEntity.badRequest().body("El mes debe estar entre 1 y 12");
            }
            
            if (año < 2000 || año > 2100) {
                return ResponseEntity.badRequest().body("Año fuera de rango válido");
            }

            List<ResumenAsistenciaDTO> resumen;
            
            // Llamar al servicio según parámetros
            if (rut == null || rut.isEmpty()) {
                // Solo filtrar por mes y año
                resumen = asistenciaService.resumenPorMesYAño(mes, año);
            } else {
                // Filtrar por mes, año y RUT
                resumen = asistenciaService.resumenPorRutMesYAño(rut, mes, año);
            }
            
            logger.info("Resumen mensual generado exitosamente con {} registros", resumen.size());
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            logger.error("Error al generar resumen mensual", e);
            return ResponseEntity.badRequest().body("Error al generar resumen mensual: " + e.getMessage());
        }
    }
}
