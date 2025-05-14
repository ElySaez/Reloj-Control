package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.model.RegistroActividad;
import com.relojcontrol.reloj_control.repository.RegistroActividadRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class RegistroActividadService {
    private final RegistroActividadRepository repo;
    public RegistroActividadService(RegistroActividadRepository repo) {
        this.repo = repo;
    }

    public void log(Integer idUsuario,
                    String accion,
                    String modulo,
                    String ipOrigen) {
        RegistroActividad r = new RegistroActividad(
                idUsuario,
                accion,
                LocalDateTime.now(),
                modulo,
                ipOrigen
        );
        repo.save(r);
    }
}
