package it.its.impianti.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Una provincia pugliese")
public record ProvinciaResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "Bari") String nome) {
}
