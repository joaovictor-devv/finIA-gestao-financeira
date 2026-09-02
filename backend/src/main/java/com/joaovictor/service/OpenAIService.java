package com.joaovictor.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {

    private final RestClient restClient;

    @Value("${openai.api.key}")
    private String apiKey;

    public OpenAIService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .build();
    }

    public String analisar(String dadosFinanceiros) {

        Map<String, Object> body = Map.of(
                "model", "gpt-5.6",
                "input", """
                        Você é um assistente de educação financeira.

                        Analise os seguintes dados financeiros:

                        %s

                        Gere uma análise simples e objetiva, destacando:
                        - situação financeira;
                        - principais gastos;
                        - possíveis pontos de atenção;
                        - sugestões para melhorar a organização financeira.

                        Não invente informações que não estejam nos dados.
                        """.formatted(dadosFinanceiros)
        );

        Map<?, ?> resposta = restClient.post()
                .uri("/responses")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (resposta == null) {
            throw new RuntimeException("Resposta vazia da OpenAI.");
        }

        Object output = resposta.get("output");

        if (!(output instanceof List<?> outputList) || outputList.isEmpty()) {
            throw new RuntimeException("A OpenAI não retornou conteúdo.");
        }

        Map<?, ?> primeiroItem = (Map<?, ?>) outputList.get(0);

        Object content = primeiroItem.get("content");

        if (!(content instanceof List<?> contentList) || contentList.isEmpty()) {
            throw new RuntimeException("A OpenAI não retornou texto.");
        }

        Map<?, ?> primeiroConteudo = (Map<?, ?>) contentList.get(0);

        Object texto = primeiroConteudo.get("text");

        if (texto == null) {
            throw new RuntimeException("Não foi possível encontrar o texto da resposta.");
        }

        return texto.toString();
    }
}