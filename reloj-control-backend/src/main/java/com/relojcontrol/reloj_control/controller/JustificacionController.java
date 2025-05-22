package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.dto.CrearJustificacionDTO;
import com.relojcontrol.reloj_control.dto.JustificacionListadoDTO;
import com.relojcontrol.reloj_control.model.Justificacion;
import com.relojcontrol.reloj_control.model.enums.EstadoJustificacionEnum;
import com.relojcontrol.reloj_control.service.IJustificacionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/justificaciones")
public class JustificacionController {

    private final IJustificacionService justificacionService;

    public JustificacionController(IJustificacionService justificacionService) {
        this.justificacionService = justificacionService;
    }

    @GetMapping("/empleado/{rutEmpleado}")
    @PreAuthorize(
            "hasRole('ADMIN') or #rutEmpleado == authentication.principal.username"
    )
    public List<JustificacionListadoDTO> listarPorEmpleado(@PathVariable String rutEmpleado) {
        return justificacionService.listar(rutEmpleado).stream().map(JustificacionListadoDTO::new).toList();
    }

    @GetMapping("")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public List<JustificacionListadoDTO> listadoCompletoPorEstado(@RequestParam(name = "estado") EstadoJustificacionEnum estadoJustificacion) {
        return justificacionService.listar(estadoJustificacion).stream().map(JustificacionListadoDTO::new).toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(
            "hasRole('ADMIN') or @securityHelper.isEmpleadoOwner(authentication.name, #crearJustificacionDto.rutEmpleado)"
    )
    public ResponseEntity<Justificacion> crear(@ModelAttribute CrearJustificacionDTO crearJustificacionDto) {
        Justificacion justificacion = justificacionService.guardarJustificacion(crearJustificacionDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(justificacion);
    }


    @GetMapping("/{id}/archivo")
    @PreAuthorize(
            "hasRole('ADMIN') or @securityHelper.isJustificacionOwner(authentication.name, #id)"
    )
    public ResponseEntity<byte[]> descargar(@PathVariable Long id) {
        Justificacion justificacion = justificacionService.getById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=justificacion-" + id + ".pdf")
                .body(justificacion.getArchivoAdjunto());
    }

    @PutMapping("/{id}")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<JustificacionListadoDTO> actualizarEstadoJustificacion(@PathVariable Long id, @RequestParam("estado") EstadoJustificacionEnum estadoJustificacion) {
        return ResponseEntity.ok().body(new JustificacionListadoDTO(justificacionService.actualizarEstadoJustificacion(id, estadoJustificacion)));
    }
}
