# Frontend do FinIA

Esta pasta contém a interface **React 19 + Vite 8 + Tailwind CSS 4** do FinIA. A descrição das regras financeiras, dos endpoints e da estrutura do TCC fica no [README principal](../README.md), para evitar documentos divergentes.

## Telas atuais

| Rota | Finalidade |
| --- | --- |
| `/` | Dashboard e situação financeira atual |
| `/planejamento` | Informar renda, gastos e valor planejado para guardar |
| `/metas` | Criar, editar e acompanhar metas |
| `/simulacoes` | Testar decisões, folga mensal, reserva e metas, inclusive sem metas cadastradas |
| `/insights` | Conversar com a FinIA, mantendo o histórico temporário da aba e permitindo apagá-lo |
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

## Histórico temporário do chat

A tela `/insights` mantém até 60 mensagens em `sessionStorage` **somente na aba atual** do navegador. A conversa continua visível ao sair da tela, voltar ou atualizar a página. O usuário pode selecionar **Limpar conversa** a qualquer momento. O histórico não é gravado no MySQL nem compartilhado automaticamente entre abas. Alguns navegadores restauram dados de sessão ao reabrir abas; utilize o botão para apagá-los imediatamente. Para entender perguntas de continuação, até seis mensagens anteriores são enviadas junto da pergunta atual a `POST /ia/perguntar`; não são gravadas no servidor. Ao selecionar **Limpar conversa**, a próxima pergunta é enviada sem histórico.

Em `/simulacoes`, cada opção de decisão exibe somente os indicadores pertinentes. **Compra pontual** analisa um único mês e não altera automaticamente os aportes à reserva ou às metas; se o orçamento do mês ficar negativo, alerta sobre a necessidade de revisão ou de recursos livres anteriores. Os cenários completos (orçamento atual e personalizado) não exibem mais a tabela mensal repetitiva: apenas meses com alterações reais ou previsão de conclusão de metas aparecem em um resumo de acontecimentos. Se todos os meses forem iguais, essa seção não aparece. O valor mensal disponível mais baixo recebe atenção especial. Não há gráficos de linhas.

### Projeção das metas nas Simulações

Os cartões de meta exibem **o valor projetado ao final do período**, o percentual do objetivo alcançado e quanto ainda faltaria. A comparação com o planejamento atual aparece **somente quando existir mudança no valor projetado ou na data prevista de conclusão**, sem repetir números idênticos ou a frase gerada de avanço. O valor já registrado pelo usuário não muda automaticamente quando a simulação é executada: é atualizado pela ação **Atualizar progresso** na página Metas; as projeções são condicionais aos aportes planejados.
