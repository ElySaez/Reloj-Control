package com.relojcontrol.reloj_control.config.registro;

import com.relojcontrol.reloj_control.model.RegistroActividad;
import com.relojcontrol.reloj_control.model.Usuario;
import com.relojcontrol.reloj_control.repository.RegistroActividadRepository;
import com.relojcontrol.reloj_control.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Aspect
@Component
public class RegistroAspect {

    private final RegistroActividadRepository actividadRepository;
    private final UsuarioRepository usuarioRepository;

    private final HttpServletRequest request;

    public RegistroAspect(RegistroActividadRepository actividadRepository,
                          UsuarioRepository usuarioRepository,
                          HttpServletRequest request) {
        this.actividadRepository = actividadRepository;
        this.usuarioRepository = usuarioRepository;
        this.request = request;
    }

    @Pointcut("within(com.relojcontrol.reloj_control.controller..*)")
    public void controlador() {}

    @AfterReturning(pointcut = "controlador()", returning = "ret")
    public void logAfter(JoinPoint jp, Object ret) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return;
        }
        Optional<Usuario> usuario = usuarioRepository.findByRun(auth.getName());

        RegistroActividad log = new RegistroActividad();
        log.setIdUsuario(usuario.map(Usuario::getIdUsuario).orElse(null));
        log.setAccion(jp.getSignature().getName().toUpperCase());
        log.setFechaHora(LocalDateTime.now());
        log.setModulo(this.obtenerNombreControlador(jp.getSignature().getDeclaringTypeName()));
        log.setIpOrigen(request.getRemoteAddr());

        actividadRepository.save(log);
    }

    private String obtenerNombreControlador(String nombreCompleto){
        return nombreCompleto.substring(
                nombreCompleto.lastIndexOf("controller.") + "controller.".length());
    }
}
