package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Justificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JustificacionRepository extends JpaRepository<Justificacion,Integer> {
    List<Justificacion> findAllByEmpleadoRut(String rutEmpleado);

    Optional<Justificacion> findByIdJustificacion(Long id);

    @Query("""
        SELECT COUNT(j)
          FROM Justificacion j
         WHERE j.empleado.idEmpleado = :idEmpleado
           AND j.fechaInicio <= :fin
           AND j.fechaTermino >= :inicio
        """)
    long countSolapamientos(
            @Param("idEmpleado") Long idEmpleado,
            @Param("inicio") LocalDate inicio,
            @Param("fin")    LocalDate fin);
}
