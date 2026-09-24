package it.its.impianti.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Un ente proprietario di impianti sportivi.
 *
 * Getter e setter da Lombok, ma niente @Data: genererebbe equals, hashCode e
 * toString su tutti i campi, relazione LAZY compresa, con query nascoste e
 * cicli infiniti.
 */
@Entity
@Table(name = "ente")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Ente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** L'ID del file open data: univoco, regge l'idempotenza dell'import. */
    @Column(name = "id_sorgente", nullable = false, unique = true, length = 20)
    private String idSorgente;

    @Column(nullable = false, length = 100)
    private String denominazione;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoEnte tipo;

    /** LAZY: @ManyToOne è EAGER per default. Chi legge gli enti usa un @EntityGraph. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provincia_id", nullable = false)
    private Provincia provincia;

    @Column(nullable = false, length = 100)
    private String comune;

    @Column(length = 255)
    private String indirizzo;

    /** Testo, non numero: contiene anche punti, barre e trattini. */
    @Column(length = 30)
    private String telefono;

    @Column(name = "dt_inserimento", nullable = false, updatable = false)
    private LocalDateTime dtInserimento;

    @Column(name = "dt_modifica", nullable = false)
    private LocalDateTime dtModifica;

    public Ente(String idSorgente, String denominazione, TipoEnte tipo, Provincia provincia,
                String comune, String indirizzo, String telefono) {
        this.idSorgente = idSorgente;
        this.denominazione = denominazione;
        this.tipo = tipo;
        this.provincia = provincia;
        this.comune = comune;
        this.indirizzo = indirizzo;
        this.telefono = telefono;
    }

    @PrePersist
    void inserimento() {
        dtInserimento = LocalDateTime.now();
        dtModifica = dtInserimento;
    }

    @PreUpdate
    void modifica() {
        dtModifica = LocalDateTime.now();
    }
}
