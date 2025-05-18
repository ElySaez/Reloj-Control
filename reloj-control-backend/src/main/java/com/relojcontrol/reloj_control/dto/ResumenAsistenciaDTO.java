package com.relojcontrol.reloj_control.dto;

public class ResumenAsistenciaDTO {
    private Long idAsistencia;
    private String fecha;
    private String nombre;
    private String rut;
    private String entrada;
    private String salida;
    private String salidaEsperada;
    private int minutosExtra25;
    private int minutosExtra50;
    private String estado;  // AUTORIZADO, RECHAZADO, PENDIENTE
    private boolean esDiaEspecial;  // true para feriados y fines de semana
    private String observaciones;  // Para indicar información adicional

    // Constructor por defecto
    public ResumenAsistenciaDTO() {
        this.estado = "AUTORIZADO";  // Estado por defecto cambiado a AUTORIZADO
        this.esDiaEspecial = false;
        this.observaciones = "";
    }

    // Getters y Setters
    public Long getIdAsistencia() {
        return idAsistencia;
    }

    public void setIdAsistencia(Long idAsistencia) {
        this.idAsistencia = idAsistencia;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getEntrada() {
        return entrada;
    }

    public void setEntrada(String entrada) {
        this.entrada = entrada;
    }

    public String getSalida() {
        return salida;
    }

    public void setSalida(String salida) {
        this.salida = salida;
    }

    public String getSalidaEsperada() {
        if (esDiaEspecial) {
            return "No aplica";
        }
        return salidaEsperada;
    }

    public void setSalidaEsperada(String salidaEsperada) {
        this.salidaEsperada = salidaEsperada;
    }

    public int getMinutosExtra25() {
        return minutosExtra25;
    }

    public void setMinutosExtra25(int minutosExtra25) {
        this.minutosExtra25 = minutosExtra25;
    }

    public int getMinutosExtra50() {
        return minutosExtra50;
    }

    public void setMinutosExtra50(int minutosExtra50) {
        this.minutosExtra50 = minutosExtra50;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public boolean isEsDiaEspecial() {
        return esDiaEspecial;
    }

    public void setEsDiaEspecial(boolean esDiaEspecial) {
        this.esDiaEspecial = esDiaEspecial;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    // Método para obtener el total de minutos extras considerando el estado
    public int getTotalMinutosExtras() {
        if ("AUTORIZADO".equals(estado)) {
            return minutosExtra25 + minutosExtra50;
        }
        return 0;  // Para estados RECHAZADO o PENDIENTE
    }
}
