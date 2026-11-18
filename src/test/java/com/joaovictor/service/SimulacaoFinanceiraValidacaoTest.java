package com.joaovictor.service;

import com.joaovictor.dto.EventoSimulacaoRequest;
import com.joaovictor.dto.SimulacaoFinanceiraRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SimulacaoFinanceiraValidacaoTest {

    private final SimulacaoFinanceiraService service = new SimulacaoFinanceiraService();

    @Test
    void deveLimitarSimulacaoA60Meses() {
        SimulacaoFinanceiraRequest request = new SimulacaoFinanceiraRequest();
        request.setMeses(61);

        assertThatThrownBy(() -> service.simular(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1 e 60 meses");
    }

    @Test
    void deveRejeitarEventoForaDoPeriodo() {
        SimulacaoFinanceiraRequest request = request(6);
        request.setEventos(List.of(evento(7, "GASTO_EXTRAORDINARIO", "100", null)));

        assertThatThrownBy(() -> service.simular(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mês entre 1");
    }

    @Test
    void deveRejeitarTipoDeEventoDesconhecido() {
        SimulacaoFinanceiraRequest request = request(6);
        request.setEventos(List.of(evento(1, "EVENTO_INEXISTENTE", "100", null)));

        assertThatThrownBy(() -> service.simular(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tipo de evento");
    }

    @Test
    void deveRejeitarValorNegativoEmEvento() {
        SimulacaoFinanceiraRequest request = request(6);
        request.setEventos(List.of(evento(1, "ALTERAR_GASTOS", "-1", null)));

        assertThatThrownBy(() -> service.simular(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("não pode ser negativo");
    }

    @Test
    void deveRejeitarReservaMensalNegativaAntesDeAcessarOBanco() {
        SimulacaoFinanceiraRequest request = request(3);
        request.setReservaMensal(new BigDecimal("-100"));

        assertThatThrownBy(() -> service.simular(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("guardar não pode ser negativo");
    }

    @Test
    void deveExigirValorPositivoParaGastoExtraordinario() {
        SimulacaoFinanceiraRequest request = request(6);
        request.setEventos(List.of(evento(1, "GASTO_EXTRAORDINARIO", "0", null)));

        assertThatThrownBy(() -> service.simular(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("maiores que zero");
    }

    @Test
    void deveLimitarQuantidadeDeEventos() {
        SimulacaoFinanceiraRequest request = request(12);
        List<EventoSimulacaoRequest> eventos = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            eventos.add(evento(1, "RENDA_EXTRAORDINARIA", "1", null));
        }
        request.setEventos(eventos);

        assertThatThrownBy(() -> service.simular(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no máximo 100 eventos");
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
        evento.setValor(new BigDecimal(valor));
        evento.setMetaId(metaId);
        return evento;
    }
}
