package com.joaovictor.service;

import com.joaovictor.dto.EventoSimulacaoRequest;
import com.joaovictor.dto.SimulacaoFinanceiraRequest;
import com.joaovictor.model.CapacidadeFinanceira;
import com.joaovictor.model.Meta;
import com.joaovictor.model.ProjecaoMensal;
import com.joaovictor.model.ProjecaoMetaMensal;
import com.joaovictor.model.ProjecaoMeta;
import com.joaovictor.model.ResultadoSimulacaoFinanceira;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class MotorSimulacaoService {

    private static final BigDecimal CEM = new BigDecimal("100");
    private static final BigDecimal LIMITE_ATENCAO_PERCENTUAL = new BigDecimal("80");
    private static final int MAX_EVENTOS = 100;

    public ResultadoSimulacaoFinanceira simular(SimulacaoFinanceiraRequest request,
                                                 CapacidadeFinanceira situacaoAtual,
                                                 List<Meta> metasAtuais) {
        validarBase(request);

        if (situacaoAtual == null) {
            throw new IllegalArgumentException("A situação financeira atual é obrigatória para a simulação.");
        }

        List<Meta> metas = metasAtuais != null ? metasAtuais : List.of();
        validarMetasReferenciadas(request, metas);

        int meses = request.getMeses() != null ? request.getMeses() : 6;
        BigDecimal rendaMensalAtual = escolher(request.getRendaMensal(), situacaoAtual.getRendaMensal());
        BigDecimal gastosMensaisAtuais = escolher(request.getGastosMensais(), situacaoAtual.getGastosMensais());
        BigDecimal reservaMensal = escolher(request.getReservaMensal(), situacaoAtual.getReservaPlanejada());
        BigDecimal aporteExtraGlobalMensal = valor(request.getAporteExtraMetasMensal());

        List<EstadoMeta> estadosMetas = prepararMetas(metas);
        Map<Long, BigDecimal> aporteExtraPorMetaMensal = new HashMap<>();
        List<ProjecaoMensal> evolucao = new ArrayList<>();

        BigDecimal saldo = valor(situacaoAtual.getSaldoAtual());
        BigDecimal saldoInicial = saldo;
        BigDecimal totalAportadoMetas = BigDecimal.ZERO;
        BigDecimal totalReserva = BigDecimal.ZERO;
        BigDecimal totalRendasExtraordinarias = BigDecimal.ZERO;
        BigDecimal totalGastosExtraordinarios = BigDecimal.ZERO;
        YearMonth mesBase = YearMonth.now();

        List<EventoSimulacaoRequest> eventos = new ArrayList<>(request.getEventos());
        eventos.sort(Comparator.comparingInt(EventoSimulacaoRequest::getMes));

        for (int indice = 1; indice <= meses; indice++) {
            YearMonth referencia = mesBase.plusMonths(indice);
            BigDecimal rendaExtraordinariaMes = BigDecimal.ZERO;
            BigDecimal gastoExtraordinarioMes = BigDecimal.ZERO;
            List<String> eventosAplicados = new ArrayList<>();

            for (EventoSimulacaoRequest evento : eventos) {
                if (evento.getMes() != indice) {
                    continue;
                }

                String tipo = normalizarTipo(evento.getTipo());
                BigDecimal valorEvento = valor(evento.getValor());

                switch (tipo) {
                    case "RENDA_EXTRAORDINARIA" -> {
                        rendaExtraordinariaMes = rendaExtraordinariaMes.add(valorEvento);
                        eventosAplicados.add("Renda extraordinária de R$ " + valorEvento);
                    }
                    case "GASTO_EXTRAORDINARIO" -> {
                        gastoExtraordinarioMes = gastoExtraordinarioMes.add(valorEvento);
                        eventosAplicados.add("Gasto extraordinário de R$ " + valorEvento);
                    }
                    case "ALTERAR_RENDA" -> {
                        rendaMensalAtual = valorEvento;
                        eventosAplicados.add("Renda mensal alterada para R$ " + valorEvento);
                    }
                    case "ALTERAR_GASTOS" -> {
                        gastosMensaisAtuais = valorEvento;
                        eventosAplicados.add("Gastos mensais alterados para R$ " + valorEvento);
                    }
                    case "ALTERAR_APORTE_META" -> {
                        if (evento.getMetaId() == null) {
                            aporteExtraGlobalMensal = valorEvento;
                            eventosAplicados.add("Aporte extra mensal geral alterado para R$ " + valorEvento);
                        } else {
                            aporteExtraPorMetaMensal.put(evento.getMetaId(), valorEvento);
                            String nomeMeta = encontrarNomeMeta(evento.getMetaId(), metas);
                            eventosAplicados.add("Aporte extra mensal da meta '" + nomeMeta
                                    + "' alterado para R$ " + valorEvento);
                        }
                    }
                    default -> throw new IllegalArgumentException("Tipo de evento de simulação inválido: " + tipo);
                }
            }

            BigDecimal aporteBaseMes = aplicarAportesBase(estadosMetas, indice, referencia);
            BigDecimal aporteEspecificoMes = aplicarAportesEspecificos(
                    aporteExtraPorMetaMensal,
                    estadosMetas,
                    indice,
                    referencia
            );
            BigDecimal aporteGlobalMes = aplicarAporteExtraGlobal(
                    aporteExtraGlobalMensal,
                    estadosMetas,
                    request.getMetaPrioritariaId(),
                    indice,
                    referencia
            );
            BigDecimal aporteExtraMes = aporteEspecificoMes.add(aporteGlobalMes);

            BigDecimal rendaDoMes = rendaMensalAtual.add(rendaExtraordinariaMes);
            BigDecimal margemMensal = rendaDoMes
                    .subtract(gastosMensaisAtuais)
                    .subtract(reservaMensal)
                    .subtract(aporteBaseMes)
                    .subtract(aporteExtraMes)
                    .subtract(gastoExtraordinarioMes);

            saldo = saldo.add(margemMensal);

            String classificacao = classificarMes(
                    rendaDoMes,
                    gastosMensaisAtuais,
                    reservaMensal,
                    aporteBaseMes.add(aporteExtraMes),
                    gastoExtraordinarioMes,
                    margemMensal
            );

            evolucao.add(new ProjecaoMensal(
                    indice,
                    referencia.toString(),
                    rendaMensalAtual,
                    rendaExtraordinariaMes,
                    gastosMensaisAtuais,
                    reservaMensal,
                    aporteBaseMes,
                    aporteExtraMes,
                    gastoExtraordinarioMes,
                    margemMensal,
                    saldo,
                    classificacao,
                    List.copyOf(eventosAplicados),
                    estadosMetas.stream().map(estado -> new ProjecaoMetaMensal(
                            estado.meta.getId(),
                            estado.meta.getNome(),
                            estado.valorProjetado,
                            estado.meta.getValorAlvo()
                    )).toList()
            ));

            totalAportadoMetas = totalAportadoMetas.add(aporteBaseMes).add(aporteExtraMes);
            totalReserva = totalReserva.add(reservaMensal);
            totalRendasExtraordinarias = totalRendasExtraordinarias.add(rendaExtraordinariaMes);
            totalGastosExtraordinarios = totalGastosExtraordinarios.add(gastoExtraordinarioMes);
        }

        List<ProjecaoMeta> projecoesMetas = montarProjecoesMetas(estadosMetas);
        // Diagnóstico geral pelo pior período: não esconder déficit anterior com mês final positivo.
        String classificacaoFinal;
        if (evolucao.stream().anyMatch(mes -> mes.getMargemMensal().signum() < 0)) {
            classificacaoFinal = "DEFICIT_MENSAL";
        } else if (evolucao.stream().anyMatch(mes -> "SEM_RENDA".equals(mes.getClassificacao()))) {
            classificacaoFinal = "SEM_RENDA";
        } else if (evolucao.stream().anyMatch(mes -> "EQUILIBRADA".equals(mes.getClassificacao()))) {
            classificacaoFinal = "EQUILIBRADA";
        } else if (evolucao.stream().anyMatch(mes -> "APERTADA".equals(mes.getClassificacao()))) {
            classificacaoFinal = "APERTADA";
        } else {
            classificacaoFinal = "SAUDAVEL";
        }
        BigDecimal variacaoSaldo = saldo.subtract(saldoInicial);
        String mensagem = gerarMensagem(evolucao);
        String nomeCenario = request.getNomeCenario() == null || request.getNomeCenario().isBlank()
                ? "Simulação personalizada"
                : request.getNomeCenario().trim();

        return new ResultadoSimulacaoFinanceira(
                nomeCenario,
                meses,
                false,
                saldoInicial,
                saldo,
                variacaoSaldo,
                totalReserva,
                totalAportadoMetas,
                totalRendasExtraordinarias,
                totalGastosExtraordinarios,
                classificacaoFinal,
                mensagem,
                situacaoAtual,
                evolucao,
                projecoesMetas
        );
    }

    private List<EstadoMeta> prepararMetas(List<Meta> metas) {
        List<EstadoMeta> estados = new ArrayList<>();

        for (Meta meta : metas) {
            BigDecimal valorAtual = valor(meta.getValorInicial());
            BigDecimal aporteBase = calcularAporteBase(meta);
            estados.add(new EstadoMeta(meta, valorAtual, aporteBase));
        }

        return estados;
    }

    private BigDecimal calcularAporteBase(Meta meta) {
        BigDecimal restante = valor(meta.getValorAlvo()).subtract(valor(meta.getValorInicial()));
        if (restante.compareTo(BigDecimal.ZERO) <= 0 || meta.getPrazoMeses() <= 0) {
            return BigDecimal.ZERO;
        }

        return restante.divide(
                BigDecimal.valueOf(meta.getPrazoMeses()),
                2,
                RoundingMode.CEILING
        );
    }

    private BigDecimal aplicarAportesBase(List<EstadoMeta> estados,
                                           int indiceMes,
                                           YearMonth referencia) {
        BigDecimal total = BigDecimal.ZERO;

        for (EstadoMeta estado : estados) {
            BigDecimal restante = restante(estado);
            if (restante.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal aporte = menor(estado.aporteBaseMensal, restante);
            estado.valorProjetado = estado.valorProjetado.add(aporte);
            total = total.add(aporte);
            registrarConclusao(estado, indiceMes, referencia);
        }

        return total;
    }

    private BigDecimal aplicarAportesEspecificos(Map<Long, BigDecimal> aportesPorMeta,
                                                  List<EstadoMeta> estados,
                                                  int indiceMes,
                                                  YearMonth referencia) {
        BigDecimal total = BigDecimal.ZERO;

        for (Map.Entry<Long, BigDecimal> entry : aportesPorMeta.entrySet()) {
            EstadoMeta estado = estados.stream()
                    .filter(item -> item.meta.getId() == entry.getKey())
                    .findFirst()
                    .orElse(null);

            if (estado != null) {
                total = total.add(aplicarNaMeta(estado, entry.getValue(), indiceMes, referencia));
            }
        }

        return total;
    }

    private BigDecimal aplicarAporteExtraGlobal(BigDecimal aporteDisponivel,
                                                 List<EstadoMeta> estados,
                                                 Long metaPrioritariaId,
                                                 int indiceMes,
                                                 YearMonth referencia) {
        if (aporteDisponivel.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal restanteAporte = aporteDisponivel;
        BigDecimal totalAplicado = BigDecimal.ZERO;

        if (metaPrioritariaId != null) {
            EstadoMeta prioritaria = estados.stream()
                    .filter(estado -> estado.meta.getId() == metaPrioritariaId)
                    .findFirst()
                    .orElse(null);

            if (prioritaria != null) {
                BigDecimal aplicado = aplicarNaMeta(prioritaria, restanteAporte, indiceMes, referencia);
                totalAplicado = totalAplicado.add(aplicado);
                restanteAporte = restanteAporte.subtract(aplicado);
            }
        }

        if (restanteAporte.compareTo(BigDecimal.ZERO) <= 0) {
            return totalAplicado;
        }

        List<EstadoMeta> ordenadas = new ArrayList<>(estados);
        ordenadas.sort(Comparator
                .comparingInt((EstadoMeta estado) -> pesoPrioridade(estado.meta.getPrioridade()))
                .reversed()
                .thenComparingLong(estado -> estado.meta.getId()));

        for (EstadoMeta estado : ordenadas) {
            if (restanteAporte.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            if (metaPrioritariaId != null && estado.meta.getId() == metaPrioritariaId) {
                continue;
            }

            BigDecimal aplicado = aplicarNaMeta(estado, restanteAporte, indiceMes, referencia);
            totalAplicado = totalAplicado.add(aplicado);
            restanteAporte = restanteAporte.subtract(aplicado);
        }

        return totalAplicado;
    }

    private BigDecimal aplicarNaMeta(EstadoMeta estado,
                                     BigDecimal valorDisponivel,
                                     int indiceMes,
                                     YearMonth referencia) {
        BigDecimal restante = restante(estado);
        if (restante.compareTo(BigDecimal.ZERO) <= 0 || valorDisponivel.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal aplicado = menor(valorDisponivel, restante);
        estado.valorProjetado = estado.valorProjetado.add(aplicado);
        registrarConclusao(estado, indiceMes, referencia);
        return aplicado;
    }

    private void registrarConclusao(EstadoMeta estado, int indiceMes, YearMonth referencia) {
        if (estado.mesConclusao == null
                && estado.valorProjetado.compareTo(valor(estado.meta.getValorAlvo())) >= 0) {
            estado.mesConclusao = indiceMes;
            estado.mesConclusaoReferencia = referencia.toString();
        }
    }

    private List<ProjecaoMeta> montarProjecoesMetas(List<EstadoMeta> estados) {
        List<ProjecaoMeta> resultado = new ArrayList<>();

        for (EstadoMeta estado : estados) {
            BigDecimal valorAtual = valor(estado.meta.getValorInicial());
            BigDecimal valorAlvo = valor(estado.meta.getValorAlvo());
            BigDecimal valorProjetado = menor(estado.valorProjetado, valorAlvo);
            BigDecimal progressoAtual = percentual(valorAtual, valorAlvo);
            BigDecimal progressoProjetado = percentual(valorProjetado, valorAlvo);
            boolean concluida = estado.mesConclusao != null || valorProjetado.compareTo(valorAlvo) >= 0;

            String impacto;
            if (valorAtual.compareTo(valorAlvo) >= 0) {
                impacto = "A meta já estava concluída antes da simulação.";
            } else if (concluida) {
                impacto = "A meta seria concluída dentro do período simulado.";
            } else if (valorProjetado.compareTo(valorAtual) > 0) {
                impacto = "Os aportes planejados acrescentariam "
                        + NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR"))
                                .format(valorProjetado.subtract(valorAtual))
                        + " à meta durante o período simulado.";
            } else {
                impacto = "Não houve avanço projetado para esta meta.";
            }

            resultado.add(new ProjecaoMeta(
                    estado.meta.getId(),
                    estado.meta.getNome(),
                    valorAtual,
                    valorAlvo,
                    valorProjetado,
                    progressoAtual,
                    progressoProjetado,
                    concluida,
                    estado.mesConclusao,
                    estado.mesConclusaoReferencia,
                    impacto
            ));
        }

        return resultado;
    }

    private String classificarMes(BigDecimal rendaDoMes,
                                  BigDecimal gastosMensais,
                                  BigDecimal reserva,
                                  BigDecimal aporteMetas,
                                  BigDecimal gastoExtraordinario,
                                  BigDecimal margemMensal) {
        if (rendaDoMes.compareTo(BigDecimal.ZERO) <= 0) {
            return "SEM_RENDA";
        }

        if (margemMensal.compareTo(BigDecimal.ZERO) < 0) {
            return "DEFICIT_MENSAL";
        }

        if (margemMensal.compareTo(BigDecimal.ZERO) == 0) {
            return "EQUILIBRADA";
        }

        BigDecimal compromissos = gastosMensais
                .add(reserva)
                .add(aporteMetas)
                .add(gastoExtraordinario);

        BigDecimal percentualComprometido = compromissos.multiply(CEM)
                .divide(rendaDoMes, 2, RoundingMode.HALF_UP);

        if (percentualComprometido.compareTo(LIMITE_ATENCAO_PERCENTUAL) >= 0) {
            return "APERTADA";
        }

        return "SAUDAVEL";
    }

    private String gerarMensagem(List<ProjecaoMensal> evolucao) {
        long mesesComDeficit = evolucao.stream()
                .filter(mes -> mes.getMargemMensal().compareTo(BigDecimal.ZERO) < 0)
                .count();
        if (mesesComDeficit > 0) {
            return "Neste cenário, os compromissos mensais superam a renda em "
                    + mesesComDeficit + " mês(es). Revise gastos, valores para guardar ou aportes às metas.";
        }

        long mesesSemFolga = evolucao.stream()
                .filter(mes -> mes.getMargemMensal().compareTo(BigDecimal.ZERO) == 0)
                .count();
        if (mesesSemFolga > 0) {
            return "O orçamento cobre os compromissos, mas não deixa folga em "
                    + mesesSemFolga + " mês(es) para gastos não planejados.";
        }

        BigDecimal menorFolga = evolucao.stream()
                .map(ProjecaoMensal::getMargemMensal)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        return "O orçamento cobre despesas e valores planejados para guardar em todos os "
                + evolucao.size() + " meses. A menor folga mensal seria de R$ " + menorFolga + ".";
    }

    private void validarBase(SimulacaoFinanceiraRequest request) {
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
        validarNaoNegativoOpcional(request.getReservaMensal(), "O valor mensal para guardar não pode ser negativo.");
        validarNaoNegativoOpcional(request.getAporteExtraMetasMensal(), "O aporte extra para metas não pode ser negativo.");

        if (request.getEventos().size() > MAX_EVENTOS) {
            throw new IllegalArgumentException("Uma simulação pode ter no máximo " + MAX_EVENTOS + " eventos.");
        }

        for (EventoSimulacaoRequest evento : request.getEventos()) {
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
        BigDecimal valorEvento = evento.getValor();
        if (valorEvento == null || valorEvento.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("O valor de um evento não pode ser negativo.");
        }

        switch (tipo) {
            case "RENDA_EXTRAORDINARIA", "GASTO_EXTRAORDINARIO" -> {
                if (valorEvento.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Rendas e gastos extraordinários devem ser maiores que zero.");
                }
            }
            case "ALTERAR_RENDA", "ALTERAR_GASTOS", "ALTERAR_APORTE_META" -> {
                // Zero interrompe a renda, gasto ou aporte a partir do mês informado.
            }
            default -> throw new IllegalArgumentException("Tipo de evento de simulação inválido: " + tipo);
        }
    }

    private void validarMetasReferenciadas(SimulacaoFinanceiraRequest request, List<Meta> metas) {
        validarMetaExistente(request.getMetaPrioritariaId(), metas, "A meta prioritária informada não foi encontrada.");

        for (EventoSimulacaoRequest evento : request.getEventos()) {
            if ("ALTERAR_APORTE_META".equals(normalizarTipo(evento.getTipo())) && evento.getMetaId() != null) {
                validarMetaExistente(evento.getMetaId(), metas, "A meta informada em um evento de aporte não foi encontrada.");
            }
        }
    }

    private void validarMetaExistente(Long metaId, List<Meta> metas, String mensagem) {
        if (metaId == null) {
            return;
        }

        boolean existe = metas.stream().anyMatch(meta -> meta.getId() == metaId);
        if (!existe) {
            throw new IllegalArgumentException(mensagem);
        }
    }

    private String encontrarNomeMeta(Long metaId, List<Meta> metas) {
        return metas.stream()
                .filter(meta -> meta.getId() == metaId)
                .map(Meta::getNome)
                .findFirst()
                .orElse(String.valueOf(metaId));
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException("O tipo do evento é obrigatório.");
        }
        return tipo.trim().toUpperCase(Locale.ROOT);
    }

    private void validarNaoNegativoOpcional(BigDecimal numero, String mensagem) {
        if (numero != null && numero.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(mensagem);
        }
    }

    private int pesoPrioridade(String prioridade) {
        if (prioridade == null) {
            return 1;
        }

        return switch (prioridade.trim().toLowerCase(Locale.ROOT)) {
            case "alta" -> 3;
            case "media", "média" -> 2;
            default -> 1;
        };
    }

    private BigDecimal restante(EstadoMeta estado) {
        return valor(estado.meta.getValorAlvo()).subtract(estado.valorProjetado);
    }

    private BigDecimal percentual(BigDecimal parte, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal resultado = parte.multiply(CEM)
                .divide(total, 2, RoundingMode.HALF_UP);
        return resultado.compareTo(CEM) > 0 ? CEM : resultado;
    }

    private BigDecimal menor(BigDecimal a, BigDecimal b) {
        return a.compareTo(b) <= 0 ? a : b;
    }

    private BigDecimal escolher(BigDecimal informado, BigDecimal padrao) {
        return informado != null ? informado : valor(padrao);
    }

    private BigDecimal valor(BigDecimal numero) {
        return numero != null ? numero : BigDecimal.ZERO;
    }

    private static class EstadoMeta {
        private final Meta meta;
        private BigDecimal valorProjetado;
        private final BigDecimal aporteBaseMensal;
        private Integer mesConclusao;
        private String mesConclusaoReferencia;

        private EstadoMeta(Meta meta, BigDecimal valorAtual, BigDecimal aporteBaseMensal) {
            this.meta = meta;
            this.valorProjetado = valorAtual;
            this.aporteBaseMensal = aporteBaseMensal;
        }
    }
}
