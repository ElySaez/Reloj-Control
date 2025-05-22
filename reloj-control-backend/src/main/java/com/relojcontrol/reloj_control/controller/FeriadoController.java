package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.Feriado;
import com.relojcontrol.reloj_control.service.FeriadoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/feriados")
@CrossOrigin(origins = "*")
public class FeriadoController {

    private final FeriadoService feriadoService;

    public FeriadoController(FeriadoService feriadoService) {
        this.feriadoService = feriadoService;
    }

    @GetMapping
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<List<Feriado>> listarFeriados() {
        return ResponseEntity.ok(feriadoService.listarTodos());
    }

    @PostMapping
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<?> agregarFeriado(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fecha,
            @RequestParam String descripcion) {
        try {
            Feriado feriado = feriadoService.agregarFeriado(fecha, descripcion);
            return ResponseEntity.ok(feriado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al agregar feriado: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<?> eliminarFeriado(@PathVariable Long id) {
        try {
            feriadoService.eliminarFeriado(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar feriado: " + e.getMessage());
        }
    }

    @GetMapping("/verificar")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<Boolean> verificarFeriado(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fecha) {
        return ResponseEntity.ok(feriadoService.esFeriado(fecha));
    }

    @GetMapping("/rango")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<List<Feriado>> obtenerFeriadosEnRango(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate inicio,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fin) {
        return ResponseEntity.ok(feriadoService.obtenerFeriadosEnRango(inicio, fin));
    }
} 