package it.its.impianti.web;

import it.its.impianti.domain.EnteNonTrovatoException;
import it.its.impianti.domain.IdSorgenteDuplicatoException;
import it.its.impianti.domain.ProvinciaNonTrovataException;
import it.its.impianti.domain.SorgenteNonDisponibileException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.TypeMismatchException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.lang.Nullable;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tools.jackson.core.JacksonException;

/**
 * Tutti gli errori passano da qui e diventano un ProblemDetail (RFC 9457).
 *
 * I 400 dicono QUALI campi sono in errore e perché, nella proprietà
 * "errori": un 400 con il corpo vuoto costringe il client a indovinare.
 * Il 500 resta per i difetti dell'applicazione.
 */
@RestControllerAdvice
@Slf4j
public class GestoreErrori extends ResponseEntityExceptionHandler {

    // ------------------------------------------------------------------ 400 ---

    /** Corpo della POST con campi non validi (@Valid). */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errori = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField,
                        e -> Objects.requireNonNullElse(e.getDefaultMessage(), "valore non valido"),
                        (primo, secondo) -> primo + "; " + secondo));
        return badRequest("Richiesta non valida", "Alcuni campi del corpo non sono validi.", errori);
    }

    /** Parametri non validi nelle GET, per esempio un id non positivo (@Positive). */
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errori = ex.getParameterValidationResults().stream()
                .collect(Collectors.toMap(
                        r -> Objects.requireNonNullElse(r.getMethodParameter().getParameterName(), "parametro"),
                        r -> r.getResolvableErrors().stream()
                                .map(MessageSourceResolvable::getDefaultMessage)
                                .filter(Objects::nonNull)
                                .collect(Collectors.joining("; ")),
                        (primo, secondo) -> primo + "; " + secondo));
        return badRequest("Parametro non valido", "Alcuni parametri della richiesta non sono validi.", errori);
    }

    /** Parametro non convertibile, per esempio GET /enti/abc. */
    @Override
    protected ResponseEntity<Object> handleTypeMismatch(TypeMismatchException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String nome = Objects.requireNonNullElse(ex.getPropertyName(), "parametro");
        String atteso = ex.getRequiredType() == null ? "un valore valido" : ex.getRequiredType().getSimpleName();
        return badRequest("Parametro non valido", "Un parametro non è convertibile nel tipo atteso.",
                Map.of(nome, "il valore '" + ex.getValue() + "' non è convertibile in " + atteso));
    }

    /** Corpo che non è JSON, oppure con un valore non convertibile (per esempio tipo: "ALTRO"). */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        if (ex.getMostSpecificCause() instanceof JacksonException jackson && !jackson.getPath().isEmpty()) {
            String campo = jackson.getPath().stream()
                    .map(r -> r.getPropertyName() != null ? r.getPropertyName() : "[" + r.getIndex() + "]")
                    .collect(Collectors.joining("."));
            return badRequest("Corpo malformato", "Il corpo contiene un valore non convertibile.",
                    Map.of(campo, "valore non valido per questo campo"));
        }
        return badRequest("Corpo malformato", "Il corpo della richiesta non è un JSON valido.", Map.of());
    }

    /** Ordinamento su una proprietà che non esiste, per esempio ?sort=colore. */
    @ExceptionHandler({PropertyReferenceException.class, InvalidDataAccessApiUsageException.class})
    public ResponseEntity<Object> ordinamentoNonValido(RuntimeException e) {
        PropertyReferenceException causa = e instanceof PropertyReferenceException p ? p
                : e.getCause() instanceof PropertyReferenceException p ? p : null;
        if (causa == null) {
            return erroreInterno(e);
        }
        return badRequest("Parametro non valido", "L'ordinamento richiesto non è possibile.",
                Map.of("sort", "la proprietà '" + causa.getPropertyName() + "' non esiste"));
    }

    // ------------------------------------------------------------ 404 e 409 ---

    @ExceptionHandler({EnteNonTrovatoException.class, ProvinciaNonTrovataException.class})
    public ProblemDetail nonTrovato(RuntimeException e) {
        return problema(HttpStatus.NOT_FOUND, "Risorsa inesistente", e.getMessage());
    }

    @ExceptionHandler(IdSorgenteDuplicatoException.class)
    public ProblemDetail idSorgenteDuplicato(IdSorgenteDuplicatoException e) {
        return problema(HttpStatus.CONFLICT, "idSorgente già presente", e.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail vincoloViolato(DataIntegrityViolationException e) {
        log.warn("vincolo del database violato: {}", e.getMostSpecificCause().getMessage());
        return problema(HttpStatus.CONFLICT, "Conflitto",
                "L'operazione viola un vincolo dei dati: probabilmente la risorsa esiste già.");
    }

    // ------------------------------------------------------------------ 503 ---

    @ExceptionHandler(SorgenteNonDisponibileException.class)
    public ResponseEntity<ProblemDetail> sorgenteNonDisponibile(SorgenteNonDisponibileException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .header(HttpHeaders.RETRY_AFTER, "60")
                .body(problema(HttpStatus.SERVICE_UNAVAILABLE, "Sorgente open data non disponibile",
                        e.getMessage()));
    }

    // ------------------------------------------------------------------ 500 ---

    /** Tutto il resto è un difetto dell'applicazione: si registra, e al client non si mostrano dettagli. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> erroreInterno(Exception e) {
        log.error("errore non gestito", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(problema(HttpStatus.INTERNAL_SERVER_ERROR, "Errore interno",
                        "Si è verificato un errore imprevisto."));
    }

    // -------------------------------------------------------------- supporto ---

    private static ResponseEntity<Object> badRequest(String titolo, String dettaglio,
                                                     @Nullable Map<String, String> errori) {
        ProblemDetail corpo = problema(HttpStatus.BAD_REQUEST, titolo, dettaglio);
        if (errori != null && !errori.isEmpty()) {
            corpo.setProperty("errori", errori.entrySet().stream()
                    .map(e -> Map.of("campo", e.getKey(), "messaggio", e.getValue()))
                    .toList());
        } else {
            corpo.setProperty("errori", List.of());
        }
        return ResponseEntity.badRequest().body(corpo);
    }

    private static ProblemDetail problema(HttpStatus stato, String titolo, String dettaglio) {
        ProblemDetail corpo = ProblemDetail.forStatusAndDetail(stato, dettaglio);
        corpo.setTitle(titolo);
        return corpo;
    }
}
