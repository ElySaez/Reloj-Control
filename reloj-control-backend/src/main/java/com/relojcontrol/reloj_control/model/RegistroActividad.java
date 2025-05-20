package com.relojcontrol.reloj_control.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "registro_actividad")
public class RegistroActividad {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id_log")
    private Long idLog;

    @Column(name = "id_usuario", nullable = false)
    private Integer idUsuario;

    @Column(nullable = false, length = 100)
    private String accion;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(nullable = false, length = 100)
    private String modulo;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    public RegistroActividad() {}

    public RegistroActividad(Integer idUsuario,
                             String accion,
                             LocalDateTime fechaHora,
                             String modulo,
                             String ipOrigen) {
        this.idUsuario  = idUsuario;
        this.accion     = accion;
        this.fechaHora  = fechaHora;
        this.modulo     = modulo;
        this.ipOrigen   = ipOrigen;
    }

    // getters / setters
    public Long getIdLog() { return idLog; }
    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer u) { this.idUsuario = u; }
    public String getAccion() { return accion; }
    public void setAccion(String a) { this.accion = a; }
    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime f) { this.fechaHora = f; }
    public String getModulo() { return modulo; }
    public void setModulo(String m) { this.modulo = m; }
    public String getIpOrigen() { return ipOrigen; }
    public void setIpOrigen(String ip) { this.ipOrigen = ip; }
}
