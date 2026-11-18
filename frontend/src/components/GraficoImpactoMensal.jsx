import { useState } from "react";
import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const LARGURA = 760;
const ALTURA = 260;
const ESQUERDA = 96;
const DIREITA = 18;
const TOPO = 18;
const BASE = 210;

const indicadores = [
  { id: "margem", titulo: "Disponível por mês", explicacao: "Valor mensal restante após despesas, reserva planejada e aportes às metas. Não é o saldo de uma conta." },
  { id: "reserva", titulo: "Reserva planejada", explicacao: "Total previsto para separar mês a mês, sem rendimentos. Não inclui dinheiro que você já tinha." },
  { id: "metas", titulo: "Aportes para metas", explicacao: "Total previsto de contribuições às metas no período. Para ver o progresso de cada meta, utilize o gráfico específico abaixo." },
];

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function valoresDaSerie(meses, indicador) {
  let acumulado = 0;
  return meses.map((mes) => {
    if (indicador === "margem") return numero(mes.margemMensal);
    const aporte = indicador === "reserva"
      ? numero(mes.reservaPlanejada)
      : numero(mes.aporteMetasBase) + numero(mes.aporteExtraMetas);
    acumulado += aporte;
    return acumulado;
  });
}

function formatoEixo(valor) {
  const formatar = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  if (Math.abs(valor) >= 1000000) return "R$ " + formatar(valor / 1000000) + " mi";
  if (Math.abs(valor) >= 1000) return "R$ " + formatar(valor / 1000) + " mil";
  return formatarMoeda(valor);
}

export default function GraficoImpactoMensal({ dados = [], referencia = null, temMetas = false }) {
  const [indicador, setIndicador] = useState("margem");
  const [mesSelecionado, setMesSelecionado] = useState(dados.length || 1);

  if (!dados.length) return <p className="mt-5 text-sm text-slate-500">Não há meses disponíveis para exibir.</p>;

  const temReferencia = Array.isArray(referencia) && referencia.length === dados.length;
  const opcoes = temMetas ? indicadores : indicadores.filter((item) => item.id !== "metas");
  const atual = indicadores.find((item) => item.id === indicador) || indicadores[0];
  const valores = valoresDaSerie(dados, indicador);
  const valoresBase = temReferencia ? valoresDaSerie(referencia, indicador) : [];
  const todos = [0, ...valores, ...valoresBase];
  const minimoOriginal = Math.min(...todos);
  const maximoOriginal = Math.max(...todos);
  const intervalo = maximoOriginal - minimoOriginal;
  const margem = Math.max(intervalo * 0.1, Math.abs(maximoOriginal) * 0.04, 1);
  const minimo = minimoOriginal - margem;
  const maximo = maximoOriginal + margem;
  const x = (indice) => dados.length === 1
    ? (ESQUERDA + LARGURA - DIREITA) / 2
    : ESQUERDA + indice / (dados.length - 1) * (LARGURA - ESQUERDA - DIREITA);
  const y = (valor) => TOPO + (maximo - valor) / (maximo - minimo) * (BASE - TOPO);
  const pontos = (serie) => serie.map((valor, index) => x(index) + "," + y(valor)).join(" ");

  const indice = Math.max(0, Math.min(dados.length - 1, mesSelecionado - 1));
  const mes = dados[indice];
  const valorCenario = valores[indice];
  const valorBase = temReferencia ? valoresBase[indice] : null;
  const impacto = temReferencia ? valorCenario - valorBase : null;
  const nomeMes = formatarMesReferencia(mes.mesReferencia);
  const formatoDiferenca = (n) => (n > 0 ? "+" : "") + formatarMoeda(n);
  const linhas = [maximoOriginal, (minimoOriginal + maximoOriginal) / 2, minimoOriginal];

  return (
    <figure className="finia-chart">
      <figcaption className="text-base font-extrabold text-slate-800">Impacto da decisão ao longo dos meses</figcaption>
      <p className="mt-1 text-xs leading-5 text-slate-500">{atual.explicacao}</p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Informação exibida no gráfico">
        {opcoes.map((opcao) => (
          <button key={opcao.id} type="button" aria-pressed={indicador === opcao.id}
            onClick={() => setIndicador(opcao.id)}
            className={"rounded-lg border px-3 py-2 text-xs font-bold transition " +
              (indicador === opcao.id ? "border-cyan-700 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
            {opcao.titulo}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-2"><span className="h-1 w-6 rounded bg-cyan-700" /> Sua simulação</span>
        {temReferencia && <span className="flex items-center gap-2"><span className="w-6 border-t-[3px] border-dashed border-slate-400" /> Sem mudanças</span>}
      </div>

      <div className="mt-3 overflow-x-auto" tabIndex={0} aria-label="Visualização do gráfico">
        <svg role="img" aria-label={"Gráfico de " + atual.titulo.toLowerCase()}
          viewBox={"0 0 " + LARGURA + " " + ALTURA}
          preserveAspectRatio="xMidYMid meet" className="h-auto min-w-[500px] w-full">
          <title>{atual.titulo}: cenário simulado comparado ao orçamento sem mudanças</title>
          <desc>{nomeMes + ": " + formatarMoeda(valorCenario)
            + (temReferencia ? "; cenário sem mudanças: " + formatarMoeda(valorBase) : "")
            + ". Valores por mês disponíveis abaixo."}</desc>
          {linhas.map((valor, index) => (
            <g key={index}>
              <line x1={ESQUERDA} x2={LARGURA - DIREITA} y1={y(valor)} y2={y(valor)}
                stroke="#e2e8f0" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
              <text x={ESQUERDA - 10} y={y(valor) + 4} textAnchor="end" fontSize="11" fill="#475569">{formatoEixo(valor)}</text>
            </g>
          ))}
          <line x1={ESQUERDA} x2={LARGURA - DIREITA} y1={y(0)} y2={y(0)}
            stroke="#64748b" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
          {temReferencia && (
            <polyline points={pontos(valoresBase)} fill="none" stroke="#94a3b8" strokeWidth="3"
              strokeDasharray="7 5" vectorEffect="non-scaling-stroke" />
          )}
          <polyline points={pontos(valores)} fill="none" stroke="#0e7490"
            strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <line x1={x(indice)} x2={x(indice)} y1={TOPO} y2={BASE}
            stroke="#0891b2" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
          {temReferencia && <circle cx={x(indice)} cy={y(valorBase)} r="5.5" fill="#94a3b8" stroke="white" strokeWidth="2" />}
          <circle cx={x(indice)} cy={y(valorCenario)} r="6" fill="#0e7490" stroke="white" strokeWidth="2" />
          <text x={ESQUERDA} y={ALTURA - 9} textAnchor="start" fontSize="12" fill="#475569">
            {formatarMesReferencia(dados[0].mesReferencia)}
          </text>
          {dados.length > 1 && <text x={LARGURA - DIREITA} y={ALTURA - 9} textAnchor="end" fontSize="12" fill="#475569">
            {formatarMesReferencia(dados.at(-1).mesReferencia)}
          </text>}
        </svg>
      </div>

      <div className="mt-4">
        <label className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-700">
          Ver mês
          <select aria-label="Mês para detalhar" value={indice + 1}
            onChange={(event) => setMesSelecionado(Number(event.target.value))}
            className="finia-input h-11 w-auto min-w-40 px-3">
            {dados.map((item, index) => (
              <option key={item.indiceMes || index} value={index + 1}>
                {formatarMesReferencia(item.mesReferencia)} (mês {index + 1})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
        <Medida titulo="Na simulação" valor={formatarMoeda(valorCenario)} />
        {temReferencia && <>
          <Medida titulo="Sem mudanças" valor={formatarMoeda(valorBase)} />
          <Medida titulo="Mudança em relação ao orçamento atual" valor={formatoDiferenca(impacto)} teste="impacto-cenario" destaque={impacto < 0} />
        </>}
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700" aria-live="polite">
        <p className="font-extrabold">Interpretação de {nomeMes}</p>
        {indicador === "margem" ? (
          <p className="mt-1">
            {valorCenario < 0
              ? `As despesas e os valores planejados ultrapassariam a renda em ${formatarMoeda(Math.abs(valorCenario))} neste mês. Será necessário rever os compromissos ou a renda.`
              : valorCenario === 0
                ? "Toda a renda estaria comprometida neste mês. Não haveria margem para imprevistos."
                : `Após os compromissos, restariam ${formatarMoeda(valorCenario)} para gastos não planejados neste mês.`}
          </p>
        ) : (
          <p className="mt-1">
            Até este mês, o total de {indicador === "reserva" ? "reserva planejada" : "aportes planejados às metas"} seria de {formatarMoeda(valorCenario)}.
            Esse valor depende de cumprir o planejamento; não representa depósito realizado.
          </p>
        )}
        {temReferencia && impacto !== 0 && (
          <p className="mt-2">
            Diferença em relação ao planejamento atual: {formatoDiferenca(impacto)}.
            {indicador === "margem" && impacto < 0 && " Uma redução do valor livre pode ocorrer porque mais dinheiro foi destinado à reserva ou às metas."}
          </p>
        )}
        {mes.eventosAplicados?.length > 0 && (
          <p className="mt-2 text-xs text-slate-600">Alterações consideradas neste mês: {mes.eventosAplicados.join("; ")}.</p>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        O gráfico simula o planejamento informado; não acompanha contas bancárias e não calcula juros, rendimentos de investimentos ou inflação.
      </p>
      {!temReferencia && <p className="mt-3 text-xs font-semibold text-amber-800">Não foi possível calcular o cenário sem mudanças. Os valores simulados continuam disponíveis.</p>}
    </figure>
  );
}

function Medida({ titulo, valor, teste, destaque = false }) {
  return <div className={"rounded-xl p-4 " + (destaque ? "bg-amber-50" : "bg-slate-50")}>
    <p className="text-xs font-semibold text-slate-500">{titulo}</p>
    <p data-testid={teste} className={"finia-number mt-1 text-base font-extrabold " + (destaque ? "text-amber-800" : "text-[#0A192F]")}>{valor}</p>
  </div>;
}
