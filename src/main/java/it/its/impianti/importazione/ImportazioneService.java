package it.its.impianti.importazione;

import it.its.impianti.client.EnteSorgente;
import it.its.impianti.client.OpenDataClient;
import it.its.impianti.domain.Ente;
import it.its.impianti.domain.Provincia;
import it.its.impianti.domain.TipoEnte;
import it.its.impianti.repository.EnteRepository;
import it.its.impianti.repository.ProvinciaRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Importa gli enti dall'open data.
 *
 * Idempotente: un ente già salvato, riconosciuto dall'idSorgente, non si
 * duplica. Un record non importabile si scarta e si conta, senza fermare gli
 * altri.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImportazioneService {

    static final int MAX_ID_SORGENTE = 20;
    static final int MAX_DENOMINAZIONE = 100;
    static final int MAX_COMUNE = 100;
    static final int MAX_INDIRIZZO = 255;
    static final int MAX_TELEFONO = 30;

    private final OpenDataClient client;
    private final EnteRepository enteRepository;
    private final ProvinciaRepository provinciaRepository;
    private final TransactionTemplate transazione;

    public EsitoImport importa() {
        // il download sta fuori dalla transazione: una sorgente lenta non deve
        // tenere occupata una connessione al database
        List<EnteSorgente> sorgente = client.scaricaEnti();
        return transazione.execute(stato -> salva(sorgente));
    }

    private EsitoImport salva(List<EnteSorgente> sorgente) {
        // province e idSorgente esistenti si leggono UNA volta, prima del ciclo
        Map<String, Provincia> province = provinciaRepository.findAll().stream()
                .collect(Collectors.toMap(Provincia::getNome, Function.identity()));
        Set<String> visti = new HashSet<>(enteRepository.findAllIdSorgente());

        List<Ente> nuovi = new ArrayList<>();
        int giaPresenti = 0;
        int scartati = 0;
        for (EnteSorgente record : sorgente) {
            String idSorgente = Normalizzatore.testo(record.id());
            if (idSorgente == null) {
                // nel file ce n'è uno: l'ultimo elemento, { "ID": "" }
                scartati++;
                continue;
            }
            if (!visti.add(idSorgente)) {
                // già nel database, oppure già letto più su nello stesso file
                giaPresenti++;
                continue;
            }
            Optional<Ente> ente = converti(idSorgente, record, province);
            if (ente.isPresent()) {
                nuovi.add(ente.get());
            } else {
                scartati++;
            }
        }
        enteRepository.saveAll(nuovi);
        log.info("import completato: {} inseriti, {} già presenti, {} scartati",
                nuovi.size(), giaPresenti, scartati);
        return new EsitoImport(nuovi.size(), giaPresenti, scartati);
    }

    /** Il record normalizzato e validato, oppure vuoto se non si può importare. */
    Optional<Ente> converti(String idSorgente, EnteSorgente record, Map<String, Provincia> province) {
        String denominazione = Normalizzatore.testo(record.denominazione());
        Optional<TipoEnte> tipo = TipoEnte.daSorgente(record.tipo());
        Provincia provincia = province.get(Normalizzatore.testo(record.provincia()));
        String comune = Normalizzatore.testo(record.comune());
        String indirizzo = Normalizzatore.testo(record.indirizzo());
        String telefono = Normalizzatore.telefono(record.telefono());

        String motivo = null;
        if (idSorgente.length() > MAX_ID_SORGENTE) {
            motivo = "ID più lungo di " + MAX_ID_SORGENTE + " caratteri";
        } else if (denominazione == null || denominazione.length() > MAX_DENOMINAZIONE) {
            motivo = "DENOMINAZIONE mancante o più lunga di " + MAX_DENOMINAZIONE + " caratteri";
        } else if (tipo.isEmpty()) {
            motivo = "TIPO sconosciuto: " + record.tipo();
        } else if (provincia == null) {
            motivo = "PROVINCIA sconosciuta: " + record.provincia();
        } else if (comune == null || comune.length() > MAX_COMUNE) {
            motivo = "COMUNE mancante o più lungo di " + MAX_COMUNE + " caratteri";
        } else if (indirizzo != null && indirizzo.length() > MAX_INDIRIZZO) {
            motivo = "INDIRIZZO più lungo di " + MAX_INDIRIZZO + " caratteri";
        } else if (telefono != null && telefono.length() > MAX_TELEFONO) {
            motivo = "TELEFONO più lungo di " + MAX_TELEFONO + " caratteri";
        }
        if (motivo != null) {
            log.warn("record con ID {} scartato: {}", idSorgente, motivo);
            return Optional.empty();
        }
        return Optional.of(new Ente(idSorgente, denominazione, tipo.get(), provincia,
                comune, indirizzo, telefono));
    }
}
