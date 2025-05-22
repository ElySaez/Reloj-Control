package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.model.Usuario;
import com.relojcontrol.reloj_control.repository.UsuarioRepository;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DetalleUsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepo;

    public DetalleUsuarioService(UsuarioRepository usuarioRepo) {
        this.usuarioRepo = usuarioRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String run) throws UsernameNotFoundException {
        Usuario u = usuarioRepo.findByRun(run)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + run));
        if (!"ACTIVO".equals(u.getEstadoCuenta())) {
            throw new DisabledException("Cuenta inactiva");
        }
        // El rol ya incluye prefijo “ROLE_”
        return new User(
                u.getRun(),
                u.getContrasenaHash(),
                List.of(new SimpleGrantedAuthority(u.getRol()))
        );
    }
}
