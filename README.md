# FinIA

Sistema de gestão financeira desenvolvido com Java e Spring Boot, focado em controle de gastos, organização financeira, metas e análises inteligentes.

## Sobre o projeto

O FinIA foi criado com o objetivo de auxiliar usuários no gerenciamento financeiro pessoal através de uma API REST moderna e organizada em camadas.

O sistema permite observar transações financeiras, acompanhar saldo, criar metas e gerar análises sobre os hábitos financeiros do usuário.

## Funcionalidades

- Cadastro de receitas e despesas
- Controle de saldo financeiro
- Histórico de transações
- Criação e gerenciamento de metas financeiras
- Análises financeiras
- Organização por categorias
- Validações de regras financeiras
- API REST estruturada
- Tratamento global de exceções
- Integração com banco de dados MySQL

## Arquitetura

O projeto segue arquitetura em camadas:

- Controllers
- Services
- Repositories
- DTOs
- Models
- Configurações globais

A aplicação utiliza separação de responsabilidades para facilitar manutenção, escalabilidade e evolução futura.

## Tecnologias utilizadas

- Java 21
- Spring Boot 3
- Maven
- MySQL
- JDBC
- REST API
- BigDecimal para operações financeiras

## Estrutura do projeto

```txt
src/main/java
├── controller
├── service
├── repository
├── dto
├── model
├── config
├── exception
└── util
