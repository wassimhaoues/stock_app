package com.wassim.stock.service;

import com.wassim.stock.dto.request.ProduitRequest;
import com.wassim.stock.dto.response.ProduitResponse;
import com.wassim.stock.entity.Produit;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProduitServiceTest {

    @Mock private ProduitRepository produitRepository;
    @Mock private StockRepository stockRepository;
    @Mock private MouvementStockRepository mouvementStockRepository;

    @InjectMocks private ProduitService produitService;

    @Test
    void findAllReturnsMappedResponses() {
        when(produitRepository.findAll()).thenReturn(List.of(produit(1L, "Laptop")));

        List<ProduitResponse> result = produitService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nom()).isEqualTo("Laptop");
    }

    @Test
    void createTrimsAndPersistsProductFields() {
        when(produitRepository.findByNomIgnoreCase("Phone")).thenReturn(Optional.empty());
        when(produitRepository.save(any(Produit.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProduitResponse response = produitService.create(
                new ProduitRequest(" Phone ", " Informatique ", BigDecimal.valueOf(999), " Fournisseur ", 5)
        );

        assertThat(response.nom()).isEqualTo("Phone");
        assertThat(response.categorie()).isEqualTo("Informatique");
        assertThat(response.fournisseur()).isEqualTo("Fournisseur");
    }

    @Test
    void findByIdThrowsWhenNotFound() {
        when(produitRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findByIdReturnsResponseWhenFound() {
        when(produitRepository.findById(1L)).thenReturn(Optional.of(produit(1L, "Camera")));

        ProduitResponse response = produitService.findById(1L);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.nom()).isEqualTo("Camera");
    }

    @Test
    void createThrowsWhenNameAlreadyExists() {
        when(produitRepository.findByNomIgnoreCase("Laptop")).thenReturn(Optional.of(produit(5L, "Laptop")));

        assertThatThrownBy(() -> produitService.create(request("Laptop")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("existe deja");
        verify(produitRepository, never()).save(any());
    }

    @Test
    void createSavesAndReturnsMappedProduct() {
        when(produitRepository.findByNomIgnoreCase("Phone")).thenReturn(Optional.empty());
        when(produitRepository.save(any(Produit.class))).thenAnswer(inv -> {
            Produit p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });

        ProduitResponse response = produitService.create(request("Phone"));

        assertThat(response.nom()).isEqualTo("Phone");
        assertThat(response.id()).isEqualTo(10L);
    }

    @Test
    void updateThrowsWhenProductNotFound() {
        when(produitRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.update(99L, request("Phone")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateThrowsWhenNameTakenByAnotherProduct() {
        Produit current = produit(1L, "Laptop");
        Produit other = produit(2L, "Camera");
        when(produitRepository.findById(1L)).thenReturn(Optional.of(current));
        when(produitRepository.findByNomIgnoreCase("Camera")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> produitService.update(1L, request("Camera")))
                .isInstanceOf(BadRequestException.class);
        verify(produitRepository, never()).save(any());
    }

    @Test
    void updateSavesSuccessfullyWhenNameBelongsToSameProduct() {
        Produit current = produit(1L, "Laptop");
        when(produitRepository.findById(1L)).thenReturn(Optional.of(current));
        when(produitRepository.findByNomIgnoreCase("Laptop")).thenReturn(Optional.of(current));
        when(produitRepository.save(any())).thenReturn(current);

        ProduitResponse response = produitService.update(1L, request("Laptop"));

        assertThat(response.nom()).isEqualTo("Laptop");
    }

    @Test
    void deleteThrowsWhenProductLinkedToStock() {
        when(produitRepository.findById(1L)).thenReturn(Optional.of(produit(1L, "Laptop")));
        when(stockRepository.existsByProduitId(1L)).thenReturn(true);

        assertThatThrownBy(() -> produitService.delete(1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("stocks ou mouvements");
        verify(produitRepository, never()).delete(any());
    }

    @Test
    void deleteThrowsWhenProductLinkedToMouvement() {
        when(produitRepository.findById(1L)).thenReturn(Optional.of(produit(1L, "Laptop")));
        when(stockRepository.existsByProduitId(1L)).thenReturn(false);
        when(mouvementStockRepository.existsByProduitId(1L)).thenReturn(true);

        assertThatThrownBy(() -> produitService.delete(1L))
                .isInstanceOf(BadRequestException.class);
        verify(produitRepository, never()).delete(any());
    }

    @Test
    void deleteSucceedsWhenProductIsUnlinked() {
        Produit p = produit(1L, "Laptop");
        when(produitRepository.findById(1L)).thenReturn(Optional.of(p));
        when(stockRepository.existsByProduitId(1L)).thenReturn(false);
        when(mouvementStockRepository.existsByProduitId(1L)).thenReturn(false);

        produitService.delete(1L);

        verify(produitRepository).delete(p);
    }

    private Produit produit(Long id, String nom) {
        Produit p = new Produit();
        p.setId(id);
        p.setNom(nom);
        p.setCategorie("Informatique");
        p.setPrix(BigDecimal.valueOf(999));
        p.setFournisseur("Fournisseur");
        p.setSeuilMin(5);
        return p;
    }

    private ProduitRequest request(String nom) {
        return new ProduitRequest(nom, "Informatique", BigDecimal.valueOf(999), "Fournisseur", 5);
    }
}
