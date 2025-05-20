package com.relojcontrol.reloj_control.dto;

import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Justificacion;
import com.relojcontrol.reloj_control.model.TipoPermiso;
import jakarta.persistence.*;

import java.time.LocalDate;

public class JustificacionListadoDTO {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id_justificacion")
    private Long idJustificacion;

    @ManyToOne
    @JoinColumn(name = "id_empleado", nullable = false)
    private Empleado empleado;

    @ManyToOne
    @JoinColumn(name = "tipo_permiso", nullable = false)
    private TipoPermiso tipoPermiso;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_termino", nullable = false)
    private LocalDate fechaTermino;

    @Column(columnDefinition = "text")
    private String motivo;

    @Column(nullable = false)
    private String estado;

    public JustificacionListadoDTO(Long idJustificacion, Empleado empleado, TipoPermiso tipoPermiso, LocalDate fechaInicio, LocalDate fechaTermino, String motivo, String estado) {
        this.idJustificacion = idJustificacion;
        this.empleado = empleado;
        this.tipoPermiso = tipoPermiso;
        this.fechaInicio = fechaInicio;
        this.fechaTermino = fechaTermino;
        this.motivo = motivo;
        this.estado = estado;
    }

    public JustificacionListadoDTO(Justificacion j) {
        this.idJustificacion = j.getIdJustificacion();
        this.empleado = j.getEmpleado();
        this.tipoPermiso = j.getTipoPermiso();
        this.fechaInicio = j.getFechaInicio();
        this.fechaTermino = j.getFechaTermino();
        this.motivo = j.getMotivo();
        this.estado = j.getEstado();
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
}
