package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class FileImportService implements IFileImportService {
    private final EmpleadoRepository fRepo;
    private final AsistenciaRepository aRepo;
    private final DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public FileImportService(EmpleadoRepository fRepo,
                             AsistenciaRepository aRepo) {
        this.fRepo = fRepo;
        this.aRepo = aRepo;
    }

    private String determinarTipoMarca(Empleado empleado, LocalDateTime fechaHora) {
        // Contar las marcas del día para este empleado
        long marcasDelDia = aRepo.findAllByEmpleadoIdEmpleado(empleado.getIdEmpleado())
                .stream()
                .filter(a -> a.getFechaHora().toLocalDate().equals(fechaHora.toLocalDate()))
                .count();

        // Si el número de marcas es par (0, 2, 4...) entonces es una ENTRADA
        // Si es impar (1, 3, 5...) entonces es una SALIDA
        return marcasDelDia % 2 == 0 ? "ENTRADA" : "SALIDA";
    }

    @Override
    public void importarDat(MultipartFile file) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] cols = line.trim().split("\\t");
                if (cols.length < 2) continue;

                String rutSinDV = cols[0].trim();
                LocalDateTime fechaHora = LocalDateTime.parse(cols[1], fmt);

                fRepo.findByRut(rutSinDV)
                        .ifPresent(empleado -> {
                            String tipo = determinarTipoMarca(empleado, fechaHora);
                            Asistencia a = new Asistencia(empleado, fechaHora, tipo);
                            aRepo.save(a);
                        });
            }
        }
    }
}
