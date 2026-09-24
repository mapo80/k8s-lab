package it.its.impianti.service;

import it.its.impianti.domain.Provincia;
import it.its.impianti.repository.ProvinciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProvinciaService {

    private final ProvinciaRepository provinciaRepository;

    @Transactional(readOnly = true)
    public Page<Provincia> elenco(Pageable pagina) {
        return provinciaRepository.findAll(pagina);
    }
}
