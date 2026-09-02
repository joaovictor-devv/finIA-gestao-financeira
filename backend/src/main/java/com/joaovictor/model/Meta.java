package com.joaovictor.model;

import java.math.BigDecimal;

public class Meta {

    private long id;
    private String nome;
    private BigDecimal valorAlvo;
    private int prazoMeses;
    private BigDecimal valorInicial;
    private String prioridade;
    private String descricao;

    public Meta() {
    }

    public Meta(long id, String nome, BigDecimal valorAlvo, int prazoMeses, BigDecimal valorInicial, String prioridade, String descricao) {
        this.id = id;
        this.nome = nome;
        this.valorAlvo = valorAlvo;
        this.prazoMeses = prazoMeses;
        this.valorInicial = valorInicial;
        this.prioridade = prioridade;
        this.descricao = descricao;
    }

    public Meta(String nome, BigDecimal valorAlvo, int prazoMeses, BigDecimal valorInicial, String prioridade, String descricao) {
        this.nome = nome;
        this.valorAlvo = valorAlvo;
        this.prazoMeses = prazoMeses;
        this.valorInicial = valorInicial;
        this.prioridade = prioridade;
        this.descricao = descricao;
    }

    public long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public BigDecimal getValorAlvo() {
        return valorAlvo;
    }

    public int getPrazoMeses() {
        return prazoMeses;
    }

    public BigDecimal getValorInicial() {
        return valorInicial;
    }

    public String getPrioridade() {
        return prioridade;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setId(long id) {
        this.id = id;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public void setValorAlvo(BigDecimal valorAlvo) {
        this.valorAlvo = valorAlvo;
    }

    public void setPrazoMeses(int prazoMeses) {
        this.prazoMeses = prazoMeses;
    }

    public void setValorInicial(BigDecimal valorInicial) {
        this.valorInicial = valorInicial;
    }

    public void setPrioridade(String prioridade) {
        this.prioridade = prioridade;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
}