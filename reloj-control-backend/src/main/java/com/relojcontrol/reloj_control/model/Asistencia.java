package com.relojcontrol.reloj_control.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "asistencias")
public class Asistencia {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;

    @Column(nullable = false)
    private LocalDateTime fechaHora;

    @Column(nullable = false)
    private String tipo; // "ENTRADA", "SALIDA" o genérico "MARCA"

    @Column
    private String estado = "AUTORIZADO"; // "AUTORIZADO", "RECHAZADO", "PENDIENTE"

    @Column(name = "es_oficial")
    private Boolean esOficial;

    // Constructor por defecto (requerido por JPA)
    public Asistencia() {}

    // Constructor de conveniencia: siempre "MARCA"
    public Asistencia(Empleado empleado, LocalDateTime fechaHora) {
        this(empleado, fechaHora, "MARCA");
    }

    // Constructor completo: recibe tipo explícito
    public Asistencia(Empleado empleado, LocalDateTime fechaHora, String tipo) {
        this.empleado = empleado;
        this.fechaHora   = fechaHora;
        this.tipo        = tipo;
        this.estado      = "AUTORIZADO";// Por defecto AUTORIZADO
        this.esOficial = false;
    }

    public Asistencia(Empleado empleado, LocalDateTime fechaHora, String tipo, Boolean esOficial) {
        this.empleado = empleado;
        this.fechaHora = fechaHora;
        this.tipo = tipo;
        this.estado      = "AUTORIZADO";
        this.esOficial = esOficial;
    }

    public Boolean getEsOficial() {
        return esOficial;
    }

    public void setEsOficial(Boolean esOficial) {
        this.esOficial = esOficial;
    }

    // Getters y setters
    public Long getId() {
        return id;
    }
    public Empleado getEmpleado() {
        return empleado;
    }
    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }
    public LocalDateTime getFechaHora() {
        return fechaHora;
    }
    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }
    public String getTipo() {
        return tipo;
    }
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
    public String getEstado() {
        return estado;
    }
    public void setEstado(String estado) {
        this.estado = estado;
    }
}

