package com.relojcontrol.reloj_control.dto;

public class ResumenTotalDTO {
    private int totalRegistros;
    private int registrosAutorizados;
    private int registrosRechazados;
    private int registrosPendientes;
    private int horasExtrasAutorizadas;
    private int horasExtrasRechazadas;
    private int horasExtrasPendientes;

    public ResumenTotalDTO() {
        this.totalRegistros = 0;
        this.registrosAutorizados = 0;
        this.registrosRechazados = 0;
        this.registrosPendientes = 0;
        this.horasExtrasAutorizadas = 0;
        this.horasExtrasRechazadas = 0;
        this.horasExtrasPendientes = 0;
    }

    // Getters y Setters
    public int getTotalRegistros() {
        return totalRegistros;
    }

    public void setTotalRegistros(int totalRegistros) {
        this.totalRegistros = totalRegistros;
    }

    public int getRegistrosAutorizados() {
        return registrosAutorizados;
    }

    public void setRegistrosAutorizados(int registrosAutorizados) {
        this.registrosAutorizados = registrosAutorizados;
    }

    public int getRegistrosRechazados() {
        return registrosRechazados;
    }

    public void setRegistrosRechazados(int registrosRechazados) {
        this.registrosRechazados = registrosRechazados;
    }

    public int getRegistrosPendientes() {
        return registrosPendientes;
    }

    public void setRegistrosPendientes(int registrosPendientes) {
        this.registrosPendientes = registrosPendientes;
    }

    public int getHorasExtrasAutorizadas() {
        return horasExtrasAutorizadas;
    }

    public void setHorasExtrasAutorizadas(int horasExtrasAutorizadas) {
        this.horasExtrasAutorizadas = horasExtrasAutorizadas;
    }

    public int getHorasExtrasRechazadas() {
        return horasExtrasRechazadas;
    }

    public void setHorasExtrasRechazadas(int horasExtrasRechazadas) {
        this.horasExtrasRechazadas = horasExtrasRechazadas;
    }

    public int getHorasExtrasPendientes() {
        return horasExtrasPendientes;
    }

    public void setHorasExtrasPendientes(int horasExtrasPendientes) {
        this.horasExtrasPendientes = horasExtrasPendientes;
    }

    // Método para agregar un registro y actualizar los contadores
    public void agregarRegistro(ResumenAsistenciaDTO registro) {
        totalRegistros++;
        
        int minutosExtra = registro.getMinutosExtra25() + registro.getMinutosExtra50();
        
        switch (registro.getEstado()) {
            case "AUTORIZADO":
                registrosAutorizados++;
                horasExtrasAutorizadas += minutosExtra;
                break;
            case "RECHAZADO":
                registrosRechazados++;
                horasExtrasRechazadas += minutosExtra;
                break;
            case "PENDIENTE":
                registrosPendientes++;
                horasExtrasPendientes += minutosExtra;
                break;
        }
    }
} 