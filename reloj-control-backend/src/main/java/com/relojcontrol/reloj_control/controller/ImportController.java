package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.service.FileImportService;            // <— import para tu servicio de importación
import com.relojcontrol.reloj_control.service.RegistroActividadService;    // <— import para tu servicio de logs
import jakarta.servlet.http.HttpServletRequest;                            // <— import para HttpServletRequest
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class ImportController {

    private final FileImportService importService;
    private final RegistroActividadService logService;
    private final HttpServletRequest request;

    public ImportController(FileImportService importService,
                            RegistroActividadService logService,
                            HttpServletRequest request) {
        this.importService = importService;
        this.logService    = logService;
        this.request       = request;
    }

    @PostMapping("/importar")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<?> importar(@RequestParam("file") MultipartFile file) {
        try {
            importService.importarDat(file);
            return ResponseEntity.ok("Importación exitosa");
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body("Error al importar: " + e.getMessage());
        }
    }

}

