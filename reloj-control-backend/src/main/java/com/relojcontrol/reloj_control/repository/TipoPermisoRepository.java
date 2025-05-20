package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.TipoPermiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoPermisoRepository extends JpaRepository<TipoPermiso,Integer> {
    Optional<TipoPermiso> findByDescripcion(String tipoPermiso);
}
