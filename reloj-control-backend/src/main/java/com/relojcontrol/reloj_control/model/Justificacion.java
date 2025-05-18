package com.relojcontrol.reloj_control.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "justificacion")
public class Justificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_justificacion")
    private Integer idJustificacion;

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

    @Column(name = "archivo_adjunto")
    private String archivoAdjunto;

    @Column(nullable = false)
    private String estado;

    // Getters y setters...
    public Integer getIdJustificacion() { return idJustificacion; }
    public Empleado getEmpleado() { return empleado; }
    public void setEmpleado(Empleado e) { this.empleado = e; }
    public TipoPermiso getTipoPermiso() { return tipoPermiso; }
    public void setTipoPermiso(TipoPermiso t) { this.tipoPermiso = t; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate f) { this.fechaInicio = f; }
    public LocalDate getFechaTermino() { return fechaTermino; }
    public void setFechaTermino(LocalDate f) { this.fechaTermino = f; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String m) { this.motivo = m; }
    public String getArchivoAdjunto() { return archivoAdjunto; }
    public void setArchivoAdjunto(String a) { this.archivoAdjunto = a; }
    public String getEstado() { return estado; }
    public void setEstado(String e) { this.estado = e; }
}
