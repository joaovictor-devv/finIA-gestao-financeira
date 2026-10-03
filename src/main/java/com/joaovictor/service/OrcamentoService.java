package com.joaovictor.service;

import com.joaovictor.dto.OrcamentoRequest;
import com.joaovictor.model.CapacidadeFinanceira;
import com.joaovictor.model.OrcamentoResumo;
import com.joaovictor.model.PerfilFinanceiro;
import com.joaovictor.repository.PerfilFinanceiroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class OrcamentoService {

    private final PerfilFinanceiroRepository perfilRepository;
    private final MotorFinanceiroService motorFinanceiroService;

    public OrcamentoService() {
        this(new PerfilFinanceiroRepository(), new MotorFinanceiroService());
    }

    @Autowired
    public OrcamentoService(PerfilFinanceiroRepository perfilRepository,
                            MotorFinanceiroService motorFinanceiroService) {
        this.perfilRepository = perfilRepository;
        this.motorFinanceiroService = motorFinanceiroService;
    }

    public OrcamentoResumo buscarResumo() {
        return montarResumo(motorFinanceiroService.calcularCapacidade());
    }

    public OrcamentoResumo salvar(OrcamentoRequest request) {
        validar(request);

        PerfilFinanceiro existente = perfilRepository.buscarUltimoPerfil();

        if (existente == null) {
            PerfilFinanceiro novo = new PerfilFinanceiro(
                    "Usuário",
                    BigDecimal.ZERO,
                    request.getRendaMensal(),
                    request.getGastosMensais(),
                    request.getValorPlanejadoGuardar()
            );
            perfilRepository.salvar(novo);
        } else {
            PerfilFinanceiro atualizado = new PerfilFinanceiro(
                    existente.getId(),
                    existente.getNome(),
                    existente.getSaldoAtual(),
                    request.getRendaMensal(),
                    request.getGastosMensais(),
                    request.getValorPlanejadoGuardar()
            );
            perfilRepository.atualizar(existente.getId(), atualizado);
        }

        return buscarResumo();
    }

    private OrcamentoResumo montarResumo(CapacidadeFinanceira capacidade) {
        return new OrcamentoResumo(
                capacidade.getRendaMensal(),
                capacidade.getGastosMensais(),
                capacidade.getReservaPlanejada(),
                capacidade.getMargemAntesMetas(),
                capacidade.getComprometimentoMensalMetas(),
                capacidade.getMargemAposMetas(),
                capacidade.getSaldoAtual(),
                capacidade.getCapacidadeGastoImediato(),
                capacidade.getPercentualRendaComprometida(),
                capacidade.getClassificacao()
        );
    }

    private void validar(OrcamentoRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Os dados do orçamento são obrigatórios.");
        }

        validarNaoNegativo(request.getRendaMensal(), "A renda mensal é obrigatória e não pode ser negativa.");
        validarNaoNegativo(request.getGastosMensais(), "Os gastos mensais são obrigatórios e não podem ser negativos.");
        validarNaoNegativo(request.getValorPlanejadoGuardar(), "O valor planejado para guardar é obrigatório e não pode ser negativo.");
    }

    private void validarNaoNegativo(BigDecimal valor, String mensagem) {
        ValoresMonetarios.validar(valor);
        if (valor == null || valor.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(mensagem);
        }
    }
}
