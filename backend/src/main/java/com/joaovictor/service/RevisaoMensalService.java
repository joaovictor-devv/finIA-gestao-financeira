package com.joaovictor.service;

import com.joaovictor.model.RevisaoMensal;
import com.joaovictor.repository.RevisaoMensalRepository;

import java.util.List;

public class RevisaoMensalService {

    private final RevisaoMensalRepository repository;

    public RevisaoMensalService() {
        this.repository = new RevisaoMensalRepository();
    }

    public void cadastrarRevisao(String mesReferencia,
                                 boolean gastoInesperado,
                                 boolean valorIncorreto,
                                 boolean revisarCategorias,
                                 String observacoes) {

        validarCampos(mesReferencia);

        RevisaoMensal revisao = new RevisaoMensal(
                mesReferencia,
                gastoInesperado,
                valorIncorreto,
                revisarCategorias,
                observacoes
        );

        repository.salvar(revisao);
    }

    public List<RevisaoMensal> listarRevisoes() {
        return repository.listarTodas();
    }

    public RevisaoMensal buscarPorId(long id) {
        RevisaoMensal revisao = repository.buscarPorId(id);

        if (revisao == null) {
            throw new IllegalArgumentException("Revisão mensal não encontrada para o id informado.");
        }

        return revisao;
    }

    public void excluirRevisao(long id) {
        boolean excluiu = repository.excluirPorId(id);

        if (!excluiu) {
            throw new IllegalArgumentException("Revisão mensal não encontrada para exclusão.");
        }
    }

    private void validarCampos(String mesReferencia) {
        if (mesReferencia == null || mesReferencia.isBlank()) {
            throw new IllegalArgumentException("O mês de referência é obrigatório.");
        }
    }
}