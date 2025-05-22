package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.model.RegistroActividad;

import java.util.List;

public interface IRegistroActividadService {
    List<RegistroActividad> obtenerRegistroDeActividadPorUsuario(String run);
}