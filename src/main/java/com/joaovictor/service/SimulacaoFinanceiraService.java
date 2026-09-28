package com.joaovictor.service;

import com.joaovictor.dto.EventoSimulacaoRequest;
import com.joaovictor.dto.SimulacaoFinanceiraRequest;
import com.joaovictor.model.CapacidadeFinanceira;
import com.joaovictor.model.Meta;
import com.joaovictor.model.ResultadoSimulacaoFinanceira;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class SimulacaoFinanceiraService {

    private static final int MAX_EVENTOS = 100;
    private static final Set<String> TIPOS_EVENTO = Set.of(
            "RENDA_EXTRAORDINARIA",
            "GASTO_EXTRAORDINARIO",
            "ALTERAR_RENDA",
            "ALTERAR_GASTOS",
            "ALTERAR_APORTE_META"
    );

    private final MotorFinanceiroService motorFinanceiroService;
    private final MetaService metaService;
    private final MotorSimulacaoService motorSimulacaoService;

    public SimulacaoFinanceiraService() {
        this(new MotorFinanceiroService(), new MetaService(), new MotorSimulacaoService());
    }

    @Autowired
    public SimulacaoFinanceiraService(MotorFinanceiroService motorFinanceiroService,
                                      MetaService metaService,
                                      MotorSimulacaoService motorSimulacaoService) {
        this.motorFinanceiroService = motorFinanceiroService;
        this.metaService = metaService;
        this.motorSimulacaoService = motorSimulacaoService;
    }

    public ResultadoSimulacaoFinanceira simular(SimulacaoFinanceiraRequest request) {
        validarAntesDeAcessarBanco(request);

        CapacidadeFinanceira situacaoAtual = motorFinanceiroService.calcularCapacidade();
        List<Meta> metas = metaService.listarMetas();

        return motorSimulacaoService.simular(request, situacaoAtual, metas);
    }

    private void validarAntesDeAcessarBanco(SimulacaoFinanceiraRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Os dados da simulação são obrigatórios.");
        }

        int meses = request.getMeses() != null ? request.getMeses() : 6;
        if (meses < 1 || meses > 60) {
            throw new IllegalArgumentException("O período da simulação deve estar entre 1 e 60 meses.");
        }

        if (request.getNomeCenario() != null && request.getNomeCenario().trim().length() > 100) {
            throw new IllegalArgumentException("O nome do cenário deve ter no máximo 100 caracteres.");
        }

        validarNaoNegativoOpcional(request.getRendaMensal(), "A renda mensal simulada não pode ser negativa.");
        validarNaoNegativoOpcional(request.getGastosMensais(), "Os gastos mensais simulados não podem ser negativos.");
        validarNaoNegativoOpcional(request.getAporteExtraMetasMensal(), "O aporte extra para metas não pode ser negativo.");

        List<EventoSimulacaoRequest> eventos = request.getEventos();
        if (eventos == null) {
            return;
        }

        if (eventos.size() > MAX_EVENTOS) {
            throw new IllegalArgumentException("Uma simulação pode ter no máximo " + MAX_EVENTOS + " eventos.");
        }

        for (EventoSimulacaoRequest evento : eventos) {
            validarEvento(evento, meses);
        }
    }

    private void validarEvento(EventoSimulacaoRequest evento, int meses) {
        if (evento == null) {
            throw new IllegalArgumentException("A lista de eventos não pode conter eventos vazios.");
        }

        if (evento.getMes() == null || evento.getMes() < 1 || evento.getMes() > meses) {
            throw new IllegalArgumentException("Todo evento deve indicar um mês entre 1 e o período total da simulação.");
        }

        String tipo = normalizarTipo(evento.getTipo());
        if (!TIPOS_EVENTO.contains(tipo)) {
            throw new IllegalArgumentException("Tipo de evento de simulação inválido: " + tipo);
        }

        BigDecimal valor = evento.getValor();
        ValoresMonetarios.validar(valor);
        if (valor == null || valor.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("O valor de um evento não pode ser negativo.");
        }

        if (("RENDA_EXTRAORDINARIA".equals(tipo) || "GASTO_EXTRAORDINARIO".equals(tipo))
                && valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Rendas e gastos extraordinários devem ser maiores que zero.");
        }
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException("O tipo do evento é obrigatório.");
        }
        return tipo.trim().toUpperCase(Locale.ROOT);
    }

    private void validarNaoNegativoOpcional(BigDecimal valor, String mensagem) {
        ValoresMonetarios.validar(valor);
        if (valor != null && valor.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(mensagem);
        }
    }
}
