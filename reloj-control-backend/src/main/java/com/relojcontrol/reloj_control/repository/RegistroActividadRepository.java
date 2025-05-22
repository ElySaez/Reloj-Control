package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.RegistroActividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistroActividadRepository
        extends JpaRepository<RegistroActividad, Long> {
    List<RegistroActividad> findAllByIdUsuario(Integer idUsuario);
}
