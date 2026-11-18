import { useState } from "react";
import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const LARGURA = 760;
const ALTURA = 260;
const ESQUERDA = 100;
const DIREITA = 20;
const TOPO = 22;
const BASE = 219;

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function valorDoEixo(valor) {
  const absoluto = Math.abs(valor);
  const formatar = (numero) => numero.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  if (absoluto >= 1000000) return "R$ " + formatar(valor / 1000000) + " mi";
  if (absoluto >= 1000) return "R$ " + formatar(valor / 1000) + " mil";
  return formatarMoeda(valor);
}

/**
 * Apresenta a projeção recebida da API, comparada à mesma simulação sem eventos.
 * O eixo vertical se ajusta aos valores para que pequenas variações sejam visíveis.
 * A escala não começa necessariamente em zero; os valores exatos são exibidos abaixo.
 */
export default function GraficoSaldoComparativo({ dados, comparacao, saldoInicial }) {
  const [mesSelecionado, setMesSelecionado] = useState(dados.length || 1);

  if (!dados.length) {
    return <p className="mt-6 text-sm text-slate-500">Não há dados mensais para desenhar o gráfico.</p>;
  }

  const temComparacao = Array.isArray(comparacao) && comparacao.length === dados.length;
  const saldoDePartida = numeroSeguro(saldoInicial);
  const valoresSimulados = [saldoDePartida, ...dados.map((mes) => numeroSeguro(mes.saldoDisponivelProjetado))];
  const valoresSemMudancas = temComparacao
    ? [saldoDePartida, ...comparacao.map((mes) => numeroSeguro(mes.saldoDisponivelProjetado))]
    : [];

  const todosValores = [...valoresSimulados, ...valoresSemMudancas];
  const menorValor = Math.min(...todosValores);
  const maiorValor = Math.max(...todosValores);
  const margemEscala = Math.max(
    (maiorValor - menorValor) * 0.12,
    Math.max(Math.abs(menorValor), Math.abs(maiorValor), 1) * 0.01,
    0.5
  );
  const minimo = menorValor - margemEscala;
  const maximo = maiorValor + margemEscala;

  const x = (indice) => ESQUERDA + (indice / dados.length) * (LARGURA - ESQUERDA - DIREITA);
  const y = (valor) => TOPO + ((maximo - valor) / (maximo - minimo)) * (BASE - TOPO);
  const pontos = (valores) => valores.map((valor, indice) => x(indice) + "," + y(valor)).join(" ");

  const indice = Math.max(1, Math.min(dados.length, mesSelecionado));
  const mes = dados[indice - 1];
  const mesBase = temComparacao ? comparacao[indice - 1] : null;
  const saldoSimulado = valoresSimulados[indice];
  const saldoSemMudancas = temComparacao ? valoresSemMudancas[indice] : null;
  const diferenca = temComparacao ? saldoSimulado - saldoSemMudancas : null;
  const nomeMes = formatarMesReferencia(mes.mesReferencia);
  const sinal = (valor) => (valor > 0 ? "+" : "") + formatarMoeda(valor);
  const meio = (maximo + minimo) / 2;
  const linhasEixo = [maximo, meio, minimo];
  const zeroVisivel = minimo <= 0 && maximo >= 0;
  const descricao = "O saldo projetado para " + nomeMes + " é " + formatarMoeda(saldoSimulado)
    + (temComparacao ? "; sem mudanças, " + formatarMoeda(saldoSemMudancas) : "")
    + ". Consulte os detalhes numéricos abaixo do gráfico.";

  return (
    <figure className="finia-chart">
      <figcaption className="finia-chart-scale">
        <span>Saldo disponível projetado, mês a mês</span>
        <span>Escala ajustada aos valores (não começa necessariamente em zero)</span>
      </figcaption>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-600" aria-label="Legenda do gráfico">
        <span className="flex items-center gap-2"><span className="inline-block h-1 w-7 rounded bg-cyan-700" /> Cenário simulado</span>
        {temComparacao && (
          <span className="flex items-center gap-2"><span className="inline-block w-7 border-t-[3px] border-dashed border-slate-400" /> Sem mudanças</span>
        )}
      </div>

      <div className="mt-4 overflow-x-auto" tabIndex={0} aria-label="Área do gráfico; role horizontalmente em telas pequenas">
        <svg
          role="img"
          aria-label="Gráfico de evolução do saldo"
          viewBox={"0 0 " + LARGURA + " " + ALTURA}
          className="h-auto min-w-[540px] w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <title>Saldo disponível do cenário versus manutenção do orçamento</title>
          <desc>{descricao}</desc>

          {linhasEixo.map((marcador, posicao) => (
            <g key={posicao}>
              <line x1={ESQUERDA} x2={LARGURA - DIREITA} y1={y(marcador)} y2={y(marcador)}
                stroke="#e2e8f0" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
              <text x={ESQUERDA - 10} y={y(marcador) + 4} textAnchor="end" fontSize="11" fill="#475569">
                {valorDoEixo(marcador)}
              </text>
            </g>
          ))}

          {zeroVisivel && (
            <line x1={ESQUERDA} x2={LARGURA - DIREITA} y1={y(0)} y2={y(0)}
              stroke="#64748b" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
              <title>Saldo zero</title>
            </line>
          )}

          {temComparacao && (
            <polyline points={pontos(valoresSemMudancas)} fill="none" stroke="#94a3b8"
              strokeWidth="2.5" strokeDasharray="7 5" strokeLinecap="round" strokeLinejoin="round"
              vectorEffect="non-scaling-stroke" />
          )}

          <polyline points={pontos(valoresSimulados)} fill="none" stroke="#0e7490"
            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            vectorEffect="non-scaling-stroke" />

          <line x1={x(indice)} x2={x(indice)} y1={TOPO} y2={BASE}
            stroke="#0891b2" strokeWidth="1" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
          {temComparacao && (
            <circle cx={x(indice)} cy={y(saldoSemMudancas)} r="5.5" fill="#94a3b8" stroke="white" strokeWidth="2" />
          )}
          <circle cx={x(indice)} cy={y(saldoSimulado)} r="6" fill="#0e7490" stroke="white" strokeWidth="2" />

          <text x={ESQUERDA} y={ALTURA - 7} fontSize="12" fill="#475569" textAnchor="middle">Hoje</text>
          <text x={LARGURA - DIREITA} y={ALTURA - 7} fontSize="12" fill="#475569" textAnchor="end">
            {formatarMesReferencia(dados.at(-1).mesReferencia)}
          </text>
        </svg>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
          Mês para detalhar
          <select
            aria-label="Mês para detalhar"
            value={indice}
            onChange={(evento) => setMesSelecionado(Number(evento.target.value))}
            className="finia-input h-10 w-auto min-w-36 px-3"
          >
            {dados.map((item, posicao) => (
              <option key={item.indiceMes || posicao} value={posicao + 1}>
                {formatarMesReferencia(item.mesReferencia)} (mês {posicao + 1})
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs font-semibold text-slate-500">Valores de {nomeMes}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
        <div className="rounded-xl bg-cyan-50 p-4">
          <p className="text-xs font-bold text-cyan-800">Saldo no cenário</p>
          <p className="finia-number mt-1 text-lg font-extrabold text-cyan-900">{formatarMoeda(saldoSimulado)}</p>
        </div>
        {temComparacao && (
          <>
            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-xs font-bold text-slate-600">Saldo sem mudanças</p>
              <p className="finia-number mt-1 text-lg font-extrabold text-slate-800">{formatarMoeda(saldoSemMudancas)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-600">Impacto no saldo disponível</p>
              <p data-testid="impacto-cenario" className={"finia-number mt-1 text-lg font-extrabold " + (diferenca < 0 ? "text-amber-800" : "text-cyan-800")}>
                {sinal(diferenca)}
              </p>
            </div>
          </>
        )}
      </div>

      {temComparacao ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {diferenca === 0
            ? "Neste mês, a decisão não altera o saldo disponível em relação a manter tudo como está."
            : "Em " + nomeMes + ", o cenário deixa " + formatarMoeda(Math.abs(diferenca))
              + (diferenca > 0 ? " a mais" : " a menos")
              + " no saldo disponível do que manter tudo como está."}
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">A referência sem mudanças não pôde ser carregada. O gráfico exibe somente o cenário simulado.</p>
      )}

      <p className="mt-2 text-xs leading-5 text-slate-500">
        A curva considera renda, gastos, reserva planejada e aportes às metas. Menor saldo disponível
        pode significar mais dinheiro reservado para uma meta, e não necessariamente uma situação financeira pior.
        {mes.eventosAplicados?.length > 0 ? " Eventos do mês: " + mes.eventosAplicados.join("; ") + "." : ""}
        {mesBase?.eventosAplicados?.length > 0 ? " A referência também possui eventos." : ""}
      </p>
    </figure>
  );
}
