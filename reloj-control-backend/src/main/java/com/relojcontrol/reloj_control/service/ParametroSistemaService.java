package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.repository.ParametroSistemaRepository;
import org.springframework.stereotype.Service;

@Service
public class ParametroSistemaService {
    private final ParametroSistemaRepository repo;

    public ParametroSistemaService(ParametroSistemaRepository repo) {
        this.repo = repo;
    }

    /** Devuelve el valor (string) de un parámetro o lanza error si falta */
    public String getValor(String clave) {
        return repo.findByClave(clave)
                .map(p -> p.getValor())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Parámetro de sistema faltante: " + clave));
    }
}
