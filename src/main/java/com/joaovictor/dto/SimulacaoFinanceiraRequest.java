package com.joaovictor.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class SimulacaoFinanceiraRequest {

    private String nomeCenario;
    private Integer meses;
    private BigDecimal rendaMensal;
    private BigDecimal gastosMensais;
    private BigDecimal reservaMensal;
    private BigDecimal aporteExtraMetasMensal;
    private Long metaPrioritariaId;
    // Opcional: adapta aportes planejados à renda que sobra após despesas e reserva.
    // Sem esse campo, mantém a projeção original para compatibilidade.
    private boolean ajustarAportesAoOrcamento;
    private List<EventoSimulacaoRequest> eventos = new ArrayList<>();

    public String getNomeCenario() { return nomeCenario; }
    public void setNomeCenario(String nomeCenario) { this.nomeCenario = nomeCenario; }

    public Integer getMeses() { return meses; }
    public void setMeses(Integer meses) { this.meses = meses; }

    public BigDecimal getRendaMensal() { return rendaMensal; }
    public void setRendaMensal(BigDecimal rendaMensal) { this.rendaMensal = rendaMensal; }

    public BigDecimal getGastosMensais() { return gastosMensais; }
    public void setGastosMensais(BigDecimal gastosMensais) { this.gastosMensais = gastosMensais; }

    public BigDecimal getReservaMensal() { return reservaMensal; }
    public void setReservaMensal(BigDecimal reservaMensal) { this.reservaMensal = reservaMensal; }

    public BigDecimal getAporteExtraMetasMensal() { return aporteExtraMetasMensal; }
    public void setAporteExtraMetasMensal(BigDecimal aporteExtraMetasMensal) { this.aporteExtraMetasMensal = aporteExtraMetasMensal; }

    public Long getMetaPrioritariaId() { return metaPrioritariaId; }
    public void setMetaPrioritariaId(Long metaPrioritariaId) { this.metaPrioritariaId = metaPrioritariaId; }

    public boolean isAjustarAportesAoOrcamento() { return ajustarAportesAoOrcamento; }
    public void setAjustarAportesAoOrcamento(boolean ajustarAportesAoOrcamento) {
        this.ajustarAportesAoOrcamento = ajustarAportesAoOrcamento;
    }

    public List<EventoSimulacaoRequest> getEventos() { return eventos; }
    public void setEventos(List<EventoSimulacaoRequest> eventos) {
        this.eventos = eventos != null ? eventos : new ArrayList<>();
    }
}
