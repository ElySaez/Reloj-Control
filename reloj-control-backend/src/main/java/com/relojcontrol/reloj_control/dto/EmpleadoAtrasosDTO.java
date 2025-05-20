package com.relojcontrol.reloj_control.dto;


import com.relojcontrol.reloj_control.model.Empleado;


public class EmpleadoAtrasosDTO {

    private Long idEmpleado;

    private String nombreCompleto;

    private String rut;

    private String unidad;

    private String cargo;

    private Integer atrasos;

    public EmpleadoAtrasosDTO(Empleado empleado, Integer atrasos) {
        this.idEmpleado = empleado.getIdEmpleado();
        this.nombreCompleto = empleado.getNombreCompleto();
        this.rut = empleado.getRut();
        this.unidad = empleado.getUnidad();
        this.cargo = empleado.getCargo();
        this.atrasos = atrasos;
    }

    public EmpleadoAtrasosDTO() {
    }

    public Long getIdEmpleado() {
        return idEmpleado;
    }

    public void setIdEmpleado(Long idEmpleado) {
        this.idEmpleado = idEmpleado;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public Integer getAtrasos() {
        return atrasos;
    }

    public void setAtrasos(Integer atrasos) {
        this.atrasos = atrasos;
    }
}
