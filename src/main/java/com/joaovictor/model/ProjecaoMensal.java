package com.joaovictor.model;

import java.math.BigDecimal;
import java.util.List;

public class ProjecaoMensal {

    private final int indiceMes;
    private final String mesReferencia;
    private final BigDecimal rendaMensal;
    private final BigDecimal rendaExtraordinaria;
    private final BigDecimal gastosMensais;
    private final BigDecimal reservaPlanejada;
    private final BigDecimal aporteMetasBase;
    private final BigDecimal aporteExtraMetas;
    private final BigDecimal gastoExtraordinario;
    private final BigDecimal margemMensal;
    private final BigDecimal saldoDisponivelProjetado;
    private final String classificacao;
    private final List<String> eventosAplicados;
    private final List<ProjecaoMetaMensal> metasProjetadas;

    public ProjecaoMensal(int indiceMes,
                          String mesReferencia,
                          BigDecimal rendaMensal,
                          BigDecimal rendaExtraordinaria,
                          BigDecimal gastosMensais,
                          BigDecimal reservaPlanejada,
                          BigDecimal aporteMetasBase,
                          BigDecimal aporteExtraMetas,
                          BigDecimal gastoExtraordinario,
                          BigDecimal margemMensal,
                          BigDecimal saldoDisponivelProjetado,
                          String classificacao,
                          List<String> eventosAplicados) {
        this(indiceMes, mesReferencia, rendaMensal, rendaExtraordinaria, gastosMensais,
                reservaPlanejada, aporteMetasBase, aporteExtraMetas, gastoExtraordinario,
                margemMensal, saldoDisponivelProjetado, classificacao, eventosAplicados, List.of());
    }

    public ProjecaoMensal(int indiceMes,
                          String mesReferencia,
                          BigDecimal rendaMensal,
                          BigDecimal rendaExtraordinaria,
                          BigDecimal gastosMensais,
                          BigDecimal reservaPlanejada,
                          BigDecimal aporteMetasBase,
                          BigDecimal aporteExtraMetas,
                          BigDecimal gastoExtraordinario,
                          BigDecimal margemMensal,
                          BigDecimal saldoDisponivelProjetado,
                          String classificacao,
                          List<String> eventosAplicados,
                          List<ProjecaoMetaMensal> metasProjetadas) {
        this.metasProjetadas = List.copyOf(metasProjetadas);
        this.indiceMes = indiceMes;
        this.mesReferencia = mesReferencia;
        this.rendaMensal = rendaMensal;
        this.rendaExtraordinaria = rendaExtraordinaria;
        this.gastosMensais = gastosMensais;
        this.reservaPlanejada = reservaPlanejada;
        this.aporteMetasBase = aporteMetasBase;
        this.aporteExtraMetas = aporteExtraMetas;
        this.gastoExtraordinario = gastoExtraordinario;
        this.margemMensal = margemMensal;
        this.saldoDisponivelProjetado = saldoDisponivelProjetado;
        this.classificacao = classificacao;
        this.eventosAplicados = eventosAplicados;
    }

    public int getIndiceMes() { return indiceMes; }
    public String getMesReferencia() { return mesReferencia; }
    public BigDecimal getRendaMensal() { return rendaMensal; }
    public BigDecimal getRendaExtraordinaria() { return rendaExtraordinaria; }
    public BigDecimal getGastosMensais() { return gastosMensais; }
    public BigDecimal getReservaPlanejada() { return reservaPlanejada; }
    public BigDecimal getAporteMetasBase() { return aporteMetasBase; }
    public BigDecimal getAporteExtraMetas() { return aporteExtraMetas; }
    public BigDecimal getGastoExtraordinario() { return gastoExtraordinario; }
    public BigDecimal getMargemMensal() { return margemMensal; }
    public BigDecimal getSaldoDisponivelProjetado() { return saldoDisponivelProjetado; }
    public String getClassificacao() { return classificacao; }
    public List<String> getEventosAplicados() { return eventosAplicados; }
    public List<ProjecaoMetaMensal> getMetasProjetadas() { return metasProjetadas; }
}
