package com.relojcontrol.reloj_control;

import com.relojcontrol.reloj_control.model.Feriado;
import com.relojcontrol.reloj_control.repository.FeriadoRepository;
import com.relojcontrol.reloj_control.service.FeriadoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class FeriadoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // This configuration replaces FeriadoService with a stubbed bean
    @TestConfiguration
    static class StubServiceConfig {
        @Bean
        public FeriadoService feriadoService() {
            FeriadoRepository feriadoRepository = null;
            return new FeriadoService(feriadoRepository) {
                @Override
                public List<Feriado> listarTodos() {
                    return List.of(new Feriado(1L, LocalDate.of(2025, 5, 21), "Día de las Glorias Navales", true));
                }

                @Override
                public Feriado agregarFeriado(LocalDate fecha, String descripcion) {
                    return new Feriado(99L, fecha, descripcion, true);
                }

                @Override
                public void eliminarFeriado(Long id) {
                    // Simulate successful deletion
                }

                @Override
                public boolean esFeriado(LocalDate fecha) {
                    return fecha.equals(LocalDate.of(2025, 5, 21));
                }

                @Override
                public List<Feriado> obtenerFeriadosEnRango(LocalDate inicio, LocalDate fin) {
                    return List.of(new Feriado(2L, LocalDate.of(2025, 5, 25), "Otro feriado", true));
                }
            };
        }
    }

    @Test
    @DisplayName("GET /api/feriados - returns list of feriados")
    void testListarFeriados() throws Exception {
        mockMvc.perform(get("/api/feriados"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion").value("Día de las Glorias Navales"));
    }

    @Test
    @DisplayName("POST /api/feriados - adds a new feriado")
    void testAgregarFeriado() throws Exception {
        mockMvc.perform(post("/api/feriados")
                        .param("fecha", "2025-06-01")
                        .param("descripcion", "Feriado Test")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descripcion").value("Feriado Test"))
                .andExpect(jsonPath("$.fecha").value("2025-06-01"));
    }

    @Test
    @DisplayName("DELETE /api/feriados/{id} - deletes feriado")
    void testEliminarFeriado() throws Exception {
        mockMvc.perform(delete("/api/feriados/1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/feriados/verificar - verifies if date is a feriado")
    void testVerificarFeriado() throws Exception {
        mockMvc.perform(get("/api/feriados/verificar")
                        .param("fecha", "2025-05-21"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    @DisplayName("GET /api/feriados/rango - returns feriados in range")
    void testFeriadosEnRango() throws Exception {
        mockMvc.perform(get("/api/feriados/rango")
                        .param("inicio", "2025-05-01")
                        .param("fin", "2025-06-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion").value("Otro feriado"));
    }
}