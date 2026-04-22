package com.wassim.stock.controller;

import com.wassim.stock.dto.response.AlerteResponse;
import com.wassim.stock.service.AlerteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
public class AlerteController {

    private final AlerteService alerteService;

    @GetMapping
    public ResponseEntity<List<AlerteResponse>> findAll() {
        return ResponseEntity.ok(alerteService.findAll());
    }
}
