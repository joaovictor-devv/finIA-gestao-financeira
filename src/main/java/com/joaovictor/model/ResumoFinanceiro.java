package com.joaovictor.model;

import java.math.BigDecimal;

public class ResumoFinanceiro {
    private final BigDecimal totalEntradas;
    private final BigDecimal totalSaidas;
    private final BigDecimal saldoMes;
    private final String categoriaMaiorGasto;
    private final BigDecimal valorMaiorGasto;

    public ResumoFinanceiro(BigDecimal totalEntradas,
                            BigDecimal totalSaidas,
                            BigDecimal saldoMes,
                            String categoriaMaiorGasto,
                            BigDecimal valorMaiorGasto) {
        this.totalEntradas = totalEntradas;
        this.totalSaidas = totalSaidas;
        this.saldoMes = saldoMes;
        this.categoriaMaiorGasto = categoriaMaiorGasto;
        this.valorMaiorGasto = valorMaiorGasto;
    }

    public BigDecimal getTotalEntradas() {
        return totalEntradas;
    }

    public BigDecimal getTotalSaidas() {
        return totalSaidas;
    }

    public BigDecimal getSaldoMes() {
        return saldoMes;
    }

    public String getCategoriaMaiorGasto() {
        return categoriaMaiorGasto;
    }

    public BigDecimal getValorMaiorGasto() {
        return valorMaiorGasto;
    }
}