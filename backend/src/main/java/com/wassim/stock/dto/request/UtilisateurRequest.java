package com.wassim.stock.dto.request;

import com.wassim.stock.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UtilisateurRequest(
        @NotBlank(message = "Le nom est obligatoire")
        String nom,

        @Email(message = "Email invalide")
        @NotBlank(message = "L'email est obligatoire")
        String email,

        String motDePasse,

        @NotNull(message = "Le role est obligatoire")
        Role role,

        String entrepotNom
) {
}
