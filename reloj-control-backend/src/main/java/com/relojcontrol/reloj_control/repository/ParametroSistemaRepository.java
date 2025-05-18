package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.ParametroSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ParametroSistemaRepository
        extends JpaRepository<ParametroSistema, Integer> {
    Optional<ParametroSistema> findByClave(String clave);
}
