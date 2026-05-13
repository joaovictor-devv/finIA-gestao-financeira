package com.joaovictor.repository;

import com.joaovictor.model.PerfilFinanceiro;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class PerfilFinanceiroRepository {

    public void salvar(PerfilFinanceiro perfil) {
        String sql = """
                INSERT INTO perfil_financeiro (
                    renda_mensal,
                    renda_extra,
                    gasto_moradia,
                    gasto_agua,
                    gasto_energia,
                    gasto_internet,
                    gasto_transporte,
                    gasto_alimentacao,
                    outras_despesas,
                    valor_planejado_guardar,
                    objetivo_principal
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            preencherStatement(stmt, perfil);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao salvar perfil financeiro.", e);
        }
    }

    public PerfilFinanceiro buscarPorId(long id) {
        String sql = """
                SELECT *
                FROM perfil_financeiro
                WHERE id = ?
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearPerfil(rs);
                }
            }

            return null;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar perfil financeiro.", e);
        }
    }

    public PerfilFinanceiro buscarUltimoPerfil() {
        String sql = """
                SELECT *
                FROM perfil_financeiro
                ORDER BY id DESC
                LIMIT 1
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return mapearPerfil(rs);
            }

            return null;

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar último perfil financeiro.", e);
        }
    }

    public void atualizar(long id, PerfilFinanceiro perfil) {
        String sql = """
                UPDATE perfil_financeiro
                SET renda_mensal = ?,
                    renda_extra = ?,
                    gasto_moradia = ?,
                    gasto_agua = ?,
                    gasto_energia = ?,
                    gasto_internet = ?,
                    gasto_transporte = ?,
                    gasto_alimentacao = ?,
                    outras_despesas = ?,
                    valor_planejado_guardar = ?,
                    objetivo_principal = ?
                WHERE id = ?
                """;

        try (Connection conn = Conexao.abrir();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            preencherStatement(stmt, perfil);
            stmt.setLong(12, id);

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao atualizar perfil financeiro.", e);
        }
    }

    private void preencherStatement(PreparedStatement stmt, PerfilFinanceiro perfil) throws SQLException {
        stmt.setBigDecimal(1, perfil.getRendaMensal());
        stmt.setBigDecimal(2, perfil.getRendaExtra());
        stmt.setBigDecimal(3, perfil.getGastoMoradia());
        stmt.setBigDecimal(4, perfil.getGastoAgua());
        stmt.setBigDecimal(5, perfil.getGastoEnergia());
        stmt.setBigDecimal(6, perfil.getGastoInternet());
        stmt.setBigDecimal(7, perfil.getGastoTransporte());
        stmt.setBigDecimal(8, perfil.getGastoAlimentacao());
        stmt.setBigDecimal(9, perfil.getOutrasDespesas());
        stmt.setBigDecimal(10, perfil.getValorPlanejadoGuardar());
        stmt.setString(11, perfil.getObjetivoPrincipal());
    }

    private PerfilFinanceiro mapearPerfil(ResultSet rs) throws SQLException {
        return new PerfilFinanceiro(
                rs.getLong("id"),
                rs.getBigDecimal("renda_mensal"),
                rs.getBigDecimal("renda_extra"),
                rs.getBigDecimal("gasto_moradia"),
                rs.getBigDecimal("gasto_agua"),
                rs.getBigDecimal("gasto_energia"),
                rs.getBigDecimal("gasto_internet"),
                rs.getBigDecimal("gasto_transporte"),
                rs.getBigDecimal("gasto_alimentacao"),
                rs.getBigDecimal("outras_despesas"),
                rs.getBigDecimal("valor_planejado_guardar"),
                rs.getString("objetivo_principal")
        );
    }
}