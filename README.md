# Banco Java (Mini Sistema Bancário)

Mini sistema bancário desenvolvido em Java utilizando JDBC e MySQL, seguindo o modelo de ledger (saldo calculado a partir do histórico de transações).

## Funcionalidades

- Depósito de valores  
- Saque com validação de saldo insuficiente  
- Cálculo de saldo por histórico  
- Extrato de transações  
- Interface gráfica em Swing  
- Persistência com MySQL + JDBC  

## Arquitetura

O sistema utiliza o modelo contábil:

saldo = depósitos − saques

O saldo não é armazenado, sendo sempre calculado a partir do histórico.

## Tecnologias

- Java 21+  
- Maven  
- MySQL  
- JDBC  
- Swing  

## Configuração do banco

Por padrão o sistema usa:

- host: localhost  
- banco: banco_app  
- usuário: root  
- senha: root  

Opcionalmente, é possível sobrescrever via variáveis de ambiente:

```bash
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
```

## Como executar a interface

```bash
mvn clean compile
mvn exec:java -Dexec.mainClass=com.joaovictor.BancoUI
```

Projeto em evolução.
