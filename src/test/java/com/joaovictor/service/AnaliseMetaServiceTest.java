package com.joaovictor.service;

import com.joaovictor.model.AnaliseMeta;
import com.joaovictor.model.Meta;
import com.joaovictor.model.SituacaoFinanceira;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class AnaliseMetaServiceTest {

    private final AnaliseMetaService service = new AnaliseMetaService();

    @Test
    void deveClassificarMetaViavel() {
        Meta meta = meta("Notebook", "5000", "1000", 10);

        AnaliseMeta resultado = service.analisar(meta, situacaoComMargem("1000"), dinheiro("450"));

        assertThat(resultado.isViavel()).isTrue();
        assertThat(resultado.getClassificacao()).isEqualTo("VIAVEL");
        assertThat(resultado.getValorMensalNecessario()).isEqualByComparingTo("400.00");
        assertThat(resultado.getMargemDisponivelParaMeta()).isEqualByComparingTo("550");
    }

    @Test
    void deveClassificarMetaViavelComAtencao() {
        Meta meta = meta("Viagem", "1900", "0", 2);

        AnaliseMeta resultado = service.analisar(meta, situacaoComMargem("1000"), BigDecimal.ZERO);

        assertThat(resultado.isViavel()).isTrue();
        assertThat(resultado.getClassificacao()).isEqualTo("VIAVEL_COM_ATENCAO");
        assertThat(resultado.getPercentualMargemComprometida()).isEqualByComparingTo("95.00");
    }

    @Test
    void deveBloquearMetaInviavelESugerirPrazo() {
        Meta meta = meta("Notebook", "5000", "1000", 5);

        AnaliseMeta resultado = service.analisar(meta, situacaoComMargem("1000"), dinheiro("500"));

        assertThat(resultado.isViavel()).isFalse();
        assertThat(resultado.getClassificacao()).isEqualTo("INVIAVEL");
        assertThat(resultado.getValorMensalNecessario()).isEqualByComparingTo("800.00");
        assertThat(resultado.getMargemDisponivelParaMeta()).isEqualByComparingTo("500");
        assertThat(resultado.getPrazoMinimoViavelMeses()).isEqualTo(8);
        assertThat(resultado.getPrazoConfortavelMeses()).isEqualTo(12);
        assertThat(resultado.getMensagem()).contains("prazo mínimo é de 8 meses");
    }

    @Test
    void deveClassificarMetaConcluida() {
        Meta meta = meta("Celular", "2000", "2000", 6);

        AnaliseMeta resultado = service.analisar(meta, situacaoComMargem("500"), BigDecimal.ZERO);

        assertThat(resultado.isViavel()).isTrue();
        assertThat(resultado.getClassificacao()).isEqualTo("CONCLUIDA");
        assertThat(resultado.getValorRestante()).isZero();
        assertThat(resultado.getValorMensalNecessario()).isZero();
    }

    @Test
    void deveBloquearMetaQuandoOrcamentoNaoTemMargem() {
        Meta meta = meta("Curso", "1000", "0", 10);

        AnaliseMeta resultado = service.analisar(meta, situacaoComMargem("0"), BigDecimal.ZERO);

        assertThat(resultado.isViavel()).isFalse();
        assertThat(resultado.getClassificacao()).isEqualTo("INVIAVEL");
        assertThat(resultado.getPrazoMinimoViavelMeses()).isNull();
    }

    @Test
    void deveConsiderarCompromissoDasOutrasMetas() {
        Meta meta = meta("Moto", "6000", "0", 12);

        AnaliseMeta resultado = service.analisar(meta, situacaoComMargem("800"), dinheiro("800"));

        assertThat(resultado.isViavel()).isFalse();
        assertThat(resultado.getMargemDisponivelParaMeta()).isZero();
        assertThat(resultado.getMensagem()).contains("outras metas");
    }

    @Test
    void naoSugerePrazoForaDoLimiteNemSofreOverflow() {
        AnaliseMeta resultado = service.analisar(meta("Casa", "9999999999.99", "0", 600),
                situacaoComMargem("0.01"), BigDecimal.ZERO);
        assertThat(resultado.isViavel()).isFalse();
        assertThat(resultado.getPrazoMinimoViavelMeses()).isNull();
        assertThat(resultado.getPrazoConfortavelMeses()).isNull();
    }

    private SituacaoFinanceira situacaoComMargem(String margemAntesMetas) {
        BigDecimal margem = dinheiro(margemAntesMetas);
        return new SituacaoFinanceira(
                dinheiro("3000"),
                dinheiro("1000"),
                dinheiro("300"),
                margem,
                BigDecimal.ZERO,
                margem,
                margem.max(BigDecimal.ZERO),
                margem.max(BigDecimal.ZERO),
                dinheiro("2000"),
                dinheiro("50"),
                "SAUDAVEL"
        );
    }

    private Meta meta(String nome, String alvo, String atual, int prazo) {
        return new Meta(
                nome,
                dinheiro(alvo),
                prazo,
                dinheiro(atual),
                "media",
                null
        );
    }

    private BigDecimal dinheiro(String valor) {
        return new BigDecimal(valor);
    }
}
