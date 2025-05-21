package com.relojcontrol.reloj_control.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum EstadoJustificacionEnum {
    EN_PROCESO("EN PROCESO"),
    APROBADO("APROBADO"),
    RECHAZADO("RECHAZADO");

    /** Descripción legible del estado. */
    private final String descripcion;

    EstadoJustificacionEnum(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Devuelve la descripción legible; se usa al serializar a JSON. */
    @JsonValue
    public String getDescripcion() {
        return descripcion;
    }
}
