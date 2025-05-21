package com.relojcontrol.reloj_control.dto;

public class ParametroSistemaUpdateDTO {

    private Long id;

    private Integer valor;

    public ParametroSistemaUpdateDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getValor() {
        return valor;
    }

    public void setValor(Integer valor) {
        this.valor = valor;
    }
}
