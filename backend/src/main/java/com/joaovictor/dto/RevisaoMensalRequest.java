package com.joaovictor.dto;

public class RevisaoMensalRequest {

    private String mesReferencia;
    private boolean gastoInesperado;
    private boolean valorIncorreto;
    private boolean revisarCategorias;
    private String observacoes;

    public String getMesReferencia() {
        return mesReferencia;
    }

    public void setMesReferencia(String mesReferencia) {
        this.mesReferencia = mesReferencia;
    }

    public boolean isGastoInesperado() {
        return gastoInesperado;
    }

    public void setGastoInesperado(boolean gastoInesperado) {
        this.gastoInesperado = gastoInesperado;
    }

    public boolean isValorIncorreto() {
        return valorIncorreto;
    }

    public void setValorIncorreto(boolean valorIncorreto) {
        this.valorIncorreto = valorIncorreto;
    }

    public boolean isRevisarCategorias() {
        return revisarCategorias;
    }

    public void setRevisarCategorias(boolean revisarCategorias) {
        this.revisarCategorias = revisarCategorias;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}