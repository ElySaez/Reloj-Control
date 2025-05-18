package com.relojcontrol.reloj_control.util;

import java.time.LocalDate;
import java.time.MonthDay;
import java.util.Set;
import java.util.HashSet;

public class FeriadosConstantes {
    private static final Set<MonthDay> FERIADOS = new HashSet<>();
    
    static {
        // Feriados fijos anuales (MM-dd)
        FERIADOS.add(MonthDay.of(1, 1));   // Año Nuevo
        FERIADOS.add(MonthDay.of(3, 29));  // Viernes Santo
        FERIADOS.add(MonthDay.of(3, 30));  // Sábado Santo
        FERIADOS.add(MonthDay.of(5, 1));   // Día del Trabajo
        FERIADOS.add(MonthDay.of(5, 21));  // Día de las Glorias Navales
        FERIADOS.add(MonthDay.of(6, 9));   // Día de la Región de Arica y Parinacota
        FERIADOS.add(MonthDay.of(6, 20));  // Día Nacional de los Pueblos Indígenas
        FERIADOS.add(MonthDay.of(6, 29));  // San Pedro y San Pablo
        FERIADOS.add(MonthDay.of(7, 16));  // Día de la Virgen del Carmen
        FERIADOS.add(MonthDay.of(8, 15));  // Asunción de la Virgen
        FERIADOS.add(MonthDay.of(9, 18));  // Independencia Nacional
        FERIADOS.add(MonthDay.of(9, 19));  // Día de las Glorias del Ejército
        FERIADOS.add(MonthDay.of(9, 20));  // Feriado adicional
        FERIADOS.add(MonthDay.of(10, 12)); // Encuentro de Dos Mundos
        FERIADOS.add(MonthDay.of(10, 27)); // Día de las Iglesias Evangélicas y Protestantes
        FERIADOS.add(MonthDay.of(10, 31)); // Día Nacional de las Iglesias Evangélicas
        FERIADOS.add(MonthDay.of(11, 1));  // Día de Todos los Santos
        FERIADOS.add(MonthDay.of(12, 8));  // Inmaculada Concepción
        FERIADOS.add(MonthDay.of(12, 25)); // Navidad
    }

    public static boolean esFeriado(LocalDate fecha) {
        MonthDay monthDay = MonthDay.from(fecha);
        return FERIADOS.contains(monthDay);
    }
} 