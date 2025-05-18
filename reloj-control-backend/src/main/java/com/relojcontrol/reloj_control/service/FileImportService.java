package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.model.Asistencia;
import com.relojcontrol.reloj_control.model.Empleado;
import com.relojcontrol.reloj_control.repository.AsistenciaRepository;
import com.relojcontrol.reloj_control.repository.EmpleadoRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;           // <<– Añade esto
import java.io.InputStreamReader;       // <<– ...y esto
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class FileImportService {
    private final EmpleadoRepository fRepo;
    private final AsistenciaRepository aRepo;
    private final DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public FileImportService(EmpleadoRepository fRepo,
                             AsistenciaRepository aRepo) {
        this.fRepo = fRepo;
        this.aRepo = aRepo;
    }

    public void importarDat(MultipartFile file) throws Exception {
        // Uso de tipo explícito en el try-with-resources
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] cols = line.trim().split("\\t");
                if (cols.length < 2) continue;

                String rutSinDV = cols[0].trim();
                LocalDateTime fechaHora = LocalDateTime.parse(cols[1], fmt);

                Empleado func = fRepo.findByRut(rutSinDV)
                        .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: " + rutSinDV));

                Asistencia a = new Asistencia(func, fechaHora);
                aRepo.save(a);
            }
        }
    }
}
