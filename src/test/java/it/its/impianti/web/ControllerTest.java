package it.its.impianti.web;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasItem;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import it.its.impianti.domain.Ente;
import it.its.impianti.domain.EnteNonTrovatoException;
import it.its.impianti.domain.IdSorgenteDuplicatoException;
import it.its.impianti.domain.Provincia;
import it.its.impianti.domain.SorgenteNonDisponibileException;
import it.its.impianti.domain.TipoEnte;
import it.its.impianti.importazione.EsitoImport;
import it.its.impianti.importazione.ImportazioneService;
import it.its.impianti.service.EnteService;
import it.its.impianti.service.ProvinciaService;
import it.its.impianti.web.mapper.EnteMapper;
import it.its.impianti.web.mapper.ProvinciaMapper;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Lo strato web da solo: i servizi sono simulati, conta come si comportano rotte, validazione ed errori. */
@WebMvcTest({EnteController.class, ProvinciaController.class, ImportController.class})
@Import({EnteMapper.class, ProvinciaMapper.class})
class ControllerTest {

    private static final String CORPO_VALIDO = """
            { "idSorgente": "90001", "denominazione": "Polisportiva", "tipo": "PRIVATO",
              "provinciaId": 1, "comune": "Bari", "indirizzo": "VIA SPARANO 12", "telefono": "080 5461291" }
            """;

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private EnteService enteService;
    @MockitoBean
    private ProvinciaService provinciaService;
    @MockitoBean
    private ImportazioneService importazioneService;

    private static Ente ente(long id, String denominazione) {
        Ente ente = new Ente("9000" + id, denominazione, TipoEnte.PRIVATO, new Provincia("Bari"),
                "Bari", null, "0805461291");
        ente.setId(id);
        return ente;
    }

    // ---------------------------------------------------------------- POST ---

    @Test
    @DisplayName("POST /enti valido: 201, header Location e il nome della provincia nel corpo")
    void creaEnte() throws Exception {
        when(enteService.crea(any())).thenReturn(ente(1, "Polisportiva"));

        mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON).content(CORPO_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/enti/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.provincia").value("Bari"))
                .andExpect(jsonPath("$.provinciaId").doesNotExist());
    }

    @Test
    @DisplayName("POST /enti con campi non validi: 400 che elenca QUALI campi e perché")
    void campiNonValidi() throws Exception {
        mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON).content("""
                        { "idSorgente": "", "denominazione": "", "comune": "Bari", "provinciaId": -1,
                          "telefono": "0123456789012345678901234567890" }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Richiesta non valida"))
                .andExpect(jsonPath("$.errori[*].campo")
                        .value(containsInAnyOrder("idSorgente", "denominazione", "tipo", "provinciaId", "telefono")))
                .andExpect(jsonPath("$.errori[*].messaggio").isNotEmpty());
        verifyNoInteractions(enteService);
    }

    @Test
    @DisplayName("POST /enti con un tipo sconosciuto: 400 che indica il campo tipo")
    void tipoSconosciuto() throws Exception {
        mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON)
                        .content(CORPO_VALIDO.replace("PRIVATO", "MISTO")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Corpo malformato"))
                .andExpect(jsonPath("$.errori[0].campo").value("tipo"));
    }

    @Test
    @DisplayName("POST /enti con un corpo che non è JSON: 400")
    void corpoMalformato() throws Exception {
        mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON).content("{ non è json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Corpo malformato"));
    }

    @Test
    @DisplayName("POST /enti con un idSorgente già presente: 409")
    void conflitto() throws Exception {
        when(enteService.crea(any())).thenThrow(new IdSorgenteDuplicatoException("90001"));

        mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON).content(CORPO_VALIDO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.detail").value("Esiste già un ente con idSorgente 90001"));
    }

    // ----------------------------------------------------------------- GET ---

    @Test
    @DisplayName("GET /enti senza parametri: pagina 0 da 20, ordinata per denominazione crescente")
    void paginazioneDiDefault() throws Exception {
        when(enteService.elenco(any())).thenReturn(new PageImpl<>(List.of(ente(1, "A"))));

        mvc.perform(get("/enti"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenuto[0].denominazione").value("A"))
                .andExpect(jsonPath("$.contenuto[0].provincia").value("Bari"));

        Pageable pagina = pageableRicevuto();
        assertThat(pagina.getPageNumber()).isZero();
        assertThat(pagina.getPageSize()).isEqualTo(20);
        assertThat(pagina.getSort()).isEqualTo(Sort.by(Sort.Direction.ASC, "denominazione"));
    }

    @Test
    @DisplayName("GET /enti?size=100000: la dimensione è limitata a 100")
    void tettoDellaDimensione() throws Exception {
        when(enteService.elenco(any())).thenReturn(Page.empty());

        mvc.perform(get("/enti").param("size", "100000")).andExpect(status().isOk());

        assertThat(pageableRicevuto().getPageSize()).isEqualTo(100);
    }

    @Test
    @DisplayName("GET /enti/{id} inesistente: 404")
    void enteInesistente() throws Exception {
        when(enteService.trova(99L)).thenThrow(new EnteNonTrovatoException(99L));

        mvc.perform(get("/enti/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Ente con id 99 inesistente"));
    }

    @Test
    @DisplayName("GET /enti/abc: 400, l'id non è convertibile in numero")
    void idNonNumerico() throws Exception {
        mvc.perform(get("/enti/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errori[0].campo").value("id"));
    }

    @Test
    @DisplayName("GET /enti/0: 400, la validazione dei parametri vuole un id positivo")
    void idNonPositivo() throws Exception {
        mvc.perform(get("/enti/0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errori[*].campo").value(hasItem("id")));
        verifyNoInteractions(enteService);
    }

    @Test
    @DisplayName("GET /province/{id}/enti passa l'id e l'ordinamento di default al servizio")
    void entiDellaProvincia() throws Exception {
        when(enteService.perProvincia(eq(1L), any())).thenReturn(new PageImpl<>(List.of(ente(1, "A"))));

        mvc.perform(get("/province/1/enti"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenuto[0].provincia").value("Bari"));
    }

    // ---------------------------------------------------------- importazione ---

    @Test
    @DisplayName("POST /import/enti restituisce l'esito dell'importazione")
    void importazione() throws Exception {
        when(importazioneService.importa()).thenReturn(new EsitoImport(1739, 0, 1));

        mvc.perform(post("/import/enti"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inseriti").value(1739))
                .andExpect(jsonPath("$.giaPresenti").value(0))
                .andExpect(jsonPath("$.scartati").value(1));
    }

    @Test
    @DisplayName("POST /import/enti con la sorgente giù: 503 con Retry-After")
    void sorgenteGiu() throws Exception {
        when(importazioneService.importa()).thenThrow(new SorgenteNonDisponibileException("giù", null));

        mvc.perform(post("/import/enti"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(503));
    }

    @Test
    @DisplayName("GET /import/enti: 405, la risorsa accetta solo POST")
    void importSoloPost() throws Exception {
        mvc.perform(get("/import/enti")).andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("GET /enti/import: 400 — per questo l'import NON sta dentro /enti")
    void perchéNonEntiImport() throws Exception {
        // «import» viene preso come valore di {id}: la conversione a Long fallisce
        mvc.perform(get("/enti/import")).andExpect(status().isBadRequest());
    }

    private Pageable pageableRicevuto() {
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(enteService).elenco(captor.capture());
        return captor.getValue();
    }
}
