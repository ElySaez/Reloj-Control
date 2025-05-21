package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.CrearJustificacionDTO;
import com.relojcontrol.reloj_control.model.Justificacion;

import java.util.List;

public interface IJustificacionService {
    List<Justificacion> listar(String rutEmpleado);

    Justificacion guardarJustificacion(CrearJustificacionDTO crearJustificacionDto);

    Justificacion getById(Long id);

    Justificacion aprobarJustificacion(Long id);
}
