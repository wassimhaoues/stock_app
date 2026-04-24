package com.wassim.stock.controller;

import com.wassim.stock.dto.request.MouvementStockRequest;
import com.wassim.stock.dto.response.MouvementStockResponse;
import com.wassim.stock.dto.response.PagedResponse;
import com.wassim.stock.service.MouvementStockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/mouvements-stock")
@RequiredArgsConstructor
public class MouvementStockController {

    private final MouvementStockService mouvementStockService;

    @GetMapping
    public ResponseEntity<PagedResponse<MouvementStockResponse>> findAll(
            @PageableDefault(page = 0, size = 20, sort = "date", direction = org.springframework.data.domain.Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(mouvementStockService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MouvementStockResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(mouvementStockService.findById(id));
    }

    @PostMapping
    public ResponseEntity<MouvementStockResponse> create(@Valid @RequestBody MouvementStockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mouvementStockService.create(request));
    }
}
