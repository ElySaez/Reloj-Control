package com.relojcontrol.reloj_control.dto;

public class ResumenAsistenciaDTO {
    private String nombre;
    private String entrada;
    private String salida;
    private String salidaEsperada;
    private long minutosExtra25;
    private long minutosExtra50;

    public ResumenAsistenciaDTO() {}

    public ResumenAsistenciaDTO(String nombre,
                                String entrada,
                                String salida,
                                String salidaEsperada,
                                long minutosExtra25,
                                long minutosExtra50) {
        this.nombre         = nombre;
        this.entrada        = entrada;
        this.salida         = salida;
        this.salidaEsperada = salidaEsperada;
        this.minutosExtra25 = minutosExtra25;
        this.minutosExtra50 = minutosExtra50;
    }

    // Getters
    public String getNombre() {
        return nombre;
    }

    public String getEntrada() {
        return entrada;
    }

    public String getSalida() {
        return salida;
    }

    public String getSalidaEsperada() {
        return salidaEsperada;
    }

    public long getMinutosExtra25() {
        return minutosExtra25;
    }

    public long getMinutosExtra50() {
        return minutosExtra50;
    }

    // Setters
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setEntrada(String entrada) {
        this.entrada = entrada;
    }

    public void setSalida(String salida) {
        this.salida = salida;
    }

    public void setSalidaEsperada(String salidaEsperada) {
        this.salidaEsperada = salidaEsperada;
    }

    public void setMinutosExtra25(long minutosExtra25) {
        this.minutosExtra25 = minutosExtra25;
    }

    public void setMinutosExtra50(long minutosExtra50) {
        this.minutosExtra50 = minutosExtra50;
    }
}
