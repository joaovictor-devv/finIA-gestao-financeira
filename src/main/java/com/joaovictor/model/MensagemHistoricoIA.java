package com.joaovictor.model;

/** Mensagem recente enviada somente como contexto da conversa, sem persistência no servidor. */
public class MensagemHistoricoIA {
    private String tipo;
    private String texto;

    public MensagemHistoricoIA() { }

    public MensagemHistoricoIA(String tipo, String texto) {
        this.tipo = tipo;
        this.texto = texto;
    }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
}
