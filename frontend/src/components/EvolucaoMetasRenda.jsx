import { Link } from "react-router-dom";
import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const numero = (valor) => Number.isFinite(Number(valor)) ? Number(valor) : 0;

function CartaoEvolucao({ meta, mensal, comparacao, meses }) {
  const alvo = numero(meta.valorAlvo);
  const fim = numero(meta.valorProjetado);
  const restante = Math.max(0, alvo - fim);
  const percentual = alvo > 0 ? Math.min(100, fim / alvo * 100) : 100;
  const base = comparacao?.projecoesMetas?.find((item) => String(item.id) === String(meta.id));
  const delta = base ? fim - numero(base.valorProjetado) : null;
  const alterouValor = delta !== null && Math.abs(delta) >= 0.005;

  const serie = (mensal || []).map((mes) => ({
    mes,
    item: mes.metasProjetadas?.find((item) => String(item.id) === String(meta.id))
  })).filter(({ item }) => item);
  const marcos = [...new Set([0, Math.floor((serie.length - 1) / 2), serie.length - 1])]
    .filter((indice) => indice >= 0).map((indice) => serie[indice])
    .filter((item, indice, lista) => item && (indice === 0
      || Math.abs(numero(item.item.valorProjetado) - numero(lista[indice - 1].item.valorProjetado)) >= 0.005));

  const dataAnterior = base?.mesConclusaoReferencia;
  const dataNova = meta.mesConclusaoReferencia;
  const mudouPrazo = base && (dataAnterior || "") !== (dataNova || "");

  return (
    <article data-testid="evolucao-meta-renda" className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-1">
        <h4 className="break-words text-base font-extrabold text-[#0A192F]">{meta.nome}</h4>
        <p className="text-xs font-medium text-slate-600">Objetivo: {formatarMoeda(alvo)}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-cyan-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-700">Previsto após {meses} {meses === 1 ? "mês" : "meses"}</p>
          <p className="finia-number mt-1 break-words text-xl font-extrabold text-cyan-900">{formatarMoeda(fim)}</p>
          <p className="mt-1 text-xs font-bold text-cyan-800">
            {percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do objetivo
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold text-slate-700">{restante < 0.005 ? "Meta alcançada no cenário" : "Ainda faltaria"}</p>
          <p className="finia-number mt-1 break-words text-xl font-extrabold text-slate-900">{formatarMoeda(restante)}</p>
          <p className="mt-1 text-xs text-slate-500">para concluir a meta</p>
        </div>
      </div>

      {marcos.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-slate-600">Progresso em momentos do período</p>
          <ol className="grid gap-2 sm:grid-cols-3" aria-label={"Marcos da meta " + meta.nome}>
            {marcos.map(({ mes, item }) => (
              <li key={mes.indiceMes} className="min-w-0 rounded-lg bg-slate-50 px-3 py-3">
                <p className="text-xs font-bold text-slate-600">{formatarMesReferencia(mes.mesReferencia)}</p>
                <p className="finia-number mt-1 break-words text-sm font-extrabold text-slate-900">{formatarMoeda(item.valorProjetado)}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {alvo > 0 ? Math.min(100, numero(item.valorProjetado) / alvo * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : 100}%
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {alterouValor && (
        <p data-testid="impacto-renda-meta" className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm leading-6 text-slate-700">
          Em relação ao plano atual, o valor previsto {delta < 0 ? "diminuiria" : "aumentaria"} em
          {" "}<strong>{formatarMoeda(Math.abs(delta))}</strong>.
        </p>
      )}
      {mudouPrazo && (
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {dataNova
            ? "Conclusão neste cenário: " + formatarMesReferencia(dataNova) + "."
            : "A conclusão deixaria de ocorrer dentro do período analisado."}
          {dataAnterior && " No plano atual: " + formatarMesReferencia(dataAnterior) + "."}
        </p>
      )}
      {meta.concluidaNoPeriodo && dataNova && !mudouPrazo && (
        <p className="mt-3 text-sm text-slate-600">Conclusão prevista: {formatarMesReferencia(dataNova)}.</p>
      )}
      {!serie.length && (
        <p className="mt-3 text-xs text-slate-600">
          Sem dados intermediários disponíveis; o valor final foi calculado normalmente.
        </p>
      )}
    </article>
  );
}

export default function EvolucaoMetasRenda({ resultado, comparacao, ajusteAportes = false, cenario }) {
  const metas = resultado?.projecoesMetas || [];
  if (!metas.length) return null;
  const meses = Number(resultado?.meses) || resultado?.evolucaoMensal?.length || 1;
  const houveMudanca = metas.some((meta) => {
    const base = comparacao?.projecoesMetas?.find((item) => String(item.id) === String(meta.id));
    return base && (Math.abs(numero(meta.valorProjetado) - numero(base.valorProjetado)) >= 0.005
      || (meta.mesConclusaoReferencia || "") !== (base.mesConclusaoReferencia || ""));
  });

  return (
    <section className="finia-card mt-6 w-full p-5 sm:p-8" data-testid="evolucao-metas-renda"
      aria-labelledby="titulo-evolucao-metas-renda">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 id="titulo-evolucao-metas-renda" className="text-xl font-extrabold text-[#0A192F]">Evolução das metas</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Projeções resumidas por objetivo, sem repetição de todos os meses.
          </p>
        </div>
        <Link to="/metas" className="text-sm font-bold text-cyan-800 underline underline-offset-2">
          Revisar metas
        </Link>
      </div>

      {cenario === "reducao" && ajusteAportes && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Os aportes foram ajustados ao dinheiro restante após despesas e reserva, seguindo as prioridades cadastradas.
          O ajuste é apenas uma simulação.
        </p>
      )}
      {!houveMudanca && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          {cenario === "aumento"
            ? "As metas seguem no ritmo atual. Para antecipar uma delas, destine parte do aumento de renda no formulário acima."
            : "Mantendo os aportes atuais, as metas seguem no mesmo ritmo; confira se continuam viáveis com a renda menor."}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        {metas.map((meta) => (
          <CartaoEvolucao key={meta.id} meta={meta} mensal={resultado.evolucaoMensal}
            comparacao={comparacao} meses={meses} />
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-600">
        Os valores são previsões de aportes, sem rendimentos nem depósitos confirmados.
      </p>
    </section>
  );
}
