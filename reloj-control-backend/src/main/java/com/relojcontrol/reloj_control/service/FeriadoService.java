package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.model.Feriado;
import com.relojcontrol.reloj_control.repository.FeriadoRepository;
import com.relojcontrol.reloj_control.util.FeriadosConstantes;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.util.List;

@Service
public class FeriadoService {

    private final FeriadoRepository feriadoRepository;

    public FeriadoService(FeriadoRepository feriadoRepository) {
        this.feriadoRepository = feriadoRepository;
    }

    public boolean esFeriado(LocalDate fecha) {
        return FeriadosConstantes.esFeriado(fecha);
    }

    public boolean esFinDeSemanaOFeriado(LocalDate fecha) {
        return fecha.getDayOfWeek() == DayOfWeek.SATURDAY || 
               fecha.getDayOfWeek() == DayOfWeek.SUNDAY || 
               esFeriado(fecha);
    }

    @Transactional(readOnly = true)
    public List<Feriado> obtenerFeriadosEnRango(LocalDate inicio, LocalDate fin) {
        return feriadoRepository.findFeriadosEnRango(inicio, fin);
    }

    @Transactional
    public Feriado agregarFeriado(LocalDate fecha, String descripcion) {
        Feriado feriado = new Feriado(fecha, descripcion);
        return feriadoRepository.save(feriado);
    }

    @Transactional
    public void eliminarFeriado(Long id) {
        feriadoRepository.findById(id).ifPresent(feriado -> {
            feriado.setActivo(false);
            feriadoRepository.save(feriado);
        });
    }

    @Transactional(readOnly = true)
    public List<Feriado> listarTodos() {
        return feriadoRepository.findAll();
    }
} 