package it.its.impianti.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Una pagina di risultati: il contenuto e le informazioni per chiedere le altre. */
@Schema(description = "Una pagina di risultati")
public record Pagina<T>(
        List<T> contenuto,
        @Schema(description = "Numero della pagina, da 0", example = "0") int pagina,
        @Schema(description = "Elementi per pagina", example = "20") int dimensione,
        @Schema(description = "Elementi in totale", example = "1739") long totaleElementi,
        @Schema(description = "Pagine in totale", example = "87") int totalePagine) {

    public static <E, T> Pagina<T> da(Page<E> page, Function<E, T> conversione) {
        return new Pagina<>(page.getContent().stream().map(conversione).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
