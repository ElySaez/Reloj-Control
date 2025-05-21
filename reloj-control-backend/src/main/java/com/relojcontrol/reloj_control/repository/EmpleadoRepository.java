package com.relojcontrol.reloj_control.repository;
import com.relojcontrol.reloj_control.model.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado,Integer> {
    Optional<Empleado> findByRut(String rut);

    Optional<Empleado> findByIdEmpleado(Long idEmpleado);
}
