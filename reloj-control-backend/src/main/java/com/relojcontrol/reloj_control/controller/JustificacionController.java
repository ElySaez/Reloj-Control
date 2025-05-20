package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.dto.CrearJustificacionDTO;
import com.relojcontrol.reloj_control.dto.JustificacionListadoDTO;
import com.relojcontrol.reloj_control.model.Justificacion;
import com.relojcontrol.reloj_control.service.IJustificacionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    public List<JustificacionListadoDTO> listar(@PathVariable String rutEmpleado) {
        return justificacionService.listar(rutEmpleado).stream().map(JustificacionListadoDTO::new).toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Justificacion> crear(@ModelAttribute CrearJustificacionDTO crearJustificacionDto) {
        Justificacion justificacion = justificacionService.guardarJustificacion(crearJustificacionDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(justificacion);
    }


    @GetMapping("/{id}/archivo")
    public ResponseEntity<byte[]> descargar(@PathVariable Long id) {
        Justificacion justificacion = justificacionService.getById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=justificacion-" + id + ".pdf")
                .body(justificacion.getArchivoAdjunto());
    }

//    @GetMapping("/{id}")
//    public ResponseEntity<Justificacion> uno(@PathVariable Integer id) {A
//        return repo.findById(id)
//                .map(ResponseEntity::ok)
//                .orElse(ResponseEntity.notFound().build());
//    }
//
//    @PutMapping("/{id}")
//    public ResponseEntity<Justificacion> actualizar(@PathVariable Integer id,
//                                                    @RequestBody Justificacion cambios) {
//        return repo.findById(id).map(j -> {
//            j.setEmpleado(cambios.getEmpleado());
//            j.setTipoPermiso(cambios.getTipoPermiso());
//            j.setFechaInicio(cambios.getFechaInicio());
//            j.setFechaTermino(cambios.getFechaTermino());
//            j.setMotivo(cambios.getMotivo());
//            j.setArchivoAdjunto(cambios.getArchivoAdjunto());
//            j.setEstado(cambios.getEstado());
//            return ResponseEntity.ok(repo.save(j));
//        }).orElse(ResponseEntity.notFound().build());
//    }
//
//    @DeleteMapping("/{id}")
//    public ResponseEntity<Void> borrar(@PathVariable Integer id) {
//        repo.deleteById(id);
//        return ResponseEntity.noContent().build();
//    }
}
