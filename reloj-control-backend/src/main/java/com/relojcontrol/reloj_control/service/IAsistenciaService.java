package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.model.Empleado;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public interface IAsistenciaService {
    List<ResumenAsistenciaDTO> resumenPorDia(LocalDate dia);
    LocalTime calcularSalidaEsperada(LocalDateTime horaEntrada);

    Asistencia crearAsistencia(String empleadoId, String tipo, LocalDateTime parse, boolean esOficial);

    void crearAsistenciaEnRangoDeFechasDesdeJustificacion(Empleado empleado, LocalDate fechaInicio, LocalDate fechaTermino, String descripcion);
}