package it.its.impianti.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class TipoEnteTest {

    @Test
    @DisplayName("«Privato» e «Pubblico», con l'iniziale maiuscola, diventano i valori dell'enum")
    void valoriDelFile() {
        assertThat(TipoEnte.daSorgente("Privato")).contains(TipoEnte.PRIVATO);
        assertThat(TipoEnte.daSorgente("Pubblico")).contains(TipoEnte.PUBBLICO);
    }

    @Test
    @DisplayName("la conversione ignora maiuscole, minuscole e spazi esterni")
    void ignoraMaiuscoleESpazi() {
        assertThat(TipoEnte.daSorgente(" PUBBLICO ")).contains(TipoEnte.PUBBLICO);
        assertThat(TipoEnte.daSorgente("privato")).contains(TipoEnte.PRIVATO);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "Misto", "Privata"})
    @DisplayName("un valore sconosciuto non si converte")
    void valoreSconosciuto(String valore) {
        assertThat(TipoEnte.daSorgente(valore)).isEmpty();
    }

    @Test
    @DisplayName("null non si converte")
    void nullo() {
        assertThat(TipoEnte.daSorgente(null)).isEmpty();
    }
}
