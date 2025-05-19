package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.model.Usuario;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.ArrayList;

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
     * @param inicio Fecha inicio (formato: yyyy-MM-dd)
     * @param fin Fecha fin (formato: yyyy-MM-dd)
     * @param rut RUT del empleado (parcial o completo)
     * @return Lista de resúmenes de asistencia
     */
    @Operation(summary = "Obtener resumen de asistencias",
              description = "Obtiene el resumen de asistencias para una fecha específica")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Resumen obtenido exitosamente"),
        @ApiResponse(responseCode = "400", description = "Fecha inválida")
    })
    @GetMapping("/resumen")
    public ResponseEntity<?> getResumen(
            @RequestParam(required = false) LocalDate inicio,
            @RequestParam(required = false) LocalDate fin,
            @RequestParam(required = false) String rut)
    {
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

            // Asegurar que existan datos para estas fechas (creará datos de prueba si es necesario)
            asegurarDatosParaFechas(inicio, fin, rut);

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
     * Método privado para crear datos de prueba para fechas específicas y RUT
     */
    private void crearDatosPruebaParaFechas(LocalDate inicio, LocalDate fin, String rutParcial) {
        try {
            logger.info("Creando datos de prueba para fechas {} a {} y RUT {}", inicio, fin, rutParcial);
            
            // Crear un nombre de empleado distintivo basado en el RUT
            String nombreEmpleado;
            String rutCompleto;
            
            if (rutParcial == null || rutParcial.isEmpty()) {
                // Usar un RUT por defecto
                rutCompleto = "87654321-1";
                nombreEmpleado = "Usuario De Prueba";
            } else if (rutParcial.equals("12345")) {
                // Para el RUT 12345 del ejemplo, usar Ana García
                rutCompleto = "12345678-5";
                nombreEmpleado = "Ana García";
            } else if (rutParcial.contains("-")) {
                // Ya es un RUT completo
                rutCompleto = rutParcial;
                nombreEmpleado = "Empleado " + rutParcial.substring(0, 4);
            } else {
                // Agregar dígito verificador para completar el RUT
                rutCompleto = rutParcial + "-1";
                nombreEmpleado = "Empleado " + rutParcial.substring(0, Math.min(4, rutParcial.length()));
            }
            
            // Buscar o crear el empleado
            Empleado empleado = eRepo.findByRut(rutCompleto).orElse(null);
            
            if (empleado == null) {
                // Primero, crear o recuperar un usuario
                String correoPrueba = "usuario." + rutParcial + "@example.com";
                Usuario usuario = uRepo.findByCorreo(correoPrueba).orElse(null);
                
                if (usuario == null) {
                    usuario = new Usuario();
                    usuario.setCorreo(correoPrueba);
                    usuario.setContrasenaHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"); // password: 123456
                    usuario.setRol("EMPLEADO");
                    usuario.setEstadoCuenta("ACTIVO");
                    usuario = uRepo.save(usuario);
                    logger.info("Usuario creado: {}", usuario.getCorreo());
                }
                
                // Crear el empleado con el RUT y nombre específicos
                empleado = new Empleado();
                empleado.setRut(rutCompleto);
                empleado.setNombreCompleto(nombreEmpleado);
                empleado.setUsuario(usuario);
                empleado = eRepo.save(empleado);
                logger.info("Empleado creado: {} ({})", empleado.getNombreCompleto(), empleado.getRut());
            } else {
                logger.info("Usando empleado existente: {} ({})", empleado.getNombreCompleto(), empleado.getRut());
            }
            
            // Crear asistencias para cada día entre inicio y fin
            List<Asistencia> nuevasAsistencias = new ArrayList<>();
            LocalDate fechaActual = inicio;
            
            while (!fechaActual.isAfter(fin)) {
                // Crear marcas específicas según el día y el empleado
                if (rutCompleto.equals("12345678-5")) {
                    // Para Ana García (datos de la imagen)
                    if (fechaActual.equals(LocalDate.of(2025, 5, 16))) {
                        // Día 16/05/2025
                        nuevasAsistencias.add(crearMarca(empleado, fechaActual, 7, 54, "ENTRADA"));
                        nuevasAsistencias.add(crearMarca(empleado, fechaActual, 22, 30, "SALIDA"));
                    } else if (fechaActual.equals(LocalDate.of(2025, 5, 17))) {
                        // Día 17/05/2025
                        nuevasAsistencias.add(crearMarca(empleado, fechaActual, 7, 58, "ENTRADA"));
                        nuevasAsistencias.add(crearMarca(empleado, fechaActual, 14, 53, 2, "SALIDA"));
                    } else if (fechaActual.equals(LocalDate.of(2025, 5, 18))) {
                        // Día 18/05/2025
                        nuevasAsistencias.add(crearMarca(empleado, fechaActual, 6, 23, "ENTRADA"));
                        nuevasAsistencias.add(crearMarca(empleado, fechaActual, 23, 40, 1, "SALIDA"));
                    } else {
                        // Días restantes: horario normal
                        nuevasAsistencias.add(crearMarca(empleado, fechaActual, 8, 0, "ENTRADA"));
                        nuevasAsistencias.add(crearMarca(empleado, fechaActual, 18, 0, "SALIDA"));
                    }
                } else {
                    // Para otros empleados, horario normal con variaciones
                    int minutosVariacion = (int)(Math.random() * 20) - 10; // Entre -10 y +10 minutos
                    nuevasAsistencias.add(crearMarca(empleado, fechaActual, 7, 58 + minutosVariacion, "ENTRADA"));
                    nuevasAsistencias.add(crearMarca(empleado, fechaActual, 18, 5 + minutosVariacion, "SALIDA"));
                }
                
                fechaActual = fechaActual.plusDays(1);
            }
            
            // Guardar todas las asistencias
            asRepo.saveAll(nuevasAsistencias);
            logger.info("Creados {} registros de asistencia para el empleado {} ({})", 
                      nuevasAsistencias.size(), empleado.getNombreCompleto(), empleado.getRut());
        } catch (Exception e) {
            logger.error("Error al crear datos de prueba para fechas específicas", e);
        }
    }

    /**
     * Método auxiliar para crear una marca de asistencia
     */
    private Asistencia crearMarca(Empleado empleado, LocalDate fecha, int hora, int minuto, String tipo) {
        LocalDateTime fechaHora = fecha.atTime(hora, minuto);
        Asistencia marca = new Asistencia(empleado, fechaHora, tipo);
        marca.setEstado("AUTORIZADO");
        return marca;
    }

    /**
     * Método auxiliar para crear una marca de asistencia con segundos
     */
    private Asistencia crearMarca(Empleado empleado, LocalDate fecha, int hora, int minuto, int segundo, String tipo) {
        LocalDateTime fechaHora = fecha.atTime(hora, minuto, segundo);
        Asistencia marca = new Asistencia(empleado, fechaHora, tipo);
        marca.setEstado("AUTORIZADO");
        return marca;
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
    public ResponseEntity<?> getResumenMensual(
            @RequestParam int mes, 
            @RequestParam int año,
            @RequestParam(required = false) String rut)
    {
        try {
            logger.info("Obteniendo resumen mensual: mes={}, año={}, RUT={}", mes, año, rut);
            
            // Validar parámetros
            if (mes < 1 || mes > 12) {
                return ResponseEntity.badRequest().body("El mes debe estar entre 1 y 12");
            }
            
            if (año < 2000 || año > 2100) {
                return ResponseEntity.badRequest().body("Año fuera de rango válido");
            }
            
            // Validar que el RUT tenga al menos 4 caracteres si se proporciona
            if (rut != null && !rut.isEmpty()) {
                // Eliminar puntos y guiones para contar solo dígitos
                String rutLimpio = rut.replace(".", "").replace("-", "");
                if (rutLimpio.length() < 4) {
                    return ResponseEntity.badRequest().body("El RUT debe tener al menos 4 dígitos para realizar la búsqueda");
                }
            }

            // Calcular fechas inicio y fin del mes
            LocalDate inicio = LocalDate.of(año, mes, 1);
            LocalDate fin = inicio.plusMonths(1).minusDays(1);
            
            // Asegurar que existan datos para estas fechas
            asegurarDatosParaFechas(inicio, fin, rut);

            List<ResumenAsistenciaDTO> resumen;
            
            // Llamar al servicio según parámetros
            if (rut == null || rut.isEmpty()) {
                // Solo filtrar por mes y año
                resumen = asistenciaService.resumenPorMesYAño(mes, año);
            } else {
                // Filtrar por mes, año y RUT
                resumen = asistenciaService.resumenPorRutMesYAño(rut, mes, año);
            }
            
            // Ordenar resumen por fecha y luego por nombre de empleado
            if (!resumen.isEmpty()) {
                resumen.sort((a, b) -> {
                    int fechaComp = a.getFecha().compareTo(b.getFecha());
                    if (fechaComp == 0) {
                        return a.getNombre().compareTo(b.getNombre());
                    }
                    return fechaComp;
                });
                
                logger.info("Resumen mensual generado exitosamente con {} registros", resumen.size());
                return ResponseEntity.ok(resumen);
            } else {
                // Si no hay resultados, enviar respuesta clara
                Map<String, Object> respuestaVacia = new HashMap<>();
                respuestaVacia.put("mensaje", "No se encontraron registros para los filtros seleccionados");
                respuestaVacia.put("filtros", Map.of(
                    "mes", mes,
                    "año", año,
                    "rut", rut == null ? "" : rut
                ));
                respuestaVacia.put("data", new ArrayList<>());
                
                return ResponseEntity.ok(respuestaVacia);
            }
        } catch (Exception e) {
            logger.error("Error al generar resumen mensual", e);
            return ResponseEntity.badRequest().body("Error al generar resumen mensual: " + e.getMessage());
        }
    }

    /**
     * Actualiza el estado de una asistencia.
     *
     * @param id ID de la asistencia
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
     * Endpoint de prueba para listar todas las asistencias y empleados
     */
    @GetMapping("/debug")
    public ResponseEntity<?> debugInfo() {
        try {
            Map<String, Object> info = new HashMap<>();
            
            // Obtener todas las asistencias
            List<Asistencia> asistencias = asRepo.findAll();
            info.put("total_asistencias", asistencias.size());
            
            // Obtener todos los empleados
            List<Empleado> empleados = eRepo.findAll();
            info.put("total_empleados", empleados.size());
            
            // Datos de empleados
            List<Map<String, Object>> datosEmpleados = empleados.stream()
                .map(e -> {
                    Map<String, Object> datos = new HashMap<>();
                    datos.put("id", e.getIdEmpleado());
                    datos.put("nombre", e.getNombreCompleto());
                    datos.put("rut", e.getRut());
                    return datos;
                })
                .collect(Collectors.toList());
            info.put("empleados", datosEmpleados);
            
            // Muestra de asistencias (primeras 10)
            List<Map<String, Object>> muestraAsistencias = asistencias.stream()
                .limit(10)
                .map(a -> {
                    Map<String, Object> datos = new HashMap<>();
                    datos.put("id", a.getId());
                    datos.put("empleado_id", a.getEmpleado().getIdEmpleado());
                    datos.put("empleado_rut", a.getEmpleado().getRut());
                    datos.put("fecha_hora", a.getFechaHora());
                    datos.put("tipo", a.getTipo());
                    datos.put("estado", a.getEstado());
                    return datos;
                })
                .collect(Collectors.toList());
            info.put("muestra_asistencias", muestraAsistencias);
            
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            logger.error("Error al obtener información de depuración", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Endpoint para crear datos de prueba
     */
    @PostMapping("/crear-datos-prueba")
    public ResponseEntity<?> crearDatosPrueba() {
        try {
            // 1. Verificar si ya existe el empleado con RUT 87654321
            String rutPrueba = "87654321-1";
            Empleado empleado = eRepo.findByRut(rutPrueba).orElse(null);
            
            if (empleado == null) {
                // Primero, crear un usuario
                String correoPrueba = "usuario.prueba@example.com";
                Usuario usuario = uRepo.findByCorreo(correoPrueba).orElse(null);
                
                if (usuario == null) {
                    usuario = new Usuario();
                    usuario.setCorreo(correoPrueba);
                    usuario.setContrasenaHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"); // password: 123456
                    usuario.setRol("EMPLEADO");
                    usuario.setEstadoCuenta("ACTIVO");
                    usuario = uRepo.save(usuario);
                    logger.info("Usuario de prueba creado con ID: {}", usuario.getIdUsuario());
                } else {
                    logger.info("Usuario de prueba ya existe con ID: {}", usuario.getIdUsuario());
                }
                
                // Ahora, crear el empleado con el usuario
                empleado = new Empleado();
                empleado.setRut(rutPrueba);
                empleado.setNombreCompleto("Usuario De Prueba");
                empleado.setUsuario(usuario);
                empleado = eRepo.save(empleado);
                logger.info("Empleado de prueba creado con ID: {}", empleado.getIdEmpleado());
            } else {
                logger.info("Empleado de prueba ya existe con ID: {}", empleado.getIdEmpleado());
            }
            
            // 2. Crear asistencias para el empleado (mayo 2025)
            List<Asistencia> nuevasAsistencias = new ArrayList<>();
            
            // Crear marca para el 16/05/2025
            LocalDateTime entradaDia1 = LocalDateTime.of(2025, 5, 16, 7, 58, 0);
            Asistencia entrada1 = new Asistencia(empleado, entradaDia1, "ENTRADA");
            entrada1.setEstado("AUTORIZADO");
            nuevasAsistencias.add(entrada1);
            
            LocalDateTime salidaDia1 = LocalDateTime.of(2025, 5, 16, 14, 53, 2);
            Asistencia salida1 = new Asistencia(empleado, salidaDia1, "SALIDA");
            salida1.setEstado("AUTORIZADO");
            nuevasAsistencias.add(salida1);
            
            // Crear marca para el 18/05/2025
            LocalDateTime entradaDia2 = LocalDateTime.of(2025, 5, 18, 6, 23, 0);
            Asistencia entrada2 = new Asistencia(empleado, entradaDia2, "ENTRADA");
            entrada2.setEstado("AUTORIZADO");
            nuevasAsistencias.add(entrada2);
            
            LocalDateTime salidaDia2 = LocalDateTime.of(2025, 5, 18, 23, 40, 1);
            Asistencia salida2 = new Asistencia(empleado, salidaDia2, "SALIDA");
            salida2.setEstado("RECHAZADO");
            nuevasAsistencias.add(salida2);
            
            // Guardar todas las asistencias
            asRepo.saveAll(nuevasAsistencias);
            
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("empleado", empleado.getNombreCompleto() + " (" + empleado.getRut() + ")");
            respuesta.put("asistencias_creadas", nuevasAsistencias.size());
            respuesta.put("mensaje", "Datos de prueba creados exitosamente");
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            logger.error("Error al crear datos de prueba", e);
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * Método para asegurar que existan datos para las fechas solicitadas
     * Creará datos de prueba si es necesario y las fechas son futuras
     */
    private List<Asistencia> asegurarDatosParaFechas(LocalDate inicio, LocalDate fin, String rut) {
        try {
            LocalDateTime desde = inicio.atStartOfDay();
            LocalDateTime hasta = fin.plusDays(1).atStartOfDay();
            
            // Buscar asistencias existentes
            List<Asistencia> asistencias;
            
            if (rut != null && !rut.isEmpty()) {
                if (rut.length() == 8) {
                    // RUT completo con formato
                    asistencias = asRepo.findAllByEmpleadoRutAndFechaBetween(rut, desde, hasta);
                } else {
                    // RUT parcial
                    asistencias = asRepo.findAllByRutParcialFlexibleAndFechaBetween(rut, desde, hasta);
                }
            } else {
                // Sin RUT
                asistencias = asRepo.findAllByFechaHoraBetween(desde, hasta);
            }
            
            return asistencias;
        } catch (Exception e) {
            logger.error("Error al asegurar datos para fechas", e);
            return new ArrayList<>();
        }
    }
}
