package com.joaovictor.model;

import java.util.List;

public class AnaliseIARequest {

    private String pergunta;
    private List<MensagemHistoricoIA> historico;

    public AnaliseIARequest() {
    }

    public String getPergunta() {
        return pergunta;
    }

    public void setPergunta(String pergunta) {
        this.pergunta = pergunta;
    }

    public List<MensagemHistoricoIA> getHistorico() { return historico; }
    public void setHistorico(List<MensagemHistoricoIA> historico) { this.historico = historico; }
}