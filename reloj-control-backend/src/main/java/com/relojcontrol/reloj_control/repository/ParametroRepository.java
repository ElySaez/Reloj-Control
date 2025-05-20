package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Parametro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParametroRepository extends JpaRepository<Parametro, Long> {
    Optional<Parametro> findByClave(String clave);
    boolean existsByClave(String clave);
} 