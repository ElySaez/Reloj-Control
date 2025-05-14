package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.TipoPermiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoPermisoRepository extends JpaRepository<TipoPermiso,Integer> { }
