package com.relojcontrol.reloj_control.dto;

import java.time.LocalTime;

public class ResumenAsistenciaDTO {
    private String nombre;
    private LocalTime entrada;
    private LocalTime salida;
    private LocalTime salidaEsperada;
    private long minutosExtra;

    public ResumenAsistenciaDTO() {}

    public ResumenAsistenciaDTO(String nombre,
                                LocalTime entrada,
                                LocalTime salida,
                                LocalTime salidaEsperada,
                                long minutosExtra) {
        this.nombre         = nombre;
        this.entrada        = entrada;
        this.salida         = salida;
        this.salidaEsperada = salidaEsperada;
        this.minutosExtra   = minutosExtra;
    }

    // Getters
    public String getNombre() {
        return nombre;
    }

    public LocalTime getEntrada() {
        return entrada;
    }

    public LocalTime getSalida() {
        return salida;
    }

    public LocalTime getSalidaEsperada() {
        return salidaEsperada;
    }

    public long getMinutosExtra() {
        return minutosExtra;
    }

    // Setters
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setEntrada(LocalTime entrada) {
        this.entrada = entrada;
    }

    public void setSalida(LocalTime salida) {
        this.salida = salida;
    }

    public void setSalidaEsperada(LocalTime salidaEsperada) {
        this.salidaEsperada = salidaEsperada;
    }

    public void setMinutosExtra(long minutosExtra) {
        this.minutosExtra = minutosExtra;
    }
}
