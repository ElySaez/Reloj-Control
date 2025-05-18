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
import java.util.Optional;

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

    /**
     * Limpia un RUT eliminando puntos, guiones y dígito verificador si existe.
     * @param rut RUT a limpiar
     * @return RUT sin formato, solo la parte numérica
     */
    private String limpiarRut(String rut) {
        // Quitar puntos y guiones
        String rutLimpio = rut.replace(".", "").replace("-", "");
        
        // Si el último caracter es un dígito verificador (número o K), quitarlo
        if (rutLimpio.length() > 1) {
            char ultimoChar = rutLimpio.charAt(rutLimpio.length() - 1);
            if (Character.isDigit(ultimoChar) || ultimoChar == 'K' || ultimoChar == 'k') {
                rutLimpio = rutLimpio.substring(0, rutLimpio.length() - 1);
            }
        }
        
        return rutLimpio;
    }

    /**
     * Calcula el dígito verificador para un RUT chileno.
     * @param rutSinDV RUT sin dígito verificador
     * @return Dígito verificador (0-9 o K)
     */
    private String calcularDV(String rutSinDV) {
        try {
            int rut = Integer.parseInt(rutSinDV);
            int m = 0, s = 1;
            for (; rut != 0; rut /= 10) {
                s = (s + rut % 10 * (9 - m++ % 6)) % 11;
            }
            return (s > 0) ? String.valueOf(s - 1) : "K";
        } catch (NumberFormatException e) {
            return "0"; // En caso de error, devuelve 0 como valor por defecto
        }
    }

    /**
     * Formatea un RUT en el formato estándar chileno (XX.XXX.XXX-Y)
     * @param rutSinDV RUT sin dígito verificador
     * @return RUT formateado con dígito verificador
     */
    private String formatearRut(String rutSinDV) {
        String dv = calcularDV(rutSinDV);
        
        // Formatear con puntos
        StringBuilder rutFormateado = new StringBuilder(rutSinDV);
        for (int i = rutFormateado.length() - 3; i > 0; i -= 3) {
            rutFormateado.insert(i, '.');
        }
        
        // Añadir guion y dígito verificador
        return rutFormateado + "-" + dv;
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

                // Método 1: Calcular el dígito verificador y buscar por RUT completo
                String rutCompleto = formatearRut(rutSinDV);
                Optional<Empleado> empleadoOpt = fRepo.findByRut(rutCompleto);

                // Método 2 (respaldo): Si no lo encuentra, buscar por la parte numérica
                if (empleadoOpt.isEmpty()) {
                    String rutLimpio = limpiarRut(rutSinDV);
                    List<Empleado> empleados = fRepo.findAllByRutStartingWith(rutLimpio);
                    
                    if (!empleados.isEmpty()) {
                        Empleado empleado = empleados.get(0);
                        String tipo = determinarTipoMarca(empleado, fechaHora);
                        Asistencia a = new Asistencia(empleado, fechaHora, tipo);
                        aRepo.save(a);
                    }
                } else {
                    // Si lo encontró por RUT completo
                    Empleado empleado = empleadoOpt.get();
                    String tipo = determinarTipoMarca(empleado, fechaHora);
                    Asistencia a = new Asistencia(empleado, fechaHora, tipo);
                    aRepo.save(a);
                }
            }
        }
    }
}
