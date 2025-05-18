package com.relojcontrol.reloj_control.repository;
import com.relojcontrol.reloj_control.model.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado,Integer> {
    Optional<Empleado> findByRut(String rut);
    
    @Query("SELECT e FROM Empleado e WHERE " +
           "e.rut LIKE CONCAT(:rutBase, '%') OR " +
           "REPLACE(REPLACE(e.rut, '.', ''), '-', '') LIKE CONCAT(:rutBase, '%')")
    List<Empleado> findAllByRutStartingWith(@Param("rutBase") String rutBase);
}
