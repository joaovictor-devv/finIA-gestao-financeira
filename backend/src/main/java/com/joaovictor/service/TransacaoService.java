package com.joaovictor.service;

import com.joaovictor.exception.SaldoInsuficienteException;
import com.joaovictor.model.Transacao;
import com.joaovictor.repository.TransacaoRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class TransacaoService {

    private final TransacaoRepository repository;

    public TransacaoService() {
        this.repository = new TransacaoRepository();
    }

    public void registrarEntrada(BigDecimal valor, String descricao, String categoria, LocalDate data) {
        validarCampos(valor, descricao, categoria, data);

        Transacao transacao = new Transacao("ENTRADA", valor, descricao, categoria, data);
        repository.salvar(transacao);
    }

    public void registrarSaida(BigDecimal valor, String descricao, String categoria, LocalDate data) {
        validarCampos(valor, descricao, categoria, data);

        BigDecimal saldoAtual = repository.calcularSaldo();
        if (saldoAtual.compareTo(valor) < 0) {
            throw new SaldoInsuficienteException(
                    "Saldo insuficiente. Saldo atual: R$ " + saldoAtual + " | Saída: R$ " + valor
            );
        }

        Transacao transacao = new Transacao("SAIDA", valor, descricao, categoria, data);
        repository.salvar(transacao);
    }

    public BigDecimal buscarSaldoAtual() {
        return repository.calcularSaldo();
    }

    public List<Transacao> listarExtrato(int limite) {
        return repository.buscarExtrato(limite);
    }

    private void validarCampos(BigDecimal valor, String descricao, String categoria, LocalDate data) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor deve ser maior que zero.");
        }

        if (descricao == null || descricao.isBlank()) {
            throw new IllegalArgumentException("A descrição é obrigatória.");
        }

        if (categoria == null || categoria.isBlank()) {
            throw new IllegalArgumentException("A categoria é obrigatória.");
        }

        if (data == null) {
            throw new IllegalArgumentException("A data é obrigatória.");
        }
    }
}