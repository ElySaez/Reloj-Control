package com.relojcontrol.reloj_control.service;
 
public interface IRegistroActividadService {
    void log(Integer idUsuario, String accion, String modulo, String ipOrigen);
} 