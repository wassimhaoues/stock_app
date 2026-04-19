package com.wassim.stock.controller;

import com.wassim.stock.dto.request.EntrepotRequest;
import com.wassim.stock.dto.response.EntrepotResponse;
import com.wassim.stock.service.EntrepotService;
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
@RequestMapping("/api/entrepots")
@RequiredArgsConstructor
public class EntrepotController {

    private final EntrepotService entrepotService;

    @GetMapping
    public ResponseEntity<List<EntrepotResponse>> findAll() {
        return ResponseEntity.ok(entrepotService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntrepotResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(entrepotService.findById(id));
    }

    @PostMapping
    public ResponseEntity<EntrepotResponse> create(@Valid @RequestBody EntrepotRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entrepotService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntrepotResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody EntrepotRequest request) {
        return ResponseEntity.ok(entrepotService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        entrepotService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
