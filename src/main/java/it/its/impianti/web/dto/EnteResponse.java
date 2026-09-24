package it.its.impianti.web.dto;

import it.its.impianti.domain.TipoEnte;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Un ente proprietario di impianti sportivi")
public record EnteResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "13436") String idSorgente,
        @Schema(example = "EUROPA PARK HOTEL") String denominazione,
        @Schema(example = "PRIVATO") TipoEnte tipo,
        @Schema(description = "Nome della provincia", example = "Taranto") String provincia,
        @Schema(example = "Ginosa") String comune,
        @Schema(example = "VIA DELLA CHIESA") String indirizzo,
        @Schema(example = "0998277111") String telefono) {
}
