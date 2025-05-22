package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.model.RegistroActividad;
import com.relojcontrol.reloj_control.service.IRegistroActividadService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/actividad")
public class RegistroActividadController {

    private final IRegistroActividadService registroActividadService;

    public RegistroActividadController(IRegistroActividadService registroActividadService) {
        this.registroActividadService = registroActividadService;
    }

    @GetMapping("/{run}")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public List<RegistroActividad> obtenerRegistroDeActividadPorUsuario(@PathVariable("run") String run) {
        return registroActividadService.obtenerRegistroDeActividadPorUsuario(run);
    }
}
