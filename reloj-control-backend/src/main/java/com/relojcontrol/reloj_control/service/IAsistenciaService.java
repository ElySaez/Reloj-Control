package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public interface IAsistenciaService {
    List<ResumenAsistenciaDTO> resumenPorDia(LocalDate dia);
    LocalTime calcularSalidaEsperada(LocalDateTime horaEntrada);

} 