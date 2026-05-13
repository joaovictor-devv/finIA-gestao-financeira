package com.joaovictor.service;

import com.joaovictor.model.ResumoFinanceiro;
import com.joaovictor.repository.TransacaoRepository;

import java.math.BigDecimal;
import java.time.YearMonth;

public class AnaliseFinanceiraService {

    private final TransacaoRepository repository;

    public AnaliseFinanceiraService() {
        this.repository = new TransacaoRepository();
    }

    public ResumoFinanceiro gerarResumoDoMesAtual() {
        return repository.gerarResumoMensal(YearMonth.now());
    }

    public ResumoFinanceiro gerarResumoPorMes(int ano, int mes) {
        return repository.gerarResumoMensal(YearMonth.of(ano, mes));
    }

    public BigDecimal compararGastosComMesAnterior() {
        YearMonth atual = YearMonth.now();
        YearMonth anterior = atual.minusMonths(1);

        BigDecimal saidasAtual = repository.totalSaidasNoMes(atual);
        BigDecimal saidasAnterior = repository.totalSaidasNoMes(anterior);

        return saidasAtual.subtract(saidasAnterior);
    }
}