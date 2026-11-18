import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const n = (valor) => Number.isFinite(Number(valor)) ? Number(valor) : 0;
const mesesDeficit = (meses) => (meses || []).filter((item) => n(item.margemMensal) < -0.005).length;

function Dado({ titulo, valor, destaque = false, teste }) {
  return (
    <div className={"rounded-xl border p-4 " + (destaque ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white")}>
      <p className="text-xs font-semibold leading-5 text-slate-600">{titulo}</p>
      <p data-testid={teste} className={"finia-number mt-2 break-words text-lg font-extrabold " + (typeof valor === "number" && valor < 0 ? "text-red-700" : "text-slate-900")}>
        {typeof valor === "number" ? formatarMoeda(valor) : valor}
      </p>
    </div>
  );
}

function Diagnostico({ titulo, texto, alerta = false }) {
  return (
    <section className={"rounded-2xl border p-5 " + (alerta ? "border-amber-200 bg-amber-50" : "border-cyan-100 bg-cyan-50")}>
      <h3 className={"text-lg font-extrabold " + (alerta ? "text-amber-950" : "text-cyan-950")}>{titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{texto}</p>
    </section>
  );
}

function AvaliacaoDespesa({ cenario, resultado, comparacao, valorInformado, mesEvento }) {
  const indice = cenario === "compra" ? 0 : Math.max(0, mesEvento - 1);
  const mes = resultado.evolucaoMensal?.[indice];
  if (!mes) return <p>Não foram retornados dados para o mês escolhido.</p>;

  // O custo já foi descontado na margemMensal da API. Não o descontar outra vez.
  const custo = n(mes.gastoExtraordinario) || n(valorInformado);
  const depois = n(mes.margemMensal);
  const referencia = comparacao?.evolucaoMensal?.[indice];
  const antes = referencia ? n(referencia.margemMensal) : depois + custo;
  const insuficiencia = Math.max(0, -depois);
  const jaDeficit = antes < -0.005;
  const cabeNoMes = antes >= -0.005 && depois >= -0.005;
  const saldoInformado = resultado.situacaoAtual?.saldoAtual;
  const saldoHojeMenorQueCompra = saldoInformado != null
    && Number.isFinite(Number(saldoInformado)) && n(saldoInformado) < custo;
  const mesNome = formatarMesReferencia(mes.mesReferencia);
  const nome = cenario === "compra" ? "compra" : "despesa extraordinária";
  const titulo = jaDeficit
    ? "O orçamento de " + mesNome + " já não cobria os compromissos."
    : cabeNoMes
      ? "A " + nome + " cabe no valor disponível de " + mesNome + "."
      : "A " + nome + " supera o valor disponível de " + mesNome + ".";
  const explicacao = jaDeficit
    ? "Antes da " + nome + ", faltariam " + formatarMoeda(Math.abs(antes)) + " para cumprir os compromissos previstos. Com a despesa adicional, a insuficiência do mês seria de " + formatarMoeda(insuficiencia) + "."
    : cabeNoMes
      ? "Considerando a renda, as despesas e os aportes já previstos, restariam " + formatarMoeda(depois) + " naquele mês após pagar " + formatarMoeda(custo) + "."
      : "O valor da " + nome + " ultrapassaria a quantia não comprometida do mês em " + formatarMoeda(insuficiencia) + ". Para realizar esse gasto sem alterar os aportes planejados, seria necessário ter recursos livres de meses anteriores ou outra fonte de pagamento.";

  return (
    <div data-testid="resultado-despesa" className="mt-5 space-y-4">
      <Diagnostico titulo={titulo} texto={explicacao} alerta={!cabeNoMes} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Dado titulo="Disponível antes do gasto" valor={antes} teste="disponivel-antes" />
        <Dado titulo={cenario === "compra" ? "Preço da compra" : "Despesa extraordinária"} valor={custo} />
        <Dado titulo="Disponível após o gasto" valor={depois} destaque teste="disponivel-depois" />
      </div>
      {saldoHojeMenorQueCompra && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          O saldo informado atualmente é de {formatarMoeda(saldoInformado)}, abaixo do preço deste gasto.
          Mesmo que o orçamento do mês comporte a despesa, isso não comprova que haverá dinheiro livre para pagá-la no momento da compra.
        </p>
      )}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p className="font-bold">E a reserva e as metas?</p>
        <p className="mt-1">
          O FinIA não reduz automaticamente os valores planejados para a reserva ou para as metas.
          {insuficiencia > 0
            ? " Como a renda prevista não cobre todos os compromissos neste mês, será necessário revisar o planejamento ou utilizar recursos livres já disponíveis."
            : " Pelo orçamento mensal simulado, a despesa pode ser incluída sem reduzir esses aportes previstos."}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          A despesa é contabilizada uma única vez. O orçamento mensal dos períodos seguintes não é automaticamente alterado.
          Esta análise é de uma despesa única à vista, sem parcelas. A disponibilidade mensal não garante o dinheiro necessário para pagar agora:
          parte do saldo informado pode estar reservada para metas ou outros compromissos.
        </p>
      </div>
    </div>
  );
}

function AvaliacaoRenda({ resultado, comparacao }) {
  const mes = resultado.evolucaoMensal?.[0];
  const ref = comparacao?.evolucaoMensal?.[0];
  if (!mes) return <p>Não há dados para avaliar a alteração de renda.</p>;
  const atual = ref ? n(ref.rendaMensal) : n(resultado.situacaoAtual?.rendaMensal);
  const nova = n(mes.rendaMensal);
  const variacao = nova - atual;
  const deficit = mesesDeficit(resultado.evolucaoMensal);
  const deficitBase = comparacao ? mesesDeficit(comparacao.evolucaoMensal) : null;

  return (
    <div className="mt-5 space-y-4" data-testid="resumo-renda">
      <Diagnostico
        titulo={deficit
          ? "O orçamento teria déficit em " + deficit + " mês(es)."
          : "A renda simulada cobre os compromissos mensais."}
        texto={deficit
          ? "Considere rever despesas, reserva e aportes antes de assumir todos os compromissos."
          : "A nova renda foi considerada em todo o período, mantendo os demais parâmetros informados."}
        alerta={deficit > 0}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Dado titulo="Renda mensal atual" valor={atual} />
        <Dado titulo="Renda mensal simulada" valor={nova} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
        <span className="text-sm font-bold text-cyan-950">Variação mensal</span>
        <span data-testid="variacao-renda" className={"finia-number text-xl font-extrabold " + (variacao < 0 ? "text-red-700" : "text-cyan-900")}>
          {variacao > 0 ? "+" : ""}{formatarMoeda(variacao)}
        </span>
      </div>
      {deficitBase !== null && (deficit > 0 || deficitBase > 0) && (
        <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          Meses com orçamento negativo: <strong>{deficitBase} antes</strong> e <strong>{deficit} após a alteração</strong>.
        </p>
      )}
    </div>
  );
}

function AvaliacaoReserva({ resultado, comparacao }) {
  const antes = comparacao ? n(comparacao.totalReservaPlanejada) : null;
  const depois = n(resultado.totalReservaPlanejada);
  const deficit = mesesDeficit(resultado.evolucaoMensal);
  const margem = n(resultado.evolucaoMensal?.[0]?.margemMensal);
  return <div className="mt-5 space-y-4">
    <Diagnostico
      titulo={deficit ? "A nova reserva deixaria " + deficit + " mês(es) com orçamento negativo." : "A reserva planejada está dentro da renda informada."}
      texto={deficit
        ? "O valor que deseja separar mensalmente supera a disponibilidade em parte do período. Reduza os aportes ou ajuste despesas e receitas antes de considerá-los sustentáveis."
        : "O valor indicado é uma previsão de quanto pretende separar; não representa dinheiro já depositado ou rendimento de investimento."}
      alerta={deficit > 0}
    />
    <div className="grid gap-3 sm:grid-cols-3">
      <Dado titulo="Reserva planejada no período" valor={depois} destaque />
      <Dado titulo="Disponível após compromissos no primeiro mês" valor={margem} />
      {antes !== null && <Dado titulo="Mudança na reserva em relação ao plano atual" valor={depois - antes} />}
    </div>
    <p className="text-xs leading-5 text-slate-600">
      A simulação não exige metas cadastradas e não calcula juros nem rendimentos.
      O valor projetado para a reserva depende de os aportes serem realizados; o sistema não confirma depósitos.
    </p>
  </div>;
}

function AvaliacaoAporte({ resultado, comparacao, metaId, metaOriginal, aporteExtra }) {
  const meta = resultado.projecoesMetas?.find((item) => String(item.id) === String(metaId))
    || resultado.projecoesMetas?.[0];
  const anterior = comparacao?.projecoesMetas?.find((item) => String(item.id) === String(meta?.id));
  const deficit = mesesDeficit(resultado.evolucaoMensal);
  if (!meta) return <p className="mt-5 text-sm text-slate-600">Não há meta para avaliar. Cadastre uma meta antes de simular novos aportes.</p>;
  return <div className="mt-5 space-y-4">
    <Diagnostico
      titulo={deficit ? "Os aportes propostos exigem ajustes no orçamento." : "Aporte adicional previsto para a meta " + meta.nome + "."}
      texto={deficit
        ? "Há " + deficit + " mês(es) com renda insuficiente para cumprir todos os compromissos. O progresso da meta depende de conseguir financiar os aportes previstos."
        : "A projeção mostra o valor previsto ao final do período, sem presumir rendimentos financeiros."}
      alerta={deficit > 0}
    />
    {metaOriginal && (
      <p data-testid="minimo-no-resultado" className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
        Aporte mensal já previsto para cumprir o prazo: <strong>{formatarMoeda(Math.ceil(Math.max(0, n(metaOriginal.valorAlvo) - n(metaOriginal.valorInicial)) / Math.max(1, n(metaOriginal.prazoMeses)) * 100 - 0.0000001) / 100)}</strong>.
        {" "}O adicional informado foi de <strong>{formatarMoeda(aporteExtra)}</strong> por mês, limitado ao valor restante da meta.
      </p>
    )}
    <div className="grid gap-3 sm:grid-cols-3">
      <Dado titulo="Valor previsto para a meta" valor={n(meta.valorProjetado)} destaque />
      <Dado titulo="Falta para atingir o objetivo" valor={Math.max(0, n(meta.valorAlvo) - n(meta.valorProjetado))} />
      {anterior && <Dado titulo="Aumento previsto em relação ao plano atual" valor={n(meta.valorProjetado) - n(anterior.valorProjetado)} />}
    </div>
    <p className="text-sm text-slate-700">
      {meta.concluidaNoPeriodo && meta.mesConclusaoReferencia
        ? "Conclusão estimada: " + formatarMesReferencia(meta.mesConclusaoReferencia) + ", se os aportes forem mantidos."
        : "Com os aportes previstos, a meta não seria concluída dentro do período analisado. O prazo é contado a partir de agora."}
    </p>
  </div>;
}

export default function ResultadoPorDecisao({ cenario, resultado, comparacao, valorInformado, mesEvento, metaId, metaOriginal, aporteExtra }) {
  if (!resultado) return null;
  if (cenario === "compra" || cenario === "imprevisto") {
    return <AvaliacaoDespesa cenario={cenario} resultado={resultado} comparacao={comparacao}
      valorInformado={valorInformado} mesEvento={mesEvento} />;
  }
  if (cenario === "aumento" || cenario === "reducao") {
    return <AvaliacaoRenda resultado={resultado} comparacao={comparacao} />;
  }
  if (cenario === "guardar") return <AvaliacaoReserva resultado={resultado} comparacao={comparacao} />;
  if (cenario === "aporte") return <AvaliacaoAporte resultado={resultado} comparacao={comparacao} metaId={metaId} metaOriginal={metaOriginal} aporteExtra={aporteExtra} />;
  return null;
}
