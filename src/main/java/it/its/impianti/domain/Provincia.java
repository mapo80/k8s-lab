package it.its.impianti.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Una delle sei province pugliesi: le inserisce la migrazione V1. */
@Entity
@Table(name = "provincia")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Provincia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String nome;

    @Column(name = "dt_inserimento", nullable = false, updatable = false)
    private LocalDateTime dtInserimento;

    @Column(name = "dt_modifica", nullable = false)
    private LocalDateTime dtModifica;

    public Provincia(String nome) {
        this.nome = nome;
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
