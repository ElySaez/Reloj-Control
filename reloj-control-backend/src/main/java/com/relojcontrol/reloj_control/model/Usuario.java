package com.relojcontrol.reloj_control.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(nullable = false, unique = true)
    private String run;

    @Column(name = "contrasena_hash", nullable = false)
    private String contrasenaHash;

    @Column(nullable = false)
    private String rol;

    @Column(name = "estado_cuenta", nullable = false)
    private String estadoCuenta;

    // Constructor que vamos a usar en seedData()
    public Usuario(String run, String contrasenaHash, String rol, String estadoCuenta) {
        this.run = run;
        this.contrasenaHash = contrasenaHash;
        this.rol = rol;
        this.estadoCuenta = estadoCuenta;
    }

    // Constructor vacío necesario para JPA
    public Usuario() {}

    // Getters y setters
    public Integer getIdUsuario() { return idUsuario; }
    public String getRun() { return run; }
    public void setRun(String run) { this.run = run; }
    public String getContrasenaHash() { return contrasenaHash; }
    public void setContrasenaHash(String h) { this.contrasenaHash = h; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public String getEstadoCuenta() { return estadoCuenta; }
    public void setEstadoCuenta(String e) { this.estadoCuenta = e; }
}
