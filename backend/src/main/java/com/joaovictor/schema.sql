CREATE DATABASE IF NOT EXISTS banco_app;
USE banco_app;

CREATE TABLE IF NOT EXISTS transacoes (
                                          id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                          tipo VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao VARCHAR(120) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    data_transacao DATE NOT NULL
    );

CREATE TABLE IF NOT EXISTS metas (
                                     id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                     nome VARCHAR(100) NOT NULL,
    valor_alvo DECIMAL(10,2) NOT NULL,
    prazo_meses INT NOT NULL,
    valor_inicial DECIMAL(10,2) NOT NULL,
    prioridade VARCHAR(30) NOT NULL,
    descricao VARCHAR(255)
    );

CREATE TABLE IF NOT EXISTS perfil_financeiro (
                                                 id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                                 renda_mensal DECIMAL(10,2) NOT NULL,
    renda_extra DECIMAL(10,2),
    gasto_moradia DECIMAL(10,2) NOT NULL,
    gasto_agua DECIMAL(10,2) NOT NULL,
    gasto_energia DECIMAL(10,2) NOT NULL,
    gasto_internet DECIMAL(10,2) NOT NULL,
    gasto_transporte DECIMAL(10,2) NOT NULL,
    gasto_alimentacao DECIMAL(10,2) NOT NULL,
    outras_despesas DECIMAL(10,2),
    valor_planejado_guardar DECIMAL(10,2) NOT NULL,
    objetivo_principal VARCHAR(255) NOT NULL
    );

CREATE TABLE IF NOT EXISTS revisoes_mensais (
                                                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                                mes_referencia VARCHAR(30) NOT NULL,
    gasto_inesperado BOOLEAN NOT NULL,
    valor_incorreto BOOLEAN NOT NULL,
    revisar_categorias BOOLEAN NOT NULL,
    observacoes VARCHAR(500)
    );