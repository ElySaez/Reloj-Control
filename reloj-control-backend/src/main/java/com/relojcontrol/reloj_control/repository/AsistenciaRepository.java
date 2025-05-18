package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    @Query("SELECT a FROM Asistencia a JOIN a.empleado e WHERE " +
           "(e.rut LIKE CONCAT('%', :rutParcial, '%') OR " +
           "REPLACE(REPLACE(e.rut, '.', ''), '-', '') LIKE CONCAT('%', :rutParcial, '%')) " +
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
           "(a.empleado.rut LIKE CONCAT('%', :rutParcial, '%') OR " +
           "REPLACE(REPLACE(a.empleado.rut, '.', ''), '-', '') LIKE CONCAT('%', :rutParcial, '%')) " +
           "AND a.fechaHora BETWEEN :desde AND :hasta")
    List<Asistencia> findAllByRutParcialFlexibleAndFechaBetween(
        @Param("rutParcial") String rutParcial,
        @Param("desde") LocalDateTime desde,
        @Param("hasta") LocalDateTime hasta
    );
}
