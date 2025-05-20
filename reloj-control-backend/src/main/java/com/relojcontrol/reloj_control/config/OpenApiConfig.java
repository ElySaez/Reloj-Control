package com.relojcontrol.reloj_control.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API de Reloj Control")
                        .version("1.0")
                        .description("API para el sistema de control de asistencia")
                        .contact(new Contact()
                                .name("Equipo de Desarrollo")
                                .email("desarrollo@empresa.com")));
    }
} 