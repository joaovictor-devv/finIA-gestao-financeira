# Executar o FinIA

## Opção 1 — Docker Desktop

Requer Docker Desktop instalado e iniciado. Esta opção cria um banco MySQL isolado por volume e expõe somente o frontend localmente.

1. Extraia o projeto e abra um terminal na pasta que contém `compose.yaml`.
2. Copie `.env.example` para `.env` (no PowerShell: `Copy-Item .env.example .env`).
3. Preencha `FINIA_DB_PASSWORD` e `MYSQL_ROOT_PASSWORD` com duas senhas diferentes.
4. A chave `OPENAI_API_KEY` pode permanecer vazia. Perfil, orçamento, metas e simulações funcionam sem IA. Para habilitar explicações, configure uma chave da API e um modelo disponível na sua conta em `OPENAI_MODEL`.
5. Execute:

```bash
docker compose up --build -d
```

Abra http://localhost:3000. Se a aplicação ainda estiver iniciando, aguarde e recarregue.

```bash
docker compose logs --tail=100 backend
docker compose down
```

O primeiro comando mostra os logs; o segundo para os serviços preservando o banco. O banco usa o volume `finia-db`. Não use `down -v` se quiser manter seus dados. As senhas de inicialização do MySQL só são aplicadas ao criar um volume vazio.

Esta configuração cria um banco novo e não migra automaticamente um banco antigo. A migração legada continua em `database/migration_v3_final.sql`; faça backup antes de aplicá-la a dados existentes.

O acesso é restrito ao próprio computador (`127.0.0.1:3000`), pois o escopo do TCC não possui login. MySQL e backend não publicam portas no host. Para hospedagem pública, será necessário definir proteção de acesso e HTTPS; CORS sozinho não protege os dados.

## Opção 2 — Iniciador para Windows

Com Java 21, Maven, Node.js e MySQL configurados, você pode abrir `Iniciar-FinIA.bat` na raiz do repositório. O launcher inicia frontend e backend e abre `http://localhost:5173` sem apagar dados.

Instruções completas: [Iniciar no Windows](INICIAR-WINDOWS.md).

## Opção 2 — Ferramentas locais

Requisitos: Java 21, Maven, Node.js 22.12+ e MySQL 8.4.

1. Execute `database/schema.sql` no MySQL para uma instalação nova.
2. Defina `DB_URL`, `DB_USER` e `DB_PASSWORD` no ambiente do processo Java. O Spring/Maven não carrega automaticamente o arquivo `.env`.
3. Na raiz, execute `mvn spring-boot:run`.
4. Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abra http://localhost:5173. A API fica em http://localhost:8080.

## Conferir antes de apresentar

```bash
mvn verify
cd frontend
npm ci
npm run lint
npm run build
npx playwright install chromium --only-shell
npm test
```

Os testes unitários e integrados da API usam H2 isolado em modo MySQL. O CI também executa migração e smoke tests com MySQL real. Os testes de navegador usam respostas de API controladas e rodam em Chromium (desktop e viewport móvel); isso não substitui um teste em Safari/iPhone físico. O resultado dos testes deve ser confirmado para o commit específico na [aba Actions](https://github.com/joaovictor-devv/finIA-gestao-financeira/actions).

## Roteiro de apresentação

1. Perfil: nome e saldo R$ 1.500.
2. Orçamento: renda R$ 3.000, gastos R$ 1.200, reserva R$ 300.
3. Meta: Notebook de R$ 3.000, R$ 1.000 já guardados, prazo de 10 meses.
4. Dashboard: o compromisso da meta é R$ 200/mês; a margem fica em R$ 1.300.
5. Edite a meta, confira a prévia e salve. Teste também um valor inviável.
6. Em Simulações, escolha **Compra pontual**: teste uma compra que caiba no valor disponível do próximo mês e outra que exceda esse valor. O resultado deve informar quanto restaria ou faltaria **naquele mês**, sem repetir os compromissos inalterados. Depois teste **Alterar reserva mensal** sem metas e **Planejamento personalizado** para conferir a tabela mensal; volte ao perfil e confirme que os dados reais não mudaram.
7. Complete o progresso da meta: seu compromisso mensal deixa de pesar no orçamento.
8. Sem chave da IA, mostre que todo o motor continua funcionando. Com chave, confirme a qualidade das explicações antes da apresentação.
