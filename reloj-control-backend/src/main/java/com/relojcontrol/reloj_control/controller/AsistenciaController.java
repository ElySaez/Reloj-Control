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
     * @param fecha Fecha para la cual se quiere obtener el resumen
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
            @Parameter(description = "Fecha para el resumen (formato: yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fecha) {
        try {
            logger.info("Obteniendo resumen para fecha: {}", fecha);
            
            if (fecha == null) {
                return ResponseEntity.badRequest().body("La fecha es requerida");
            }

            List<ResumenAsistenciaDTO> resumen = asistenciaService.resumenPorDia(fecha);
            
            logger.info("Resumen generado exitosamente con {} registros", resumen.size());
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            logger.error("Error al generar resumen", e);
            return ResponseEntity.badRequest().body("Error al generar resumen: " + e.getMessage());
        }
    }
}
