package com.joaovictor.service;

import com.joaovictor.model.Meta;
import com.joaovictor.repository.MetaRepository;

import java.math.BigDecimal;
import java.util.List;

public class MetaService {

    private final MetaRepository repository;

    public MetaService() {
        this.repository = new MetaRepository();
    }

    public void cadastrarMeta(BigDecimal valorAlvo,
                              String nome,
                              Integer prazoMeses,
                              BigDecimal valorInicial,
                              String prioridade,
                              String descricao) {

        validarCampos(nome, valorAlvo, prazoMeses, valorInicial, prioridade);

        Meta meta = new Meta(
                nome,
                valorAlvo,
                prazoMeses,
                valorInicial,
                prioridade,
                descricao
        );

        repository.salvar(meta);
    }

    public List<Meta> listarMetas() {
        return repository.listarTodas();
    }

    public Meta buscarPorId(long id) {
        Meta meta = repository.buscarPorId(id);

        if (meta == null) {
            throw new IllegalArgumentException("Meta não encontrada para o id informado.");
        }

        return meta;
    }

    public void excluirMeta(long id) {
        boolean excluiu = repository.excluirPorId(id);

        if (!excluiu) {
            throw new IllegalArgumentException("Meta não encontrada para exclusão.");
        }
    }

    private void validarCampos(String nome,
                               BigDecimal valorAlvo,
                               Integer prazoMeses,
                               BigDecimal valorInicial,
                               String prioridade) {

        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("O nome da meta é obrigatório.");
        }

        if (valorAlvo == null || valorAlvo.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor alvo deve ser maior que zero.");
        }

        if (prazoMeses == null || prazoMeses <= 0) {
            throw new IllegalArgumentException("O prazo em meses deve ser maior que zero.");
        }

        if (valorInicial == null || valorInicial.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("O valor inicial não pode ser negativo.");
        }

        if (valorInicial.compareTo(valorAlvo) > 0) {
            throw new IllegalArgumentException("O valor inicial não pode ser maior que o valor alvo.");
        }

        if (prioridade == null || prioridade.isBlank()) {
            throw new IllegalArgumentException("A prioridade é obrigatória.");
        }
    }
}