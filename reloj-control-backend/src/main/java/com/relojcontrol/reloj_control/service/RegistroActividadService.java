package com.relojcontrol.reloj_control.service;

import com.relojcontrol.reloj_control.exception.BadRequestException;
import com.relojcontrol.reloj_control.model.RegistroActividad;
import com.relojcontrol.reloj_control.model.Usuario;
import com.relojcontrol.reloj_control.repository.RegistroActividadRepository;
import com.relojcontrol.reloj_control.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.text.MessageFormat;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistroActividadService implements IRegistroActividadService {

    private final RegistroActividadRepository registroActividadRepository;

    private final UsuarioRepository usuarioRepository;

    public RegistroActividadService(RegistroActividadRepository registroActividadRepository, UsuarioRepository usuarioRepository) {
        this.registroActividadRepository = registroActividadRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public List<RegistroActividad> obtenerRegistroDeActividadPorUsuario(String run) {
        Usuario usuario = usuarioRepository.findByRun(run).orElseThrow(() -> new BadRequestException(MessageFormat.format("No existe un usuario asociado al run {0}", run)));
        return registroActividadRepository.findAllByIdUsuario(usuario.getIdUsuario());
    }
}
