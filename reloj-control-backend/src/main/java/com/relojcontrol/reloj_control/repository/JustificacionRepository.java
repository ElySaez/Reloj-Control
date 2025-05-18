package com.relojcontrol.reloj_control.repository;

import com.relojcontrol.reloj_control.model.Justificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JustificacionRepository extends JpaRepository<Justificacion,Integer> { }
