package it.its.impianti.importazione;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NormalizzatoreTest {

    @Test
    @DisplayName("il testo perde gli spazi in testa e in coda, non quelli interni")
    void trimDelTesto() {
        assertThat(Normalizzatore.testo("  Oratorio San Paolo ")).isEqualTo("Oratorio San Paolo");
    }

    @Test
    @DisplayName("la stringa vuota, o fatta solo di spazi, diventa null")
    void vuotoDiventaNull() {
        assertThat(Normalizzatore.testo("")).isNull();
        assertThat(Normalizzatore.testo("   ")).isNull();
        assertThat(Normalizzatore.testo(null)).isNull();
    }

    @Test
    @DisplayName("il telefono perde TUTTI gli spazi, anche quelli interni")
    void telefonoSenzaSpazi() {
        assertThat(Normalizzatore.telefono(" 0335 408 787 ")).isEqualTo("0335408787");
    }

    @Test
    @DisplayName("il telefono resta testo: punto, barra e trattino si conservano")
    void telefonoConservaISeparatori() {
        assertThat(Normalizzatore.telefono("0831.412461")).isEqualTo("0831.412461");
        assertThat(Normalizzatore.telefono("0881 / 542313")).isEqualTo("0881/542313");
        assertThat(Normalizzatore.telefono("080-5461291")).isEqualTo("080-5461291");
    }

    @Test
    @DisplayName("un telefono vuoto diventa null")
    void telefonoVuoto() {
        assertThat(Normalizzatore.telefono("")).isNull();
        assertThat(Normalizzatore.telefono("  ")).isNull();
        assertThat(Normalizzatore.telefono(null)).isNull();
    }
}
