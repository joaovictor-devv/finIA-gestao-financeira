import { Link } from "react-router-dom";
import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const numero = (valor) => Number.isFinite(Number(valor)) ? Number(valor) : 0;

function CartaoEvolucao({ meta, mensal, comparacao, meses }) {
  const alvo = numero(meta.valorAlvo);
  const fim = numero(meta.valorProjetado);
  const restante = Math.max(0, alvo - fim);
  const base = comparacao?.projecoesMetas?.find((m) => String(m.id) === String(meta.id));
  const delta = base ? fim - numero(base.valorProjetado) : null;
  const alterouValor = delta !== null && Math.abs(delta) >= 0.005;
  const referenciaSerie = (mensal || []).map((mes) =>
    ({ mes, item: mes.metasProjetadas?.find((m) => String(m.id) === String(meta.id)) }))
    .filter(({ item }) => item);

  // Apenas 3 marcos para não repetir a antiga tabela de todos os meses.
  const ids = [...new Set([0, Math.floor((referenciaSerie.length - 1) / 2), referenciaSerie.length - 1])]
    .filter((indice) => indice >= 0);
  const checkpoints = ids.map((indice) => referenciaSerie[indice])
    .filter(Boolean)
    .filter(({ item }, indice, lista) => indice === 0
      || Math.abs(numero(item.valorProjetado) - numero(lista[indice - 1].item.valorProjetado)) >= 0.005);
  const dataAntiga = base?.mesConclusaoReferencia;
  const dataNova = meta.mesConclusaoReferencia;
  const mudouPrazo = base && (dataAntiga || "") !== (dataNova || "");

  return (
    <article data-testid="evolucao-meta-renda" className="rounded-2xl border border-slate-200 bg-white p-5">
      <h4 className="font-extrabold text-[#0A192F] break-words">{meta.nome}</h4>
      <p className="mt-1 text-xs text-slate-600">Objetivo: {formatarMoeda(alvo)}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-cyan-50 p-4">
        <div>
          <p className="text-xs font-bold text-slate-600">Projeção ao final de {meses} {meses === 1 ? "mês" : "meses"}</p>
          <p className="finia-number mt-1 text-lg font-extrabold text-cyan-900">{formatarMoeda(fim)}</p>
        </div>
        <p className="text-xs font-bold text-slate-700">Faltariam {formatarMoeda(restante)}</p>
      </div>
      {checkpoints.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3" aria-label={"Marcos da meta " + meta.nome}>
          {checkpoints.map(({ mes, item }) => (
            <div key={mes.indiceMes} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">{formatarMesReferencia(mes.mesReferencia)}</p>
              <p className="finia-number mt-1 text-sm font-extrabold text-slate-900">{formatarMoeda(item.valorProjetado)}</p>
              <p className="text-xs text-slate-600">
                {alvo > 0 ? Math.min(100, numero(item.valorProjetado) / alvo * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : 100}% da meta
              </p>
            </div>
          ))}
        </div>
      )}
      {alterouValor && (
        <p data-testid="impacto-renda-meta" className="mt-4 text-sm leading-6 text-slate-700">
          Em comparação ao plano atual, o valor previsto {delta < 0 ? "diminuiria" : "aumentaria"} em
          {" "}<strong>{formatarMoeda(Math.abs(delta))}</strong>.
        </p>
      )}
      {mudouPrazo && (
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {dataNova
            ? "Conclusão prevista com este cenário: " + formatarMesReferencia(dataNova) + "."
            : "A conclusão da meta deixaria de ocorrer dentro do período analisado."}
          {dataAntiga && " No plano atual: " + formatarMesReferencia(dataAntiga) + "."}
        </p>
      )}
      {meta.concluidaNoPeriodo && dataNova && !mudouPrazo && (
        <p className="mt-3 text-sm text-slate-600">Conclusão prevista: {formatarMesReferencia(dataNova)}.</p>
      )}
      {!referenciaSerie.length && (
        <p className="mt-3 text-xs text-slate-500">
          Os dados mensais não estão disponíveis; apenas o resultado ao final do período pode ser mostrado.
        </p>
      )}
    </article>
  );
}

export default function EvolucaoMetasRenda({ resultado, comparacao, ajusteAportes = false, cenario }) {
  const metas = resultado?.projecoesMetas || [];
  if (!metas.length) return null;
  const meses = Number(resultado?.meses) || resultado?.evolucaoMensal?.length || 1;
  const algumaMudanca = metas.some((meta) => {
    const base = comparacao?.projecoesMetas?.find((m) => String(m.id) === String(meta.id));
    return base && (Math.abs(numero(meta.valorProjetado) - numero(base.valorProjetado)) >= 0.005
      || (meta.mesConclusaoReferencia || "") !== (base.mesConclusaoReferencia || ""));
  });

  return (
    <section className="mt-5 border-t border-slate-200 pt-5" data-testid="evolucao-metas-renda">
      <h3 className="text-lg font-extrabold text-slate-900">Como ficam suas metas</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Acompanhe até três momentos do progresso previsto de cada meta, sem repetir todos os meses.
      </p>
      {cenario === "reducao" && ajusteAportes && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Os aportes foram adaptados ao orçamento: primeiro despesas e reserva, depois as metas
          por prioridade (alta, média e baixa). Essa é uma alternativa simulada, não uma alteração nas metas cadastradas.
          Se despesas e reserva já ultrapassarem a renda, ainda poderá haver déficit.
        </p>
      )}
      {!algumaMudanca && (
        <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {cenario === "aumento"
            ? "A renda maior não acelera as metas sozinha. Para antecipá-las, destine parte do aumento a uma meta nos campos da simulação."
            : "Mantendo os aportes cadastrados, as metas avançam no mesmo ritmo. Isso não garante que os aportes sejam viáveis com a renda menor."}
        </p>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {metas.map((meta) => (
          <CartaoEvolucao key={meta.id} meta={meta} mensal={resultado.evolucaoMensal}
            comparacao={comparacao} meses={meses} />
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-600">
        São projeções de aportes, sem rendimentos ou movimentações reais.
        <Link to="/metas" className="ml-1 font-bold text-cyan-800 underline">Revisar metas cadastradas</Link>
      </p>
    </section>
  );
}
