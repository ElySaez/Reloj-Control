package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.CrearJustificacionDto;
import com.relojcontrol.reloj_control.model.Justificacion;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IJustificacionService {
    List<Justificacion> listar(String rutEmpleado);

    Justificacion guardarJustificacion(CrearJustificacionDto crearJustificacionDto, MultipartFile archivo);
}
