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

### Ajustes financeiros nas Simulações

A opção **Aporte adicional para uma meta** mostra o aporte já calculado para atender o prazo, esclarecendo que o usuário digita somente a quantia **extra**. Ao selecionar outro período, também calcula o adicional mensal necessário para tentar atingir o alvo nesse horizonte, com um atalho para preenchê-lo e um alerta de capacidade financeira. Exibe o impacto na disponibilidade mensal e não transfere excedentes automaticamente para outras metas.

Em **Redução de renda**, é possível simular a adaptação dos aportes ao dinheiro restante depois de despesas e reserva, com prioridade alta → média → baixa. Ao desativar a opção, são mantidos os aportes atuais para comparar o risco. Em **Aumento de renda**, um campo opcional permite destinar parte do aumento a uma meta; sem essa decisão, os aportes e os prazos continuam iguais. O progresso aparece em até três marcos explicativos por objetivo, e não em um gráfico ou tabela repetitiva.
 
### Distribuição dos resultados em Simulações

Nas opções **Aumento de renda** e **Redução de renda**, o resumo da renda fica ao lado do formulário, com os valores anterior e simulado alinhados e a variação mensal em destaque. O progresso das metas é exibido em uma seção separada, de largura inteira, **abaixo do formulário e do resumo**, evitando cartões estreitos e grandes espaços em branco. Em telas largas, duas metas podem aparecer lado a lado; em dispositivos menores, os cartões se empilham com espaçamento adequado. Cada meta mostra o valor final, quanto falta e até três marcos resumidos, sem gráficos ou tabela mensal.
