package it.its.impianti.repository;

import it.its.impianti.domain.Ente;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EnteRepository extends JpaRepository<Ente, Long> {

    /*
     * La provincia è LAZY: senza @EntityGraph una pagina da 20 enti farebbe una
     * query per gli enti più una per ogni provincia letta (N+1). L'entity graph
     * la carica nella stessa query, con una join.
     */
    @Override
    @EntityGraph(attributePaths = "provincia")
    Page<Ente> findAll(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "provincia")
    Optional<Ente> findById(Long id);

    @EntityGraph(attributePaths = "provincia")
    Page<Ente> findByProvinciaId(Long provinciaId, Pageable pageable);

    boolean existsByIdSorgente(String idSorgente);

    /** Gli idSorgente già salvati, letti una volta sola prima dell'import. */
    @Query("select e.idSorgente from Ente e")
    Set<String> findAllIdSorgente();
}
