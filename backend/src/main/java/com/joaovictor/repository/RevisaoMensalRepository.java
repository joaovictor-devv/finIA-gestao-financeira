package com.joaovictor.repository;

import com.joaovictor.model.RevisaoMensal;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class RevisaoMensalRepository {

    public void salvar(RevisaoMensal revisao) {
        String sql = """
                INSERT INTO revisoes_mensais (
                    mes_referencia,
                    gasto_inesperado,
                    valor_incorreto,
                    revisar_categorias,
                    observacoes
                ) VALUES (?, ?, ?, ?, ?)
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, revisao.getMesReferencia());
            stmt.setBoolean(2, revisao.isGastoInesperado());
            stmt.setBoolean(3, revisao.isValorIncorreto());
            stmt.setBoolean(4, revisao.isRevisarCategorias());
            stmt.setString(5, revisao.getObservacoes());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao salvar revisão mensal.", e);
        }
    }

    public List<RevisaoMensal> listarTodas() {
        String sql = """
                SELECT id,
                       mes_referencia,
                       gasto_inesperado,
                       valor_incorreto,
                       revisar_categorias,
                       observacoes
                FROM revisoes_mensais
                ORDER BY id DESC
                """;

        List<RevisaoMensal> revisoes = new ArrayList<>();

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                revisoes.add(mapearRevisao(rs));
            }

            return revisoes;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao listar revisões mensais.", e);
        }
    }

    public RevisaoMensal buscarPorId(long id) {
        String sql = """
                SELECT id,
                       mes_referencia,
                       gasto_inesperado,
                       valor_incorreto,
                       revisar_categorias,
                       observacoes
                FROM revisoes_mensais
                WHERE id = ?
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearRevisao(rs);
                }
            }

            return null;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar revisão mensal por id.", e);
        }
    }

    public boolean excluirPorId(long id) {
        String sql = "DELETE FROM revisoes_mensais WHERE id = ?";

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);

            int linhasAfetadas = stmt.executeUpdate();
            return linhasAfetadas > 0;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao excluir revisão mensal.", e);
        }
    }

    private RevisaoMensal mapearRevisao(ResultSet rs) throws SQLException {
        return new RevisaoMensal(
                rs.getLong("id"),
                rs.getString("mes_referencia"),
                rs.getBoolean("gasto_inesperado"),
                rs.getBoolean("valor_incorreto"),
                rs.getBoolean("revisar_categorias"),
                rs.getString("observacoes")
        );
    }
}