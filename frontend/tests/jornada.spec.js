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
  await page.getByRole('button', { name: /Cenário personalizado/ }).click();
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
  await expect(page.getByText('Os compromissos ultrapassam a renda.', { exact: false })).toBeVisible();
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
  await expect(page.getByRole('img', { name: 'Gráfico de disponível por mês' })).toBeVisible();
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
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();

  await expect(page.getByRole('img', { name: 'Gráfico de disponível por mês' })).toBeVisible();
  await expect(page.getByText('O orçamento ficaria negativo em 1 de 3 meses.')).toBeVisible();
  await page.getByLabel('Mês para detalhar').selectOption('1');
  await expect(page.getByTestId('impacto-cenario')).toContainText('R$ 0,00');
  await page.getByLabel('Mês para detalhar').selectOption('2');
  await expect(page.getByTestId('impacto-cenario')).toContainText('-R$ 500,00');

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
  await expect(page.getByText('Você não tem metas cadastradas.', { exact: false })).toBeVisible();
  await expect(page.getByText('R$ 1.500,00', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Reserva planejada' }).click();
  await expect(page.getByTestId('impacto-cenario')).toContainText('+R$ 1.500,00');
  await expect(page.getByRole('button', { name: 'Aportes para metas' })).toHaveCount(0);
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
  await expect(page.getByText('A folga acumulada é a soma das margens mensais', { exact: false })).toBeVisible();
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

test('evolução de metas utiliza valores mensais fornecidos pelo backend', async ({ page }) => {
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
  await expect(page.getByRole('img', { name: 'Gráfico de evolução das metas' })).toBeVisible();
  await page.getByLabel('Mês do progresso da meta').selectOption('2');
  await expect(page.getByText('R$ 900,00', { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId('comparacao-meta')).toContainText('R$ 100,00');
});
