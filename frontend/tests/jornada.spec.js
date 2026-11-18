import { test, expect } from '@playwright/test';

const capacidade = { rendaMensal: 3000, gastosMensais: 1200, reservaPlanejada: 300, saldoAtual: 1500, margemAntesMetas: 1500, margemAposMetas: 1300, comprometimentoMensalMetas: 200, capacidadeGastoImediato: 1300, classificacao: 'SAUDAVEL' };
const analise = { viavel: true, classificacao: 'VIAVEL', valorRestante: 2000, valorMensalNecessario: 200, margemDisponivelParaMeta: 1500, comprometimentoOutrasMetas: 0, percentualMargemComprometida: 13.33 };
const meta = { id: 1, nome: 'Notebook', valorAlvo: 3000, valorInicial: 1000, prazoMeses: 10, prioridade: 'alta', descricao: 'Estudos' };

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data;
    if (path === '/perfil-financeiro') data = { nome: 'João', ...capacidade };
    else if (path === '/orcamento' || path === '/analise/capacidade-gastos') data = capacidade;
    else if (path === '/metas/resumo') data = [{ meta, analise }];
    else if (path === '/metas') data = [meta];
    else if (path === '/ia/status') data = { configurada: false };
    else return route.fulfill({ status: 404, json: { mensagem: 'Rota não prevista pelo teste' } });
    await route.fulfill({ json: data });
  });
});

test('edita meta somente após prévia e confirmação', async ({ page }) => {
  let salva = false;
  await page.route('**/metas/1/simular', route => route.fulfill({ json: analise }));
  await page.route('**/metas/1', async route => {
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON().nome).toBe('Computador');
    salva = true;
    await route.fulfill({ json: { meta, analise } });
  });
  await page.goto('/metas');
  await page.getByRole('button', { name: 'Editar meta', exact: true }).click();
  await page.getByLabel('O que você quer alcançar?').fill('Computador');
  await page.getByRole('button', { name: 'Ver se essa meta cabe' }).click();
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeVisible();
  expect(salva).toBe(false);
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('status')).toContainText('Meta atualizada');
  expect(salva).toBe(true);
});

test('não salva edição inviável', async ({ page }) => {
  await page.route('**/metas/1/simular', route => route.fulfill({ json: { ...analise, viavel: false, classificacao: 'INVIAVEL' } }));
  await page.goto('/metas');
  await page.getByRole('button', { name: 'Editar meta', exact: true }).click();
  await page.getByRole('button', { name: 'Ver se essa meta cabe' }).click();
  await expect(page.getByText('Essa meta não cabe nesse prazo.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);
});

test('progresso vazio não vira zero', async ({ page }) => {
  await page.goto('/metas');
  await page.getByRole('button', { name: 'Atualizar progresso' }).click();
  await page.getByLabel('Valor já guardado').fill('');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Informe um valor');
});

test('limpa resultado ao mudar período e envia eventos personalizados', async ({ page }) => {
  let payload;
  await page.route('http://localhost:8080/simulacoes', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    const requestBody = route.request().postDataJSON();
    if (requestBody.nomeCenario !== 'Sem mudanças') payload = requestBody;
    await route.fulfill({ json: {
      meses: requestBody.meses, classificacaoFinal: 'SAUDAVEL',
      situacaoAtual: capacidade, totalReservaPlanejada: 300 * requestBody.meses,
      totalAportadoMetas: 0, projecoesMetas: [],
      evolucaoMensal: Array.from({ length: requestBody.meses }, (_, index) => ({
        indiceMes: index + 1, mesReferencia: '2027-' + String(index % 12 + 1).padStart(2, '0'),
        rendaMensal: 3000, gastosMensais: 1200, reservaPlanejada: 300,
        aporteMetasBase: 0, aporteExtraMetas: 0, margemMensal: 1500,
        eventosAplicados: [],
      })),
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Planejamento personalizado/ }).click();
  await page.getByRole('button', { name: 'Adicionar evento' }).click();
  await page.getByLabel('Valor do evento').fill('500');
  await page.getByLabel('Mês do evento').fill('2');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('6 meses analisados com as condições informadas.')).toBeVisible();
  expect(payload.eventos).toEqual([{ mes: 2, tipo: 'RENDA_EXTRAORDINARIA', valor: 500 }]);
  await page.getByRole('button', { name: '12 meses', exact: true }).click();
  await expect(page.getByText('6 meses analisados com as condições informadas.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Explicar com a FinIA' })).toHaveCount(0);
});

test('distingue indisponibilidade do servidor e ausência de chave IA', async ({ page }) => {
  await page.route('**/ia/status', route => route.abort());
  await page.goto('/insights');
  await expect(page.getByText('Conexão indisponível', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar pergunta' })).toBeDisabled();
});

test('restaura pergunta após falha da IA', async ({ page }) => {
  await page.route('**/ia/status', route => route.fulfill({ json: { configurada: true } }));
  await page.route('**/ia/perguntar', route => route.fulfill({ status: 503, json: { mensagem: 'Serviço indisponível' } }));
  await page.goto('/insights');
  await page.getByLabel('Sua pergunta para a FinIA').fill('Por que minha margem caiu?');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await expect(page.getByRole('alert')).toHaveText('Serviço indisponível');
  await expect(page.getByLabel('Sua pergunta para a FinIA')).toHaveValue('Por que minha margem caiu?');
});

test('seis telas sem erros JavaScript nem rolagem horizontal', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/perfil', '/planejamento', '/metas', '/simulacoes', '/insights']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('21px "Material Symbols Outlined"'))).toBe(true);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('oculta valores do dashboard e mantém a escolha ao recarregar', async ({ page }) => {
  await page.goto('/');
  const saldo = page.getByTestId('saldo-atual');
  await expect(saldo).toContainText('1.500');
  await expect(page.getByRole('progressbar', { name: 'Progresso da meta Notebook' })).toHaveAttribute('aria-valuenow', '33.3');
  await page.getByRole('button', { name: 'Ocultar valores' }).click();
  await expect(saldo).toHaveText('••••');
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('1.500');
  await page.reload();
  await expect(saldo).toHaveText('••••');
  await page.getByRole('button', { name: 'Mostrar valores' }).click();
  await expect(saldo).toContainText('1.500');
  await expect(page.getByRole('progressbar')).toHaveCount(1);
});

test('falha nas metas não impede o dashboard e o atalho abre o formulário', async ({ page }) => {
  await page.route('**/metas/resumo', route => route.fulfill({ status: 503, json: { mensagem: 'Indisponível' } }));
  await page.goto('/');
  await expect(page.getByTestId('saldo-atual')).toContainText('1.500');
  await expect(page.getByText('Não foi possível carregar suas metas.', { exact: false })).toBeVisible();
  await page.getByRole('navigation', { name: 'Ações rápidas' }).getByRole('link', { name: 'Nova meta' }).click();
  await expect(page).toHaveURL(/\/metas#form-meta$/);
  await expect(page.getByLabel('O que você quer alcançar?')).toBeFocused();
});

test('pergunta sugerida só é enviada após a ação do cliente', async ({ page }) => {
  let chamadas = 0;
  await page.route('**/ia/status', route => route.fulfill({ json: { configurada: true } }));
  await page.route('**/ia/perguntar', async route => {
    chamadas++;
    expect(route.request().postDataJSON().pergunta).toBe('Por que minha situação está assim?');
    await route.fulfill({ json: { resposta: 'Você tem margem para planejar seus próximos passos.' } });
  });
  await page.goto('/insights');
  await page.getByRole('button', { name: 'Por que minha situação está assim?' }).click();
  await expect(page.getByLabel('Sua pergunta para a FinIA')).toBeFocused();
  expect(chamadas).toBe(0);
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await expect(page.getByRole('log')).toContainText('Você tem margem para planejar seus próximos passos.');
  await expect(page.getByRole('log')).toContainText('Por que minha situação está assim?');
  expect(chamadas).toBe(1);
});

test('orçamento mostra a prévia sem gravar antes de salvar', async ({ page }) => {
  let gravacoes = 0;
  await page.route('**/orcamento', async route => {
    if (route.request().method() !== 'PUT') return route.fallback();
    gravacoes++;
    expect(route.request().postDataJSON()).toEqual({ rendaMensal: 3000, gastosMensais: 2800, valorPlanejadoGuardar: 300 });
    await route.fulfill({ json: { ...capacidade, gastosMensais: 2800, margemAposMetas: -300, classificacao: 'METAS_ACIMA_DA_CAPACIDADE' } });
  });
  await page.goto('/planejamento');
  await page.getByLabel('Despesas mensais').fill('2800');
  await expect(page.getByText('Os compromissos superam a renda em', { exact: false })).toBeVisible();
  expect(gravacoes).toBe(0);
  await page.getByRole('button', { name: 'Salvar orçamento' }).click();
  await expect(page.getByRole('status')).toContainText('Orçamento salvo');
  expect(gravacoes).toBe(1);
});

test('a simulação mostra risco por margem negativa, sem exibir saldo bancário projetado', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    await route.fulfill({ json: {
      meses: 3, saldoInicial: 1500, saldoFinalProjetado: -500, variacaoSaldo: -2000,
      classificacaoFinal: 'DEFICIT', mensagem: 'Mensagem antiga sobre saldo não deve aparecer.',
      situacaoAtual: capacidade, totalReservaPlanejada: 900, totalAportadoMetas: 600,
      evolucaoMensal: [
        { indiceMes: 1, mesReferencia: '2026-12', saldoDisponivelProjetado: 1000, margemMensal: -500, rendaMensal: 3000, gastosMensais: 3500, reservaPlanejada: 300, aporteMetasBase: 200 },
        { indiceMes: 2, mesReferencia: '2027-01', saldoDisponivelProjetado: 0, margemMensal: -1000, rendaMensal: 3000, gastosMensais: 4000, reservaPlanejada: 300, aporteMetasBase: 200 },
        { indiceMes: 3, mesReferencia: '2027-02', saldoDisponivelProjetado: -500, margemMensal: -500, rendaMensal: 3000, gastosMensais: 3500, reservaPlanejada: 300, aporteMetasBase: 200 }
      ], projecoesMetas: []
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByTestId('mudancas-relevantes')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByText('O orçamento ficaria negativo em 3 de 3 meses.')).toBeVisible();
  await expect(page.getByText('Reserva planejada no período').first()).toBeVisible();
  await expect(page.getByText('Mensagem antiga sobre saldo não deve aparecer.')).toHaveCount(0);
  await expect(page.getByText('Saldo depois de 3 meses')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('dashboard apresenta déficit e valores grandes sem perder ações no celular', async ({ page }) => {
  await page.route('**/analise/capacidade-gastos', route => route.fulfill({ json: { ...capacidade, saldoAtual: 9999999999.99, margemAposMetas: -700, comprometimentoMensalMetas: 2200, classificacao: 'METAS_ACIMA_DA_CAPACIDADE' } }));
  await page.goto('/');
  await expect(page.getByTestId('saldo-atual')).toContainText('9.999.999.999');
  await expect(page.getByRole('link', { name: 'Revisar minhas metas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verificar gasto' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


test('compara a folga mensal com a referência e destaca os meses afetados', async ({ page }) => {
  let chamadas = 0;
  await page.route('http://localhost:8080/simulacoes', async route => {
    const payload = route.request().postDataJSON();
    chamadas++;
    const eReferencia = payload.nomeCenario === 'Sem mudanças';
    const margens = eReferencia ? [300, 300, 300] : [300, -200, 300];
    await route.fulfill({ json: {
      meses: 3, saldoInicial: 1500, saldoFinalProjetado: 2000, variacaoSaldo: 500,
      classificacaoFinal: 'SAUDAVEL', mensagem: 'Projeção calculada.',
      situacaoAtual: capacidade, totalReservaPlanejada: 900, totalAportadoMetas: 0,
      evolucaoMensal: margens.map((margem, index) => ({
        indiceMes: index + 1,
        mesReferencia: ['2026-12', '2027-01', '2027-02'][index],
        margemMensal: margem, reservaPlanejada: 300, rendaMensal: 3000,
        gastosMensais: 2400, aporteMetasBase: 0, aporteExtraMetas: 0, eventosAplicados: [],
      })),
      projecoesMetas: [],
    } });
  });

  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await page.getByRole('button', { name: /Despesa imprevista/ }).click();
  await page.getByRole('spinbutton', { name: 'Valor da despesa extraordinária' }).fill('500');
  await page.getByLabel('Mês em que a despesa ocorrerá').selectOption('2');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();

  await expect(page.getByTestId('resultado-despesa')).toBeVisible();
  await expect(page.getByText('A despesa extraordinária supera o valor disponível', { exact: false })).toBeVisible();
  await expect(page.getByTestId('disponivel-antes')).toContainText('R$ 300,00');
  await expect(page.getByTestId('disponivel-depois')).toContainText('-R$ 200,00');
  await expect(page.getByRole('table')).toHaveCount(0);

  expect(chamadas).toBe(2);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('permite planejar reserva sem nenhuma meta, sem confundir folga com economia', async ({ page }) => {
  let payloadSimulado;
  await page.route('**/metas', route => route.fulfill({ json: [] }));
  await page.route('**/analise/capacidade-gastos', route => route.fulfill({ json: {
    ...capacidade, reservaPlanejada: 0, comprometimentoMensalMetas: 0, margemAposMetas: 1800,
  } }));
  await page.route('http://localhost:8080/simulacoes', async route => {
    const payload = route.request().postDataJSON();
    const referencia = payload.nomeCenario === 'Sem mudanças';
    if (!referencia) payloadSimulado = payload;
    const reservaMensal = referencia ? 0 : payload.reservaMensal;
    await route.fulfill({ json: {
      meses: 3, saldoInicial: 1500, saldoFinalProjetado: 5000, variacaoSaldo: 3500,
      classificacaoFinal: 'SAUDAVEL', mensagem: 'Saldo não é o foco.',
      situacaoAtual: capacidade, totalReservaPlanejada: reservaMensal * 3, totalAportadoMetas: 0,
      evolucaoMensal: [1, 2, 3].map((i) => ({
        indiceMes: i, mesReferencia: ['2026-12', '2027-01', '2027-02'][i - 1],
        margemMensal: 1800 - reservaMensal, reservaPlanejada: reservaMensal,
        rendaMensal: 3000, gastosMensais: 1200, aporteMetasBase: 0, aporteExtraMetas: 0, eventosAplicados: [],
      })),
      projecoesMetas: [],
    } });
  });

  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Alterar reserva mensal/ }).click();
  await page.getByRole('spinbutton', { name: 'Novo valor mensal para a reserva' }).fill('500');
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();

  expect(payloadSimulado.reservaMensal).toBe(500);
  await expect(page.getByText('A simulação não exige metas cadastradas', { exact: false })).toBeVisible();
  await expect(page.getByText('R$ 1.500,00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Mudança na reserva em relação ao plano atual')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByText('Saldo não é o foco.')).toHaveCount(0);
});

test('sem reserva definida, recomenda planejamento sem dizer que a folga foi guardada', async ({ page }) => {
  await page.route('**/metas', route => route.fulfill({ json: [] }));
  await page.route('http://localhost:8080/simulacoes', route => route.fulfill({ json: {
    meses: 1, saldoInicial: 0, saldoFinalProjetado: 1200,
    classificacaoFinal: 'SAUDAVEL', situacaoAtual: capacidade,
    totalReservaPlanejada: 0, totalAportadoMetas: 0,
    evolucaoMensal: [{ indiceMes: 1, mesReferencia: '2026-12',
      margemMensal: 1200, reservaPlanejada: 0, rendaMensal: 2000,
      gastosMensais: 800, aporteMetasBase: 0, aporteExtraMetas: 0 }],
    projecoesMetas: [],
  } }));
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('Neste cenário não há valor destinado à reserva', { exact: false })).toBeVisible();
  await expect(page.getByText('Não representam depósitos confirmados nem rendimentos', { exact: false })).toBeVisible();
});


test('período aceita digitar 24 meses sem reduzir a 1 e rejeita valores fora do limite', async ({ page }) => {
  const enviados = [];
  await page.route('http://localhost:8080/simulacoes', async route => {
    const payload = route.request().postDataJSON();
    enviados.push(payload);
    await route.fulfill({ json: {
      meses: payload.meses, situacaoAtual: capacidade,
      totalReservaPlanejada: payload.meses * 300, totalAportadoMetas: 0,
      evolucaoMensal: Array.from({ length: payload.meses }, (_, i) => ({
        indiceMes: i + 1, mesReferencia: '2027-' + String(i % 12 + 1).padStart(2, '0'),
        rendaMensal: 3000, gastosMensais: 1200, margemMensal: 1500,
        reservaPlanejada: 300, aporteMetasBase: 0, aporteExtraMetas: 0
      })),
      projecoesMetas: []
    } });
  });
  await page.goto('/simulacoes');
  const campo = page.getByLabel('Período da simulação (meses)');
  await campo.fill('');
  await expect(campo).toHaveValue('');
  await expect(page.getByRole('button', { name: '3. Ver o que aconteceria' })).toBeDisabled();
  await campo.fill('61');
  await expect(page.getByRole('button', { name: '3. Ver o que aconteceria' })).toBeDisabled();
  await campo.fill('24');
  await expect(campo).toHaveValue('24');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('24 meses analisados com as condições informadas.')).toBeVisible();
  expect(enviados).toHaveLength(2);
  expect(enviados[0].meses).toBe(24);
  expect(enviados[1].meses).toBe(24);
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await expect(campo).toHaveValue('3');
  await expect(page.getByText('24 meses analisados com as condições informadas.')).toHaveCount(0);
});

test('orçamento aceita moeda brasileira, mantém edição e envia valores numéricos', async ({ page }) => {
  let payload;
  await page.route('http://localhost:8080/orcamento', async route => {
    if (route.request().method() !== 'PUT') return route.fallback();
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { ...capacidade, rendaMensal: payload.rendaMensal, gastosMensais: payload.gastosMensais, reservaPlanejada: payload.valorPlanejadoGuardar } });
  });
  await page.goto('/planejamento');
  const renda = page.getByLabel('Renda mensal', { exact: true });
  await renda.fill('2.500,50');
  await page.getByLabel('Despesas mensais', { exact: true }).fill('1.200,25');
  await page.getByLabel('Valor mensal para a reserva').fill('300,10');
  await expect(renda).toHaveValue('2.500,50');
  await page.getByRole('button', { name: 'Salvar orçamento' }).click();
  await expect(page.getByRole('status')).toContainText('Orçamento salvo');
  expect(payload).toEqual({ rendaMensal: 2500.5, gastosMensais: 1200.25, valorPlanejadoGuardar: 300.1 });
});

test('orçamento não permite persistir valor inválido e permite continuar editando', async ({ page }) => {
  await page.goto('/planejamento');
  const reserva = page.getByLabel('Valor mensal para a reserva');
  await reserva.fill('inválido');
  await expect(page.getByRole('button', { name: 'Salvar orçamento' })).toBeDisabled();
  await reserva.fill('0');
  await expect(page.getByRole('button', { name: 'Salvar orçamento' })).toBeEnabled();
});

test('metas e planejamento continuam explicativos sem gráficos', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    const payload = route.request().postDataJSON();
    const isBase = payload.nomeCenario === 'Sem mudanças';
    await route.fulfill({ json: {
      meses: 3, situacaoAtual: capacidade, totalReservaPlanejada: 900,
      totalAportadoMetas: 600,
      evolucaoMensal: [500, 800, 1100].map((n, i) => ({
        indiceMes: i + 1, mesReferencia: '2027-0' + (i + 1),
        rendaMensal: 3000, gastosMensais: 1200, reservaPlanejada: 300,
        aporteMetasBase: 200, aporteExtraMetas: 0, margemMensal: 1300,
        metasProjetadas: [{ id: 1, nome: 'Notebook', valorAlvo: 3000, valorProjetado: isBase ? n : n + 100 }]
      })),
      projecoesMetas: [{ id: 1, nome: 'Notebook', valorAtual: 300, valorAlvo: 3000,
        valorProjetado: isBase ? 1100 : 1200, progressoProjetadoPercentual: 40,
        concluidaNoPeriodo: false, impacto: 'Progresso projetado' }]
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByRole('heading', { name: 'O que acontecerá com suas metas?' })).toBeVisible();
  await expect(page.getByText('40% do objetivo')).toBeVisible();
  await expect(page.getByText('R$ 1.200,00', { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId('resumo-meta').first().getByText('Ainda faltaria').first()).toBeVisible();
  await expect(page.getByTestId('diferenca-meta')).toContainText('R$ 100,00');
  await expect(page.getByTestId('mudancas-relevantes')).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /Gráfico de/ })).toHaveCount(0);
});


test('histórico do chatbot permanece ao navegar e atualizar, mas pode ser apagado', async ({ page }) => {
  await page.route('**/ia/status', route => route.fulfill({ json: { configurada: true } }));
  await page.route('**/ia/perguntar', route => route.fulfill({ json: {
    resposta: 'Sua reserva deve considerar renda, despesas e metas.'
  } }));
  await page.goto('/insights');
  await page.getByLabel('Sua pergunta para a FinIA').fill('Como planejar minha reserva?');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();

  const log = page.getByRole('log', { name: 'Mensagens da conversa' });
  await expect(log).toContainText('Como planejar minha reserva?');
  await expect(log).toContainText('Sua reserva deve considerar renda, despesas e metas.');

  await page.getByRole('link', { name: 'Abrir meu orçamento' }).click();
  await expect(page).toHaveURL(/\/planejamento$/);
  await page.goBack();
  await expect(log).toContainText('Como planejar minha reserva?');
  await expect(log).toContainText('Sua reserva deve considerar renda, despesas e metas.');

  await page.reload();
  await expect(log).toContainText('Como planejar minha reserva?');
  await expect(log).toContainText('Sua reserva deve considerar renda, despesas e metas.');

  await page.getByRole('button', { name: 'Limpar conversa' }).click();
  await expect(log).not.toContainText('Como planejar minha reserva?');
  await page.reload();
  await expect(log).not.toContainText('Sua reserva deve considerar renda, despesas e metas.');
});

test('histórico do chatbot não é compartilhado automaticamente com outra aba', async ({ page }) => {
  await page.route('**/ia/status', route => route.fulfill({ json: { configurada: true } }));
  await page.route('**/ia/perguntar', route => route.fulfill({ json: { resposta: 'Conversa temporária.' } }));
  await page.goto('/insights');
  await page.getByLabel('Sua pergunta para a FinIA').fill('Pergunta da primeira aba.');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await expect(page.getByRole('log')).toContainText('Conversa temporária.');

  const segundaAba = await page.context().newPage();
  try {
    await segundaAba.goto('/insights');
    await expect(segundaAba.getByRole('log')).not.toContainText('Pergunta da primeira aba.');
  } finally {
    await segundaAba.close();
  }
});


test('compra pontual cabe no valor não comprometido e não repete orçamento mensal', async ({ page }) => {
  let chamadas = [];
  await page.route('http://localhost:8080/simulacoes', async route => {
    const pedido = route.request().postDataJSON();
    chamadas.push(pedido);
    const compra = pedido.nomeCenario === 'Compra pontual';
    const custo = compra ? 200 : 0;
    await route.fulfill({ json: {
      meses: 1, situacaoAtual: capacidade, totalReservaPlanejada: 100,
      totalAportadoMetas: 0, evolucaoMensal: [{
        indiceMes: 1, mesReferencia: '2026-12',
        rendaMensal: 2000, gastosMensais: 1600,
        reservaPlanejada: 100, aporteMetasBase: 0, aporteExtraMetas: 0,
        gastoExtraordinario: custo, margemMensal: 300 - custo, eventosAplicados: []
      }], projecoesMetas: []
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Compra pontual/ }).click();
  await expect(page.getByLabel('Período da simulação (meses)')).toHaveCount(0);
  await page.getByRole('spinbutton', { name: 'Valor da compra (despesa única)' }).fill('200');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('A compra cabe no valor disponível', { exact: false })).toBeVisible();
  await expect(page.getByTestId('disponivel-antes')).toContainText('R$ 300,00');
  await expect(page.getByTestId('disponivel-depois')).toContainText('R$ 100,00');
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Projeção de cada meta' })).toHaveCount(0);
  await expect(page.getByText('E a reserva e as metas?')).toBeVisible();
  expect(chamadas).toHaveLength(2);
  expect(chamadas.map(x => x.meses)).toEqual([1, 1]);
  expect(chamadas.find(x => x.nomeCenario === 'Compra pontual').eventos[0]).toEqual({
    mes: 1, tipo: 'GASTO_EXTRAORDINARIO', valor: 200
  });
});

test('compra pontual destaca o valor que falta sem reduzir metas automaticamente', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    const pedido = route.request().postDataJSON();
    const compra = pedido.nomeCenario === 'Compra pontual';
    const custo = compra ? 500 : 0;
    await route.fulfill({ json: {
      meses: 1, situacaoAtual: capacidade, totalReservaPlanejada: 100,
      totalAportadoMetas: 200, evolucaoMensal: [{
        indiceMes: 1, mesReferencia: '2026-12', rendaMensal: 2000,
        gastosMensais: 1400, reservaPlanejada: 100,
        aporteMetasBase: 200, aporteExtraMetas: 0,
        gastoExtraordinario: custo, margemMensal: 300 - custo
      }], projecoesMetas: [{ id: 1, nome: 'Notebook', valorAtual: 1000,
        valorProjetado: 1200, progressoProjetadoPercentual: 40, valorAlvo: 3000 }]
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Compra pontual/ }).click();
  await page.getByRole('spinbutton', { name: 'Valor da compra (despesa única)' }).fill('500');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('A compra supera o valor disponível', { exact: false })).toBeVisible();
  await expect(page.getByTestId('disponivel-depois')).toContainText('-R$ 200,00');
  await expect(page.getByText('R$ 200,00', { exact: false }).last()).toBeVisible();
  await expect(page.getByText('não reduz automaticamente os valores planejados', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Projeção de cada meta' })).toHaveCount(0);
});

test('compra não é classificada como viável quando orçamento já estava negativo', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    const compra = route.request().postDataJSON().nomeCenario === 'Compra pontual';
    await route.fulfill({ json: {
      meses: 1, situacaoAtual: capacidade,
      evolucaoMensal: [{ indiceMes: 1, mesReferencia: '2026-12', margemMensal: compra ? -600 : -100,
        gastoExtraordinario: compra ? 500 : 0 }], projecoesMetas: []
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Compra pontual/ }).click();
  await page.getByRole('spinbutton', { name: 'Valor da compra (despesa única)' }).fill('500');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('já não cobria os compromissos', { exact: false })).toBeVisible();
  await expect(page.getByTestId('disponivel-antes')).toContainText('-R$ 100,00');
  await expect(page.getByTestId('disponivel-depois')).toContainText('-R$ 600,00');
});

test('simulações de renda apresentam resultado da mudança sem tabela repetida', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    const pedido = route.request().postDataJSON();
    const novaRenda = pedido.nomeCenario === 'Aumento de renda' ? 3500 : 3000;
    await route.fulfill({ json: {
      meses: 3, situacaoAtual: capacidade, totalReservaPlanejada: 900,
      totalAportadoMetas: 600, evolucaoMensal: [1, 2, 3].map((i) => ({
        indiceMes: i, mesReferencia: '2027-0' + i,
        rendaMensal: novaRenda, gastosMensais: 1200,
        reservaPlanejada: 300, aporteMetasBase: 200,
        margemMensal: novaRenda - 1700
      })), projecoesMetas: []
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Aumento de renda/ }).click();
  await page.getByRole('spinbutton', { name: 'Nova renda mensal total' }).fill('3500');
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('Variação mensal')).toBeVisible();
  await expect(page.getByText('R$ 500,00', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});


test('chat usa apenas as mensagens anteriores para entender continuação e limpa o contexto', async ({ page }) => {
  const pedidos = [];
  await page.route('http://localhost:8080/ia/status', route => route.fulfill({ json: { configurada: true } }));
  await page.route('http://localhost:8080/ia/perguntar', async route => {
    const pedido = route.request().postDataJSON();
    pedidos.push(pedido);
    await route.fulfill({ json: { resposta: 'Resposta ' + pedidos.length } });
  });

  await page.goto('/insights');
  const entrada = page.getByLabel('Sua pergunta para a FinIA');
  await entrada.fill('Como posso guardar mais?');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await expect(page.getByRole('log')).toContainText('Resposta 1');
  await entrada.fill('E se forem 100 reais a mais?');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await expect(page.getByRole('log')).toContainText('Resposta 2');

  expect(pedidos[0]).toEqual({ pergunta: 'Como posso guardar mais?', historico: [] });
  expect(pedidos[1]).toEqual({
    pergunta: 'E se forem 100 reais a mais?',
    historico: [
      { tipo: 'usuario', texto: 'Como posso guardar mais?' },
      { tipo: 'finia', texto: 'Resposta 1' },
    ]
  });

  await page.getByRole('button', { name: 'Limpar conversa' }).click();
  await entrada.fill('Outra pergunta');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await expect(page.getByRole('log')).toContainText('Resposta 3');
  expect(pedidos[2]).toEqual({ pergunta: 'Outra pergunta', historico: [] });
});

test('compra analisa o mês mas informa insuficiência de saldo informado para pagar hoje', async ({ page }) => {
  await page.route('http://localhost:8080/analise/capacidade-gastos', route =>
    route.fulfill({ json: { ...capacidade, saldoAtual: 100 } })
  );
  await page.route('http://localhost:8080/simulacoes', async route => {
    const compra = route.request().postDataJSON().nomeCenario === 'Compra pontual';
    await route.fulfill({ json: {
      meses: 1, situacaoAtual: { ...capacidade, saldoAtual: 100 },
      evolucaoMensal: [{ indiceMes: 1, mesReferencia: '2026-12',
        gastoExtraordinario: compra ? 200 : 0, margemMensal: compra ? 100 : 300 }],
      projecoesMetas: []
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Compra pontual/ }).click();
  await page.getByRole('spinbutton', { name: 'Valor da compra (despesa única)' }).fill('200');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('A compra cabe no valor disponível', { exact: false })).toBeVisible();
  await expect(page.getByText('O saldo informado atualmente é de R$ 100,00', { exact: false })).toBeVisible();
});

test('meta explica que prazo começa agora e aportes não podem duplicar a reserva', async ({ page }) => {
  await page.goto('/metas');
  await expect(page.getByText('Prazo a partir de agora (meses)')).toBeVisible();
  await expect(page.getByText('não inclua o mesmo aporte mensal na reserva geral', { exact: false })).toBeVisible();
});


test('orçamento estável com R$ 1,27 livres não repete seis linhas e destaca risco real', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    await route.fulfill({ json: {
      meses: 6, situacaoAtual: capacidade, totalReservaPlanejada: 1800,
      totalAportadoMetas: 10192.38, evolucaoMensal: Array.from({ length: 6 }, (_, i) => ({
        indiceMes: i + 1, mesReferencia: ['2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05'][i],
        rendaMensal: 3000, rendaExtraordinaria: 0, gastosMensais: 1000, gastoExtraordinario: 0,
        reservaPlanejada: 300, aporteMetasBase: 1698.73, aporteExtraMetas: 0,
        margemMensal: 1.27, eventosAplicados: []
      })), projecoesMetas: []
    }});
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByTestId('mudancas-relevantes')).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByTestId('alerta-margem-pequena')).toContainText('R$ 1,27');
  await expect(page.getByText('Menor valor disponível em um mês')).toBeVisible();
  await expect(page.getByText('Soma dos valores mensais disponíveis')).toHaveCount(0);
});

test('mudança em um único mês destaca apenas o acontecimento e não todos os meses iguais', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    const base = route.request().postDataJSON().nomeCenario === 'Sem mudanças';
    await route.fulfill({ json: {
      meses: 4, situacaoAtual: capacidade, totalReservaPlanejada: 1200,
      totalAportadoMetas: 0, evolucaoMensal: [1, 2, 3, 4].map((i) => {
        const custo = !base && i === 3 ? 400 : 0;
        return {
          indiceMes: i, mesReferencia: '2027-0' + i, rendaMensal: 3000,
          gastosMensais: 1200, gastoExtraordinario: custo, reservaPlanejada: 300,
          aporteMetasBase: 0, aporteExtraMetas: 0, margemMensal: 1500 - custo,
          eventosAplicados: custo ? ['Despesa extraordinária prevista'] : [],
        };
      }), projecoesMetas: []
    }});
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Planejamento personalizado/ }).click();
  await page.getByLabel('Período da simulação (meses)').fill('4');
  // Cenário personalizado pode ter eventos únicos; configuramos pela interface.
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  const marcos = page.getByTestId('mudancas-relevantes');
  await expect(marcos).toBeVisible();
  await expect(marcos.locator('ol > li')).toHaveCount(2);
  await expect(marcos).toContainText('mar/27');
  await expect(marcos).toContainText('abr/27');
  await expect(marcos).not.toContainText('fev/27');
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('conclusão de meta vira marco mesmo com orçamento igual nos meses anteriores', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    await route.fulfill({ json: {
      meses: 3, situacaoAtual: capacidade, totalReservaPlanejada: 900,
      totalAportadoMetas: 200,
      evolucaoMensal: [1, 2, 3].map((i) => ({
        indiceMes: i, mesReferencia: '2027-0' + i, rendaMensal: 3000,
        gastosMensais: 1200, reservaPlanejada: 300,
        aporteMetasBase: i === 1 ? 200 : 0, aporteExtraMetas: 0,
        margemMensal: i === 1 ? 1300 : 1500
      })),
      projecoesMetas: [{
        id: 1, nome: 'Notebook', valorAtual: 800, valorAlvo: 1000,
        valorProjetado: 1000, progressoProjetadoPercentual: 100,
        concluidaNoPeriodo: true, mesConclusaoReferencia: '2027-01',
        impacto: 'Meta concluída no cenário'
      }]
    }});
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  const marcos = page.getByTestId('mudancas-relevantes');
  await expect(marcos).toContainText('Meta Notebook: valor-alvo previsto para este mês');
  await expect(marcos).toContainText('fev/27');
  await expect(page.getByRole('heading', { name: 'O que acontecerá com suas metas?' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});


test('meta iniciada em zero mostra só previsão, restante e percentual sem blocos redundantes', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    await route.fulfill({ json: {
      meses: 6, situacaoAtual: capacidade, totalReservaPlanejada: 1800,
      totalAportadoMetas: 10192.38,
      evolucaoMensal: Array.from({ length: 6 }, (_, index) => ({
        indiceMes: index + 1, mesReferencia: '2027-0' + (index + 1),
        rendaMensal: 3000, gastosMensais: 1000,
        reservaPlanejada: 300, aporteMetasBase: 1698.73,
        aporteExtraMetas: 0, margemMensal: 1.27,
      })),
      projecoesMetas: [
        { id: 1, nome: 'oi', valorAtual: 0, valorAlvo: 100000,
          valorProjetado: 7692.36, progressoProjetadoPercentual: 7.7,
          concluidaNoPeriodo: false, impacto: 'A meta avançaria R$ 7692.36 durante o período simulado.' },
        { id: 2, nome: 'teste', valorAtual: 0, valorAlvo: 5000,
          valorProjetado: 2500.02, progressoProjetadoPercentual: 50,
          concluidaNoPeriodo: false, impacto: 'A meta avançaria R$ 2500.02 durante o período simulado.' },
      ]
    }});
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  const cartoes = page.getByTestId('resumo-meta');
  await expect(cartoes).toHaveCount(2);
  await expect(cartoes.nth(0)).toContainText('R$ 7.692,36');
  await expect(cartoes.nth(0)).toContainText('R$ 92.307,64');
  await expect(cartoes.nth(0)).toContainText('7,7% do objetivo');
  await expect(cartoes.nth(1)).toContainText('R$ 2.500,02');
  await expect(cartoes.nth(1)).toContainText('R$ 2.499,98');
  await expect(cartoes.nth(1)).toContainText('50% do objetivo');
  await expect(page.getByText('Hoje', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Depois', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Sem mudanças:', { exact: false })).toHaveCount(0);
  await expect(page.getByText('A meta avançaria', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Aportes previstos neste período', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Atualizar o valor guardado em Metas' })).toHaveAttribute('href', '/metas');
});

test('comparação de meta só aparece quando cenário realmente altera a previsão', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    const base = route.request().postDataJSON().nomeCenario === 'Sem mudanças';
    await route.fulfill({ json: {
      meses: 3, situacaoAtual: capacidade, totalReservaPlanejada: 900,
      totalAportadoMetas: 600,
      evolucaoMensal: [1, 2, 3].map((i) => ({
        indiceMes: i, mesReferencia: '2027-0' + i,
        rendaMensal: 3000, gastosMensais: 1200, reservaPlanejada: 300,
        aporteMetasBase: 200, margemMensal: 1300,
      })),
      projecoesMetas: [
        { id: 1, nome: 'Meta com mudança', valorAtual: 200, valorAlvo: 4000,
          valorProjetado: base ? 1000 : 1200, concluidaNoPeriodo: false },
        { id: 2, nome: 'Meta sem mudança', valorAtual: 0, valorAlvo: 10000,
          valorProjetado: 2000, concluidaNoPeriodo: false },
      ],
    }});
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  const cartoes = page.getByTestId('resumo-meta');
  await expect(cartoes).toHaveCount(2);
  await expect(cartoes.nth(0).getByTestId('diferenca-meta')).toContainText('R$ 200,00');
  await expect(cartoes.nth(1).getByTestId('diferenca-meta')).toHaveCount(0);
  await expect(cartoes.nth(0)).toContainText('Aportes previstos neste período');
  await expect(cartoes.nth(1)).not.toContainText('Aportes previstos neste período');
});


test('mudança no prazo de conclusão importa mesmo com valor final igual', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    const base = route.request().postDataJSON().nomeCenario === 'Sem mudanças';
    await route.fulfill({ json: {
      meses: 6, situacaoAtual: capacidade,
      evolucaoMensal: Array.from({ length: 6 }, (_, i) => ({
        indiceMes: i + 1, mesReferencia: '2027-0' + (i + 1),
        rendaMensal: 3000, gastosMensais: 1200, margemMensal: 1000,
      })),
      projecoesMetas: [{
        id: 1, nome: 'Curso', valorAtual: 0, valorAlvo: 5000,
        valorProjetado: 5000, progressoProjetadoPercentual: 100,
        concluidaNoPeriodo: true,
        mesConclusaoReferencia: base ? '2027-04' : '2027-02'
      }]
    }});
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  const cartao = page.getByTestId('resumo-meta');
  await expect(cartao).toContainText('R$ 5.000,00');
  await expect(cartao.getByTestId('diferenca-meta')).toHaveCount(0);
  await expect(cartao.getByTestId('diferenca-prazo-meta')).toContainText('antecipada de abr/27 para fev/27');
});


test('aporte adicional mostra o mínimo já previsto e não soma duas vezes', async ({ page }) => {
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Aporte adicional para uma meta/ }).click();
  await expect(page.getByTestId('aporte-minimo-meta')).toContainText('R$ 200,00');
  await expect(page.getByText('Restante da meta:', { exact: false })).toContainText('R$ 2.000,00');
  await page.getByRole('spinbutton', { name: 'Quanto deseja adicionar por mês?' }).fill('100');
  await expect(page.getByText('Aporte total mensal para esta meta:', { exact: false })).toContainText('R$ 300,00');
  await expect(page.getByText('já está incluído no orçamento', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await expect(page.getByTestId('extra-necessario-periodo')).toContainText('R$ 466,67');
  await page.getByRole('button', { name: 'Usar valor necessário para o período' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Quanto deseja adicionar por mês?' })).toHaveValue('466.67');
  await expect(page.getByText('Aporte total mensal para esta meta:', { exact: false })).toContainText('R$ 666,67');
});

test('redução de renda adapta aportes por escolha e mostra marcos das metas', async ({ page }) => {
  const pedidos = [];
  await page.route('http://localhost:8080/simulacoes', async route => {
    const pedido = route.request().postDataJSON();
    pedidos.push(pedido);
    const base = pedido.nomeCenario === 'Sem mudanças';
    const adapta = pedido.ajustarAportesAoOrcamento === true;
    const renda = base ? 3000 : 1600;
    const aporte = adapta ? 100 : 200;
    const final = 1000 + aporte * 3;
    await route.fulfill({ json: {
      meses: 3, situacaoAtual: capacidade, totalReservaPlanejada: 900,
      totalAportadoMetas: aporte * 3,
      evolucaoMensal: [1,2,3].map(i => ({
        indiceMes: i, mesReferencia: '2027-0' + i,
        rendaMensal: renda, gastosMensais: 1200,
        reservaPlanejada: 300, aporteMetasBase: aporte,
        margemMensal: renda - 1500 - aporte,
        metasProjetadas: [{ id: 1, nome: 'Notebook', valorAlvo: 3000,
          valorProjetado: 1000 + aporte * i }]
      })),
      projecoesMetas: [{
        id: 1, nome: 'Notebook', valorAtual: 1000, valorAlvo: 3000,
        valorProjetado: final, concluidaNoPeriodo: false
      }]
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Redução de renda/ }).click();
  await page.getByRole('spinbutton', { name: 'Nova renda mensal total' }).fill('1600');
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await expect(page.getByLabel('Adaptar os aportes das metas à renda disponível')).toBeChecked();
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByTestId('evolucao-metas-renda')).toBeVisible();
  await expect(page.getByTestId('evolucao-meta-renda')).toContainText('R$ 1.300,00');
  await expect(page.getByTestId('evolucao-meta-renda')).toContainText('jan/27');
  await expect(page.getByTestId('impacto-renda-meta')).toContainText('R$ 300,00');
  expect(pedidos.find(p => p.nomeCenario === 'Redução de renda').ajustarAportesAoOrcamento).toBe(true);
  await page.getByLabel('Adaptar os aportes das metas à renda disponível').uncheck();
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByTestId('evolucao-meta-renda')).toContainText('R$ 1.600,00');
  expect(pedidos.filter(p => p.nomeCenario === 'Redução de renda').at(-1).ajustarAportesAoOrcamento).toBeUndefined();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('aumento de renda só acelera meta quando aporte extra é escolhido', async ({ page }) => {
  const pedidos = [];
  await page.route('http://localhost:8080/simulacoes', async route => {
    const pedido = route.request().postDataJSON();
    pedidos.push(pedido);
    const extra = pedido.nomeCenario !== 'Sem mudanças' ? Number(pedido.aporteExtraMetasMensal || 0) : 0;
    const aporte = 200 + extra;
    await route.fulfill({ json: {
      meses: 3, situacaoAtual: capacidade, totalReservaPlanejada: 900,
      totalAportadoMetas: aporte * 3,
      evolucaoMensal: [1,2,3].map(i => ({
        indiceMes: i, mesReferencia: '2027-0' + i, rendaMensal: 3500,
        gastosMensais: 1200, reservaPlanejada: 300, aporteMetasBase: 200,
        aporteExtraMetas: extra, margemMensal: 2000 - aporte,
        metasProjetadas: [{ id: 1, nome: 'Notebook', valorAlvo: 3000,
          valorProjetado: 1000 + aporte * i }]
      })),
      projecoesMetas: [{ id: 1, nome: 'Notebook', valorAtual: 1000,
        valorAlvo: 3000, valorProjetado: 1000 + aporte * 3,
        concluidaNoPeriodo: false }]
    } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Aumento de renda/ }).click();
  await page.getByRole('spinbutton', { name: 'Nova renda mensal total' }).fill('3500');
  await page.getByRole('button', { name: '3 meses', exact: true }).click();
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByTestId('evolucao-metas-renda')).toContainText('As metas seguem no ritmo atual');
  await page.getByLabel('Usar parte do aumento da renda para antecipar uma meta').check();
  await page.getByRole('spinbutton', { name: 'Valor extra mensal destinado à meta' }).fill('150');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByTestId('evolucao-meta-renda')).toContainText('R$ 2.050,00');
  await expect(page.getByTestId('impacto-renda-meta')).toContainText('R$ 450,00');
  expect(pedidos.filter(p => p.nomeCenario === 'Aumento de renda').at(-1).aporteExtraMetasMensal).toBe(150);
  expect(pedidos.filter(p => p.nomeCenario === 'Aumento de renda').at(-1).metaPrioritariaId).toBe(1);
  await expect(page.getByRole('table')).toHaveCount(0);
});


test('análise da renda distribui resumo e duas metas sem comprimir os cartões no desktop ou celular', async ({ page }) => {
  await page.route('http://localhost:8080/simulacoes', async route => {
    const pedido = route.request().postDataJSON();
    const renda = pedido.nomeCenario === 'Sem mudanças' ? 3000 : 5000;
    await route.fulfill({ json: {
      meses: 6, situacaoAtual: capacidade, totalReservaPlanejada: 1800,
      totalAportadoMetas: 10192.38,
      evolucaoMensal: Array.from({ length: 6 }, (_, i) => ({
        indiceMes: i + 1,
        mesReferencia: ['2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05'][i],
        rendaMensal: renda, gastosMensais: 1000, reservaPlanejada: 300,
        aporteMetasBase: 1698.73, aporteExtraMetas: 0,
        margemMensal: renda - 2998.73,
        metasProjetadas: [
          { id: 1, nome: 'oi', valorAlvo: 100000, valorProjetado: 1282.06 * (i + 1) },
          { id: 2, nome: 'teste', valorAlvo: 5000, valorProjetado: 416.67 * (i + 1) },
        ],
      })),
      projecoesMetas: [
        { id: 1, nome: 'oi', valorAtual: 0, valorAlvo: 100000, valorProjetado: 7692.36, concluidaNoPeriodo: false },
        { id: 2, nome: 'teste', valorAtual: 0, valorAlvo: 5000, valorProjetado: 2500.02, concluidaNoPeriodo: false },
      ],
    } });
  });

  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Aumento de renda/ }).click();
  await page.getByRole('spinbutton', { name: 'Nova renda mensal total' }).fill('5000');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();

  const resumo = page.getByTestId('analise-cenario');
  const metas = page.getByTestId('evolucao-metas-renda');
  const cartoes = page.getByTestId('evolucao-meta-renda');

  await expect(page.getByTestId('resumo-renda')).toBeVisible();
  await expect(page.getByTestId('variacao-renda')).toContainText('R$');
  await expect(metas).toBeVisible();
  await expect(cartoes).toHaveCount(2);
  await expect(cartoes.nth(0)).toContainText('R$ 7.692,36');
  await expect(cartoes.nth(1)).toContainText('R$ 2.500,02');
  await expect(resumo.getByTestId('evolucao-metas-renda')).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);

  const painel = await resumo.boundingBox();
  const secaoMetas = await metas.boundingBox();
  const primeiro = await cartoes.nth(0).boundingBox();
  const segundo = await cartoes.nth(1).boundingBox();
  expect(painel && secaoMetas && primeiro && segundo).toBeTruthy();
  expect(secaoMetas.y).toBeGreaterThanOrEqual(painel.y + painel.height - 2);

  if (page.viewportSize()?.width >= 1200) {
    expect(secaoMetas.width).toBeGreaterThan(painel.width * 1.4);
    expect(Math.abs(primeiro.y - segundo.y)).toBeLessThan(3);
  } else {
    expect(segundo.y).toBeGreaterThan(primeiro.y);
  }

  const semRolagemHorizontal = await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 2
  );
  expect(semRolagemHorizontal).toBe(true);
});
