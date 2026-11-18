import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const num = (valor) => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
};
const diferente = (a, b) => Math.abs(a - b) > 0.005;

const indicadores = [
  { nome: "Receitas", valor: (mes) => num(mes?.rendaMensal) + num(mes?.rendaExtraordinaria) },
  { nome: "Despesas", valor: (mes) => num(mes?.gastosMensais) + num(mes?.gastoExtraordinario) },
  { nome: "Reserva mensal prevista", valor: (mes) => num(mes?.reservaPlanejada) },
  { nome: "Aportes mensais às metas", valor: (mes) => num(mes?.aporteMetasBase) + num(mes?.aporteExtraMetas) },
  { nome: "Disponível após compromissos", valor: (mes) => num(mes?.margemMensal) },
];

/**
 * Exibe somente meses em que um valor muda ou uma meta é concluída.
 * A variação no primeiro mês é comparada ao orçamento sem mudanças, quando disponível.
 * Uma simulação estável não gera uma lista repetitiva.
 */
export default function MudancasRelevantes({ resultado, comparacao }) {
  const evolucao = resultado?.evolucaoMensal || [];
  const referencia = comparacao?.evolucaoMensal || [];
  const marcos = evolucao.flatMap((mes, i) => {
    const anterior = i === 0 ? referencia[0] : evolucao[i - 1];
    const mudancas = anterior
      ? indicadores.flatMap(({ nome, valor }) => {
          const antes = valor(anterior);
          const depois = valor(mes);
          return diferente(antes, depois)
            ? [nome + ": " + formatarMoeda(antes) + " → " + formatarMoeda(depois)]
            : [];
        })
      : [];

    // Quando não há comparação disponível, ainda sinaliza os eventos informados
    // sem inferir valores que não foram retornados pela API.
    if (!anterior && mes.eventosAplicados?.length) {
      mudancas.push(...mes.eventosAplicados);
    }

    const metasConcluidas = (resultado.projecoesMetas || [])
      .filter((meta) => meta.concluidaNoPeriodo
        && meta.mesConclusaoReferencia === mes.mesReferencia
        && meta.valorAtual < meta.valorAlvo)
      .map((meta) => "Meta " + meta.nome + ": valor-alvo previsto para este mês");

    if (!mudancas.length && !metasConcluidas.length) return [];
    return [{
      mes: mes.mesReferencia,
      mensagens: [...mudancas, ...metasConcluidas],
    }];
  });

  if (!marcos.length) return null;

  return (
    <section className="finia-card mt-6 p-6 sm:p-8" data-testid="mudancas-relevantes">
      <h2 className="text-xl font-extrabold text-[#0A192F]">O que realmente muda no período</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Somente meses com alterações nos valores ou conclusão prevista de metas.
        Os meses iguais foram omitidos para facilitar a análise.
      </p>
      <ol className="mt-5 space-y-4">
        {marcos.slice(0, 8).map((marco) => (
          <li key={marco.mes} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-extrabold text-cyan-900">{formatarMesReferencia(marco.mes)}</h3>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
              {marco.mensagens.map((mensagem, i) => <li key={i}>{mensagem}</li>)}
            </ul>
          </li>
        ))}
      </ol>
      {marcos.length > 8 && (
        <p className="mt-4 text-xs leading-5 text-slate-600">
          Há outras {marcos.length - 8} alterações no período. Para comparar mais detalhes,
          simule um intervalo menor.
        </p>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Estas são projeções, não movimentações realizadas. Os aportes às metas e à reserva
        dependem de haver recursos suficientes em cada mês.
      </p>
    </section>
  );
}
