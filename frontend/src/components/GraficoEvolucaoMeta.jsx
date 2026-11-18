import { useState } from "react";
import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const WIDTH = 760;
const HEIGHT = 278;
const L = 102;
const R = 20;
const T = 22;
const B = 222;
const valor = (n) => Number.isFinite(Number(n)) ? Number(n) : 0;

export default function GraficoEvolucaoMeta({ projecoesMetas = [], evolucao = [], referencia = null }) {
  const [idMeta, setIdMeta] = useState(String(projecoesMetas[0]?.id ?? ""));
  const [mesEscolhido, setMesEscolhido] = useState(String(evolucao.length || 1));

  if (!projecoesMetas.length) return null;

  const meta = projecoesMetas.find((item) => String(item.id) === idMeta) || projecoesMetas[0];
  const mesIndex = Math.min(evolucao.length - 1, Math.max(0, Number(mesEscolhido) - 1));
  const hist = evolucao.map((mes) => mes.metasProjetadas?.find((m) => String(m.id) === String(meta.id)));
  const baseHist = Array.isArray(referencia) && referencia.length === evolucao.length
    ? referencia.map((mes) => mes.metasProjetadas?.find((m) => String(m.id) === String(meta.id)))
    : [];
  const possuiSerie = hist.length > 0 && hist.every(Boolean);
  const possuiBase = baseHist.length === hist.length && baseHist.length > 0 && baseHist.every(Boolean);
  const inicial = valor(meta.valorAtual);
  const alvo = valor(meta.valorAlvo);
  const valores = [inicial, ...hist.map((m) => valor(m?.valorProjetado))];
  const valoresBase = possuiBase ? [inicial, ...baseHist.map((m) => valor(m?.valorProjetado))] : [];
  const maior = Math.max(1, alvo, ...valores, ...valoresBase);
  const limite = maior * 1.1;
  const x = (i) => L + (i / Math.max(1, evolucao.length)) * (WIDTH - L - R);
  const y = (n) => B - (n / limite) * (B - T);
  const pontos = (v) => v.map((n, i) => x(i) + "," + y(n)).join(" ");
  const mes = evolucao[mesIndex];
  const valorNoMes = valor(hist[mesIndex]?.valorProjetado);
  const valorBaseNoMes = possuiBase ? valor(baseHist[mesIndex]?.valorProjetado) : null;
  const progresso = alvo > 0 ? Math.min(100, valorNoMes / alvo * 100) : 0;

  return (
    <figure className="finia-chart">
      <figcaption className="text-base font-extrabold text-[#0A192F]">Evolução do valor destinado à meta</figcaption>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Veja a previsão de quanto estará separado para cada objetivo, mês a mês, considerando os aportes informados.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold text-slate-700">
          Meta analisada
          <select aria-label="Meta analisada" value={meta.id}
            onChange={(e) => setIdMeta(String(e.target.value))}
            className="finia-input mt-2 h-11 px-3">
            {projecoesMetas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-700">
          Mês para comparar
          <select aria-label="Mês do progresso da meta" value={mesIndex + 1}
            onChange={(e) => setMesEscolhido(e.target.value)}
            className="finia-input mt-2 h-11 px-3">
            {evolucao.map((m, i) => <option key={i} value={i + 1}>{formatarMesReferencia(m.mesReferencia)}</option>)}
          </select>
        </label>
      </div>

      {possuiSerie ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-2"><span className="h-1 w-7 rounded bg-cyan-700" /> Simulação</span>
            {possuiBase && <span className="flex items-center gap-2"><span className="w-7 border-t-[3px] border-dashed border-slate-400" /> Planejamento atual</span>}
            <span className="flex items-center gap-2"><span className="w-7 border-t-[2px] border-dotted border-amber-600" /> Valor da meta</span>
          </div>
          <div className="mt-3 overflow-x-auto" tabIndex={0} aria-label="Gráfico de progresso da meta">
            <svg role="img" aria-label="Gráfico de evolução das metas" className="h-auto min-w-[500px] w-full"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
              <title>Evolução da meta {meta.nome}</title>
              <desc>De {formatarMoeda(inicial)} para {formatarMoeda(valor(meta.valorProjetado))} durante {evolucao.length} meses, de uma meta de {formatarMoeda(alvo)}.</desc>
              {[0, maior / 2, maior].map((n, i) => (
                <g key={i}>
                  <line x1={L} y1={y(n)} x2={WIDTH - R} y2={y(n)} stroke="#e2e8f0" strokeDasharray="4 5" />
                  <text x={L - 9} y={y(n) + 4} textAnchor="end" fontSize="11" fill="#526176">
                    {formatarMoeda(n).replace(",00", "")}
                  </text>
                </g>
              ))}
              <line x1={L} y1={y(alvo)} x2={WIDTH - R} y2={y(alvo)}
                stroke="#b45309" strokeDasharray="3 4" strokeWidth="1.5" />
              {possuiBase && <polyline points={pontos(valoresBase)} stroke="#94a3b8" strokeWidth="3"
                strokeDasharray="7 5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              <polyline points={pontos(valores)} stroke="#0e7490" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1={x(mesIndex + 1)} y1={T} x2={x(mesIndex + 1)} y2={B}
                stroke="#0e7490" strokeDasharray="3 5" />
              {possuiBase && <circle cx={x(mesIndex + 1)} cy={y(valorBaseNoMes)} r="5.5" fill="#94a3b8" stroke="white" strokeWidth="2" />}
              <circle cx={x(mesIndex + 1)} cy={y(valorNoMes)} r="6" fill="#0e7490" stroke="white" strokeWidth="2" />
              <text x={L} y={HEIGHT - 11} fontSize="12" fill="#526176">Hoje</text>
              <text x={WIDTH - R} y={HEIGHT - 11} textAnchor="end" fontSize="12" fill="#526176">
                {formatarMesReferencia(evolucao.at(-1).mesReferencia)}
              </text>
            </svg>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
            <Informacao titulo="Valor previsto para a meta" valor={formatarMoeda(valorNoMes)} />
            <Informacao titulo="Percentual da meta" valor={progresso.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%"} />
            <Informacao titulo="Valor ainda necessário" valor={formatarMoeda(Math.max(0, alvo - valorNoMes))} />
          </div>
          {possuiBase && <p data-testid="comparacao-meta" className="mt-4 text-sm leading-6 text-slate-700">
            Em {formatarMesReferencia(mes.mesReferencia)}, o cenário {valorNoMes > valorBaseNoMes ? "anteciparia" : valorNoMes < valorBaseNoMes ? "reduziria" : "manteria"}
            {" "}o valor separado em {formatarMoeda(Math.abs(valorNoMes - valorBaseNoMes))} em relação ao planejamento atual.
          </p>}
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          A evolução mensal desta meta não está disponível nesta resposta. Consulte o valor final previsto no quadro de metas abaixo.
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Valores simulados de aportes, não depósitos confirmados. Não há cálculo de rendimentos de aplicações financeiras ou inflação.
      </p>
    </figure>
  );
}

function Informacao({ titulo, valor }) {
  return <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-bold text-slate-600">{titulo}</p>
    <p className="finia-number mt-1 font-extrabold text-cyan-900">{valor}</p>
  </div>;
}
