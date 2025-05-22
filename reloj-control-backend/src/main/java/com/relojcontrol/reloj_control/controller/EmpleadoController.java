package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {
    private final EmpleadoRepository repo;
    public EmpleadoController(EmpleadoRepository repo) { this.repo = repo; }

    @GetMapping
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public List<Empleado> listar() { return repo.findAll(); }

    @PostMapping
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public Empleado crear(@RequestBody Empleado e) { return repo.save(e); }

    @GetMapping("/{id}")
    @PreAuthorize(
            "hasRole('ADMIN') or @securityHelper.isEmpleadoOwner(authentication.name, #id)"
    )
    public ResponseEntity<Empleado> uno(@PathVariable Integer id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize(
            "hasRole('ADMIN') or @securityHelper.isEmpleadoOwner(authentication.name, #id)"
    )
    public ResponseEntity<Empleado> actualizar(@PathVariable Integer id,
                                               @RequestBody Empleado cambios) {
        return repo.findById(id).map(e -> {
            e.setNombreCompleto(cambios.getNombreCompleto());
            e.setRut(cambios.getRut());
            e.setUnidad(cambios.getUnidad());
            e.setCargo(cambios.getCargo());
            return ResponseEntity.ok(repo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<Void> borrar(@PathVariable Integer id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
