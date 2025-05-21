package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.CrearJustificacionDTO;
import com.relojcontrol.reloj_control.exception.BadRequestException;
import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Justificacion;
import com.relojcontrol.reloj_control.model.TipoPermiso;
import com.relojcontrol.reloj_control.model.enums.EstadoJustificacionEnum;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import com.relojcontrol.reloj_control.repository.JustificacionRepository;
import com.relojcontrol.reloj_control.repository.TipoPermisoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.text.MessageFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class JustificacionService implements IJustificacionService{

    private final JustificacionRepository justificacionRepository;
    private final EmpleadoRepository empleadoRepository;
    private final TipoPermisoRepository tipoPermisoRepository;
    private final IAsistenciaService iAsistenciaService;

    public JustificacionService(JustificacionRepository justificacionRepository,
                                EmpleadoRepository empleadoRepository,
                                TipoPermisoRepository tipoPermisoRepository,
                                IAsistenciaService iAsistenciaService) {
        this.justificacionRepository = justificacionRepository;
        this.empleadoRepository = empleadoRepository;
        this.tipoPermisoRepository = tipoPermisoRepository;
        this.iAsistenciaService = iAsistenciaService;
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

        validarSolapamiento(empleado.getIdEmpleado(), crearJustificacionDto.getFechaInicio(), crearJustificacionDto.getFechaTermino());

        if(tipoPermiso.getRequiereAdjuntos() && Objects.isNull(crearJustificacionDto.getArchivo())){
            throw new BadRequestException(MessageFormat.format("Tipo de permiso {0} requiere archivos adjuntos", tipoPermiso.getDescripcion()));
        }

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
        return justificacionRepository.findByIdJustificacion(id).orElseThrow(() -> new EntityNotFoundException("Justificacion no encontrada"));
    }

    @Override
    @Transactional
    public Justificacion actualizarEstadoJustificacion(Long id, EstadoJustificacionEnum estadoJustificacion) {
        Justificacion justificacion = getById(id);
        if(justificacion.getEstado().equals(EstadoJustificacionEnum.EN_PROCESO.getDescripcion())){
            justificacion.setMotivo(estadoJustificacion.getDescripcion());
            throw new BadRequestException("Solo se pueden actualizar justificaciones en estado EN PROCESO");
        }

        if(estadoJustificacion.getDescripcion().equals(EstadoJustificacionEnum.APROBADO.getDescripcion())) {
            iAsistenciaService.crearAsistenciaEnRangoDeFechasDesdeJustificacion(justificacion.getEmpleado(), justificacion.getFechaInicio(), justificacion.getFechaTermino(), justificacion.getTipoPermiso().getDescripcion());
        }
        justificacion.setEstado(estadoJustificacion.getDescripcion());
        return justificacionRepository.save(justificacion);
    }

    private void validarSolapamiento(
            Long idEmpleado,
            LocalDate inicio,
            LocalDate fin) {

        long solapamientos = justificacionRepository.countSolapamientos(idEmpleado, inicio, fin);

        if (solapamientos > 0) {
            throw new BadRequestException(
                    "Ya existe otra justificación para este empleado "
                            + "que se solapa con el rango de fechas indicado."
            );
        }
    }
}
