package it.its.impianti.service;

import it.its.impianti.domain.Ente;
import it.its.impianti.domain.EnteNonTrovatoException;
import it.its.impianti.domain.IdSorgenteDuplicatoException;
import it.its.impianti.domain.Provincia;
import it.its.impianti.domain.ProvinciaNonTrovataException;
import it.its.impianti.importazione.Normalizzatore;
import it.its.impianti.repository.EnteRepository;
import it.its.impianti.repository.ProvinciaRepository;
import it.its.impianti.web.dto.EnteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EnteService {

    private final EnteRepository enteRepository;
    private final ProvinciaRepository provinciaRepository;

    @Transactional
    public Ente crea(EnteRequest richiesta) {
        String idSorgente = Normalizzatore.testo(richiesta.idSorgente());
        if (enteRepository.existsByIdSorgente(idSorgente)) {
            throw new IdSorgenteDuplicatoException(idSorgente);
        }
        Provincia provincia = provinciaRepository.findById(richiesta.provinciaId())
                .orElseThrow(() -> new ProvinciaNonTrovataException(richiesta.provinciaId()));
        Ente ente = new Ente(idSorgente,
                Normalizzatore.testo(richiesta.denominazione()),
                richiesta.tipo(),
                provincia,
                Normalizzatore.testo(richiesta.comune()),
                Normalizzatore.testo(richiesta.indirizzo()),
                Normalizzatore.telefono(richiesta.telefono()));
        try {
            // flush subito: se due richieste con lo stesso idSorgente arrivano
            // insieme, decide il vincolo UNIQUE, e l'errore diventa un 409 qui
            return enteRepository.saveAndFlush(ente);
        } catch (DataIntegrityViolationException e) {
            throw new IdSorgenteDuplicatoException(idSorgente);
        }
    }

    @Transactional(readOnly = true)
    public Page<Ente> elenco(Pageable pagina) {
        return enteRepository.findAll(pagina);
    }

    @Transactional(readOnly = true)
    public Ente trova(Long id) {
        return enteRepository.findById(id).orElseThrow(() -> new EnteNonTrovatoException(id));
    }

    @Transactional(readOnly = true)
    public Page<Ente> perProvincia(Long provinciaId, Pageable pagina) {
        if (!provinciaRepository.existsById(provinciaId)) {
            throw new ProvinciaNonTrovataException(provinciaId);
        }
        return enteRepository.findByProvinciaId(provinciaId, pagina);
    }
}
