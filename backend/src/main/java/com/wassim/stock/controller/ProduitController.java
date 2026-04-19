package com.wassim.stock.controller;

import com.wassim.stock.dto.request.ProduitRequest;
import com.wassim.stock.dto.response.ProduitResponse;
import com.wassim.stock.service.ProduitService;
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
@RequestMapping("/api/produits")
@RequiredArgsConstructor
public class ProduitController {

    private final ProduitService produitService;

    @GetMapping
    public ResponseEntity<List<ProduitResponse>> findAll() {
        return ResponseEntity.ok(produitService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProduitResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(produitService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ProduitResponse> create(@Valid @RequestBody ProduitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produitService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProduitResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody ProduitRequest request) {
        return ResponseEntity.ok(produitService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        produitService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
