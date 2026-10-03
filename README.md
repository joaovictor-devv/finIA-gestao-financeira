# FinIA

Ferramenta de gestão e análise financeira pessoal desenvolvida como TCC. O FinIA combina um motor financeiro determinístico com IA para ajudar o usuário a entender sua situação atual, avaliar metas e testar decisões antes de tomá-las.

## Princípio do projeto

```text
Motor financeiro -> calcula
FinIA / IA       -> explica
```

A IA não é responsável pelas contas. Renda, gastos, reserva, metas, capacidade de gasto e projeções são calculados no backend. A IA recebe esses resultados e os explica em linguagem natural.

O FinIA não é banco, carteira digital, corretora ou sistema de investimentos. A versão final é focada em um único usuário e não exige login nem integração bancária.

## Fluxo do produto

```text
Perfil / saldo atual
        +
Orçamento mensal
        +
Metas
        ↓
Motor financeiro
        ↓
Capacidade de gasto e viabilidade
        ↓
Simulações futuras
        ↓
FinIA explica os resultados
```

## Dados principais

O modelo final foi simplificado para usar apenas informações que realmente participam das análises:

- nome do usuário;
- saldo atual informado manualmente;
- renda mensal;
- gastos mensais médios;
- valor planejado para guardar;
- metas financeiras.

Não há renda extra média permanente. Uma entrada excepcional pode ser representada como evento em uma simulação, sem assumir que acontecerá todos os meses.

## Motor financeiro

Regra central:

```text
renda mensal
- gastos mensais
- reserva planejada
- comprometimento mensal das metas
= margem disponível após metas
```

A capacidade de gasto imediato também considera o dinheiro que existe de fato no saldo:

```text
pode gastar agora = menor(saldo atual, capacidade mensal)
```

Classificações do motor incluem:

- `SEM_RENDA`
- `GASTOS_ACIMA_DA_RENDA`
- `RESERVA_INVIAVEL`
- `METAS_ACIMA_DA_CAPACIDADE`
- `EQUILIBRADA`
- `APERTADA`
- `SAUDAVEL`

O limite de 80% usado para sinalizar situação apertada é uma regra heurística do produto, não uma lei financeira universal.

## Perfil

### Criar perfil

`POST /perfil-financeiro`

```json
{
  "nome": "João",
  "saldoAtual": 1200
}
```

### Ler perfil

`GET /perfil-financeiro`

### Atualizar perfil

`PUT /perfil-financeiro`

### Atualizar somente o saldo

`PUT /perfil-financeiro/saldo`

```json
{
  "saldoAtual": 1500
}
```

O saldo pode ser atualizado diretamente. Não é necessário criar transações fictícias para representar dinheiro já existente.

## Orçamento rápido

### Ler

`GET /orcamento`

### Salvar ou substituir

`PUT /orcamento`

```json
{
  "rendaMensal": 2500,
  "gastosMensais": 1300,
  "valorPlanejadoGuardar": 300
}
```

O orçamento final possui somente três campos financeiros. O objetivo é permitir que o usuário configure a base das análises rapidamente, sem preencher uma planilha de categorias.

## Análises determinísticas

### Situação financeira

`GET /analise/situacao`

### Capacidade detalhada de gastos

`GET /analise/capacidade-gastos`

### Sugestões automáticas do motor

`GET /analise/sugestoes`

### Simular um gasto

`POST /analise/simular-gasto`

```json
{
  "valor": 500
}
```

O resultado pode ser `RECOMENDADO`, `ATENCAO`, `NAO_RECOMENDADO` ou `SALDO_INSUFICIENTE`. A operação não altera o saldo real.

## Metas

Uma meta possui:

- nome;
- valor alvo;
- valor que já foi reservado;
- prazo em meses;
- prioridade `baixa`, `media` ou `alta`;
- descrição opcional.

### Criar

`POST /metas`

Antes de salvar, o backend calcula a viabilidade. Uma meta classificada como `INVIAVEL` não é persistida e a resposta informa o motivo e, quando possível, um prazo mínimo e um prazo mais confortável.

### Simular antes de criar

`POST /analise/simular-meta`

```json
{
  "nome": "Notebook",
  "valorAlvo": 5000,
  "valorInicial": 1000,
  "prazoMeses": 10,
  "prioridade": "alta",
  "descricao": "Notebook para estudos"
}
```

### Outros endpoints

```text
GET    /metas
GET    /metas/resumo
GET    /metas/{id}
GET    /metas/{id}/viabilidade
PUT    /metas/{id}
PATCH  /metas/{id}/progresso
DELETE /metas/{id}
```

Quando o valor atual chega ao alvo, a análise passa automaticamente para `CONCLUIDA` e a meta deixa de gerar comprometimento mensal.

## Simulações futuras

`POST /simulacoes`

As simulações são temporárias e nunca alteram perfil, saldo, orçamento ou metas reais. O período permitido é de 1 a 60 meses.

O cenário pode partir do orçamento atual ou sobrescrever renda e gastos apenas para a projeção. Também aceita eventos em meses específicos.

Tipos de evento suportados:

- `RENDA_EXTRAORDINARIA`: entrada única naquele mês;
- `GASTO_EXTRAORDINARIO`: gasto único naquele mês;
- `ALTERAR_RENDA`: muda a renda mensal daquele mês em diante;
- `ALTERAR_GASTOS`: muda os gastos mensais daquele mês em diante;
- `ALTERAR_APORTE_META`: muda o aporte extra mensal geral ou de uma meta específica.

Exemplo:

```json
{
  "nomeCenario": "Cenário de 12 meses",
  "meses": 12,
  "aporteExtraMetasMensal": 100,
  "metaPrioritariaId": 1,
  "eventos": [
    {
      "mes": 2,
      "tipo": "RENDA_EXTRAORDINARIA",
      "valor": 500
    },
    {
      "mes": 4,
      "tipo": "GASTO_EXTRAORDINARIO",
      "valor": 1200
    },
    {
      "mes": 7,
      "tipo": "ALTERAR_RENDA",
      "valor": 2100
    },
    {
      "mes": 9,
      "tipo": "ALTERAR_APORTE_META",
      "valor": 200,
      "metaId": 1
    }
  ]
}
```

A resposta contém, entre outros dados:

- saldo inicial e saldo final projetado;
- variação do saldo;
- classificação final;
- evolução mês a mês;
- renda, gastos e margem de cada mês;
- eventos aplicados em cada período;
- total reservado;
- total destinado às metas;
- rendas e gastos extraordinários;
- progresso atual e projetado de cada meta;
- mês previsto de conclusão quando ocorrer dentro da simulação.

## Inteligência Artificial

Dashboard, orçamento, metas, capacidade de gasto e simulações funcionam sem chamada paga de IA.

### Verificar se a IA está configurada

`GET /ia/status`

Esse endpoint não faz chamada externa, não consome créditos e nunca retorna a chave. Ele apenas informa se `OPENAI_API_KEY` está configurada no ambiente.

### Perguntar à FinIA

`POST /ia/perguntar`

```json
{
  "pergunta": "Por que minha capacidade de gasto está baixa?"
}
```

### Análise geral

`GET /ia/analisar`

### Explicar uma simulação

`POST /ia/explicar-simulacao`

O corpo é o mesmo usado em `POST /simulacoes`. Primeiro o motor calcula todo o cenário. Depois a IA recebe os resultados determinísticos e apenas os interpreta.

A chave da OpenAI nunca deve ser salva no repositório. Use:

```text
OPENAI_API_KEY
OPENAI_MODEL
```

## Banco de dados

Banco: MySQL.

Para uma instalação nova, use:

```text
database/schema.sql
```

Para migrar a estrutura antiga para o modelo simplificado final, existe:

```text
database/migration_v3_final.sql
```

A migração preserva saldo, renda, valor planejado para guardar e converte as antigas categorias de despesa em `gastos_mensais`. Depois remove renda extra recorrente, categorias detalhadas, transações e revisão mensal, que não pertencem mais ao escopo final.

O CI testa a migração partindo de uma estrutura legada, confere a preservação dos dados essenciais e executa a migração novamente para detectar problemas de repetição.

Simulações não são persistidas e portanto não exigem tabelas próprias.

## Backend oficial

O projeto Java oficial é o da raiz:

```text
pom.xml
src/main/java/...
src/test/java/...
```

A antiga pasta duplicada `backend/` foi removida da branch de desenvolvimento. Existe apenas um backend oficial no projeto.

## Executar

```bash
mvn spring-boot:run
```

Servidor padrão:

```text
http://localhost:8080
```

## Testes

Executar todos os testes e gerar o pacote:

```bash
mvn verify
```

Os testes automatizados cobrem regras centrais do motor financeiro, comprometimento das metas, análise de gastos, viabilidade de metas, validações dos cenários de simulação, configuração da IA e carregamento do contexto Spring.

## CI

A branch `dev/finia-desenvolvimento` possui GitHub Actions. A cada push, o CI valida:

```text
Backend: mvn verify
Banco: migração legada -> schema final
API: aplicação real + MySQL + smoke tests HTTP
Frontend atual: npm ci + lint + build
```

O smoke test também verifica que simulações não alteram os dados reais e que metas inviáveis não são persistidas.

## Tecnologias

- Java 21
- Spring Boot 3.2.5
- Maven
- MySQL
- JDBC
- BigDecimal
- JUnit 5
- AssertJ
- OpenAI Java SDK
- OpenAI Responses API
- GitHub Actions

## Escopo final

A versão final do TCC é centrada em seis áreas de interface:

```text
Dashboard
Meu Orçamento
Metas
Simulações
FinIA
Perfil
```

O objetivo do produto pode ser resumido como:

> Você informa o básico. O FinIA calcula, simula e explica.

## Entrega de conclusão — 28/09/2026

A interface agora permite editar metas com prévia de viabilidade, combinar os cinco tipos de eventos em cenários personalizados e recuperar perguntas após falhas da IA. Valores monetários têm limite e precisão coerentes com o banco. Resultados anteriores são limpos quando os parâmetros mudam. Fontes e ícones são servidos pelo próprio frontend.

Novo endpoint sem persistência: `POST /metas/{id}/simular`, com o mesmo corpo de `PUT /metas/{id}`. A prévia de edição exclui o compromisso da própria meta; salvar revalida os dados no backend.

- [Como executar e apresentar](docs/EXECUTAR.md)
- [Funcionalidades, feedback e limites da validação](docs/ENTREGA.md)

Frontend: `npm test` executa jornadas em Chromium nos tamanhos desktop e mobile. Backend: `mvn verify` inclui a jornada HTTP com repositórios JDBC e H2 isolado. Os testes existentes de MySQL no CI continuam necessários.
