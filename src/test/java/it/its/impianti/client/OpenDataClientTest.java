package it.its.impianti.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import it.its.impianti.config.OpenDataProperties;
import it.its.impianti.domain.SorgenteNonDisponibileException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.time.Duration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class OpenDataClientTest {

    private static final String URL = "http://open-data.test/enti.json";

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final OpenDataClient client = new OpenDataClient(builder.build(),
            new OpenDataProperties(URI.create(URL), Duration.ofSeconds(1), Duration.ofSeconds(1)));

    @Test
    @DisplayName("chiede l'URL della configurazione e restituisce la lista degli enti")
    void scaricaLaLista() {
        server.expect(requestTo(URL)).andRespond(withSuccess("""
                [ { "ID": "1", "DENOMINAZIONE": "A", "TIPO": "Privato", "PROVINCIA": "Bari", "COMUNE": "Bari" },
                  { "ID": "" } ]
                """, MediaType.APPLICATION_JSON));

        assertThat(client.scaricaEnti()).extracting(EnteSorgente::id).containsExactly("1", "");
        server.verify();
    }

    @Test
    @DisplayName("una risposta 5xx della sorgente diventa SorgenteNonDisponibileException")
    void erroreDelServer() {
        server.expect(requestTo(URL)).andRespond(withServerError());

        assertThatThrownBy(client::scaricaEnti).isInstanceOf(SorgenteNonDisponibileException.class);
    }

    @Test
    @DisplayName("anche un timeout diventa SorgenteNonDisponibileException")
    void timeout() {
        server.expect(requestTo(URL)).andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(client::scaricaEnti)
                .isInstanceOf(SorgenteNonDisponibileException.class)
                .hasMessageContaining("riprova più tardi");
    }
}
