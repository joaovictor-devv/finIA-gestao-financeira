package com.joaovictor.dto;

import java.math.BigDecimal;

public class PerfilFinanceiroRequest {

    private BigDecimal rendaMensal;
    private BigDecimal rendaExtra;
    private BigDecimal gastoMoradia;
    private BigDecimal gastoAgua;
    private BigDecimal gastoEnergia;
    private BigDecimal gastoInternet;
    private BigDecimal gastoTransporte;
    private BigDecimal gastoAlimentacao;
    private BigDecimal outrasDespesas;
    private BigDecimal valorPlanejadoGuardar;
    private String objetivoPrincipal;

    public BigDecimal getRendaMensal() {
        return rendaMensal;
    }

    public void setRendaMensal(BigDecimal rendaMensal) {
        this.rendaMensal = rendaMensal;
    }

    public BigDecimal getRendaExtra() {
        return rendaExtra;
    }

    public void setRendaExtra(BigDecimal rendaExtra) {
        this.rendaExtra = rendaExtra;
    }

    public BigDecimal getGastoMoradia() {
        return gastoMoradia;
    }

    public void setGastoMoradia(BigDecimal gastoMoradia) {
        this.gastoMoradia = gastoMoradia;
    }

    public BigDecimal getGastoAgua() {
        return gastoAgua;
    }

    public void setGastoAgua(BigDecimal gastoAgua) {
        this.gastoAgua = gastoAgua;
    }

    public BigDecimal getGastoEnergia() {
        return gastoEnergia;
    }

    public void setGastoEnergia(BigDecimal gastoEnergia) {
        this.gastoEnergia = gastoEnergia;
    }

    public BigDecimal getGastoInternet() {
        return gastoInternet;
    }

    public void setGastoInternet(BigDecimal gastoInternet) {
        this.gastoInternet = gastoInternet;
    }

    public BigDecimal getGastoTransporte() {
        return gastoTransporte;
    }

    public void setGastoTransporte(BigDecimal gastoTransporte) {
        this.gastoTransporte = gastoTransporte;
    }

    public BigDecimal getGastoAlimentacao() {
        return gastoAlimentacao;
    }

    public void setGastoAlimentacao(BigDecimal gastoAlimentacao) {
        this.gastoAlimentacao = gastoAlimentacao;
    }

    public BigDecimal getOutrasDespesas() {
        return outrasDespesas;
    }

    public void setOutrasDespesas(BigDecimal outrasDespesas) {
        this.outrasDespesas = outrasDespesas;
    }

    public BigDecimal getValorPlanejadoGuardar() {
        return valorPlanejadoGuardar;
    }

    public void setValorPlanejadoGuardar(BigDecimal valorPlanejadoGuardar) {
        this.valorPlanejadoGuardar = valorPlanejadoGuardar;
    }

    public String getObjetivoPrincipal() {
        return objetivoPrincipal;
    }

    public void setObjetivoPrincipal(String objetivoPrincipal) {
        this.objetivoPrincipal = objetivoPrincipal;
    }
}