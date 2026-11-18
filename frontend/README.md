# Frontend do FinIA

Esta pasta contém a interface **React 19 + Vite 8 + Tailwind CSS 4** do FinIA. A descrição das regras financeiras, dos endpoints e da estrutura do TCC fica no [README principal](../README.md), para evitar documentos divergentes.

## Telas atuais

| Rota | Finalidade |
| --- | --- |
| `/` | Dashboard e situação financeira atual |
| `/planejamento` | Informar renda, gastos e valor planejado para guardar |
| `/metas` | Criar, editar e acompanhar metas |
| `/simulacoes` | Testar decisões, folga mensal, reserva e metas, inclusive sem metas cadastradas |
| `/insights` | Conversar com a FinIA quando a integração estiver configurada |
| `/perfil` | Nome e saldo informado pelo usuário |

A simulação **não salva** os resultados no banco nem representa dinheiro depositado. Ela exibe o planejamento com o orçamento informado.

## Desenvolvimento local

É necessário Node.js 22.12+ e backend Spring Boot executando na porta 8080 (ou endereço configurado via `VITE_API_URL`).

```bash
npm ci
npm run dev
```

Acesse `http://localhost:5173`. Por padrão, `src/services/api.js` usa `http://localhost:8080`.

## Testes

```bash
npm run lint
npm run build
npx playwright install chromium --only-shell
npm test
```

O Playwright usa respostas simuladas da API, em Chromium desktop e viewport móvel. Para validar também o backend e o MySQL, siga [Executar o FinIA](../docs/EXECUTAR.md).

## Identidade visual

Manrope, Material Symbols Outlined, tons de azul e ciano e formato monetário brasileiro (`R$`). Ícones são carregados pela fonte local, não por sprites de redes sociais ou arquivos de template.
