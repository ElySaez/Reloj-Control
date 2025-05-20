package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.CrearJustificacionDTO;
import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Justificacion;
import com.relojcontrol.reloj_control.model.TipoPermiso;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import com.relojcontrol.reloj_control.repository.JustificacionRepository;
import com.relojcontrol.reloj_control.repository.TipoPermisoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

@Service
public class JustificacionService implements IJustificacionService{

    private final JustificacionRepository justificacionRepository;
    private final EmpleadoRepository empleadoRepository;
    private final TipoPermisoRepository tipoPermisoRepository;

    public JustificacionService(JustificacionRepository justificacionRepository, EmpleadoRepository empleadoRepository, TipoPermisoRepository tipoPermisoRepository) {
        this.justificacionRepository = justificacionRepository;
        this.empleadoRepository = empleadoRepository;
        this.tipoPermisoRepository = tipoPermisoRepository;
    }

    @Override
    public List<Justificacion> listar(String rutEmpleado) {
        return justificacionRepository.findAllByEmpleadoRut(rutEmpleado);
    }

    @Override
    public Justificacion guardarJustificacion(CrearJustificacionDTO crearJustificacionDto){
        Empleado empleado = empleadoRepository.findByRut(crearJustificacionDto.getRutEmpleado())
                .orElseThrow(() -> new EntityNotFoundException("Empleado no encontrado"));

        TipoPermiso tipoPermiso = tipoPermisoRepository.findByDescripcion(crearJustificacionDto.getTipoPermiso())
                .orElseThrow(() -> new EntityNotFoundException("Tipo de permiso no encontrado"));

        Justificacion justificacion = new Justificacion();
        justificacion.setEmpleado(empleado);
        justificacion.setTipoPermiso(tipoPermiso);
        justificacion.setFechaInicio(crearJustificacionDto.getFechaInicio());
        justificacion.setFechaTermino(crearJustificacionDto.getFechaTermino());
        justificacion.setMotivo(crearJustificacionDto.getMotivo());
        try {
            if(Objects.nonNull(crearJustificacionDto.getArchivo())){
                justificacion.setArchivoAdjunto(crearJustificacionDto.getArchivo().getInputStream().readAllBytes());
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        justificacion.setEstado("Pendiente");

        return justificacionRepository.save(justificacion);
    }

    @Override
    public Justificacion getById(Long id) {
        return justificacionRepository.findByIdJustificacion(id);
    }
}
