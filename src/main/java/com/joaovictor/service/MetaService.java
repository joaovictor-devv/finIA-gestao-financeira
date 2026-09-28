package com.joaovictor.service;

import com.joaovictor.exception.RecursoNaoEncontradoException;
import com.joaovictor.model.Meta;
import com.joaovictor.repository.MetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MetaService {

    private static final Set<String> PRIORIDADES_VALIDAS = Set.of("baixa", "media", "alta");

    private final MetaRepository repository;

    public MetaService() {
        this(new MetaRepository());
    }

    @Autowired
    public MetaService(MetaRepository repository) {
        this.repository = repository;
    }

    public Meta cadastrarMeta(BigDecimal valorAlvo,
                              String nome,
                              Integer prazoMeses,
                              BigDecimal valorInicial,
                              String prioridade,
                              String descricao) {

        validarMeta(nome, valorAlvo, prazoMeses, valorInicial, prioridade);

        Meta meta = new Meta(
                nome.trim(),
                valorAlvo,
                prazoMeses,
                valorInicial,
                normalizarPrioridade(prioridade),
                normalizarDescricao(descricao)
        );

        long id = repository.salvar(meta);
        meta.setId(id);
        return meta;
    }

    public Meta atualizarMeta(long id,
                              BigDecimal valorAlvo,
                              String nome,
                              Integer prazoMeses,
                              BigDecimal valorInicial,
                              String prioridade,
                              String descricao) {
        buscarPorId(id);
        validarMeta(nome, valorAlvo, prazoMeses, valorInicial, prioridade);

        Meta meta = new Meta(
                id,
                nome.trim(),
                valorAlvo,
                prazoMeses,
                valorInicial,
                normalizarPrioridade(prioridade),
                normalizarDescricao(descricao)
        );

        if (!repository.atualizar(id, meta)) {
            throw new RecursoNaoEncontradoException("Meta não encontrada para atualização.");
        }

        return meta;
    }

    public Meta atualizarProgresso(long id, BigDecimal valorAtual) {
        ValoresMonetarios.validar(valorAtual);
        Meta meta = buscarPorId(id);

        if (valorAtual == null || valorAtual.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("O valor atual da meta não pode ser negativo.");
        }

        if (valorAtual.compareTo(meta.getValorAlvo()) > 0) {
            throw new IllegalArgumentException("O valor atual não pode ser maior que o valor alvo da meta.");
        }

        if (!repository.atualizarValorInicial(id, valorAtual)) {
            throw new RecursoNaoEncontradoException("Meta não encontrada para atualização do progresso.");
        }

        meta.setValorInicial(valorAtual);
        return meta;
    }

    public void validarMeta(String nome,
                            BigDecimal valorAlvo,
                            Integer prazoMeses,
                            BigDecimal valorInicial,
                            String prioridade) {
        validarCampos(nome, valorAlvo, prazoMeses, valorInicial, prioridade);
    }

    public List<Meta> listarMetas() {
        return repository.listarTodas();
    }

    public Meta buscarPorId(long id) {
        Meta meta = repository.buscarPorId(id);

        if (meta == null) {
            throw new RecursoNaoEncontradoException("Meta não encontrada para o id informado.");
        }

        return meta;
    }

    public void excluirMeta(long id) {
        boolean excluiu = repository.excluirPorId(id);

        if (!excluiu) {
            throw new RecursoNaoEncontradoException("Meta não encontrada para exclusão.");
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

        if (nome.trim().length() > 100) {
            throw new IllegalArgumentException("O nome da meta deve ter no máximo 100 caracteres.");
        }

        ValoresMonetarios.validar(valorAlvo);
        ValoresMonetarios.validar(valorInicial);

        if (valorAlvo == null || valorAlvo.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor alvo deve ser maior que zero.");
        }

        if (prazoMeses == null || prazoMeses <= 0) {
            throw new IllegalArgumentException("O prazo em meses deve ser maior que zero.");
        }

        if (prazoMeses > 600) {
            throw new IllegalArgumentException("O prazo da meta deve ser de no máximo 600 meses.");
        }

        if (valorInicial == null || valorInicial.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("O valor inicial não pode ser negativo.");
        }

        if (valorInicial.compareTo(valorAlvo) > 0) {
            throw new IllegalArgumentException("O valor inicial não pode ser maior que o valor alvo.");
        }

        String prioridadeNormalizada = normalizarPrioridade(prioridade);
        if (!PRIORIDADES_VALIDAS.contains(prioridadeNormalizada)) {
            throw new IllegalArgumentException("A prioridade deve ser baixa, media ou alta.");
        }
    }

    private String normalizarPrioridade(String prioridade) {
        if (prioridade == null || prioridade.isBlank()) {
            throw new IllegalArgumentException("A prioridade é obrigatória.");
        }

        String normalizada = prioridade.trim().toLowerCase(Locale.ROOT);
        return normalizada.equals("média") ? "media" : normalizada;
    }

    private String normalizarDescricao(String descricao) {
        if (descricao == null || descricao.isBlank()) {
            return null;
        }

        if (descricao.trim().length() > 255) {
            throw new IllegalArgumentException("A descrição deve ter no máximo 255 caracteres.");
        }

        return descricao.trim();
    }
}
