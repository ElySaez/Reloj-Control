package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Feriado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface FeriadoRepository extends JpaRepository<Feriado, Long> {
    
    @Query("SELECT f FROM Feriado f WHERE f.activo = true AND f.fecha = :fecha")
    Feriado findByFecha(@Param("fecha") LocalDate fecha);
    
    @Query("SELECT f FROM Feriado f WHERE f.activo = true AND f.fecha BETWEEN :inicio AND :fin")
    List<Feriado> findFeriadosEnRango(@Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);
    
    boolean existsByFechaAndActivo(LocalDate fecha, boolean activo);
} 