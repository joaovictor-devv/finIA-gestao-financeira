package com.joaovictor.service;

import com.joaovictor.model.ResumoFinanceiro;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class SugestaoFinanceiraService {

    private final AnaliseFinanceiraService analiseFinanceiraService;

    public SugestaoFinanceiraService() {
        this.analiseFinanceiraService = new AnaliseFinanceiraService();
    }

    public List<String> gerarSugestoesDoMesAtual() {
        ResumoFinanceiro resumo = analiseFinanceiraService.gerarResumoDoMesAtual();
        BigDecimal diferencaMesAnterior = analiseFinanceiraService.compararGastosComMesAnterior();

        List<String> sugestoes = new ArrayList<>();

        if (resumo.getTotalSaidas().compareTo(resumo.getTotalEntradas()) > 0) {
            sugestoes.add("Seus gastos estão maiores que suas entradas neste mês. Revise despesas não essenciais.");
        }

        if (resumo.getCategoriaMaiorGasto() != null
                && !resumo.getCategoriaMaiorGasto().equalsIgnoreCase("Sem dados")
                && resumo.getValorMaiorGasto().compareTo(BigDecimal.ZERO) > 0) {
            sugestoes.add("Sua categoria com maior gasto é '" + resumo.getCategoriaMaiorGasto()
                    + "' com total de R$ " + resumo.getValorMaiorGasto() + ".");
        }

        if (diferencaMesAnterior.compareTo(BigDecimal.ZERO) > 0) {
            sugestoes.add("Você gastou R$ " + diferencaMesAnterior + " a mais que no mês anterior.");
        } else if (diferencaMesAnterior.compareTo(BigDecimal.ZERO) < 0) {
            sugestoes.add("Parabéns. Você reduziu seus gastos em R$ "
                    + diferencaMesAnterior.abs() + " em relação ao mês anterior.");
        }

        if (resumo.getSaldoMes().compareTo(BigDecimal.ZERO) > 0) {
            sugestoes.add("Seu mês está positivo. Considere reservar parte desse valor para uma meta financeira.");
        }

        if (sugestoes.isEmpty()) {
            sugestoes.add("Ainda não há dados suficientes para gerar sugestões.");
        }

        return sugestoes;
    }
}