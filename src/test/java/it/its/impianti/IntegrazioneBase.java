package it.its.impianti;

import com.sun.net.httpserver.HttpServer;
import it.its.impianti.repository.EnteRepository;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Base dei test di integrazione: l'applicazione intera, PostgreSQL vero in un
 * container e, al posto del portale regionale, un server HTTP locale che
 * serve il file open data reale (src/test/resources/open-data/enti.json).
 *
 * Container e server partono una volta per tutte le classi; ogni test parte
 * dalla tabella ente vuota.
 */
@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@AutoConfigureMockMvc
public abstract class IntegrazioneBase {

    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");
    static final HttpServer OPEN_DATA;

    /** Lo stato HTTP con cui risponde la finta sorgente: 200, oppure un errore. */
    static volatile int statoOpenData = 200;

    static {
        POSTGRES.start();
        byte[] file = leggi("/open-data/enti.json");
        try {
            OPEN_DATA = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        OPEN_DATA.createContext("/enti.json", scambio -> {
            int stato = statoOpenData;
            if (stato == 200) {
                scambio.getResponseHeaders().add("Content-Type", "application/json");
                scambio.sendResponseHeaders(200, file.length);
                try (OutputStream out = scambio.getResponseBody()) {
                    out.write(file);
                }
            } else {
                scambio.sendResponseHeaders(stato, -1);
                scambio.close();
            }
        });
        OPEN_DATA.start();
    }

    @DynamicPropertySource
    static void configura(DynamicPropertyRegistry registro) {
        registro.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registro.add("spring.datasource.username", POSTGRES::getUsername);
        registro.add("spring.datasource.password", POSTGRES::getPassword);
        registro.add("impianti.open-data.url",
                () -> "http://localhost:" + OPEN_DATA.getAddress().getPort() + "/enti.json");
    }

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected EnteRepository enteRepository;

    @BeforeEach
    void tabellaEnteVuota() {
        enteRepository.deleteAllInBatch();
    }

    @AfterEach
    void sorgenteDiNuovoDisponibile() {
        statoOpenData = 200;
    }

    private static byte[] leggi(String risorsa) {
        try (InputStream in = IntegrazioneBase.class.getResourceAsStream(risorsa)) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
