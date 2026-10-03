# FinIA — entrega e feedback técnico

Data: 28/09/2026.
Base: `joaovictor-devv/finIA-gestao-financeira`, branch `dev/finia-desenvolvimento`, commit `1d1295a7a03d28cc34e288ea7d1b1e4293f1a28f`.

## O que foi concluído nesta revisão

| Área | Resultado |
| --- | --- |
| Perfil | Mantidos cadastro/atualização de nome e saldo; formulário bloqueia alterações durante envio; backend rejeita valores fora da precisão/limite do banco. |
| Orçamento | Renda, gastos e reserva integrados; a classificação passa a indicar que corresponde ao último orçamento salvo, evitando confundi-la com a prévia digitada. |
| Metas | Acrescentadas edição completa, prévia sem persistência, cancelamento e confirmação; edição exclui o compromisso da própria meta; salvar revalida; progresso vazio não vira zero; operações bloqueiam cliques concorrentes; descrição aparece no cartão. |
| Simulações | Cenário personalizado aceita adicionar/remover até 100 eventos dos cinco tipos existentes no motor, com mês, valor e meta de destino quando aplicável; alterações dos parâmetros invalidam resultado e explicação antigos. |
| IA | Interface diferencia verificação, ausência de configuração e falha de conexão; não promete que uma chave configurada é válida; pergunta é recuperada após falha; limite de 2.000 caracteres na pergunta do usuário. |
| Interface | Fontes e ícones locais, feedback acessível, indicação da rota ativa, respeito a redução de movimento; progresso correto inclusive para metas inferiores a R$ 1. |
| Backend | Validação comum de valores monetários; rejeição de meses fracionados; prevenção de overflow em sugestão de prazo; sugestões limitadas aos 600 meses aceitos pelo produto. |
| Execução | Docker Compose com MySQL, API e frontend; proxy `/api`; rotas SPA; acesso local; guia de instalação e roteiro de apresentação. |
| Testes | Novas jornadas da API com JDBC/H2, validações monetárias e testes de interface desktop/mobile; CI inclui jornadas do frontend. |

## Verificação executada

- Java 21: `mvn verify` passou; **69 testes**, zero falhas, zero erros e nenhum ignorado. Pacote Spring Boot gerado.
- API: testes com controllers HTTP, serviços e repositórios reais usando **H2 em modo MySQL**, sem mocks dos repositórios. Conferidos perfil, orçamento, criação, edição, prévia, progresso, conclusão, exclusão, rejeição de valores, IA ausente e simulações sem persistência.
- Frontend: `npm run lint` e `npm run build` passaram.
- Navegador: **14 testes** passaram em Chromium, com tamanhos desktop e mobile. Respostas da API controladas nesses testes; não equivalem a uma sessão de navegador conectada ao MySQL.
- Inspeção visual das telas de metas em desktop e mobile; corrigida a falha de fontes externas encontrada. Imagens com dados fictícios em `docs/evidencias/`.
- Repositório sem erros de whitespace no diff. O pacote contém código e patch, sem credenciais reais, dependências instaladas ou banco do usuário.

## Meu feedback sobre o produto

**Ponto forte:** a separação entre cálculo determinístico e explicação por IA torna o TCC mais fácil de demonstrar e verificar. O usuário consegue obter resultados úteis mesmo sem configurar a IA.

**O ganho mais importante desta entrega:** metas agora têm o ciclo completo de criação, edição, atualização de progresso e exclusão pela interface. O usuário também consegue testar várias mudanças futuras em um único cenário.

**Cuidado na apresentação:** diferencie saldo disponível, reserva e valores já separados para metas. Explique que a projeção mantém as hipóteses informadas; não representa previsão garantida nem movimentação automática de dinheiro. O prazo da meta é um número de meses informado, não um calendário de vencimento que diminui automaticamente.

**Próxima validação de produto:** observe algumas pessoas fazendo o roteiro sem ajuda. Veja se entendem a diferença entre “testar” e “salvar”, e se conseguem informar o orçamento sem confundir reserva geral e dinheiro das metas. Essa avaliação exige usuários reais e não foi simulada como concluída.

## Limites e pendências externas

1. **Publicação:** na preparação inicial do ZIP a conexão era somente leitura. Após a liberação de escrita, as alterações foram preparadas na branch `entrega/finia-conclusao`, com revisão por pull request para `dev/finia-desenvolvimento`. Acompanhe o resultado do CI e a integração pelo GitHub. O ZIP original registra a situação anterior à publicação.
2. **IA real:** não foi usada uma chave da OpenAI. A integração com serviço pago, disponibilidade do modelo, qualidade e fidelidade das respostas precisam de validação com credencial válida. `GET /ia/status` só verifica presença da chave, não a autentica.
3. **MySQL e Docker:** não havia daemon Docker/MySQL neste ambiente. Os testes novos rodaram em H2; o CI existente com MySQL foi preservado, mas não foi disparado nesta entrega. O Compose não foi executado aqui. O teste de migração do banco antigo continua necessário no CI.
4. **Hospedagem:** a aplicação não foi publicada. Como o escopo é de usuário único sem login, a configuração entregue restringe acesso ao próprio computador. Publicação exige definir acesso e HTTPS.
5. **Dispositivos:** os testes mobile usam Chromium com viewport móvel. Safari/iPhone físico não foi homologado.

Não seria correto chamar essas pendências externas de concluídas apenas porque o código compila.
