package com.wassim.stock.controller;

import com.wassim.stock.dto.request.StockRequest;
import com.wassim.stock.dto.response.StockResponse;
import com.wassim.stock.service.StockService;
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
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping
    public ResponseEntity<List<StockResponse>> findAll() {
        return ResponseEntity.ok(stockService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(stockService.findById(id));
    }

    @PostMapping
    public ResponseEntity<StockResponse> create(@Valid @RequestBody StockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody StockRequest request) {
        return ResponseEntity.ok(stockService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        stockService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
