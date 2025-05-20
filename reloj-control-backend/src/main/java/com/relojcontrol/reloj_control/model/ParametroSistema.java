package com.relojcontrol.reloj_control.model;

import jakarta.persistence.*;

@Entity
@Table(name = "parametro_sistema")
public class ParametroSistema {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id_parametro")
    private Long idParametro;

    @Column(nullable = false, unique = true)
    private String clave;

    @Column(nullable = false)
    private String valor;

    private String descripcion;

    // Getter/setter
    public Long getIdParametro() { return idParametro; }
    public String getClave()       { return clave; }
    public void setClave(String c) { this.clave = c; }
    public String getValor()       { return valor; }
    public void setValor(String v) { this.valor = v; }
    public String getDescripcion(){ return descripcion; }
    public void setDescripcion(String d) { this.descripcion = d; }
}
