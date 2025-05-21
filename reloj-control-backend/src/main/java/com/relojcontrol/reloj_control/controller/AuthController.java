package com.relojcontrol.reloj_control.controller;

import com.relojcontrol.reloj_control.config.JwtUtil;
import com.relojcontrol.reloj_control.service.DetalleUsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final DetalleUsuarioService uds;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authManager,
                          DetalleUsuarioService uds,
                          JwtUtil jwtUtil) {
        this.authManager = authManager;
        this.uds = uds;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        var token = new UsernamePasswordAuthenticationToken(
                req.run(), req.password());
        authManager.authenticate(token);  // lanza excepción si falla

        UserDetails user = uds.loadUserByUsername(req.run());
        String jwt = jwtUtil.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(jwt));
    }

    public static record AuthRequest(String run, String password) {}
    public static record AuthResponse(String token) {}
}
