package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.dto.ResumenAsistenciaDTO;
import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AsistenciaService {

    private final AsistenciaRepository repo;
    private final ParametroSistemaService paramSvc;

    public AsistenciaService(AsistenciaRepository repo,
                             ParametroSistemaService paramSvc) {
        this.repo     = repo;
        this.paramSvc = paramSvc;
    }

    private int getIntParam(String clave) {
        return Integer.parseInt(paramSvc.getValor(clave));
    }

    /**
     * Calcula la hora de salida esperada para una entrada dada.
     */
    public LocalTime calcularSalidaEsperada(LocalTime horaEntrada) {
        int horasSemanales  = getIntParam("horas_semanales");   // 44
        int minutosColacion = getIntParam("minutos_colacion");  // 30
        int minutosTol      = getIntParam("minutos_tolerancia");// 12

        // minutos de jornada diaria = (44h * 60) / 5 días
        int minutosJornada = horasSemanales * 60 / 5;

        // normalizar entrada
        LocalTime base = LocalTime.of(8, 0);
        LocalTime entradaNorm = horaEntrada.isBefore(base) ? base : horaEntrada;

        return entradaNorm
                .plusMinutes(minutosJornada)
                .plusMinutes(minutosColacion)
                .plusMinutes(minutosTol);
    }

    /**
     * Devuelve el resumen de asistencia de todos los empleados para un día.
     */
    @Transactional(readOnly = true)
    public List<ResumenAsistenciaDTO> resumenPorDia(LocalDate dia) {
        LocalDateTime desde = dia.atStartOfDay();
        LocalDateTime hasta = dia.plusDays(1).atStartOfDay();

        // Traer solo las marcas de ese día
        List<Asistencia> marcas = repo.findByFechaHoraBetween(desde, hasta);

        // Agrupar por empleado
        Map<Long, List<Asistencia>> agrupado = marcas.stream()
                .collect(Collectors.groupingBy(a -> a.getEmpleado().getIdEmpleado()));

        return agrupado.values().stream().map(lista -> {
                    // buscar primero ENTRADA y luego SALIDA
                    Asistencia ent = lista.stream()
                            .filter(a -> "ENTRADA".equals(a.getTipo()))
                            .min((a,b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                            .orElseThrow();
                    Asistencia sal = lista.stream()
                            .filter(a -> "SALIDA".equals(a.getTipo()) &&
                                    a.getFechaHora().isAfter(ent.getFechaHora()))
                            .max((a,b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                            .orElse(null);

                    LocalTime horaEnt = ent.getFechaHora().toLocalTime();
                    LocalTime horaSalReal = sal != null
                            ? sal.getFechaHora().toLocalTime()
                            : null;

                    LocalTime horaSalEsp  = calcularSalidaEsperada(horaEnt);

                    long minutosExtra = sal != null
                            ? java.time.Duration
                            .between(horaSalEsp, horaSalReal)
                            .toMinutes()
                            : 0L;

                    return new ResumenAsistenciaDTO(
                            ent.getEmpleado().getNombreCompleto(),
                            horaEnt,
                            horaSalReal,
                            horaSalEsp,
                            minutosExtra
                    );
                })
                .collect(Collectors.toList());
    }
}
