package com.joaovictor.service;

import com.joaovictor.dto.EventoSimulacaoRequest;
import com.joaovictor.dto.SimulacaoFinanceiraRequest;
import com.joaovictor.model.CapacidadeFinanceira;
import com.joaovictor.model.Meta;
import com.joaovictor.model.ProjecaoMeta;
import com.joaovictor.model.ResultadoSimulacaoFinanceira;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MotorSimulacaoServiceTest {

    private final MotorSimulacaoService service = new MotorSimulacaoService();

    @Test
    void deveProjetarCenarioEstavelPorTresMeses() {
        SimulacaoFinanceiraRequest request = request(3);

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "0", "1200"),
                List.of()
        );

        assertThat(resultado.getSaldoInicial()).isEqualByComparingTo("1200");
        assertThat(resultado.getSaldoFinalProjetado()).isEqualByComparingTo("3900");
        assertThat(resultado.getVariacaoSaldo()).isEqualByComparingTo("2700");
        assertThat(resultado.getTotalReservaPlanejada()).isEqualByComparingTo("900");
        assertThat(resultado.getTotalAportadoMetas()).isZero();
        assertThat(resultado.getEvolucaoMensal()).hasSize(3);
        assertThat(resultado.getEvolucaoMensal().get(0).getMargemMensal()).isEqualByComparingTo("900");
        assertThat(resultado.getEvolucaoMensal().get(2).getSaldoDisponivelProjetado()).isEqualByComparingTo("3900");
        assertThat(resultado.getClassificacaoFinal()).isEqualTo("SAUDAVEL");
    }

    @Test
    void deveClassificarTodoOHorizontePeloMesDeficitarioSemConfundirComSaldoTeorico() {
        SimulacaoFinanceiraRequest request = request(3);
        request.setEventos(List.of(evento(1, "GASTO_EXTRAORDINARIO", "900", null)));

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request, capacidade("1000", "800", "0", "0", "0"), List.of());

        assertThat(resultado.getEvolucaoMensal().get(0).getMargemMensal()).isEqualByComparingTo("-700");
        assertThat(resultado.getEvolucaoMensal().get(0).getClassificacao()).isEqualTo("DEFICIT_MENSAL");
        // O saldo acumulado permanece negativo, mas a renda cobre o segundo mês.
        assertThat(resultado.getEvolucaoMensal().get(1).getSaldoDisponivelProjetado())
                .isEqualByComparingTo("-500");
        assertThat(resultado.getEvolucaoMensal().get(1).getMargemMensal())
                .isEqualByComparingTo("200");
        assertThat(resultado.getEvolucaoMensal().get(1).getClassificacao()).isEqualTo("APERTADA");
        // Último mês positivo não pode apagar o risco do primeiro.
        assertThat(resultado.getClassificacaoFinal()).isEqualTo("DEFICIT_MENSAL");
        assertThat(resultado.getMensagem()).contains("1 mês");
    }

    @Test
    void deveSimularReservaMensalSemMetasSemAlterarOOrcamentoReal() {
        SimulacaoFinanceiraRequest request = request(3);
        request.setReservaMensal(dinheiro("600"));

        CapacidadeFinanceira base = capacidade("2500", "1300", "300", "0", "1200");
        ResultadoSimulacaoFinanceira resultado = service.simular(request, base, List.of());

        assertThat(resultado.getTotalReservaPlanejada()).isEqualByComparingTo("1800");
        assertThat(resultado.getTotalAportadoMetas()).isZero();
        assertThat(resultado.getProjecoesMetas()).isEmpty();
        assertThat(resultado.getEvolucaoMensal()).allSatisfy(mes -> {
            assertThat(mes.getReservaPlanejada()).isEqualByComparingTo("600");
            assertThat(mes.getMargemMensal()).isEqualByComparingTo("600");
        });
        assertThat(base.getReservaPlanejada()).isEqualByComparingTo("300");
    }

    @Test
    void reservaMaiorQueRendaDisponivelDeveGerarMargemNegativaSemCriarMetas() {
        SimulacaoFinanceiraRequest request = request(2);
        request.setReservaMensal(dinheiro("1500"));

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request, capacidade("2500", "1300", "0", "0", "1200"), List.of());

        assertThat(resultado.getEvolucaoMensal().get(0).getMargemMensal()).isEqualByComparingTo("-300");
        assertThat(resultado.getEvolucaoMensal().get(1).getMargemMensal()).isEqualByComparingTo("-300");
        assertThat(resultado.getTotalReservaPlanejada()).isEqualByComparingTo("3000");
    }

    @Test
    void deveSuportarHorizonteMaximoDeSessentaMeses() {
        SimulacaoFinanceiraRequest request = request(60);

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "0", "1200"),
                List.of()
        );

        assertThat(resultado.getMeses()).isEqualTo(60);
        assertThat(resultado.getEvolucaoMensal()).hasSize(60);
        assertThat(resultado.getSaldoFinalProjetado()).isEqualByComparingTo("55200");
        assertThat(resultado.getTotalReservaPlanejada()).isEqualByComparingTo("18000");
        assertThat(resultado.getClassificacaoFinal()).isEqualTo("SAUDAVEL");
    }

    @Test
    void gastoExtraordinarioDeveAfetarSomenteOMesEscolhido() {
        SimulacaoFinanceiraRequest request = request(3);
        request.setEventos(List.of(evento(2, "GASTO_EXTRAORDINARIO", "600", null)));

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "0", "1200"),
                List.of()
        );

        assertThat(resultado.getEvolucaoMensal().get(0).getSaldoDisponivelProjetado()).isEqualByComparingTo("2100");
        assertThat(resultado.getEvolucaoMensal().get(1).getMargemMensal()).isEqualByComparingTo("300");
        assertThat(resultado.getEvolucaoMensal().get(1).getSaldoDisponivelProjetado()).isEqualByComparingTo("2400");
        assertThat(resultado.getEvolucaoMensal().get(2).getSaldoDisponivelProjetado()).isEqualByComparingTo("3300");
        assertThat(resultado.getTotalGastosExtraordinarios()).isEqualByComparingTo("600");
        assertThat(resultado.getEvolucaoMensal().get(1).getEventosAplicados())
                .anyMatch(texto -> texto.contains("600"));
    }

    @Test
    void alteracaoDeRendaDevePersistirNosMesesSeguintes() {
        SimulacaoFinanceiraRequest request = request(3);
        request.setEventos(List.of(evento(2, "ALTERAR_RENDA", "2000", null)));

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "0", "1200"),
                List.of()
        );

        assertThat(resultado.getEvolucaoMensal().get(0).getMargemMensal()).isEqualByComparingTo("900");
        assertThat(resultado.getEvolucaoMensal().get(1).getMargemMensal()).isEqualByComparingTo("400");
        assertThat(resultado.getEvolucaoMensal().get(2).getMargemMensal()).isEqualByComparingTo("400");
        assertThat(resultado.getSaldoFinalProjetado()).isEqualByComparingTo("2900");
    }

    @Test
    void alteracaoDeGastosDevePersistirNosMesesSeguintes() {
        SimulacaoFinanceiraRequest request = request(3);
        request.setEventos(List.of(evento(2, "ALTERAR_GASTOS", "1600", null)));

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "0", "1200"),
                List.of()
        );

        assertThat(resultado.getEvolucaoMensal().get(0).getMargemMensal()).isEqualByComparingTo("900");
        assertThat(resultado.getEvolucaoMensal().get(1).getMargemMensal()).isEqualByComparingTo("600");
        assertThat(resultado.getEvolucaoMensal().get(2).getMargemMensal()).isEqualByComparingTo("600");
        assertThat(resultado.getSaldoFinalProjetado()).isEqualByComparingTo("3300");
    }

    @Test
    void rendaExtraordinariaDeveSerSomadaUmaUnicaVez() {
        SimulacaoFinanceiraRequest request = request(3);
        request.setEventos(List.of(evento(2, "RENDA_EXTRAORDINARIA", "500", null)));

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "0", "1200"),
                List.of()
        );

        assertThat(resultado.getTotalRendasExtraordinarias()).isEqualByComparingTo("500");
        assertThat(resultado.getEvolucaoMensal().get(1).getRendaExtraordinaria()).isEqualByComparingTo("500");
        assertThat(resultado.getEvolucaoMensal().get(2).getRendaExtraordinaria()).isZero();
        assertThat(resultado.getSaldoFinalProjetado()).isEqualByComparingTo("4400");
    }

    @Test
    void deveCombinarMudancasPersistentesEEventosUnicos() {
        SimulacaoFinanceiraRequest request = request(4);
        request.setEventos(List.of(
                evento(2, "ALTERAR_GASTOS", "1500", null),
                evento(3, "RENDA_EXTRAORDINARIA", "500", null),
                evento(4, "GASTO_EXTRAORDINARIO", "600", null)
        ));

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "0", "1200"),
                List.of()
        );

        assertThat(resultado.getEvolucaoMensal()).hasSize(4);
        assertThat(resultado.getEvolucaoMensal().get(0).getMargemMensal()).isEqualByComparingTo("900");
        assertThat(resultado.getEvolucaoMensal().get(1).getMargemMensal()).isEqualByComparingTo("700");
        assertThat(resultado.getEvolucaoMensal().get(2).getMargemMensal()).isEqualByComparingTo("1200");
        assertThat(resultado.getEvolucaoMensal().get(3).getMargemMensal()).isEqualByComparingTo("100");
        assertThat(resultado.getSaldoFinalProjetado()).isEqualByComparingTo("4100");
        assertThat(resultado.getTotalRendasExtraordinarias()).isEqualByComparingTo("500");
        assertThat(resultado.getTotalGastosExtraordinarios()).isEqualByComparingTo("600");
    }

    @Test
    void deveProjetarAvancoDeMetaSemAlterarMetaReal() {
        Meta meta = meta(1, "Notebook", "2000", "0", 10, "alta");
        SimulacaoFinanceiraRequest request = request(3);

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "200", "1200"),
                List.of(meta)
        );

        ProjecaoMeta projecao = resultado.getProjecoesMetas().get(0);

        assertThat(resultado.getTotalAportadoMetas()).isEqualByComparingTo("600.00");
        assertThat(resultado.getSaldoFinalProjetado()).isEqualByComparingTo("3300.00");
        assertThat(projecao.getValorProjetado()).isEqualByComparingTo("600.00");
        assertThat(projecao.getProgressoProjetadoPercentual()).isEqualByComparingTo("30.00");
        assertThat(projecao.isConcluidaNoPeriodo()).isFalse();
        assertThat(meta.getValorInicial()).isEqualByComparingTo("0");
    }

    @Test
    void deveRetornarEvolucaoRealDeCadaMetaEmTodosOsMeses() {
        Meta meta = meta(1, "Notebook", "2000", "200", 6, "alta");
        SimulacaoFinanceiraRequest request = request(3);

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1200", "300", "300", "1000"),
                List.of(meta)
        );

        assertThat(resultado.getEvolucaoMensal()).hasSize(3);
        assertThat(resultado.getEvolucaoMensal().get(0).getMetasProjetadas()).hasSize(1);
        assertThat(resultado.getEvolucaoMensal().get(0).getMetasProjetadas().get(0).getValorProjetado())
                .isEqualByComparingTo("500");
        assertThat(resultado.getEvolucaoMensal().get(1).getMetasProjetadas().get(0).getValorProjetado())
                .isEqualByComparingTo("800");
        assertThat(resultado.getEvolucaoMensal().get(2).getMetasProjetadas().get(0).getValorProjetado())
                .isEqualByComparingTo("1100");
        assertThat(meta.getValorInicial()).isEqualByComparingTo("200");
    }

    @Test
    void semMetasRetornaSerieDeProgressoVazia() {
        ResultadoSimulacaoFinanceira resultado = service.simular(
                request(2),
                capacidade("2500", "1200", "300", "0", "1000"),
                List.of()
        );

        assertThat(resultado.getEvolucaoMensal())
                .allSatisfy(mes -> assertThat(mes.getMetasProjetadas()).isEmpty());
    }

    @Test
    void aporteExtraPodeConcluirMetaEParaDeConsumirSaldoDepois() {
        Meta meta = meta(1, "Curso", "500", "0", 5, "alta");
        SimulacaoFinanceiraRequest request = request(3);
        request.setAporteExtraMetasMensal(dinheiro("400"));
        request.setMetaPrioritariaId(1L);

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("2500", "1300", "300", "100", "1200"),
                List.of(meta)
        );

        ProjecaoMeta projecao = resultado.getProjecoesMetas().get(0);

        assertThat(resultado.getTotalAportadoMetas()).isEqualByComparingTo("500.00");
        assertThat(projecao.isConcluidaNoPeriodo()).isTrue();
        assertThat(projecao.getMesConclusaoNaSimulacao()).isEqualTo(1);
        assertThat(projecao.getValorProjetado()).isEqualByComparingTo("500");
        assertThat(resultado.getEvolucaoMensal().get(1).getAporteMetasBase()).isZero();
        assertThat(resultado.getEvolucaoMensal().get(1).getAporteExtraMetas()).isZero();
        assertThat(resultado.getSaldoFinalProjetado()).isEqualByComparingTo("3400.00");
    }

    @Test
    void aporteEspecificoDeveSerAplicadoSomenteNaMetaIndicada() {
        Meta alta = meta(1, "Notebook", "2000", "0", 10, "alta");
        Meta baixa = meta(2, "Viagem", "2000", "0", 10, "baixa");
        SimulacaoFinanceiraRequest request = request(2);
        request.setEventos(List.of(evento(1, "ALTERAR_APORTE_META", "100", 2L)));

        ResultadoSimulacaoFinanceira resultado = service.simular(
                request,
                capacidade("3000", "1000", "300", "400", "2000"),
                List.of(alta, baixa)
        );

        ProjecaoMeta projecaoAlta = resultado.getProjecoesMetas().stream()
                .filter(meta -> meta.getId() == 1)
                .findFirst()
                .orElseThrow();
        ProjecaoMeta projecaoBaixa = resultado.getProjecoesMetas().stream()
                .filter(meta -> meta.getId() == 2)
                .findFirst()
                .orElseThrow();

        assertThat(projecaoAlta.getValorProjetado()).isEqualByComparingTo("400.00");
        assertThat(projecaoBaixa.getValorProjetado()).isEqualByComparingTo("600.00");
    }

    @Test
    void deveRejeitarMetaReferenciadaQueNaoExiste() {
        SimulacaoFinanceiraRequest request = request(3);
        request.setMetaPrioritariaId(99L);

        assertThatThrownBy(() -> service.simular(
                request,
                capacidade("2500", "1300", "300", "0", "1200"),
                List.of()
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("meta prioritária");
    }

    private SimulacaoFinanceiraRequest request(int meses) {
        SimulacaoFinanceiraRequest request = new SimulacaoFinanceiraRequest();
        request.setMeses(meses);
        return request;
    }

    private EventoSimulacaoRequest evento(int mes, String tipo, String valor, Long metaId) {
        EventoSimulacaoRequest evento = new EventoSimulacaoRequest();
        evento.setMes(mes);
        evento.setTipo(tipo);
        evento.setValor(dinheiro(valor));
        evento.setMetaId(metaId);
        return evento;
    }

    private Meta meta(long id, String nome, String alvo, String atual, int prazo, String prioridade) {
        Meta meta = new Meta(nome, dinheiro(alvo), prazo, dinheiro(atual), prioridade, null);
        meta.setId(id);
        return meta;
    }

    private CapacidadeFinanceira capacidade(String renda,
                                             String gastos,
                                             String reserva,
                                             String metas,
                                             String saldo) {
        BigDecimal rendaValor = dinheiro(renda);
        BigDecimal gastosValor = dinheiro(gastos);
        BigDecimal reservaValor = dinheiro(reserva);
        BigDecimal metasValor = dinheiro(metas);
        BigDecimal total = gastosValor.add(reservaValor).add(metasValor);
        BigDecimal margemAntes = rendaValor.subtract(gastosValor).subtract(reservaValor);
        BigDecimal margemApos = rendaValor.subtract(total);
        BigDecimal capacidadeMensal = margemApos.max(BigDecimal.ZERO);
        BigDecimal saldoValor = dinheiro(saldo);
        BigDecimal imediato = saldoValor.min(capacidadeMensal);

        return new CapacidadeFinanceira(
                rendaValor,
                gastosValor,
                reservaValor,
                metasValor,
                total,
                margemAntes,
                margemApos,
                capacidadeMensal,
                saldoValor,
                imediato,
                BigDecimal.ZERO,
                "SAUDAVEL",
                "teste"
        );
    }

    private BigDecimal dinheiro(String valor) {
        return new BigDecimal(valor);
    }
}
