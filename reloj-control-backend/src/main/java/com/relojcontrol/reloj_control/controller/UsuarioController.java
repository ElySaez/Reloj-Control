package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.Usuario;
import com.relojcontrol.reloj_control.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository repo;
    public UsuarioController(UsuarioRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public List<Usuario> listar() {
        return repo.findAll();
    }

    @PostMapping
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public Usuario crear(@RequestBody Usuario u) {
        return repo.save(u);
    }

    @GetMapping("/{id}")
    @PreAuthorize(
            "hasRole('ADMIN') or @securityHelper.isEmpleadoOwner(authentication.name, #id)"
    )
    public ResponseEntity<Usuario> uno(@PathVariable Integer id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
