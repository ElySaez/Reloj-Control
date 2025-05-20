package com.relojcontrol.reloj_control.dto;

import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Justificacion;
import com.relojcontrol.reloj_control.model.TipoPermiso;

import java.time.LocalDate;
import java.util.Objects;

public class JustificacionListadoDTO {

    private Long idJustificacion;

    private Empleado empleado;

    private TipoPermiso tipoPermiso;

    private LocalDate fechaInicio;

    private LocalDate fechaTermino;

    private String motivo;

    private String estado;

    private Boolean archivo;

    public JustificacionListadoDTO(Long idJustificacion, Empleado empleado, TipoPermiso tipoPermiso, LocalDate fechaInicio, LocalDate fechaTermino, String motivo, String estado, Boolean archivo) {
        this.idJustificacion = idJustificacion;
        this.empleado = empleado;
        this.tipoPermiso = tipoPermiso;
        this.fechaInicio = fechaInicio;
        this.fechaTermino = fechaTermino;
        this.motivo = motivo;
        this.estado = estado;
        this.archivo = archivo;
    }

    public JustificacionListadoDTO(Justificacion j) {
        this.idJustificacion = j.getIdJustificacion();
        this.empleado = j.getEmpleado();
        this.tipoPermiso = j.getTipoPermiso();
        this.fechaInicio = j.getFechaInicio();
        this.fechaTermino = j.getFechaTermino();
        this.motivo = j.getMotivo();
        this.estado = j.getEstado();
        this.archivo = Objects.nonNull(j.getArchivoAdjunto());
    }

    public Long getIdJustificacion() {
        return idJustificacion;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public TipoPermiso getTipoPermiso() {
        return tipoPermiso;
    }

    public void setTipoPermiso(TipoPermiso tipoPermiso) {
        this.tipoPermiso = tipoPermiso;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaTermino() {
        return fechaTermino;
    }

    public void setFechaTermino(LocalDate fechaTermino) {
        this.fechaTermino = fechaTermino;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Boolean getArchivo() {
        return archivo;
    }

    public void setArchivo(Boolean archivo) {
        this.archivo = archivo;
    }
}
