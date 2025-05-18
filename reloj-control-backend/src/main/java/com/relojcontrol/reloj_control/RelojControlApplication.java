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

	/**
	 * SEMILLA DE DATOS (ejecútalo UNA sola vez y luego comenta/elimina este método)
	 */
	@Bean
	public CommandLineRunner seedData(
			UsuarioRepository  uRepo,
			EmpleadoRepository eRepo,
			AsistenciaRepository aRepo
	) {
		return args -> {
			aRepo.deleteAll();
			eRepo.deleteAll();
			uRepo.deleteAll();

			Usuario uAna  = uRepo.save(new Usuario("ana@empresa.com",  "hashAna123", "ROLE_USER", "ACTIVO"));
			Usuario uLuis = uRepo.save(new Usuario("luis@empresa.com", "hashLuis456", "ROLE_USER", "ACTIVO"));

			// Usa el constructor de 3 parámetros:
			Empleado ana  = eRepo.save(new Empleado("Ana García", "12345678", uAna));
			Empleado luis = eRepo.save(new Empleado("Luis Pérez", "87654321", uLuis));

			aRepo.save(new Asistencia(ana,  LocalDateTime.now().minusDays(1).withHour(8).withMinute(10),  "ENTRADA"));
			aRepo.save(new Asistencia(ana,  LocalDateTime.now().minusDays(1).withHour(17).withMinute(10), "SALIDA"));
			aRepo.save(new Asistencia(luis, LocalDateTime.now().minusDays(2).withHour(8).withMinute(35),  "ENTRADA"));
			aRepo.save(new Asistencia(luis, LocalDateTime.now().minusDays(2).withHour(17).withMinute(35), "SALIDA"));

			System.out.println(">>> Datos de prueba iniciales creados.");
		};
	}


}
