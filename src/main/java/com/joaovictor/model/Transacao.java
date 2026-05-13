package com.joaovictor.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Transacao {
    private long id;
    private String tipo;
    private BigDecimal valor;
    private String descricao;
    private String categoria;
    private LocalDate dataTransacao;

    public Transacao() {
    }

    public Transacao(long id, String tipo, BigDecimal valor, String descricao, String categoria, LocalDate dataTransacao) {
        this.id = id;
        this.tipo = tipo;
        this.valor = valor;
        this.descricao = descricao;
        this.categoria = categoria;
        this.dataTransacao = dataTransacao;
    }

    public Transacao(String tipo, BigDecimal valor, String descricao, String categoria, LocalDate dataTransacao) {
        this.tipo = tipo;
        this.valor = valor;
        this.descricao = descricao;
        this.categoria = categoria;
        this.dataTransacao = dataTransacao;
    }

    public long getId() {
        return id;
    }

    public String getTipo() {
        return tipo;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getCategoria() {
        return categoria;
    }

    public LocalDate getDataTransacao() {
        return dataTransacao;
    }

    public void setId(long id) {
        this.id = id;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public void setDataTransacao(LocalDate dataTransacao) {
        this.dataTransacao = dataTransacao;
    }

    @Override
    public String toString() {
        return id + " | " + dataTransacao + " | " + tipo + " | " + categoria + " | " + descricao + " | R$ " + valor;
    }
}