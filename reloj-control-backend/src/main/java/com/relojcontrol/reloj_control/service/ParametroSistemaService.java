package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.ParametroSistemaUpdateDTO;
import com.relojcontrol.reloj_control.model.ParametroSistema;
import com.relojcontrol.reloj_control.repository.ParametroSistemaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

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

    @Override
    public List<ParametroSistema> listarParametros() {
        return repo.findAll();
    }

    @Override
    public List<ParametroSistema> actualizarParametros(List<ParametroSistemaUpdateDTO> parametroUpdate) {
        List<ParametroSistema> parametrosActualizados = parametroUpdate.stream().map(parametroSistemaUpdateDTO -> {
            ParametroSistema parametro = this.findById(parametroSistemaUpdateDTO.getId());
            parametro.setValor(String.valueOf(parametroSistemaUpdateDTO.getValor()));
            return parametro;
        }).toList();
        return repo.saveAll(parametrosActualizados);
    }

    @Override
    public ParametroSistema findById(Long id) {
        return repo.findByIdParametro(id).orElseThrow(() -> new EntityNotFoundException("Parametro no existe"));
    }
}
