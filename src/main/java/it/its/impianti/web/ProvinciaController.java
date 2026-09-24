package it.its.impianti.web;

import it.its.impianti.service.EnteService;
import it.its.impianti.service.ProvinciaService;
import it.its.impianti.web.dto.EnteResponse;
import it.its.impianti.web.dto.Pagina;
import it.its.impianti.web.dto.ProvinciaResponse;
import it.its.impianti.web.mapper.EnteMapper;
import it.its.impianti.web.mapper.ProvinciaMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/province")
@RequiredArgsConstructor
@Tag(name = "Province", description = "Le sei province pugliesi e i loro enti")
public class ProvinciaController {

    /**
     * @PageableDefault ha un default suo (10) che vince sulla configurazione:
     * la dimensione di default va dichiarata qui. Il tetto di 100 lo impone
     * spring.data.web.pageable.max-page-size.
     */
    static final int DIMENSIONE_PAGINA = 20;

    private final ProvinciaService provinciaService;
    private final EnteService enteService;
    private final ProvinciaMapper provinciaMapper;
    private final EnteMapper enteMapper;

    @GetMapping
    @Operation(summary = "Elenco delle province, con il loro id",
            description = "Paginato come gli altri elenchi; ordinato per nome.")
    @ApiResponse(responseCode = "200", description = "Le province")
    @ApiResponse(responseCode = "400", description = "Parametro di paginazione o di ordinamento non valido",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public Pagina<ProvinciaResponse> elenco(
            @ParameterObject @PageableDefault(size = DIMENSIONE_PAGINA, sort = "nome", direction = Sort.Direction.ASC) Pageable pagina) {
        return Pagina.da(provinciaService.elenco(pagina), provinciaMapper::toResponse);
    }

    @GetMapping("/{id}/enti")
    @Operation(summary = "Gli enti di una provincia, paginati",
            description = "Default: 20 per pagina, ordinati per denominazione crescente. Massimo 100 per pagina.")
    @ApiResponse(responseCode = "200", description = "Una pagina di enti della provincia")
    @ApiResponse(responseCode = "400", description = "Id non numerico o non positivo, o parametro di paginazione non valido",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Nessuna provincia con questo id",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public Pagina<EnteResponse> entiDellaProvincia(
            @Parameter(description = "Id della provincia", example = "1") @PathVariable @Positive Long id,
            @ParameterObject @PageableDefault(size = DIMENSIONE_PAGINA, sort = "denominazione", direction = Sort.Direction.ASC) Pageable pagina) {
        return Pagina.da(enteService.perProvincia(id, pagina), enteMapper::toResponse);
    }
}
