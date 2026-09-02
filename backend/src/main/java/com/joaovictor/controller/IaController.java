package com.joaovictor.controller;

import com.joaovictor.model.ResumoFinanceiro;
import com.joaovictor.service.AnaliseFinanceiraService;
import com.joaovictor.service.OpenAIService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/ia")
public class IaController {

    private final OpenAIService openAIService;
    private final AnaliseFinanceiraService analiseFinanceiraService;

    public IaController(OpenAIService openAIService,
                        AnaliseFinanceiraService analiseFinanceiraService) {
        this.openAIService = openAIService;
        this.analiseFinanceiraService = analiseFinanceiraService;
    }

    @GetMapping("/resumo-inteligente")
    public ResponseEntity<Map<String, Object>> resumoInteligente() {

        ResumoFinanceiro resumo =
                analiseFinanceiraService.gerarResumoDoMesAtual();

        String dados = """
                Total de entradas: %s
                Total de saídas: %s
                Saldo do mês: %s
                Categoria com maior gasto: %s
                Valor do maior gasto: %s
                """.formatted(
                resumo.getTotalEntradas(),
                resumo.getTotalSaidas(),
                resumo.getSaldoMes(),
                resumo.getCategoriaMaiorGasto(),
                resumo.getValorMaiorGasto()
        );

        String analise = openAIService.analisar(dados);

        Map<String, Object> resposta = new HashMap<>();

        resposta.put("sucesso", true);
        resposta.put("dadosFinanceiros", resumo);
        resposta.put("analiseIA", analise);

        return ResponseEntity.ok(resposta);
    }
}