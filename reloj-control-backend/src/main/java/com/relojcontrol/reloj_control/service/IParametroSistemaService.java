package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.ParametroSistemaUpdateDTO;
import com.relojcontrol.reloj_control.model.ParametroSistema;

import java.util.List;

public interface IParametroSistemaService {
    String getValor(String clave);

    List<ParametroSistema> listarParametros();

    List<ParametroSistema> actualizarParametros(List<ParametroSistemaUpdateDTO> parametroUpdate);

    ParametroSistema findById(Long id);
}