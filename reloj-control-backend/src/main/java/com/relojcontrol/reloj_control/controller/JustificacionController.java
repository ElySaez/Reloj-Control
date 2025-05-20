package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.dto.CrearJustificacionDto;
import com.relojcontrol.reloj_control.model.Justificacion;
import com.relojcontrol.reloj_control.repository.JustificacionRepository;
import com.relojcontrol.reloj_control.service.IJustificacionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/justificaciones")
public class JustificacionController {

    private final IJustificacionService justificacionService;

    public JustificacionController(IJustificacionService justificacionService) {
        this.justificacionService = justificacionService;
    }

    @GetMapping("/empleado/{rutEmpleado}")
    public List<Justificacion> listar(@PathVariable String rutEmpleado) {
        return justificacionService.listar(rutEmpleado);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Justificacion crear(@RequestBody CrearJustificacionDto crearJustificacionDto, @RequestPart("archivo") MultipartFile archivo) {

        return justificacionService.guardarJustificacion(crearJustificacionDto, archivo);
    }

//    @GetMapping("/{id}")
//    public ResponseEntity<Justificacion> uno(@PathVariable Integer id) {
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
