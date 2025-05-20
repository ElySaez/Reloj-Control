package com.relojcontrol.reloj_control;

import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.model.Usuario;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import com.relojcontrol.reloj_control.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class RelojControlApplication {

	public static void main(String[] args) {
		SpringApplication.run(RelojControlApplication.class, args);
	}

}
