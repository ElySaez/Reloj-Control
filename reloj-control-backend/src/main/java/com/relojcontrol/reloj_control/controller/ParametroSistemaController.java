package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.dto.ParametroSistemaUpdateDTO;
import com.relojcontrol.reloj_control.model.ParametroSistema;
import com.relojcontrol.reloj_control.service.IParametroSistemaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parametros")
public class ParametroSistemaController {

    private final IParametroSistemaService parametroSistemaService;

    public ParametroSistemaController(IParametroSistemaService parametroSistemaService) {
        this.parametroSistemaService = parametroSistemaService;
    }

    @GetMapping("")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public List<ParametroSistema> listarParametroSistema() {
        return parametroSistemaService.listarParametros();
    }

    @PostMapping("")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public List<ParametroSistema> actualizarParametrosSistema(@RequestBody List<ParametroSistemaUpdateDTO> parametroUpdate){
        return parametroSistemaService.actualizarParametros(parametroUpdate);
    }
}
