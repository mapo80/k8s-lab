package it.its.impianti.web.dto;

import it.its.impianti.domain.TipoEnte;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Schema(description = "Dati per creare un ente")
public record EnteRequest(
        @Schema(description = "Identificativo dell'ente nell'open data: obbligatorio e univoco", example = "90001")
        @NotBlank @Size(max = 20) String idSorgente,

        @Schema(description = "Denominazione dell'ente", example = "POLISPORTIVA SAN NICOLA")
        @NotBlank @Size(max = 100) String denominazione,

        @Schema(description = "Tipo di ente", example = "PRIVATO")
        @NotNull TipoEnte tipo,

        @Schema(description = "Id della provincia, da GET /province", example = "1")
        @NotNull @Positive Long provinciaId,

        @Schema(description = "Comune", example = "Bari")
        @NotBlank @Size(max = 100) String comune,

        @Schema(description = "Indirizzo, facoltativo", example = "VIA SPARANO 12")
        @Size(max = 255) String indirizzo,

        @Schema(description = "Telefono, facoltativo: testo, gli spazi vengono rimossi", example = "080 5461291")
        @Size(max = 30) String telefono) {
}
