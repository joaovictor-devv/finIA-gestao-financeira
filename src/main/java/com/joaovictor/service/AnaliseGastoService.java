package com.joaovictor.service;

import com.joaovictor.model.AnaliseGasto;
import com.joaovictor.model.CapacidadeFinanceira;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class AnaliseGastoService {

    private static final BigDecimal LIMITE_ATENCAO = new BigDecimal("0.80");

    private final MotorFinanceiroService motorFinanceiroService;

    public AnaliseGastoService() {
        this(new MotorFinanceiroService());
    }

    @Autowired
    public AnaliseGastoService(MotorFinanceiroService motorFinanceiroService) {
        this.motorFinanceiroService = motorFinanceiroService;
    }

    public AnaliseGasto analisar(BigDecimal valor) {
        ValoresMonetarios.validar(valor);
        if (valor == null || valor.signum() <= 0) {
            throw new IllegalArgumentException("O valor do gasto deve ser maior que zero.");
        }
        return analisar(valor, motorFinanceiroService.calcularCapacidade());
    }

    public AnaliseGasto analisar(BigDecimal valor, CapacidadeFinanceira capacidade) {
        ValoresMonetarios.validar(valor);
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor do gasto deve ser maior que zero.");
        }

        if (capacidade == null) {
            throw new IllegalArgumentException("A capacidade financeira é obrigatória para analisar o gasto.");
        }

        BigDecimal saldoAtual = capacidade.getSaldoAtual();
        BigDecimal margemLivre = capacidade.getMargemAntesMetas();
        BigDecimal comprometimentoMetas = capacidade.getComprometimentoMensalMetas();
        BigDecimal margemDisponivel = capacidade.getMargemAposMetas();
        BigDecimal limiteImediato = capacidade.getCapacidadeGastoImediato();
        BigDecimal margemAposGasto = margemDisponivel.subtract(valor);
        boolean saldoSuficiente = saldoAtual.compareTo(valor) >= 0;

        if (!saldoSuficiente) {
            return resposta(
                    valor, saldoAtual, margemLivre, comprometimentoMetas, margemDisponivel, margemAposGasto,
                    false, false, "SALDO_INSUFICIENTE",
                    "O gasto não é possível porque o saldo atual informado é de R$ " + saldoAtual + "."
            );
        }

        if (margemDisponivel.compareTo(BigDecimal.ZERO) <= 0) {
            return resposta(
                    valor, saldoAtual, margemLivre, comprometimentoMetas, margemDisponivel, margemAposGasto,
                    true, false, "NAO_RECOMENDADO",
                    "O saldo é suficiente, mas não existe margem mensal disponível depois das despesas, reserva e metas."
            );
        }

        if (valor.compareTo(limiteImediato) > 0) {
            return resposta(
                    valor, saldoAtual, margemLivre, comprometimentoMetas, margemDisponivel, margemAposGasto,
                    true, false, "NAO_RECOMENDADO",
                    "O valor cabe no saldo, mas ultrapassa o limite de gasto imediato recomendado de R$ "
                            + limiteImediato + ", calculado para preservar o planejamento e as metas."
            );
        }

        if (valor.compareTo(limiteImediato.multiply(LIMITE_ATENCAO)) > 0) {
            return resposta(
                    valor, saldoAtual, margemLivre, comprometimentoMetas, margemDisponivel, margemAposGasto,
                    true, true, "ATENCAO",
                    "O gasto é possível, mas consumirá mais de 80% da capacidade de gasto imediato disponível."
            );
        }

        return resposta(
                valor, saldoAtual, margemLivre, comprometimentoMetas, margemDisponivel, margemAposGasto,
                true, true, "RECOMENDADO",
                "O gasto está dentro do saldo e da capacidade calculada pelo motor financeiro."
        );
    }

    private AnaliseGasto resposta(BigDecimal valor,
                                  BigDecimal saldoAtual,
                                  BigDecimal margemLivre,
                                  BigDecimal comprometimentoMetas,
                                  BigDecimal margemDisponivel,
                                  BigDecimal margemAposGasto,
                                  boolean saldoSuficiente,
                                  boolean recomendado,
                                  String classificacao,
                                  String mensagem) {
        return new AnaliseGasto(
                valor,
                saldoAtual,
                margemLivre,
                comprometimentoMetas,
                margemDisponivel,
                margemAposGasto,
                saldoSuficiente,
                recomendado,
                classificacao,
                mensagem
        );
    }
}
