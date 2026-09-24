package it.its.impianti.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import it.its.impianti.domain.Ente;
import it.its.impianti.domain.EnteNonTrovatoException;
import it.its.impianti.domain.IdSorgenteDuplicatoException;
import it.its.impianti.domain.Provincia;
import it.its.impianti.domain.ProvinciaNonTrovataException;
import it.its.impianti.domain.TipoEnte;
import it.its.impianti.repository.EnteRepository;
import it.its.impianti.repository.ProvinciaRepository;
import it.its.impianti.web.dto.EnteRequest;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;

class EnteServiceTest {

    private final EnteRepository enteRepository = mock(EnteRepository.class);
    private final ProvinciaRepository provinciaRepository = mock(ProvinciaRepository.class);
    private final EnteService service = new EnteService(enteRepository, provinciaRepository);

    private static EnteRequest richiesta(String idSorgente) {
        return new EnteRequest(idSorgente, " Polisportiva ", TipoEnte.PRIVATO, 1L, " Bari ", "", "080 546 1291");
    }

    @Test
    @DisplayName("crea l'ente con la provincia indicata e i valori normalizzati")
    void crea() {
        when(provinciaRepository.findById(1L)).thenReturn(Optional.of(new Provincia("Bari")));
        when(enteRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        Ente ente = service.crea(richiesta(" 90001 "));

        assertThat(ente.getIdSorgente()).isEqualTo("90001");
        assertThat(ente.getDenominazione()).isEqualTo("Polisportiva");
        assertThat(ente.getComune()).isEqualTo("Bari");
        assertThat(ente.getIndirizzo()).isNull();
        assertThat(ente.getTelefono()).isEqualTo("0805461291");
        assertThat(ente.getProvincia().getNome()).isEqualTo("Bari");
    }

    @Test
    @DisplayName("un idSorgente già presente è un conflitto, e non si salva nulla")
    void idSorgenteDuplicato() {
        when(enteRepository.existsByIdSorgente("90001")).thenReturn(true);

        assertThatThrownBy(() -> service.crea(richiesta("90001")))
                .isInstanceOf(IdSorgenteDuplicatoException.class);
        verify(enteRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("se due richieste arrivano insieme decide il vincolo UNIQUE: diventa comunque un conflitto")
    void vincoloUniqueNellaCorsa() {
        when(provinciaRepository.findById(1L)).thenReturn(Optional.of(new Provincia("Bari")));
        when(enteRepository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("uk_ente_id_sorgente"));

        assertThatThrownBy(() -> service.crea(richiesta("90001")))
                .isInstanceOf(IdSorgenteDuplicatoException.class);
    }

    @Test
    @DisplayName("una provincia inesistente nel corpo dà ProvinciaNonTrovataException")
    void provinciaInesistente() {
        when(provinciaRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.crea(richiesta("90001")))
                .isInstanceOf(ProvinciaNonTrovataException.class);
    }

    @Test
    @DisplayName("un ente inesistente dà EnteNonTrovatoException")
    void enteInesistente() {
        when(enteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.trova(99L)).isInstanceOf(EnteNonTrovatoException.class);
    }

    @Test
    @DisplayName("gli enti di una provincia inesistente danno ProvinciaNonTrovataException")
    void entiDiUnaProvinciaInesistente() {
        when(provinciaRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> service.perProvincia(99L, Pageable.unpaged()))
                .isInstanceOf(ProvinciaNonTrovataException.class);
        verify(enteRepository, never()).findByProvinciaId(any(), any());
    }
}
