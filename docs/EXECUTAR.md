# Executar o FinIA

## Opção 1 — Docker Desktop

É necessário ter Docker Desktop instalado e iniciado. Este ambiente não tinha Docker; a configuração abaixo foi revisada, mas ainda precisa ser executada em uma máquina com Docker.

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

Os testes da API usam H2 isolado em modo MySQL. O CI mantém os testes de migração e smoke HTTP com MySQL real. Os testes de navegador usam respostas controladas da API e executam em Chromium com dois tamanhos de tela; o tamanho de iPhone não representa um teste no Safari real.

## Roteiro de apresentação

1. Perfil: nome e saldo R$ 1.500.
2. Orçamento: renda R$ 3.000, gastos R$ 1.200, reserva R$ 300.
3. Meta: Notebook de R$ 3.000, R$ 1.000 já guardados, prazo de 10 meses.
4. Dashboard: o compromisso da meta é R$ 200/mês; a margem fica em R$ 1.300.
5. Edite a meta, confira a prévia e salve. Teste também um valor inviável.
6. Em Simulações, combine renda extraordinária no mês 2 e gasto no mês 4. Compare o resultado e volte ao perfil para confirmar que nada mudou.
7. Complete o progresso da meta: seu compromisso mensal deixa de pesar no orçamento.
8. Sem chave da IA, mostre que todo o motor continua funcionando. Com chave, confirme a qualidade das explicações antes da apresentação.
