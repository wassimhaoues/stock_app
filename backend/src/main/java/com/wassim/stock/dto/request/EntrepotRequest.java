package com.wassim.stock.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EntrepotRequest(
        @NotBlank(message = "Le nom est obligatoire")
        String nom,

        @NotBlank(message = "L'adresse est obligatoire")
        String adresse,

        @NotNull(message = "La capacite est obligatoire")
        @Min(value = 1, message = "La capacite doit etre superieure a 0")
        Integer capacite
) {
}
