package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.TipoPermiso;
import com.relojcontrol.reloj_control.repository.TipoPermisoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-permisos")
public class TipoPermisoController {

    private final TipoPermisoRepository repo;
    public TipoPermisoController(TipoPermisoRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<TipoPermiso> listar() {
        return repo.findAll();
    }

    @PostMapping
    public TipoPermiso crear(@RequestBody TipoPermiso tp) {
        return repo.save(tp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoPermiso> uno(@PathVariable Integer id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TipoPermiso> actualizar(@PathVariable Integer id,
                                                  @RequestBody TipoPermiso cambios) {
        return repo.findById(id).map(tp -> {
            tp.setDescripcion(cambios.getDescripcion());
            tp.setRequiereAdjuntos(cambios.getRequiereAdjuntos());
            return ResponseEntity.ok(repo.save(tp));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> borrar(@PathVariable Integer id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
