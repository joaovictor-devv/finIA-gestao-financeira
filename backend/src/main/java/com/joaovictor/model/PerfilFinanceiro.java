package com.joaovictor.model;

import java.math.BigDecimal;

public class PerfilFinanceiro {

    private long id;
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

    public PerfilFinanceiro() {
    }

    public PerfilFinanceiro(long id,
                            BigDecimal rendaMensal,
                            BigDecimal rendaExtra,
                            BigDecimal gastoMoradia,
                            BigDecimal gastoAgua,
                            BigDecimal gastoEnergia,
                            BigDecimal gastoInternet,
                            BigDecimal gastoTransporte,
                            BigDecimal gastoAlimentacao,
                            BigDecimal outrasDespesas,
                            BigDecimal valorPlanejadoGuardar,
                            String objetivoPrincipal) {
        this.id = id;
        this.rendaMensal = rendaMensal;
        this.rendaExtra = rendaExtra;
        this.gastoMoradia = gastoMoradia;
        this.gastoAgua = gastoAgua;
        this.gastoEnergia = gastoEnergia;
        this.gastoInternet = gastoInternet;
        this.gastoTransporte = gastoTransporte;
        this.gastoAlimentacao = gastoAlimentacao;
        this.outrasDespesas = outrasDespesas;
        this.valorPlanejadoGuardar = valorPlanejadoGuardar;
        this.objetivoPrincipal = objetivoPrincipal;
    }

    public PerfilFinanceiro(BigDecimal rendaMensal,
                            BigDecimal rendaExtra,
                            BigDecimal gastoMoradia,
                            BigDecimal gastoAgua,
                            BigDecimal gastoEnergia,
                            BigDecimal gastoInternet,
                            BigDecimal gastoTransporte,
                            BigDecimal gastoAlimentacao,
                            BigDecimal outrasDespesas,
                            BigDecimal valorPlanejadoGuardar,
                            String objetivoPrincipal) {
        this.rendaMensal = rendaMensal;
        this.rendaExtra = rendaExtra;
        this.gastoMoradia = gastoMoradia;
        this.gastoAgua = gastoAgua;
        this.gastoEnergia = gastoEnergia;
        this.gastoInternet = gastoInternet;
        this.gastoTransporte = gastoTransporte;
        this.gastoAlimentacao = gastoAlimentacao;
        this.outrasDespesas = outrasDespesas;
        this.valorPlanejadoGuardar = valorPlanejadoGuardar;
        this.objetivoPrincipal = objetivoPrincipal;
    }

    public long getId() {
        return id;
    }

    public BigDecimal getRendaMensal() {
        return rendaMensal;
    }

    public BigDecimal getRendaExtra() {
        return rendaExtra;
    }

    public BigDecimal getGastoMoradia() {
        return gastoMoradia;
    }

    public BigDecimal getGastoAgua() {
        return gastoAgua;
    }

    public BigDecimal getGastoEnergia() {
        return gastoEnergia;
    }

    public BigDecimal getGastoInternet() {
        return gastoInternet;
    }

    public BigDecimal getGastoTransporte() {
        return gastoTransporte;
    }

    public BigDecimal getGastoAlimentacao() {
        return gastoAlimentacao;
    }

    public BigDecimal getOutrasDespesas() {
        return outrasDespesas;
    }

    public BigDecimal getValorPlanejadoGuardar() {
        return valorPlanejadoGuardar;
    }

    public String getObjetivoPrincipal() {
        return objetivoPrincipal;
    }

    public void setId(long id) {
        this.id = id;
    }

    public void setRendaMensal(BigDecimal rendaMensal) {
        this.rendaMensal = rendaMensal;
    }

    public void setRendaExtra(BigDecimal rendaExtra) {
        this.rendaExtra = rendaExtra;
    }

    public void setGastoMoradia(BigDecimal gastoMoradia) {
        this.gastoMoradia = gastoMoradia;
    }

    public void setGastoAgua(BigDecimal gastoAgua) {
        this.gastoAgua = gastoAgua;
    }

    public void setGastoEnergia(BigDecimal gastoEnergia) {
        this.gastoEnergia = gastoEnergia;
    }

    public void setGastoInternet(BigDecimal gastoInternet) {
        this.gastoInternet = gastoInternet;
    }

    public void setGastoTransporte(BigDecimal gastoTransporte) {
        this.gastoTransporte = gastoTransporte;
    }

    public void setGastoAlimentacao(BigDecimal gastoAlimentacao) {
        this.gastoAlimentacao = gastoAlimentacao;
    }

    public void setOutrasDespesas(BigDecimal outrasDespesas) {
        this.outrasDespesas = outrasDespesas;
    }

    public void setValorPlanejadoGuardar(BigDecimal valorPlanejadoGuardar) {
        this.valorPlanejadoGuardar = valorPlanejadoGuardar;
    }

    public void setObjetivoPrincipal(String objetivoPrincipal) {
        this.objetivoPrincipal = objetivoPrincipal;
    }
}