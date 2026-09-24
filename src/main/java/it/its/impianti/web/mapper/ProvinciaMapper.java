package it.its.impianti.web.mapper;

import it.its.impianti.domain.Provincia;
import it.its.impianti.web.dto.ProvinciaResponse;
import org.springframework.stereotype.Component;

@Component
public class ProvinciaMapper {

    public ProvinciaResponse toResponse(Provincia provincia) {
        return new ProvinciaResponse(provincia.getId(), provincia.getNome());
    }
}
