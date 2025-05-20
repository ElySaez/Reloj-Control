package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.repository.ParametroSistemaRepository;
import org.springframework.stereotype.Service;

@Service
public class ParametroSistemaService implements IParametroSistemaService {
    private final ParametroSistemaRepository repo;

    public ParametroSistemaService(ParametroSistemaRepository repo) {
        this.repo = repo;
    }

    @Override
    public String getValor(String clave) {
        return repo.findByClave(clave)
                .orElseThrow(() -> new IllegalArgumentException("Parámetro no encontrado: " + clave))
                .getValor();
    }
}
