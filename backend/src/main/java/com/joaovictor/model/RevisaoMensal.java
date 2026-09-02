package com.joaovictor.model;

public class RevisaoMensal {

    private long id;
    private String mesReferencia;
    private boolean gastoInesperado;
    private boolean valorIncorreto;
    private boolean revisarCategorias;
    private String observacoes;

    public RevisaoMensal() {
    }

    public RevisaoMensal(long id,
                         String mesReferencia,
                         boolean gastoInesperado,
                         boolean valorIncorreto,
                         boolean revisarCategorias,
                         String observacoes) {
        this.id = id;
        this.mesReferencia = mesReferencia;
        this.gastoInesperado = gastoInesperado;
        this.valorIncorreto = valorIncorreto;
        this.revisarCategorias = revisarCategorias;
        this.observacoes = observacoes;
    }

    public RevisaoMensal(String mesReferencia,
                         boolean gastoInesperado,
                         boolean valorIncorreto,
                         boolean revisarCategorias,
                         String observacoes) {
        this.mesReferencia = mesReferencia;
        this.gastoInesperado = gastoInesperado;
        this.valorIncorreto = valorIncorreto;
        this.revisarCategorias = revisarCategorias;
        this.observacoes = observacoes;
    }

    public long getId() {
        return id;
    }

    public String getMesReferencia() {
        return mesReferencia;
    }

    public boolean isGastoInesperado() {
        return gastoInesperado;
    }

    public boolean isValorIncorreto() {
        return valorIncorreto;
    }

    public boolean isRevisarCategorias() {
        return revisarCategorias;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setId(long id) {
        this.id = id;
    }

    public void setMesReferencia(String mesReferencia) {
        this.mesReferencia = mesReferencia;
    }

    public void setGastoInesperado(boolean gastoInesperado) {
        this.gastoInesperado = gastoInesperado;
    }

    public void setValorIncorreto(boolean valorIncorreto) {
        this.valorIncorreto = valorIncorreto;
    }

    public void setRevisarCategorias(boolean revisarCategorias) {
        this.revisarCategorias = revisarCategorias;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}