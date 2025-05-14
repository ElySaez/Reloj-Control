package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AsistenciaService {

    private final AsistenciaRepository repo;

    public AsistenciaService(AsistenciaRepository repo) {
        this.repo = repo;
    }

    /**
     * Dada la hora de entrada, obtiene la hora de salida esperada:
     * - Si la entrada es antes de 08:00 → considerarla 08:00
     * - Si la entrada entre 08:00 y 09:00 → usarla tal cual
     * - Si posterior a 09:00 → usarla tal cual
     * La jornada dura 9 horas.
     */
    public LocalTime calcularSalidaEsperada(Asistencia entrada) {
        LocalTime in = entrada.getFechaHora().toLocalTime();
        if (in.isBefore(LocalTime.of(8, 0))) {
            in = LocalTime.of(8, 0);
        }
        return in.plusHours(9);
    }

    /**
     * Calcula cuántos minutos de extra (o falta) respecto a la salida esperada.
     * Retorna positivo si salió después de la hora esperada (extra),
     * negativo si salió antes (falta).
     */
    public long calcularMinutosExtra(Asistencia entrada, Asistencia salida) {
        LocalTime expectedOut = calcularSalidaEsperada(entrada);
        LocalTime actualOut   = salida.getFechaHora().toLocalTime();
        return java.time.temporal.ChronoUnit.MINUTES.between(expectedOut, actualOut);
    }

    /**
     * Devuelve todas las asistencias registradas en un día dado.
     */
    public List<Asistencia> findByDia(LocalDate dia) {
        return repo.findAll().stream()
                .filter(a -> a.getFechaHora().toLocalDate().equals(dia))
                .collect(Collectors.toList());
    }

    /**
     * Para cada marca de ENTRADA de ese día, empareja con la SALIDA siguiente
     * y construye un DTO con:
     *  - nombre de empleado
     *  - hora de entrada
     *  - hora de salida real
     *  - hora de salida esperada
     *  - minutos de extra (o falta)
     */
    public List<ResumenAsistenciaDTO> resumenPorDia(LocalDate dia) {
        List<Asistencia> todas = findByDia(dia);

        return todas.stream()
                .filter(a -> "ENTRADA".equals(a.getTipo()))
                .map(entrada -> {
                    Asistencia salida = todas.stream()
                            .filter(a2 ->
                                    a2.getEmpleado().getIdEmpleado().equals(entrada.getEmpleado().getIdEmpleado()) &&
                                            "SALIDA".equals(a2.getTipo()) &&
                                            a2.getFechaHora().isAfter(entrada.getFechaHora())
                            )
                            .findFirst()
                            .orElse(null);

                    LocalTime horaSalidaReal = salida != null
                            ? salida.getFechaHora().toLocalTime()
                            : null;

                    LocalTime salidaEsperada = calcularSalidaEsperada(entrada);
                    long minutosExtra = (salida != null)
                            ? calcularMinutosExtra(entrada, salida)
                            : 0L;

                    return new ResumenAsistenciaDTO(
                            entrada.getEmpleado().getNombreCompleto(),
                            entrada.getFechaHora().toLocalTime(),
                            horaSalidaReal,
                            salidaEsperada,
                            minutosExtra
                    );
                })
                .collect(Collectors.toList());
    }
}
