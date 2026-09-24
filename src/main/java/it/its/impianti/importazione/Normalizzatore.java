package it.its.impianti.importazione;

/** Le regole di pulizia dei valori, uguali per l'importazione e per POST /enti. */
public final class Normalizzatore {

    private Normalizzatore() {
    }

    /** Trim del testo; la stringa vuota diventa null. */
    public static String testo(String valore) {
        if (valore == null) {
            return null;
        }
        String pulito = valore.strip();
        return pulito.isEmpty() ? null : pulito;
    }

    /**
     * Il telefono perde TUTTI gli spazi, anche quelli interni ("080 546 1291"
     * diventa "0805461291"). Resta testo: punti, barre e trattini si conservano.
     */
    public static String telefono(String valore) {
        if (valore == null) {
            return null;
        }
        String pulito = valore.replaceAll("\\s+", "");
        return pulito.isEmpty() ? null : pulito;
    }
}
