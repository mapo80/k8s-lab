package it.its.impianti.web;

import it.its.impianti.domain.Ente;
import it.its.impianti.service.EnteService;
import it.its.impianti.web.dto.EnteRequest;
import it.its.impianti.web.dto.EnteResponse;
import it.its.impianti.web.dto.Pagina;
import it.its.impianti.web.mapper.EnteMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/enti")
@RequiredArgsConstructor
@Tag(name = "Enti", description = "Enti proprietari di impianti sportivi")
public class EnteController {

    /**
     * @PageableDefault ha un default suo (10) che vince sulla configurazione:
     * la dimensione di default va dichiarata qui. Il tetto di 100 lo impone
     * spring.data.web.pageable.max-page-size.
     */
    static final int DIMENSIONE_PAGINA = 20;

    private final EnteService service;
    private final EnteMapper mapper;

    @PostMapping
    @Operation(summary = "Crea un ente")
    @ApiResponse(responseCode = "201", description = "Ente creato; l'header Location indica dove leggerlo")
    @ApiResponse(responseCode = "400", description = "Corpo malformato o campi non validi: il corpo elenca i campi in errore",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "La provincia indicata non esiste",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "409", description = "Esiste già un ente con lo stesso idSorgente",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public ResponseEntity<EnteResponse> crea(@Valid @RequestBody EnteRequest richiesta) {
        Ente ente = service.crea(richiesta);
        return ResponseEntity.created(URI.create("/enti/" + ente.getId())).body(mapper.toResponse(ente));
    }

    @GetMapping
    @Operation(summary = "Elenco degli enti, paginato",
            description = "Default: 20 per pagina, ordinati per denominazione crescente. Massimo 100 per pagina.")
    @ApiResponse(responseCode = "200", description = "Una pagina di enti, ciascuno con il nome della provincia")
    @ApiResponse(responseCode = "400", description = "Parametro di paginazione o di ordinamento non valido",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public Pagina<EnteResponse> elenco(
            @ParameterObject @PageableDefault(size = DIMENSIONE_PAGINA, sort = "denominazione", direction = Sort.Direction.ASC) Pageable pagina) {
        return Pagina.da(service.elenco(pagina), mapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Un ente, con il nome della provincia")
    @ApiResponse(responseCode = "200", description = "L'ente")
    @ApiResponse(responseCode = "400", description = "Id non numerico o non positivo",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Nessun ente con questo id",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EnteResponse trova(@Parameter(description = "Id dell'ente", example = "1") @PathVariable @Positive Long id) {
        return mapper.toResponse(service.trova(id));
    }
}
