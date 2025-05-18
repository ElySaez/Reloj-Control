package com.relojcontrol.reloj_control.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(nullable = false, unique = true)
    private String correo;

    @Column(name = "contrasena_hash", nullable = false)
    private String contrasenaHash;

    @Column(nullable = false)
    private String rol;

    @Column(name = "estado_cuenta", nullable = false)
    private String estadoCuenta;

    // Constructor que vamos a usar en seedData()
    public Usuario(String correo, String contrasenaHash, String rol, String estadoCuenta) {
        this.correo = correo;
        this.contrasenaHash = contrasenaHash;
        this.rol = rol;
        this.estadoCuenta = estadoCuenta;
    }

    // Constructor vacío necesario para JPA
    public Usuario() {}

    // Getters y setters
    public Integer getIdUsuario() { return idUsuario; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getContrasenaHash() { return contrasenaHash; }
    public void setContrasenaHash(String h) { this.contrasenaHash = h; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public String getEstadoCuenta() { return estadoCuenta; }
    public void setEstadoCuenta(String e) { this.estadoCuenta = e; }
}
