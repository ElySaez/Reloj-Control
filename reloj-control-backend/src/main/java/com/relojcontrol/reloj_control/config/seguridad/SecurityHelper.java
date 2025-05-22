package com.relojcontrol.reloj_control.config.seguridad;

import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import com.relojcontrol.reloj_control.repository.JustificacionRepository;
import org.springframework.stereotype.Component;

@Component("securityHelper")
public class SecurityHelper {

    private final EmpleadoRepository empleadoRepo;
    private final JustificacionRepository justificacionRepository;

    public SecurityHelper(EmpleadoRepository empleadoRepo, JustificacionRepository justificacionRepository) {
        this.empleadoRepo = empleadoRepo;
        this.justificacionRepository = justificacionRepository;
    }

    /**
     * @param username el run obtenido de authentication.getName()
     * @param idEmpleado el id del empleado que se intenta consultar
     * @return true si ese empleado existe y su run coincide con el username
     */
    public boolean isEmpleadoOwner(String username, Long idEmpleado) {
        return empleadoRepo.findByIdEmpleado(idEmpleado)
                .map(emp -> username.equals(emp.getRut()))
                .orElse(false);
    }

    public boolean isEmpleadoOwner(String username, String run) {
        return empleadoRepo.findByRut(run)
                .map(emp -> username.equals(emp.getRut()))
                .orElse(false);
    }

    public boolean isJustificacionOwner(String username, Long idJustificacion) {
        return justificacionRepository.findByIdJustificacion(idJustificacion)
                .map(justificacion -> username.equals(justificacion.getEmpleado().getRut()))
                .orElse(false);
    }
}
