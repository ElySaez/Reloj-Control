package com.relojcontrol.reloj_control;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy
public class RelojControlApplication {

	public static void main(String[] args) {
		SpringApplication.run(RelojControlApplication.class, args);
	}

}
