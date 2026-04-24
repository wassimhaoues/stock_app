package com.wassim.stock.exception;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TestExceptionController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void returnsBadRequestJsonBody() throws Exception {
        mockMvc.perform(get("/test-exceptions/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Requete invalide"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void returnsNotFoundJsonBody() throws Exception {
        mockMvc.perform(get("/test-exceptions/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Ressource introuvable"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void returnsConflictJsonBody() throws Exception {
        mockMvc.perform(get("/test-exceptions/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Conflit detecte"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void returnsValidationErrorJsonBody() throws Exception {
        mockMvc.perform(post("/test-exceptions/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nom":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation échouée"))
                .andExpect(jsonPath("$.errors.nom").value("Le nom est requis"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void returnsInternalServerErrorJsonBody() throws Exception {
        mockMvc.perform(get("/test-exceptions/internal"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Erreur interne du serveur"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @RestController
    @Validated
    @RequestMapping("/test-exceptions")
    static class TestExceptionController {

        @GetMapping("/bad-request")
        void badRequest() {
            throw new BadRequestException("Requete invalide");
        }

        @GetMapping("/not-found")
        void notFound() {
            throw new ResourceNotFoundException("Ressource introuvable");
        }

        @GetMapping("/conflict")
        void conflict() {
            throw new ConflictException("Conflit detecte");
        }

        @PostMapping("/validation")
        void validation(@Valid @RequestBody ValidationRequest request) {
        }

        @GetMapping("/internal")
        void internal() {
            throw new IllegalStateException("Boom");
        }
    }

    record ValidationRequest(@NotBlank(message = "Le nom est requis") String nom) {
    }
}
