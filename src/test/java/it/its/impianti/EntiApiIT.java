package it.its.impianti;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/** Gli endpoint REST sull'applicazione intera, con PostgreSQL vero. */
class EntiApiIT extends IntegrazioneBase {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private String corpo(String idSorgente, String denominazione, long provinciaId) {
        return """
                { "idSorgente": "%s", "denominazione": "%s", "tipo": "PUBBLICO", "provinciaId": %d,
                  "comune": "Bari", "indirizzo": " VIA SPARANO 12 ", "telefono": "080 546 1291" }
                """.formatted(idSorgente, denominazione, provinciaId);
    }

    private void crea(String idSorgente, String denominazione) throws Exception {
        mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON).content(corpo(idSorgente, denominazione, 1)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /enti crea l'ente, e GET sull'header Location lo rilegge con il nome della provincia")
    void creaERileggi() throws Exception {
        String location = mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("90001", "Polisportiva San Nicola", 1)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        mvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idSorgente").value("90001"))
                .andExpect(jsonPath("$.provincia").value("Bari"))
                .andExpect(jsonPath("$.tipo").value("PUBBLICO"))
                .andExpect(jsonPath("$.indirizzo").value("VIA SPARANO 12"))
                .andExpect(jsonPath("$.telefono").value("0805461291"));
    }

    @Test
    @DisplayName("POST /enti con un idSorgente già presente: 409, anche se arriva dall'importazione")
    void idSorgenteGiaPresente() throws Exception {
        mvc.perform(post("/import/enti")).andExpect(status().isOk());

        mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON).content(corpo("13436", "Doppione", 6)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("POST /enti con una provincia inesistente: 404")
    void provinciaInesistente() throws Exception {
        mvc.perform(post("/enti").contentType(MediaType.APPLICATION_JSON).content(corpo("90002", "Circolo", 99)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /enti/{id} inesistente: 404 con ProblemDetail")
    void enteInesistente() throws Exception {
        mvc.perform(get("/enti/999999"))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", "application/problem+json"));
    }

    @Test
    @DisplayName("GET /province: le sei province con gli id assegnati dalla migrazione")
    void province() throws Exception {
        mvc.perform(get("/province"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totaleElementi").value(6))
                .andExpect(jsonPath("$.contenuto[0].id").value(1))
                .andExpect(jsonPath("$.contenuto[0].nome").value("Bari"))
                .andExpect(jsonPath("$.contenuto[1].nome").value("Barletta-Andria-Trani"))
                .andExpect(jsonPath("$.contenuto[5].nome").value("Taranto"));
    }

    @Test
    @DisplayName("GET /province/5/enti: solo gli enti di Lecce, 458 dopo l'importazione")
    void entiDiUnaProvincia() throws Exception {
        mvc.perform(post("/import/enti")).andExpect(status().isOk());

        mvc.perform(get("/province/5/enti"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totaleElementi").value(458))
                .andExpect(jsonPath("$.contenuto[*].provincia", everyItem(is("Lecce"))));
    }

    @Test
    @DisplayName("GET /province/99/enti: 404")
    void entiDiUnaProvinciaInesistente() throws Exception {
        mvc.perform(get("/province/99/enti")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /enti: 20 per pagina, ordinati per denominazione crescente")
    void paginazioneEOrdinamento() throws Exception {
        crea("1", "Circolo C");
        crea("2", "Associazione A");
        crea("3", "Bocciofila B");

        mvc.perform(get("/enti"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dimensione").value(20))
                .andExpect(jsonPath("$.totaleElementi").value(3))
                .andExpect(jsonPath("$.contenuto[0].denominazione").value("Associazione A"))
                .andExpect(jsonPath("$.contenuto[1].denominazione").value("Bocciofila B"))
                .andExpect(jsonPath("$.contenuto[2].denominazione").value("Circolo C"));

        mvc.perform(get("/enti").param("sort", "denominazione,desc").param("size", "2"))
                .andExpect(jsonPath("$.contenuto[0].denominazione").value("Circolo C"))
                .andExpect(jsonPath("$.totalePagine").value(2));
    }

    @Test
    @DisplayName("GET /enti?size=500: al massimo 100 per pagina")
    void tettoDellaPagina() throws Exception {
        mvc.perform(post("/import/enti")).andExpect(status().isOk());

        mvc.perform(get("/enti").param("size", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dimensione").value(100))
                .andExpect(jsonPath("$.contenuto.length()").value(100));
    }

    @Test
    @DisplayName("GET /enti?sort=colore: 400, la proprietà non esiste")
    void ordinamentoSuProprietaInesistente() throws Exception {
        mvc.perform(get("/enti").param("sort", "colore"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errori[0].campo").value("sort"));
    }

    @Test
    @DisplayName("nessuna N+1: una pagina da 20 enti con la provincia costa 2 query, non 21")
    void nessunaNPiuUno() throws Exception {
        mvc.perform(post("/import/enti")).andExpect(status().isOk());
        Statistics statistiche = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistiche.clear();

        mvc.perform(get("/enti").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenuto.length()").value(20));

        // la pagina con la join sulla provincia, più il conteggio per totaleElementi
        assertThat(statistiche.getPrepareStatementCount()).isEqualTo(2);
    }
}
