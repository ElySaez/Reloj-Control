package com.relojcontrol.reloj_control.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tipo_permiso")
public class TipoPermiso {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id_permiso")
    private Integer idPermiso;

    @Column(nullable = false)
    private String descripcion;

    @Column(name = "requiere_adjuntos", nullable = false)
    private Boolean requiereAdjuntos;

    // Getters y setters
    public Integer getIdPermiso() { return idPermiso; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Boolean getRequiereAdjuntos() { return requiereAdjuntos; }
    public void setRequiereAdjuntos(Boolean requiereAdjuntos) { this.requiereAdjuntos = requiereAdjuntos; }
}
