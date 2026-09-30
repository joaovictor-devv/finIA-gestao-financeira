package com.joaovictor.service;

import com.joaovictor.exception.IAIndisponivelException;
import com.joaovictor.model.RespostaIA;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.ResponseTextConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OpenAIService {

    private final ContextoFinanceiroIAService contextoService;
    private final String apiKey;
    private final String model;
    private volatile OpenAIClient client;

    public OpenAIService(
            ContextoFinanceiroIAService contextoService,
            @Value("${openai.api-key:}") String apiKey,
            @Value("${openai.model:gpt-5-mini}") String model) {
        this.contextoService = contextoService;
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigurada() {
        return apiKey != null && !apiKey.isBlank();
    }

    public RespostaIA perguntar(String pergunta) {
        if (pergunta == null || pergunta.isBlank()) {
            throw new IllegalArgumentException("A pergunta é obrigatória.");
        }

        if (!isConfigurada()) {
            throw new IAIndisponivelException(
                    "A IA está indisponível porque a variável OPENAI_API_KEY não foi configurada."
            );
        }

        String contexto = contextoService.montarTexto();
        String instrucoes = """
                Você é a FinIA, assistente de organização financeira pessoal.
                Explique a situação em português do Brasil para alguém sem conhecimento de finanças.

                COMO RESPONDER:
                - Comece com a resposta direta à pergunta, em uma frase.
                - Explique o motivo com os poucos números necessários e, se útil, indique um próximo passo concreto.
                - Use até 100 palavras por padrão. Perguntas simples pedem de 1 a 3 frases.
                  Só aprofunde se o usuário pedir; mesmo assim, evite repetições.
                - Prefira até 3 parágrafos curtos. Se uma lista ajudar, use no máximo 2 itens.
                  Não use títulos, tabelas, emojis ou listas de todos os dados por padrão.
                - Use palavras comuns: "o que sobra no mês", "quanto separar por mês" e "dinheiro disponível".
                  Não mostre códigos como METAS_ACIMA_DA_CAPACIDADE nem mencione motor, backend ou regras internas.
                - Não acrescente rótulos como "(fato)", "(sugestão)" e "(interpretação)" ou avisos genéricos repetidos.
                  Apresente os números como dados e as opções com expressões naturais, como "Você pode...".
                - Não encerre com uma pergunta ou oferta de ajuda por hábito. Pergunte apenas se faltar um dado essencial.

                PRECISÃO:
                - Os dados calculados recebidos são a fonte dos números e classificações.
                  Não invente, substitua ou refaça silenciosamente saldo, renda, gastos, reserva, metas, prazos ou projeções.
                - Ao analisar gastos, considere saldo, capacidade mensal e compromissos com metas.
                  Dinheiro disponível hoje e o que sobra todo mês são coisas diferentes: explique essa diferença quando relevante.
                  Um limite recomendado de R$ 0 não significa que o saldo da conta seja zero.
                - Ao analisar metas, considere valor restante, prazo, valor mensal necessário e outras metas.
                  Se não couber no orçamento, explique quanto falta por mês. Use os prazos viáveis já calculados.
                  Para zerar um déficit, o ajuste precisa ser de pelo menos o valor que falta, nunca "até" esse valor.
                - Alterar apenas a prioridade de uma meta não reduz seu valor mensal.
                  O saldo do perfil não está automaticamente reservado para uma meta; use o valor registrado nela.
                - Não mantenha a conclusão atual como se nada mudasse após uma compra, quitação ou alteração de meta.
                  Se o novo cenário não foi calculado, oriente o usuário a conferir a mudança em Metas ou Simulações.
                - Ao explicar uma simulação, use os resultados daquele cenário para a projeção, sem confundir com os dados atuais.
                  Diga brevemente que é uma estimativa. Não prometa resultados nem recomende investimentos específicos.
                - Se faltar informação para responder com segurança, diga qual dado falta em uma frase.

                AÇÕES DISPONÍVEIS:
                - Este chat apenas explica os dados recebidos; não executa ações nem chama outras ferramentas.
                  Não prometa alterar, pausar, excluir ou simular metas e não diga "quer que eu faça isso?".
                - Quando necessário, oriente o usuário a editar sua meta em Metas, revisar Meu Orçamento
                  ou testar um cenário em Simulações. Não invente botões ou funções.
                """;

        String input = "DADOS FINANCEIROS CALCULADOS PELO BACKEND:\n"
                + contexto
                + "\n\nPERGUNTA DO USUÁRIO:\n"
                + pergunta.trim();

        try {
            ResponseCreateParams.Builder params = ResponseCreateParams.builder()
                    .instructions(instrucoes)
                    .input(input)
                    .model(model);

            if ("gpt-5-mini".equals(model) || model.startsWith("gpt-5-mini-")) {
                params.text(ResponseTextConfig.builder()
                        .verbosity(ResponseTextConfig.Verbosity.LOW)
                        .build());
            }

            Response response = obterClient().responses().create(params.build());

            String resposta = response.output().stream()
                    .flatMap(item -> item.message().stream())
                    .flatMap(message -> message.content().stream())
                    .flatMap(content -> content.outputText().stream())
                    .map(outputText -> outputText.text())
                    .reduce("", String::concat)
                    .trim();

            if (resposta.isBlank()) {
                throw new IAIndisponivelException("A IA respondeu sem conteúdo de texto utilizável.");
            }

            return new RespostaIA(true, resposta);
        } catch (IAIndisponivelException e) {
            throw e;
        } catch (Exception e) {
            throw new IAIndisponivelException(
                    "Não foi possível consultar a IA da OpenAI no momento.",
                    e
            );
        }
    }

    private OpenAIClient obterClient() {
        if (client == null) {
            synchronized (this) {
                if (client == null) {
                    client = OpenAIOkHttpClient.builder()
                            .apiKey(apiKey)
                            .build();
                }
            }
        }

        return client;
    }
}
