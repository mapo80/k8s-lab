package it.its.impianti.web;

import it.its.impianti.importazione.EsitoImport;
import it.its.impianti.importazione.ImportazioneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * L'importazione sta su /import/enti, fuori dalla collezione /enti: dentro,
 * una GET su /enti/import verrebbe raccolta da GET /enti/{id} e risponderebbe
 * 400 invece di 405.
 */
@RestController
@RequestMapping("/import")
@RequiredArgsConstructor
@Tag(name = "Importazione", description = "Importazione dall'open data della Regione Puglia")
public class ImportController {

    private final ImportazioneService service;

    @PostMapping("/enti")
    @Operation(summary = "Importa gli enti dall'open data",
            description = "Idempotente: rilanciata non crea duplicati. I record non importabili si scartano.")
    @ApiResponse(responseCode = "200", description = "Esito: quanti inseriti, quanti già presenti, quanti scartati")
    @ApiResponse(responseCode = "503", description = "La sorgente open data non risponde",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EsitoImport importa() {
        return service.importa();
    }
}
