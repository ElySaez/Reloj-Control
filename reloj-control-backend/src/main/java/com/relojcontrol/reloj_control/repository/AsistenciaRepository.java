package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    // busca todas las marcas entre dos instantes
    @Query("SELECT a FROM Asistencia a WHERE DATE(a.fechaHora) = :fecha")
    List<Asistencia> findAllByFecha(@Param("fecha") LocalDate fecha);

    @Query("SELECT a FROM Asistencia a WHERE a.fechaHora BETWEEN :desde AND :hasta")
    List<Asistencia> findAllByFechaHoraBetween(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    List<Asistencia> findAllByEmpleadoIdEmpleado(Long empleadoId);

    // Busca todas las marcas de un empleado por RUT
    @Query("SELECT a FROM Asistencia a WHERE a.empleado.rut = :rut")
    List<Asistencia> findAllByEmpleadoRut(@Param("rut") String rut);

    // Busca todas las marcas de un empleado por RUT entre dos fechas
    @Query("SELECT a FROM Asistencia a WHERE a.empleado.rut = :rut AND a.fechaHora BETWEEN :desde AND :hasta")
    List<Asistencia> findAllByEmpleadoRutAndFechaBetween(
            @Param("rut") String rut,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    // Busca todas las marcas por RUT parcial entre dos fechas
    @Query("SELECT a FROM Asistencia a WHERE " +
            "a.empleado.rut LIKE CONCAT(:rutParcial, '%') " +
            "AND a.fechaHora BETWEEN :desde AND :hasta")
    List<Asistencia> findAllByRutParcialAndFechaBetween(
            @Param("rutParcial") String rutParcial,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    // Busca todas las marcas de un empleado por ID entre dos fechas
    List<Asistencia> findAllByEmpleadoIdEmpleadoAndFechaHoraBetween(
            Long empleadoId,
            LocalDateTime inicio,
            LocalDateTime fin
    );

    // Busca todas las marcas por RUT parcial entre dos fechas (búsqueda flexible)
    @Query("SELECT a FROM Asistencia a WHERE " +
            "(a.empleado.rut LIKE CONCAT(:rutParcial, '%') OR " +
            "REPLACE(REPLACE(a.empleado.rut, '.', ''), '-', '') LIKE CONCAT(:rutParcial, '%')) " +
            "AND a.fechaHora BETWEEN :desde AND :hasta")
    List<Asistencia> findAllByRutParcialFlexibleAndFechaBetween(
            @Param("rutParcial") String rutParcial,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    @Query("SELECT EXISTS(SELECT 1 FROM Asistencia a WHERE a.empleado.idEmpleado = :idEmpleado AND DATE(a.fechaHora) = :fecha AND a.tipo = :tipo AND a.esOficial = true)")
    boolean existsAsistenciaOficialEnFecha(
            @Param("idEmpleado") Long idEmpleado,
            @Param("fecha") LocalDate fecha,
            @Param("tipo") String tipo
    );

    @Query("SELECT a FROM Asistencia a WHERE a.empleado.idEmpleado = :idEmpleado AND DATE(a.fechaHora) = :fecha AND a.tipo = :tipo AND a.esOficial = true")
    Optional<Asistencia> findAsistenciaOficialEnFecha(
            @Param("idEmpleado") Long idEmpleado,
            @Param("fecha") LocalDate fecha,
            @Param("tipo") String tipo
    );

    boolean existsByEmpleadoIdEmpleadoAndFechaHora(Long idEmpleado, LocalDateTime fechaHora);

    @Query(value = "SELECT a.id, a.empleado_id, a.es_oficial, a.estado, a.fecha_hora, a.tipo " + // Lista explícitamente las columnas de tu entidad
            "FROM asistencias a " + // Usa el nombre real de tu tabla
            "WHERE CAST(a.fecha_hora AS DATE) >= :fechaInicio " + // Usa el nombre real de tu columna timestamp
            "AND CAST(a.fecha_hora AS DATE) <= :fechaFin " +
            "AND CAST(a.fecha_hora AS TIME) > :horaLimite",
            nativeQuery = true)
    List<Asistencia> findAsistenciasEnRangoFechasYDespuesDeHoraLimiteNativa(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("horaLimite") LocalTime horaLimite
    );

}
