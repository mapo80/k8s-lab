package it.its.impianti.importazione;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Esito dell'importazione dall'open data")
public record EsitoImport(
        @Schema(description = "Enti nuovi salvati", example = "1739") int inseriti,
        @Schema(description = "Enti già presenti, riconosciuti dall'idSorgente", example = "0") int giaPresenti,
        @Schema(description = "Record non importabili, scartati", example = "1") int scartati) {
}
