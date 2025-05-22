package com.relojcontrol.reloj_control.config.registro;

import com.relojcontrol.reloj_control.model.RegistroActividad;
import com.relojcontrol.reloj_control.model.Usuario;
import com.relojcontrol.reloj_control.repository.RegistroActividadRepository;
import com.relojcontrol.reloj_control.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class RegistroActividadListener
        implements ApplicationListener<AuthenticationSuccessEvent> {

    private final RegistroActividadRepository repo;
    private final UsuarioRepository userRepo;
    private final HttpServletRequest request;

    public RegistroActividadListener(RegistroActividadRepository repo,
                                       UsuarioRepository userRepo,
                                       HttpServletRequest request) {
        this.repo    = repo;
        this.userRepo = userRepo;
        this.request  = request;
    }

    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        String run = event.getAuthentication().getName();
        Integer idUsuario = userRepo.findByRun(run)
                .map(Usuario::getIdUsuario)
                .orElseThrow();

        RegistroActividad log = new RegistroActividad();
        log.setIdUsuario(idUsuario);
        log.setAccion("LOGIN_SUCCESS");
        log.setFechaHora(LocalDateTime.now());
        log.setModulo("AuthController");
        log.setIpOrigen(request.getRemoteAddr());
        repo.save(log);
    }
}