package com.relojcontrol.reloj_control.model;

import jakarta.persistence.*;

@Entity
@Table(name = "empleado")
public class Empleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_empleado")
    private Long idEmpleado;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(nullable = false, unique = true)
    private String rut;

    @Column
    private String unidad;

    @Column
    private String cargo;

    @OneToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    // 1) Constructor vacío que JPA requiere
    public Empleado() {}

    // 2) Constructor para tu seedData (nombre + rut)
    public Empleado(String nombreCompleto, String rut, Usuario usuario) {
        this.nombreCompleto = nombreCompleto;
        this.rut            = rut;
        this.usuario        = usuario;
    }

    // Getters y setters
    public Long getIdEmpleado() { return idEmpleado; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }

    public String getUnidad() { return unidad; }
    public void setUnidad(String unidad) { this.unidad = unidad; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}
