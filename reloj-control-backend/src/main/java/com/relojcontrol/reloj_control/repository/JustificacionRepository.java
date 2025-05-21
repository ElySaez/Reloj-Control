package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Justificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JustificacionRepository extends JpaRepository<Justificacion,Integer> {
    List<Justificacion> findAllByEmpleadoRut(String rutEmpleado);

    Optional<Justificacion> findByIdJustificacion(Long id);
}
