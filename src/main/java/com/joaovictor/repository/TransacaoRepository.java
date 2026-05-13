package com.joaovictor.repository;

import com.joaovictor.model.ResumoFinanceiro;
import com.joaovictor.model.Transacao;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

public class TransacaoRepository {

    public void salvar(Transacao transacao) {
        String sql = """
                INSERT INTO transacoes (tipo, valor, descricao, categoria, data_transacao)
                VALUES (?, ?, ?, ?, ?)
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, transacao.getTipo());
            stmt.setBigDecimal(2, transacao.getValor());
            stmt.setString(3, transacao.getDescricao());
            stmt.setString(4, transacao.getCategoria());
            stmt.setDate(5, Date.valueOf(transacao.getDataTransacao()));

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao salvar transação.", e);
        }
    }

    public BigDecimal calcularSaldo() {
        String sql = """
                SELECT
                    COALESCE(SUM(CASE WHEN tipo = 'ENTRADA' THEN valor ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN tipo = 'SAIDA' THEN valor ELSE 0 END), 0) AS saldo
                FROM transacoes
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getBigDecimal("saldo");
            }

            return BigDecimal.ZERO;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao calcular saldo.", e);
        }
    }

    public List<Transacao> buscarExtrato(int limite) {
        String sql = """
                SELECT id, tipo, valor, descricao, categoria, data_transacao
                FROM transacoes
                ORDER BY data_transacao DESC, id DESC
                LIMIT ?
                """;

        List<Transacao> lista = new ArrayList<>();

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, limite);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearTransacao(rs));
                }
            }

            return lista;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar extrato.", e);
        }
    }

    public List<Transacao> buscarPorPeriodo(LocalDate inicio, LocalDate fim) {
        String sql = """
                SELECT id, tipo, valor, descricao, categoria, data_transacao
                FROM transacoes
                WHERE data_transacao BETWEEN ? AND ?
                ORDER BY data_transacao DESC, id DESC
                """;

        List<Transacao> lista = new ArrayList<>();

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setDate(1, Date.valueOf(inicio));
            stmt.setDate(2, Date.valueOf(fim));

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearTransacao(rs));
                }
            }

            return lista;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar transações por período.", e);
        }
    }

    public BigDecimal totalEntradasNoMes(YearMonth mes) {
        String sql = """
                SELECT COALESCE(SUM(valor), 0) AS total
                FROM transacoes
                WHERE tipo = 'ENTRADA'
                  AND data_transacao BETWEEN ? AND ?
                """;

        return buscarTotalPorTipoNoMes(sql, mes);
    }

    public BigDecimal totalSaidasNoMes(YearMonth mes) {
        String sql = """
                SELECT COALESCE(SUM(valor), 0) AS total
                FROM transacoes
                WHERE tipo = 'SAIDA'
                  AND data_transacao BETWEEN ? AND ?
                """;

        return buscarTotalPorTipoNoMes(sql, mes);
    }

    public ResumoFinanceiro gerarResumoMensal(YearMonth mes) {
        BigDecimal entradas = totalEntradasNoMes(mes);
        BigDecimal saidas = totalSaidasNoMes(mes);
        BigDecimal saldo = entradas.subtract(saidas);

        String categoriaMaiorGasto = "Sem dados";
        BigDecimal valorMaiorGasto = BigDecimal.ZERO;

        String sqlCategoria = """
                SELECT categoria, COALESCE(SUM(valor), 0) AS total
                FROM transacoes
                WHERE tipo = 'SAIDA'
                  AND data_transacao BETWEEN ? AND ?
                GROUP BY categoria
                ORDER BY total DESC
                LIMIT 1
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sqlCategoria)) {

            stmt.setDate(1, Date.valueOf(mes.atDay(1)));
            stmt.setDate(2, Date.valueOf(mes.atEndOfMonth()));

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    categoriaMaiorGasto = rs.getString("categoria");
                    valorMaiorGasto = rs.getBigDecimal("total");
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao gerar resumo mensal.", e);
        }

        return new ResumoFinanceiro(
                entradas,
                saidas,
                saldo,
                categoriaMaiorGasto,
                valorMaiorGasto
        );
    }

    private BigDecimal buscarTotalPorTipoNoMes(String sql, YearMonth mes) {
        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setDate(1, Date.valueOf(mes.atDay(1)));
            stmt.setDate(2, Date.valueOf(mes.atEndOfMonth()));

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBigDecimal("total");
                }
            }

            return BigDecimal.ZERO;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar total mensal.", e);
        }
    }

    private Transacao mapearTransacao(ResultSet rs) throws SQLException {
        return new Transacao(
                rs.getLong("id"),
                rs.getString("tipo"),
                rs.getBigDecimal("valor"),
                rs.getString("descricao"),
                rs.getString("categoria"),
                rs.getDate("data_transacao").toLocalDate()
        );
    }
}