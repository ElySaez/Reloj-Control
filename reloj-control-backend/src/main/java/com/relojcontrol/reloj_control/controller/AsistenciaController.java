package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import com.relojcontrol.reloj_control.service.AsistenciaService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/asistencias")

public class AsistenciaController {

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

    /** Registra una entrada o salida para un empleado existente */
    @PostMapping
    public Asistencia marcar(@RequestParam Long empleadoId,
                             @RequestParam String tipo /* "ENTRADA" o "SALIDA" */) {
        Empleado emp = eRepo.findById(Math.toIntExact(empleadoId))
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
        Asistencia a = new Asistencia(emp, LocalDateTime.now(), tipo);
        return asRepo.save(a);
    }


    /** Lista todas las asistencias de un empleado */
    @GetMapping("/empleado/{id}")
    public List<Asistencia> porEmpleado(@PathVariable("id") Long id) {
        return asRepo.findByEmpleado_IdEmpleado(id);

    }

    @GetMapping("/resumen")
    public List<ResumenAsistenciaDTO> resumen(
            @RequestParam("fecha") String fechaStr) {
        LocalDate fecha = LocalDate.parse(fechaStr); // YYYY-MM-DD
        return asistenciaService.resumenPorDia(fecha);
    }


}
