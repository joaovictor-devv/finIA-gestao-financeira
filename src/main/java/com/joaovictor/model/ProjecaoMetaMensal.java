package com.joaovictor.model;

import java.math.BigDecimal;

/**
 * Fotografia do progresso de uma meta ao final de cada mês simulado.
 * Não representa depósito realizado nem rentabilidade.
 */
public class ProjecaoMetaMensal {
    private final long id;
    private final String nome;
    private final BigDecimal valorProjetado;
    private final BigDecimal valorAlvo;

    public ProjecaoMetaMensal(long id, String nome, BigDecimal valorProjetado, BigDecimal valorAlvo) {
        this.id = id;
        this.nome = nome;
        this.valorProjetado = valorProjetado;
        this.valorAlvo = valorAlvo;
    }

    public long getId() { return id; }
    public String getNome() { return nome; }
    public BigDecimal getValorProjetado() { return valorProjetado; }
    public BigDecimal getValorAlvo() { return valorAlvo; }
}
