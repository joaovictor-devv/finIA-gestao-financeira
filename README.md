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

### Simular quanto guardar sem criar metas

A simulação aceita `reservaMensal`, que substitui **somente no cenário** o valor mensal planejado para guardar. Não é necessário cadastrar metas. Exemplo:

```json
{
  "nomeCenario": "Guardar 400 por mês",
  "meses": 6,
  "reservaMensal": 400,
  "eventos": []
}
```

O motor calcula folga mensal = renda do mês (incluindo extras) menos gastos (incluindo extras), reserva planejada e aportes a metas existentes. A interface apresenta:
- meses em que a renda não cobre os compromissos;
- folga mensal e seu comparativo com manter o orçamento atual;
- total planejado para a reserva durante o período (não inclui dinheiro já guardado);
- valores aportados às metas e progresso simulado de cada objetivo;
- **resumos específicos para cada decisão**: a compra pontual compara preço, valor livre antes e depois e eventual insuficiência; mudanças na renda destacam variação e meses com déficit; a reserva destaca quanto se pretende separar; aportes mostram a evolução da meta selecionada;
- nos cenários completos, **só são mostrados meses que realmente mudam**, como alterações de receitas, despesas, reserva, aportes ou conclusão de uma meta; meses com números idênticos não geram tabela. O resumo prioriza a menor disponibilidade do período e alerta sobre margens mensais muito pequenas.

**Importante:** folga livre não significa economia realizada; reserva e aportes são intenções de destinação, não comprovantes de depósito. Não existem aplicações financeiras cadastradas nem estimativas automáticas de rendimentos, juros ou inflação. O quadro de metas mostra valor atual, valor final previsto e percentual de avanço; os meses com déficit são destacados no diagnóstico do cenário. Se não houver metas cadastradas, os cálculos da reserva e do orçamento permanecem válidos. As simulações não alteram dados reais.

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

- evolução mensal de renda, gastos e **folga** (renda menos compromissos);
- reserva **planejada** no período;
- aportes **planejados** às metas;
- eventos aplicados em cada mês;
- progresso atual e projetado de cada meta;
- evolução individual de cada meta em cada mês simulado, no campo `evolucaoMensal[].metasProjetadas`;
- mês previsto de conclusão, quando ocorrer dentro da simulação.

**Coerência:** a classificação geral da simulação considera os riscos de todo o período; um último mês positivo não esconde meses com déficit. Metas e reserva são contribuições previstas e não depósitos confirmados. **Compatibilidade:** a API ainda retorna campos antigos de saldo projetado, mas eles **não são indicadores de patrimônio** e não aparecem como resultado principal na interface. A tela utiliza folga mensal, reserva planejada e evolução das metas, para não confundir dinheiro livre com dinheiro já guardado.

## Inteligência Artificial

Dashboard, orçamento, metas, capacidade de gasto e simulações funcionam sem chamada paga de IA.

### Verificar se a IA está configurada

`GET /ia/status`

Esse endpoint não faz chamada externa, não consome créditos e nunca retorna a chave. Ele apenas informa se `OPENAI_API_KEY` está configurada no ambiente.

### Perguntar à FinIA

`POST /ia/perguntar`

```json
{
  "pergunta": "E se eu guardar R$ 100 a mais?",
  "historico": [
    { "tipo": "usuario", "texto": "Como está meu orçamento?" },
    { "tipo": "finia", "texto": "A renda cobre os compromissos cadastrados." }
  ]
}
```

O campo `historico` é opcional, limitado a seis mensagens recentes de até 2.000 caracteres, com tipos `usuario` e `finia`. Os valores atuais do backend prevalecem; as mensagens não são persistidas no banco. Limpar o histórico no navegador faz a próxima pergunta começar sem contexto anterior.

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

## Integração contínua (CI)

O workflow `.github/workflows/ci.yml` verifica mudanças no código:

- Java 21: `mvn verify`, incluindo os testes JUnit e a API integrada em H2;
- MySQL 8.4: migração da estrutura antiga, aplicação idempotente e smoke test HTTP da API;
- React/Vite: `npm ci`, `npm run lint`, `npm run build` e testes Playwright em desktop/mobile.

Para conhecer o estado **atual** dos testes, consulte a [aba Actions](https://github.com/joaovictor-devv/finIA-gestao-financeira/actions). Registros de uma entrega anterior não provam que a versão presente esteja aprovada.

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
- React 19, Vite 8, Tailwind CSS 4 e Playwright

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

## Documentação atual

- [Executar, testar e apresentar](docs/EXECUTAR.md) — Docker, ferramentas locais e roteiro de apresentação.
- [Iniciar no Windows](docs/INICIAR-WINDOWS.md) — configuração do launcher e execução com dois cliques.
- [Frontend](frontend/README.md) — rotas, integração da API e testes de navegador.

A documentação acima descreve o código das branches recentes; o histórico de versões e resultados anteriores permanece acessível pelos commits do Git. Não é necessário aplicar arquivos `.patch` ou importar um ZIP para atualizar a cópia clonada.

**Projeção das metas na interface:** os resultados apresentam valor projetado ao término do período, percentual e valor ainda necessário, sem comparar "Hoje" e "Depois" quando isso repete informação. A diferença em relação ao planejamento atual só é mostrada quando existir. O valor realmente separado depende de atualização manual na página Metas; o simulador não efetiva aportes.
