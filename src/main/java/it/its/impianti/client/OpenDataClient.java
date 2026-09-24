package it.its.impianti.client;

import it.its.impianti.config.OpenDataProperties;
import it.its.impianti.domain.SorgenteNonDisponibileException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Scarica l'elenco degli enti dall'open data della Regione Puglia. */
@Component
@Slf4j
public class OpenDataClient {

    /** La radice del file è un array: il generico va dichiarato esplicitamente. */
    private static final ParameterizedTypeReference<List<EnteSorgente>> LISTA_DI_ENTI =
            new ParameterizedTypeReference<>() { };

    private final RestClient restClient;
    private final OpenDataProperties proprieta;

    public OpenDataClient(@Qualifier("openDataRestClient") RestClient restClient,
                          OpenDataProperties proprieta) {
        this.restClient = restClient;
        this.proprieta = proprieta;
    }

    public List<EnteSorgente> scaricaEnti() {
        try {
            List<EnteSorgente> enti = restClient.get()
                    .uri(proprieta.url())
                    .retrieve()
                    .body(LISTA_DI_ENTI);
            return enti == null ? List.of() : enti;
        } catch (RestClientException e) {
            // timeout, connessione rifiutata, 4xx o 5xx: per il client è sempre la stessa cosa
            log.warn("la sorgente open data non risponde: {}", e.getMessage());
            throw new SorgenteNonDisponibileException(
                    "La sorgente open data non risponde: riprova più tardi.", e);
        }
    }
}
