package com.joaovictor.service;

import com.joaovictor.model.PerfilFinanceiro;
import com.joaovictor.repository.PerfilFinanceiroRepository;

import java.math.BigDecimal;

public class PerfilFinanceiroService {

    private final PerfilFinanceiroRepository repository;

    public PerfilFinanceiroService() {
        this.repository = new PerfilFinanceiroRepository();
    }

    public void cadastrarPerfil(BigDecimal rendaMensal,
                                BigDecimal rendaExtra,
                                BigDecimal gastoMoradia,
                                BigDecimal gastoAgua,
                                BigDecimal gastoEnergia,
                                BigDecimal gastoInternet,
                                BigDecimal gastoTransporte,
                                BigDecimal gastoAlimentacao,
                                BigDecimal outrasDespesas,
                                BigDecimal valorPlanejadoGuardar,
                                String objetivoPrincipal) {

        validarCampos(
                rendaMensal,
                gastoMoradia,
                gastoAgua,
                gastoEnergia,
                gastoInternet,
                gastoTransporte,
                gastoAlimentacao,
                valorPlanejadoGuardar,
                objetivoPrincipal
        );

        PerfilFinanceiro perfil = new PerfilFinanceiro(
                rendaMensal,
                rendaExtra != null ? rendaExtra : BigDecimal.ZERO,
                gastoMoradia,
                gastoAgua,
                gastoEnergia,
                gastoInternet,
                gastoTransporte,
                gastoAlimentacao,
                outrasDespesas != null ? outrasDespesas : BigDecimal.ZERO,
                valorPlanejadoGuardar,
                objetivoPrincipal
        );

        repository.salvar(perfil);
    }

    public PerfilFinanceiro buscarUltimoPerfil() {
        PerfilFinanceiro perfil = repository.buscarUltimoPerfil();

        if (perfil == null) {
            throw new IllegalArgumentException("Nenhum perfil financeiro foi cadastrado ainda.");
        }

        return perfil;
    }

    public PerfilFinanceiro buscarPorId(long id) {
        PerfilFinanceiro perfil = repository.buscarPorId(id);

        if (perfil == null) {
            throw new IllegalArgumentException("Perfil financeiro não encontrado para o id informado.");
        }

        return perfil;
    }

    public void atualizarPerfil(long id,
                                BigDecimal rendaMensal,
                                BigDecimal rendaExtra,
                                BigDecimal gastoMoradia,
                                BigDecimal gastoAgua,
                                BigDecimal gastoEnergia,
                                BigDecimal gastoInternet,
                                BigDecimal gastoTransporte,
                                BigDecimal gastoAlimentacao,
                                BigDecimal outrasDespesas,
                                BigDecimal valorPlanejadoGuardar,
                                String objetivoPrincipal) {

        validarCampos(
                rendaMensal,
                gastoMoradia,
                gastoAgua,
                gastoEnergia,
                gastoInternet,
                gastoTransporte,
                gastoAlimentacao,
                valorPlanejadoGuardar,
                objetivoPrincipal
        );

        PerfilFinanceiro perfilExistente = repository.buscarPorId(id);
        if (perfilExistente == null) {
            throw new IllegalArgumentException("Perfil financeiro não encontrado para atualização.");
        }

        PerfilFinanceiro perfilAtualizado = new PerfilFinanceiro(
                id,
                rendaMensal,
                rendaExtra != null ? rendaExtra : BigDecimal.ZERO,
                gastoMoradia,
                gastoAgua,
                gastoEnergia,
                gastoInternet,
                gastoTransporte,
                gastoAlimentacao,
                outrasDespesas != null ? outrasDespesas : BigDecimal.ZERO,
                valorPlanejadoGuardar,
                objetivoPrincipal
        );

        repository.atualizar(id, perfilAtualizado);
    }

    private void validarCampos(BigDecimal rendaMensal,
                               BigDecimal gastoMoradia,
                               BigDecimal gastoAgua,
                               BigDecimal gastoEnergia,
                               BigDecimal gastoInternet,
                               BigDecimal gastoTransporte,
                               BigDecimal gastoAlimentacao,
                               BigDecimal valorPlanejadoGuardar,
                               String objetivoPrincipal) {

        validarNaoNegativo(rendaMensal, "A renda mensal é obrigatória e não pode ser negativa.");
        validarNaoNegativo(gastoMoradia, "O gasto com moradia é obrigatório e não pode ser negativo.");
        validarNaoNegativo(gastoAgua, "O gasto com água é obrigatório e não pode ser negativo.");
        validarNaoNegativo(gastoEnergia, "O gasto com energia é obrigatório e não pode ser negativo.");
        validarNaoNegativo(gastoInternet, "O gasto com internet é obrigatório e não pode ser negativo.");
        validarNaoNegativo(gastoTransporte, "O gasto com transporte é obrigatório e não pode ser negativo.");
        validarNaoNegativo(gastoAlimentacao, "O gasto com alimentação é obrigatório e não pode ser negativo.");
        validarNaoNegativo(valorPlanejadoGuardar, "O valor planejado para guardar é obrigatório e não pode ser negativo.");

        if (objetivoPrincipal == null || objetivoPrincipal.isBlank()) {
            throw new IllegalArgumentException("O objetivo principal é obrigatório.");
        }
    }

    private void validarNaoNegativo(BigDecimal valor, String mensagem) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(mensagem);
        }
    }
}