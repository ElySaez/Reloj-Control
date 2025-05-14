package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    // Permite buscar asistencia por empleado
    List<Asistencia> findByEmpleado_IdEmpleado(Long empleadoId);


}
