package com.wassim.stock.controller;

import com.wassim.stock.dto.request.UtilisateurRequest;
import com.wassim.stock.dto.response.UtilisateurResponse;
import com.wassim.stock.service.UtilisateurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    public ResponseEntity<List<UtilisateurResponse>> findAll() {
        return ResponseEntity.ok(utilisateurService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UtilisateurResponse> create(@Valid @RequestBody UtilisateurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody UtilisateurRequest request) {
        return ResponseEntity.ok(utilisateurService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        utilisateurService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
