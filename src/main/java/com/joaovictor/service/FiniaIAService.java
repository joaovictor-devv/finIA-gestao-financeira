package com.joaovictor.service;

import com.joaovictor.dto.SimulacaoFinanceiraRequest;
import com.joaovictor.dto.StatusIAResponse;
import com.joaovictor.model.AnaliseIARequest;
import com.joaovictor.model.ProjecaoMensal;
import com.joaovictor.model.ProjecaoMeta;
import com.joaovictor.model.RespostaIA;
import com.joaovictor.model.ResultadoSimulacaoFinanceira;
import org.springframework.stereotype.Service;

@Service
public class FiniaIAService {

    private final OpenAIService openAIService;
    private final SimulacaoFinanceiraService simulacaoFinanceiraService;

    public FiniaIAService(OpenAIService openAIService,
                          SimulacaoFinanceiraService simulacaoFinanceiraService) {
        this.openAIService = openAIService;
        this.simulacaoFinanceiraService = simulacaoFinanceiraService;
    }

    public StatusIAResponse status() {
        boolean configurada = openAIService.isConfigurada();
        String mensagem = configurada
                ? "A FinIA está configurada para utilizar a OpenAI quando o usuário solicitar uma explicação."
                : "A FinIA ainda não está configurada. Defina OPENAI_API_KEY para habilitar as explicações por IA.";
        return new StatusIAResponse(configurada, mensagem);
    }

    public String analisar(AnaliseIARequest request) {
        if (request == null || request.getPergunta() == null || request.getPergunta().isBlank()) {
            throw new IllegalArgumentException("A pergunta é obrigatória.");
        }

        if (request.getPergunta().length() > 2000) {
            throw new IllegalArgumentException("A pergunta deve ter no máximo 2000 caracteres.");
        }
        RespostaIA resposta = openAIService.perguntar(request.getPergunta());
        return resposta.getResposta();
    }

    public String explicarSimulacao(SimulacaoFinanceiraRequest request) {
        ResultadoSimulacaoFinanceira resultado = simulacaoFinanceiraService.simular(request);

        StringBuilder contexto = new StringBuilder();
        contexto.append("Explique esta simulação financeira em até 100 palavras, com frases simples e curtas. ")
                .append("Não refaça nem altere os cálculos. Destaque o resultado principal e apenas os valores que o explicam.\n\n")
                .append("Cenário: ").append(resultado.getNomeCenario()).append('\n')
                .append("Período: ").append(resultado.getMeses()).append(" meses\n")
                .append("Saldo inicial: R$ ").append(resultado.getSaldoInicial()).append('\n')
                .append("Saldo final projetado: R$ ").append(resultado.getSaldoFinalProjetado()).append('\n')
                .append("Variação do saldo: R$ ").append(resultado.getVariacaoSaldo()).append('\n')
                .append("Total planejado para reserva: R$ ").append(resultado.getTotalReservaPlanejada()).append('\n')
                .append("Total aportado em metas: R$ ").append(resultado.getTotalAportadoMetas()).append('\n')
                .append("Gastos extraordinários: R$ ").append(resultado.getTotalGastosExtraordinarios()).append('\n')
                .append("Classificação final: ").append(resultado.getClassificacaoFinal()).append('\n')
                .append("Conclusão determinística: ").append(resultado.getMensagem()).append("\n\n")
                .append("EVOLUÇÃO MENSAL:\n");

        for (ProjecaoMensal mes : resultado.getEvolucaoMensal()) {
            contexto.append("- ").append(mes.getMesReferencia())
                    .append(" | saldo: R$ ").append(mes.getSaldoDisponivelProjetado())
                    .append(" | margem: R$ ").append(mes.getMargemMensal())
                    .append(" | situação: ").append(mes.getClassificacao())
                    .append('\n');
        }

        contexto.append("\nIMPACTO NAS METAS:\n");
        if (resultado.getProjecoesMetas().isEmpty()) {
            contexto.append("Nenhuma meta cadastrada.\n");
        } else {
            for (ProjecaoMeta meta : resultado.getProjecoesMetas()) {
                contexto.append("- ").append(meta.getNome())
                        .append(" | atual: R$ ").append(meta.getValorAtual())
                        .append(" | projetado: R$ ").append(meta.getValorProjetado())
                        .append(" | alvo: R$ ").append(meta.getValorAlvo())
                        .append(" | progresso projetado: ").append(meta.getProgressoProjetadoPercentual()).append("%")
                        .append(" | impacto: ").append(meta.getImpacto())
                        .append('\n');
            }
        }

        contexto.append("\nComece pelo resultado principal e explique o motivo mais importante. ")
                .append("Se houver risco, indique um próximo passo que o usuário possa executar no aplicativo. ")
                .append("Não enumere todos os meses ou todas as metas e não ofereça executar ações pelo chat. ")
                .append("Lembre em uma frase curta que os valores são uma estimativa.");

        RespostaIA resposta = openAIService.perguntar(contexto.toString());
        return resposta.getResposta();
    }
}
