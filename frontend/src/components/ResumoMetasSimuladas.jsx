import { Link } from "react-router-dom";
import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const valorNumerico = (valor) => {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
};

function CartaoMeta({ meta, referencia, meses }) {
  const alvo = valorNumerico(meta.valorAlvo);
  const registrado = valorNumerico(meta.valorAtual);
  const previsto = valorNumerico(meta.valorProjetado);
  const restante = Math.max(0, alvo - previsto);
  const aportes = Math.max(0, previsto - registrado);
  const percentual = alvo > 0
    ? Math.min(100, Math.max(0, previsto / alvo * 100))
    : 100;

  const planoAtual = referencia?.projecoesMetas?.find(
    (item) => String(item.id) === String(meta.id)
  );
  const diferenca = planoAtual
    ? previsto - valorNumerico(planoAtual.valorProjetado)
    : 0;
  const mudaPlano = planoAtual && Math.abs(diferenca) >= 0.005;

  const concluidaAntes = registrado >= alvo;
  const concluidaNoPeriodo = meta.concluidaNoPeriodo && !concluidaAntes;
  let conclusao;

  if (concluidaAntes) {
    conclusao = "Essa meta já está registrada como concluída.";
  } else if (concluidaNoPeriodo && meta.mesConclusaoReferencia) {
    conclusao = "Se os aportes forem realizados, a meta seria atingida em " +
      formatarMesReferencia(meta.mesConclusaoReferencia) + ".";
  } else if (restante < 0.005) {
    conclusao = "A meta seria atingida dentro do período analisado, se os aportes forem realizados.";
  } else if (aportes < 0.005) {
    conclusao = "Nenhum novo aporte foi previsto para esta meta durante o período analisado.";
  } else {
    conclusao = "Após " + meses + " " + (meses === 1 ? "mês" : "meses") +
      ", ainda faltaria " + formatarMoeda(restante) +
      " para concluir a meta. Você pode revisar o prazo ou o valor destinado a ela.";
  }

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="resumo-meta">
      <h3 className="text-base font-extrabold text-[#0A192F] break-words">{meta.nome}</h3>
      <p className="mt-1 text-xs text-slate-500">
        Objetivo: {formatarMoeda(alvo)}
      </p>

      <div className="mt-5 rounded-xl bg-cyan-50 p-4">
        <p className="text-xs font-bold text-slate-600">
          Valor previsto ao final {meses === 1 ? "de 1 mês" : "de " + meses + " meses"}
        </p>
        <p className="finia-number mt-1 break-words text-2xl font-extrabold text-cyan-900">
          {formatarMoeda(previsto)}
        </p>
        <p className="mt-2 text-sm font-bold text-cyan-900">
          {percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do objetivo
        </p>
      </div>

      <div className={"mt-4 grid gap-3 " + (registrado > 0.005 ? "sm:grid-cols-2" : "")}>
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-xs font-semibold text-slate-600">
            {restante < 0.005 ? "Meta alcançada no cenário" : "Ainda faltaria"}
          </p>
          <p className="finia-number mt-1 text-lg font-bold text-slate-900">
            {formatarMoeda(restante)}
          </p>
        </div>
        {registrado > 0.005 && (
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs font-semibold text-slate-600">
              Aportes previstos neste período (além do valor já registrado)
            </p>
            <p className="finia-number mt-1 text-lg font-bold text-slate-900">
              {formatarMoeda(aportes)}
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">{conclusao}</p>

      {mudaPlano && (
        <p data-testid="diferenca-meta" className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
          Comparado ao planejamento atual, esta decisão
          {diferenca > 0 ? " aumentaria " : " reduziria "}
          o valor previsto para a meta em <strong>{formatarMoeda(Math.abs(diferenca))}</strong>.
        </p>
      )}
    </article>
  );
}

export default function ResumoMetasSimuladas({ resultado, comparacao }) {
  const projecoes = resultado?.projecoesMetas || [];
  if (!projecoes.length) return null;

  const meses = Number(resultado?.meses) || resultado?.evolucaoMensal?.length || 1;
  const temDeficit = resultado.evolucaoMensal?.some(
    (mes) => valorNumerico(mes.margemMensal) < 0
  );

  return (
    <section className="finia-card mt-6 p-6 sm:p-8">
      <h2 className="text-xl font-extrabold text-[#0A192F]">O que acontecerá com suas metas?</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Os valores representam o progresso previsto com os aportes planejados,
        não dinheiro depositado automaticamente.
      </p>
      {temDeficit && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Há meses com orçamento negativo. O progresso mostrado depende de conseguir
          manter os aportes; revise os compromissos antes de contar com esse resultado.
        </p>
      )}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {projecoes.map((meta) => (
          <CartaoMeta key={meta.id} meta={meta} referencia={comparacao} meses={meses} />
        ))}
      </div>
      <p className="mt-5 text-xs leading-6 text-slate-600">
        O valor realmente separado para cada meta só muda quando você atualiza o progresso cadastrado.
        <Link className="ml-1 font-bold text-cyan-800 underline underline-offset-2" to="/metas">
          Atualizar o valor guardado em Metas
        </Link>
      </p>
    </section>
  );
}
