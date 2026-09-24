package it.its.impianti.web.mapper;

import it.its.impianti.domain.Ente;
import it.its.impianti.web.dto.EnteResponse;
import org.springframework.stereotype.Component;

/** Entity → DTO: il controller non espone mai le entity. */
@Component
public class EnteMapper {

    public EnteResponse toResponse(Ente ente) {
        return new EnteResponse(
                ente.getId(),
                ente.getIdSorgente(),
                ente.getDenominazione(),
                ente.getTipo(),
                // il NOME della provincia, non il suo id; è già caricata dall'entity graph
                ente.getProvincia().getNome(),
                ente.getComune(),
                ente.getIndirizzo(),
                ente.getTelefono());
    }
}
