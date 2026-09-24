package it.its.impianti.importazione;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import it.its.impianti.client.EnteSorgente;
import it.its.impianti.client.OpenDataClient;
import it.its.impianti.domain.Ente;
import it.its.impianti.domain.Provincia;
import it.its.impianti.domain.SorgenteNonDisponibileException;
import it.its.impianti.domain.TipoEnte;
import it.its.impianti.repository.EnteRepository;
import it.its.impianti.repository.ProvinciaRepository;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

class ImportazioneServiceTest {

    private final OpenDataClient client = mock(OpenDataClient.class);
    private final EnteRepository enteRepository = mock(EnteRepository.class);
    private final ProvinciaRepository provinciaRepository = mock(ProvinciaRepository.class);
    private final TransactionTemplate transazione = mock(TransactionTemplate.class);
    private final ImportazioneService service =
            new ImportazioneService(client, enteRepository, provinciaRepository, transazione);

    private final Provincia bari = new Provincia("Bari");
    private final Provincia lecce = new Provincia("Lecce");

    @BeforeEach
    void preparaRepository() {
        // la transazione esegue direttamente il lavoro che riceve
        when(transazione.execute(any())).thenAnswer(inv -> inv.<TransactionCallback<?>>getArgument(0).doInTransaction(null));
        when(provinciaRepository.findAll()).thenReturn(List.of(bari, lecce));
        when(enteRepository.findAllIdSorgente()).thenReturn(Set.of());
    }

    private static EnteSorgente record(String id, String denominazione, String tipo, String provincia,
                                       String comune, String indirizzo, String telefono) {
        return new EnteSorgente(id, denominazione, tipo, provincia, comune, indirizzo, telefono);
    }

    @SuppressWarnings("unchecked")
    private List<Ente> salvati() {
        ArgumentCaptor<List<Ente>> captor = ArgumentCaptor.forClass(List.class);
        verify(enteRepository).saveAll(captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("importa i record validi e scarta quello con ID vuoto")
    void scartaIdVuoto() {
        when(client.scaricaEnti()).thenReturn(List.of(
                record("1", "Polisportiva", "Privato", "Bari", "Bari", null, null),
                record("2", "Comune di Lecce", "Pubblico", "Lecce", "Lecce", null, null),
                new EnteSorgente("", null, null, null, null, null, null)));

        EsitoImport esito = service.importa();

        assertThat(esito).isEqualTo(new EsitoImport(2, 0, 1));
        assertThat(salvati()).extracting(Ente::getIdSorgente).containsExactly("1", "2");
    }

    @Test
    @DisplayName("normalizza prima di salvare: trim, telefono senza spazi, vuoto a null, tipo nell'enum")
    void normalizza() {
        when(client.scaricaEnti()).thenReturn(List.of(
                record(" 7 ", " Oratorio ", "Pubblico", "Lecce", " Galatina ", "", " 0836 56 12 34 "),
                record("8", "Circolo", "Privato", "Bari", "Bari", "VIA ROMA 1 ", "0831.412461")));

        service.importa();

        List<Ente> enti = salvati();
        Ente oratorio = enti.get(0);
        assertThat(oratorio.getIdSorgente()).isEqualTo("7");
        assertThat(oratorio.getDenominazione()).isEqualTo("Oratorio");
        assertThat(oratorio.getTipo()).isEqualTo(TipoEnte.PUBBLICO);
        assertThat(oratorio.getProvincia()).isSameAs(lecce);
        assertThat(oratorio.getComune()).isEqualTo("Galatina");
        assertThat(oratorio.getIndirizzo()).isNull();
        assertThat(oratorio.getTelefono()).isEqualTo("0836561234");
        Ente circolo = enti.get(1);
        assertThat(circolo.getIndirizzo()).isEqualTo("VIA ROMA 1");
        assertThat(circolo.getTelefono()).isEqualTo("0831.412461");
    }

    @Test
    @DisplayName("idempotente: un idSorgente già salvato conta come già presente e non si duplica")
    void idempotente() {
        when(enteRepository.findAllIdSorgente()).thenReturn(Set.of("1"));
        when(client.scaricaEnti()).thenReturn(List.of(
                record("1", "Polisportiva", "Privato", "Bari", "Bari", null, null),
                record("2", "Circolo", "Privato", "Bari", "Bari", null, null)));

        EsitoImport esito = service.importa();

        assertThat(esito).isEqualTo(new EsitoImport(1, 1, 0));
        assertThat(salvati()).extracting(Ente::getIdSorgente).containsExactly("2");
    }

    @Test
    @DisplayName("un ID ripetuto nello stesso file si importa una volta sola")
    void duplicatoNelloStessoFile() {
        when(client.scaricaEnti()).thenReturn(List.of(
                record("1", "Polisportiva", "Privato", "Bari", "Bari", null, null),
                record("1", "Polisportiva", "Privato", "Bari", "Bari", null, null)));

        assertThat(service.importa()).isEqualTo(new EsitoImport(1, 1, 0));
    }

    @Test
    @DisplayName("i record non importabili si scartano senza perdere gli altri")
    void scartaSenzaFermarsi() {
        when(client.scaricaEnti()).thenReturn(List.of(
                record("1", "Valido", "Privato", "Bari", "Bari", null, null),
                record("2", "Tipo sconosciuto", "Misto", "Bari", "Bari", null, null),
                record("3", "Provincia sconosciuta", "Privato", "Milano", "Milano", null, null),
                record("4", "Comune mancante", "Privato", "Bari", " ", null, null),
                record("5", " ", "Privato", "Bari", "Bari", null, null),
                record("6", "Telefono lungo", "Privato", "Bari", "Bari", null, "0".repeat(31)),
                record("7", "Denominazione lunga " + "x".repeat(100), "Privato", "Bari", "Bari", null, null),
                record("8", "Altro valido", "Pubblico", "Lecce", "Lecce", null, null)));

        EsitoImport esito = service.importa();

        assertThat(esito).isEqualTo(new EsitoImport(2, 0, 6));
        assertThat(salvati()).extracting(Ente::getIdSorgente).containsExactly("1", "8");
    }

    @Test
    @DisplayName("province e idSorgente esistenti si leggono una volta sola, non una per record")
    void letturePrimaDelCiclo() {
        when(client.scaricaEnti()).thenReturn(List.of(
                record("1", "A", "Privato", "Bari", "Bari", null, null),
                record("2", "B", "Privato", "Bari", "Bari", null, null),
                record("3", "C", "Privato", "Lecce", "Lecce", null, null)));

        service.importa();

        verify(provinciaRepository, times(1)).findAll();
        verify(enteRepository, times(1)).findAllIdSorgente();
    }

    @Test
    @DisplayName("se la sorgente non risponde l'errore si propaga e il database non si tocca")
    void sorgenteNonDisponibile() {
        when(client.scaricaEnti()).thenThrow(new SorgenteNonDisponibileException("giù", null));

        assertThatThrownBy(service::importa).isInstanceOf(SorgenteNonDisponibileException.class);
        verifyNoInteractions(enteRepository, provinciaRepository);
    }
}
