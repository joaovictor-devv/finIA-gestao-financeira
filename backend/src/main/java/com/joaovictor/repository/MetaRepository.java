package com.joaovictor.repository;

import com.joaovictor.model.Meta;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MetaRepository {

    public void salvar(Meta meta) {
        String sql = """
                INSERT INTO metas (nome, valor_alvo, prazo_meses, valor_inicial, prioridade, descricao)
                VALUES (?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, meta.getNome());
            stmt.setBigDecimal(2, meta.getValorAlvo());
            stmt.setInt(3, meta.getPrazoMeses());
            stmt.setBigDecimal(4, meta.getValorInicial());
            stmt.setString(5, meta.getPrioridade());
            stmt.setString(6, meta.getDescricao());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao salvar meta.", e);
        }
    }

    public List<Meta> listarTodas() {
        String sql = """
                SELECT id, nome, valor_alvo, prazo_meses, valor_inicial, prioridade, descricao
                FROM metas
                ORDER BY id DESC
                """;

        List<Meta> metas = new ArrayList<>();

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                metas.add(mapearMeta(rs));
            }

            return metas;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao listar metas.", e);
        }
    }

    public Meta buscarPorId(long id) {
        String sql = """
                SELECT id, nome, valor_alvo, prazo_meses, valor_inicial, prioridade, descricao
                FROM metas
                WHERE id = ?
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearMeta(rs);
                }
            }

            return null;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar meta por id.", e);
        }
    }

    public boolean excluirPorId(long id) {
        String sql = "DELETE FROM metas WHERE id = ?";

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);

            int linhasAfetadas = stmt.executeUpdate();
            return linhasAfetadas > 0;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao excluir meta.", e);
        }
    }

    private Meta mapearMeta(ResultSet rs) throws SQLException {
        return new Meta(
                rs.getLong("id"),
                rs.getString("nome"),
                rs.getBigDecimal("valor_alvo"),
                rs.getInt("prazo_meses"),
                rs.getBigDecimal("valor_inicial"),
                rs.getString("prioridade"),
                rs.getString("descricao")
        );
    }
}