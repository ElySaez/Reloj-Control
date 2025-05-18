package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    // busca todas las marcas entre dos instantes
    List<Asistencia> findByFechaHoraBetween(LocalDateTime start, LocalDateTime end);
    List<Asistencia> findByEmpleado_IdEmpleado(Long empleadoId);
}
