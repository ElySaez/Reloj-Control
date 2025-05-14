package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.Justificacion;
import com.relojcontrol.reloj_control.repository.JustificacionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/justificaciones")
public class JustificacionController {

    private final JustificacionRepository repo;
    public JustificacionController(JustificacionRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Justificacion> listar() {
        return repo.findAll();
    }

    @PostMapping
    public Justificacion crear(@RequestBody Justificacion j) {
        return repo.save(j);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Justificacion> uno(@PathVariable Integer id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Justificacion> actualizar(@PathVariable Integer id,
                                                    @RequestBody Justificacion cambios) {
        return repo.findById(id).map(j -> {
            j.setEmpleado(cambios.getEmpleado());
            j.setTipoPermiso(cambios.getTipoPermiso());
            j.setFechaInicio(cambios.getFechaInicio());
            j.setFechaTermino(cambios.getFechaTermino());
            j.setMotivo(cambios.getMotivo());
            j.setArchivoAdjunto(cambios.getArchivoAdjunto());
            j.setEstado(cambios.getEstado());
            return ResponseEntity.ok(repo.save(j));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> borrar(@PathVariable Integer id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
