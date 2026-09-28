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
  await page.route('**/simulacoes', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { meses: payload.meses, saldoInicial: 1500, saldoFinalProjetado: 4000, variacaoSaldo: 2500, classificacaoFinal: 'SAUDAVEL', evolucaoMensal: [], projecoesMetas: [] } });
  });
  await page.goto('/simulacoes');
  await page.getByRole('button', { name: /Cenário personalizado/ }).click();
  await page.getByRole('button', { name: 'Adicionar evento' }).click();
  await page.getByLabel('Valor do evento').fill('500');
  await page.getByLabel('Mês do evento').fill('2');
  await page.getByRole('button', { name: '3. Ver o que aconteceria' }).click();
  await expect(page.getByText('6 meses simulados')).toBeVisible();
  expect(payload.eventos).toEqual([{ mes: 2, tipo: 'RENDA_EXTRAORDINARIA', valor: 500 }]);
  await page.getByRole('button', { name: '12m', exact: true }).click();
  await expect(page.getByText('6 meses simulados')).toHaveCount(0);
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
