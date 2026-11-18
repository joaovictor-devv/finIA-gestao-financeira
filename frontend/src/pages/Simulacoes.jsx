import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import EventosCenario from "../components/EventosCenario";
import CurrencyInput from "../components/CurrencyInput";
import PageHeader from "../components/PageHeader";
import GraficoImpactoMensal from "../components/GraficoImpactoMensal";
import GraficoEvolucaoMeta from "../components/GraficoEvolucaoMeta";
import api from "../services/api";
import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const cenarios = [
  { id: "normal", icon: "calendar_month", titulo: "Manter o orçamento atual", descricao: "Projete os meses seguintes sem alterar seus valores." },
  { id: "compra", icon: "shopping_bag", titulo: "Compra pontual", descricao: "Inclua uma despesa única no primeiro mês." },
  { id: "imprevisto", icon: "warning", titulo: "Despesa imprevista", descricao: "Escolha o mês e o valor de uma despesa extraordinária." },
  { id: "aumento", icon: "trending_up", titulo: "Aumento de renda", descricao: "Simule uma nova renda mensal total." },
  { id: "reducao", icon: "trending_down", titulo: "Redução de renda", descricao: "Avalie os compromissos com uma renda menor." },
  { id: "guardar", icon: "savings", titulo: "Alterar reserva mensal", descricao: "Teste um valor para guardar, mesmo sem metas." },
  { id: "aporte", icon: "flag", titulo: "Aporte adicional para uma meta", descricao: "Veja o efeito de destinar mais dinheiro a um objetivo." },
  { id: "personalizado", icon: "tune", titulo: "Planejamento personalizado", descricao: "Combine mudanças de renda, despesas e reserva." },
];

function Simulacoes() {
  const [eventos, setEventos] = useState([]);
  const [capacidade, setCapacidade] = useState(null);
  const [metas, setMetas] = useState([]);
  const [cenario, setCenario] = useState("normal");
  const [mesesDigitados, setMesesDigitados] = useState("6");
  const periodoValido = /^\d{1,2}$/.test(mesesDigitados)
    && Number(mesesDigitados) >= 1 && Number(mesesDigitados) <= 60;
  const meses = periodoValido ? Number(mesesDigitados) : 0;
  const [valor, setValor] = useState("");
  const [mesEvento, setMesEvento] = useState(1);
  const [novaRenda, setNovaRenda] = useState("");
  const [rendaPersonalizada, setRendaPersonalizada] = useState("");
  const [gastosPersonalizados, setGastosPersonalizados] = useState("");
  const [reservaPersonalizada, setReservaPersonalizada] = useState("");
  const [metaId, setMetaId] = useState("");
  const [resultado, setResultado] = useState(null);
  const [comparacao, setComparacao] = useState(null);
  const [ultimoPayload, setUltimoPayload] = useState(null);
  const [explicacaoIA, setExplicacaoIA] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [simulando, setSimulando] = useState(false);
  const [explicando, setExplicando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const [capacidadeResponse, metasResponse] = await Promise.all([
          api.get("/analise/capacidade-gastos"),
          api.get("/metas"),
        ]);
        setCapacidade(capacidadeResponse.data);
        setMetas(metasResponse.data || []);
        setNovaRenda(String(capacidadeResponse.data.rendaMensal ?? ""));
        setRendaPersonalizada(String(capacidadeResponse.data.rendaMensal ?? ""));
        setGastosPersonalizados(String(capacidadeResponse.data.gastosMensais ?? ""));
        setReservaPersonalizada(String(capacidadeResponse.data.reservaPlanejada ?? ""));
        if (metasResponse.data?.length) {
          setMetaId(String(metasResponse.data[0].id));
        }
      } catch (error) {
        setErro(error.response?.data?.mensagem || "Configure seu perfil e orçamento antes de criar uma simulação.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const cenarioAtual = useMemo(() => cenarios.find((item) => item.id === cenario), [cenario]);

  function limparResultado() {
    setResultado(null);
    setComparacao(null);
    setUltimoPayload(null);
    setExplicacaoIA("");
    setErro("");
  }

  function selecionarCenario(novoCenario) {
    setEventos([]);
    setCenario(novoCenario);
    setResultado(null);
    setComparacao(null);
    setUltimoPayload(null);
    setExplicacaoIA("");
    setErro("");
    setMesEvento(1);
    setValor("");

    if (capacidade) {
      setNovaRenda(String(capacidade.rendaMensal ?? ""));
      setRendaPersonalizada(String(capacidade.rendaMensal ?? ""));
      setGastosPersonalizados(String(capacidade.gastosMensais ?? ""));
      setReservaPersonalizada(String(capacidade.reservaPlanejada ?? ""));
    }
  }

  function montarPayload() {
    const payload = {
      nomeCenario: cenarioAtual?.titulo || "Simulação",
      meses,
      eventos: [],
    };

    if (cenario === "compra" || cenario === "imprevisto") {
      payload.eventos.push({
        mes: cenario === "compra" ? 1 : mesEvento,
        tipo: "GASTO_EXTRAORDINARIO",
        valor: numero(valor),
      });
    }

    if (cenario === "aumento" || cenario === "reducao") {
      payload.eventos.push({
        mes: 1,
        tipo: "ALTERAR_RENDA",
        valor: numero(novaRenda),
      });
    }

    if (cenario === "guardar") {
      payload.reservaMensal = numero(valor);
    }

    if (cenario === "aporte") {
      payload.aporteExtraMetasMensal = numero(valor);
      if (metaId) payload.metaPrioritariaId = Number(metaId);
    }

    if (cenario === "personalizado") {
      payload.rendaMensal = numero(rendaPersonalizada);
      payload.gastosMensais = numero(gastosPersonalizados);
      payload.reservaMensal = numero(reservaPersonalizada);
      payload.eventos = eventos.map(({ mes, tipo, valor, metaId }) => ({ mes: Number(mes), tipo, valor: Number(valor), ...(metaId ? { metaId: Number(metaId) } : {}) }));
    }

    return payload;
  }

  function validarCenario() {
    if (!periodoValido) return "Informe um período entre 1 e 60 meses, em números inteiros.";
    if (["compra", "imprevisto", "aporte"].includes(cenario) && numero(valor) <= 0) {
      return "Informe um valor maior que zero para essa simulação.";
    }

    if (cenario === "guardar" && (!valor.trim() || !Number.isFinite(Number(valor)) || numero(valor) < 0)) {
      return "Informe o valor mensal da reserva. Use zero para simular a suspensão dos aportes.";
    }
    if (["aumento", "reducao"].includes(cenario) && numero(novaRenda) < 0) {
      return "A nova renda não pode ser negativa.";
    }

    const rendaAtual = numero(capacidade?.rendaMensal);
    if (cenario === "aumento" && numero(novaRenda) <= rendaAtual) {
      return `Para testar um aumento, informe uma renda maior que ${formatarMoeda(rendaAtual)}.`;
    }

    if (cenario === "reducao" && numero(novaRenda) >= rendaAtual) {
      return `Para testar uma redução, informe uma renda menor que ${formatarMoeda(rendaAtual)}.`;
    }

    if (cenario === "aporte" && metas.length === 0) {
      return "Crie uma meta antes de testar um valor extra para ela.";
    }

    if (cenario === "personalizado" && eventos.some((e) => !e.valor.trim() || !Number.isInteger(Number(e.mes)) || Number(e.mes) < 1 || Number(e.mes) > meses)) {
      return "Preencha o valor de cada evento e escolha um mês dentro do período simulado.";
    }
    return "";
  }

  async function simular(event) {
    event.preventDefault();
    setErro("");
    limparResultado();

    const problema = validarCenario();
    if (problema) {
      setErro(problema);
      return;
    }

    const payload = montarPayload();
    setSimulando(true);
    try {
      // O mesmo motor financeiro calcula os dois caminhos, com saldo e orçamento
      // de partida idênticos. A referência não salva nem altera dados reais.
      const [cenarioCalculado, referenciaCalculada] = await Promise.allSettled([
        api.post("/simulacoes", payload),
        api.post("/simulacoes", {
          nomeCenario: "Sem mudanças",
          meses: payload.meses,
          eventos: [],
        }),
      ]);
      if (cenarioCalculado.status === "rejected") throw cenarioCalculado.reason;
      setResultado(cenarioCalculado.value.data);
      setComparacao(referenciaCalculada.status === "fulfilled"
        ? referenciaCalculada.value.data
        : null);
      setUltimoPayload(payload);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível fazer essa simulação.");
    } finally {
      setSimulando(false);
    }
  }

  async function explicarComIA() {
    if (!ultimoPayload) return;
    setErro("");
    setExplicando(true);
    try {
      const status = await api.get("/ia/status");
      if (!status.data.configurada) {
        setErro("As explicações por IA ainda não estão disponíveis. Você pode consultar os resultados calculados abaixo.");
        return;
      }
      const response = await api.post("/ia/explicar-simulacao", ultimoPayload);
      setExplicacaoIA(response.data.resposta || "");
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível pedir a explicação da FinIA.");
    } finally {
      setExplicando(false);
    }
  }

  if (carregando) {
    return (
      <main className="finia-page">
        <p className="font-semibold text-slate-600">Preparando o ambiente de simulação...</p>
      </main>
    );
  }

  return (
    <main className="finia-page">
      <PageHeader
        pergunta="Planejamento financeiro"
        titulo="Simulações"
        descricao="Compare decisões e entenda seus efeitos sobre o orçamento, a reserva e as metas."
      />

      <p className="mb-6 flex items-start gap-2 text-xs leading-6 text-slate-600"><Icon name="science" className="text-cyan-800" /><span>Simulações não movimentam dinheiro nem alteram seu perfil, reserva planejada ou metas reais.</span></p>

      {erro && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</div>}

      {capacidade && (
        <section className="finia-metric-strip" aria-label="Ponto de partida">
          <PontoPartida titulo="Renda por mês" valor={formatarMoeda(capacidade.rendaMensal)} />
          <PontoPartida titulo="Gastos por mês" valor={formatarMoeda(capacidade.gastosMensais)} />
          <PontoPartida titulo="Reserva planejada por mês" valor={formatarMoeda(capacidade.reservaPlanejada)} />
          <PontoPartida titulo="Aportes mensais às metas" valor={formatarMoeda(capacidade.comprometimentoMensalMetas)} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-[#0A192F]">1. Escolha uma situação</h2>
        <p className="mt-1 text-sm text-slate-600">As opções modificam somente os cálculos desta simulação.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cenarios.filter((item) => item.id !== "aporte" || metas.length > 0).map((item) => {
            const ativo = cenario === item.id;
            return (
              <button
                key={item.id}
                disabled={simulando || explicando}
                aria-pressed={ativo}
                type="button"
                onClick={() => selecionarCenario(item.id)}
                className={"finia-scenario " + (ativo ? "is-active " : "") + (item.id === "personalizado" ? "sm:col-span-2 xl:col-span-3" : "")}
              >
                <span className="finia-icon-tile"><Icon name={item.icon} /></span>
                <div><p>{item.titulo}</p><small>{item.descricao}</small></div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="finia-form-layout mt-8">
        <form onSubmit={simular} onChange={limparResultado} className="finia-card p-6 sm:p-8"><fieldset disabled={simulando || explicando || !capacidade}>
          <h2 className="text-xl font-extrabold text-[#0A192F]">2. Defina os valores e o período</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{cenarioAtual?.descricao}</p>

          <div className="mt-6 space-y-5">
            {(cenario === "compra" || cenario === "imprevisto") && (
              <CurrencyInput
                label={cenario === "compra" ? "Valor da compra (despesa única)" : "Valor da despesa extraordinária"}
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                placeholder="1.500,00"
                required
              />
            )}

            {cenario === "imprevisto" && (
              <label className="block">
                <span className="text-sm font-bold text-[#0A192F]">Mês em que a despesa ocorrerá</span>
                <select value={mesEvento} onChange={(event) => setMesEvento(Number(event.target.value))} className="finia-input mt-2 h-12 px-4">
                  {Array.from({ length: periodoValido ? meses : 0 }, (_, index) => index + 1).map((mes) => (
                    <option key={mes} value={mes}>Mês {mes}</option>
                  ))}
                </select>
              </label>
            )}

            {(cenario === "aumento" || cenario === "reducao") && (
              <CurrencyInput
                label="Nova renda mensal total"
                ajuda={`Hoje sua renda é ${formatarMoeda(capacidade?.rendaMensal)}.`}
                value={novaRenda}
                onChange={(event) => setNovaRenda(event.target.value)}
                required
              />
            )}

            {cenario === "guardar" && (
              <CurrencyInput
                label="Novo valor mensal para a reserva"
                ajuda={`Atualmente, seu planejamento prevê ${formatarMoeda(capacidade?.reservaPlanejada)} por mês. Aqui você testa um novo total, sem alterar seu orçamento real.`}
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                placeholder="200,00"
                required
              />
            )}

            {cenario === "aporte" && (
              <>
                <CurrencyInput
                  label="Aporte adicional mensal para a meta"
                  value={valor}
                  onChange={(event) => setValor(event.target.value)}
                  placeholder="200,00"
                  required
                />
                {metas.length > 0 ? (
                  <label className="block">
                    <span className="text-sm font-bold text-[#0A192F]">Qual meta deve receber esse valor?</span>
                    <select value={metaId} onChange={(event) => setMetaId(event.target.value)} className="finia-input mt-2 h-12 px-4">
                      {metas.map((meta) => <option key={meta.id} value={meta.id}>{meta.nome}</option>)}
                    </select>
                  </label>
                ) : (
                  <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Crie uma meta primeiro para testar um aporte maior.</p>
                )}
              </>
            )}

            {cenario === "personalizado" && (
              <>
                <CurrencyInput
                  label="Renda mensal total no cenário"
                  value={rendaPersonalizada}
                  onChange={(event) => setRendaPersonalizada(event.target.value)}
                />
                <CurrencyInput
                  label="Despesas mensais totais no cenário"
                  value={gastosPersonalizados}
                  onChange={(event) => setGastosPersonalizados(event.target.value)}
                />
                <CurrencyInput
                  label="Reserva mensal planejada no cenário"
                  value={reservaPersonalizada}
                  onChange={(event) => setReservaPersonalizada(event.target.value)}
                />
              </>
            )}

            {cenario === "personalizado" && <EventosCenario eventos={eventos} metas={metas} meses={meses} onChange={(novos) => { setEventos(novos); limparResultado(); }} />}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <label htmlFor="periodo-simulacao" className="block text-sm font-extrabold text-slate-800">Período da simulação (meses)</label>
              <p className="mt-1 text-xs leading-5 text-slate-600">Informe um período de 1 a 60 meses. As opções abaixo são atalhos.</p>
              <input id="periodo-simulacao" type="number" inputMode="numeric" min="1" max="60" step="1" required
                value={mesesDigitados} aria-invalid={!periodoValido}
                onChange={(event) => {
                  const texto = event.target.value;
                  setMesesDigitados(texto);
                  limparResultado();
                }}
                onBlur={() => {
                  if (periodoValido) setMesEvento((atual) => Math.min(atual, meses));
                }}
                className="finia-input mt-3 h-12 max-w-48 px-4 text-lg font-bold" />
              {!periodoValido && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">Digite um número inteiro entre 1 e 60.</p>}
              <div role="group" aria-label="Sugestões de período" className="mt-4 flex flex-wrap gap-2">
                {[3, 6, 12, 24].map((opcao) => (
                  <button key={opcao} type="button" aria-pressed={meses === opcao}
                    onClick={() => { setMesesDigitados(String(opcao)); setMesEvento((atual) => Math.min(atual, opcao)); limparResultado(); }}
                    className={`rounded-lg border px-4 py-2 text-sm font-bold ${meses === opcao ? "border-cyan-700 bg-cyan-50 text-cyan-900" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}>
                    {opcao} meses
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={simulando || !capacidade || !periodoValido || (cenario === "aporte" && metas.length === 0)}
            className="finia-button-primary mt-7 w-full px-5 py-3.5"
          >
            {simulando ? "Simulando..." : "3. Ver o que aconteceria"}
          </button>
        </fieldset></form>

        <section className="finia-card p-6 sm:p-8">
          <h2 className="text-xl font-extrabold text-[#0A192F]">Resultado</h2>
          {!resultado ? (
            <div className="finia-empty mt-6 flex min-h-80 flex-col items-center justify-center rounded-2xl bg-slate-50 p-6">
              <span className="material-symbols-outlined !text-[38px] text-slate-400">query_stats</span>
              <p className="mt-4 font-extrabold text-slate-700">Toda decisão começa com uma possibilidade.</p>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Escolha um cenário para avaliar suas despesas, folga mensal, reserva planejada e metas.</p>
            </div>
          ) : (
            <ResultadoSimulacao resultado={resultado} />
          )}
        </section>
      </section>

      {resultado && (
        <>
          <section className="finia-card mt-6 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-[#0A192F]">Comparação com o planejamento atual</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Comparamos dois orçamentos no mesmo período, ambos calculados pelo motor financeiro. A diferença não é uma movimentação real.</p>
            {comparacao ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Comparacao label="Disponível no último mês após compromissos" atual={comparacao.evolucaoMensal?.at(-1)?.margemMensal} depois={resultado.evolucaoMensal?.at(-1)?.margemMensal} />
                <Comparacao label="Reserva planejada no período" atual={comparacao.totalReservaPlanejada} depois={resultado.totalReservaPlanejada} />
                <Comparacao label="Aportes previstos às metas no período" atual={comparacao.totalAportadoMetas} depois={resultado.totalAportadoMetas} />
              </div>
            ) : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">O cenário sem mudanças está indisponível. Os resultados da sua simulação continuam abaixo.</p>}
            <p className="mt-4 text-xs leading-5 text-slate-500">Uma menor folga pode significar que você decidiu guardar mais. Compare também reserva, metas e meses com déficit antes de avaliar a decisão.</p>
          </section>

          <section className="finia-card mt-6 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-[#0A192F]">Evolução do planejamento mensal</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Explore a folga para imprevistos, a reserva planejada e os aportes às metas. Sem usar um saldo bancário fictício.</p>
            <GraficoImpactoMensal
              key={JSON.stringify(ultimoPayload)}
              dados={resultado.evolucaoMensal || []}
              referencia={comparacao?.evolucaoMensal || null}
              temMetas={(resultado.projecoesMetas || []).length > 0}
            />
          </section>

          <section className="finia-card mt-6 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-[#0A192F]">O que acontece em cada mês?</h2>
            <p className="mt-1 text-sm text-slate-500">Os valores mostram de onde vem a folga mensal. Não significam depósitos ou pagamentos já realizados.</p>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-3">
              {(resultado.evolucaoMensal || []).map((mes) => {
                const aporteMetas = numero(mes.aporteMetasBase) + numero(mes.aporteExtraMetas);
                const margem = numero(mes.margemMensal);
                return (
                  <article key={mes.indiceMes} className="min-w-60 flex-1 rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{formatarMesReferencia(mes.mesReferencia)}</h3>
                    <p className={"finia-number mt-2 text-lg font-extrabold " + (margem < 0 ? "text-red-700" : "text-cyan-800")}>
                      {formatarMoeda(margem)}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">{margem < 0 ? "Falta no orçamento" : "Folga não comprometida"}</p>
                    <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
                      <LinhaMes titulo="Renda total" valor={numero(mes.rendaMensal) + numero(mes.rendaExtraordinaria)} />
                      <LinhaMes titulo="Gastos totais" valor={numero(mes.gastosMensais) + numero(mes.gastoExtraordinario)} />
                      <LinhaMes titulo="Para reserva" valor={mes.reservaPlanejada} />
                      <LinhaMes titulo="Para metas" valor={aporteMetas} />
                    </dl>
                    {mes.eventosAplicados?.length > 0 && <p className="mt-3 text-xs leading-5 text-slate-600">{mes.eventosAplicados.join(" · ")}</p>}
                  </article>
                );
              })}
            </div>
          </section>

          {resultado.projecoesMetas?.length > 0 && (
            <section className="finia-card mt-6 p-6 sm:p-8">
              <GraficoEvolucaoMeta
                key={JSON.stringify(ultimoPayload) + "-meta"}
                projecoesMetas={resultado.projecoesMetas}
                evolucao={resultado.evolucaoMensal || []}
                referencia={comparacao?.evolucaoMensal || null}
              />
              <h2 className="mt-8 text-xl font-extrabold text-[#0A192F]">Projeção de cada meta</h2>
              <p className="mt-1 text-sm text-slate-500">Veja como cada objetivo ficaria nesse cenário.</p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {resultado.projecoesMetas.map((meta) => (
                  <article key={meta.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="font-extrabold text-[#0A192F]">{meta.nome}</h3>
                      {meta.concluidaNoPeriodo && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Concluída no cenário</span>}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <MiniInfo label="Hoje" valor={formatarMoeda(meta.valorAtual)} />
                      <MiniInfo label="Depois" valor={formatarMoeda(meta.valorProjetado)} destaque />
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-600" style={{ width: `${Math.min(100, Number(meta.progressoProjetadoPercentual || 0))}%` }} />
                    </div>
                    {comparacao?.projecoesMetas?.find((item) => item.id === meta.id) && (
                      <p className="mt-3 text-xs font-bold text-slate-600">
                        Sem mudanças: {formatarMoeda(comparacao.projecoesMetas.find((item) => item.id === meta.id).valorProjetado)} ao final
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {meta.concluidaNoPeriodo && meta.mesConclusaoReferencia
                        ? `Nesse cenário, a meta seria concluída por volta de ${formatarMesReferencia(meta.mesConclusaoReferencia)}.`
                        : meta.impacto}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6 rounded-2xl bg-[#0A192F] p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-cyan-300">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="text-sm font-extrabold">FinIA</span>
                </div>
                <h2 className="mt-2 text-xl font-extrabold">Explicação adicional dos resultados</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Peça à FinIA para explicar o impacto dessa decisão no seu planejamento.</p>
              </div>
              <button type="button" onClick={explicarComIA} disabled={explicando} className="rounded-xl bg-white px-5 py-3 font-extrabold text-[#0A192F] transition hover:bg-cyan-50 disabled:opacity-60">
                {explicando ? "Explicando..." : "Explicar com a FinIA"}
              </button>
            </div>
            {explicacaoIA && <div className="mt-6 whitespace-pre-wrap rounded-2xl bg-white/10 p-5 text-sm leading-7 text-slate-100">{explicacaoIA}</div>}
          </section>
        </>
      )}
    </main>
  );
}


function ResultadoSimulacao({ resultado }) {
  const evolucao = resultado.evolucaoMensal || [];
  const semFolga = evolucao.filter((mes) => numero(mes.margemMensal) === 0);
  const comDeficit = evolucao.filter((mes) => numero(mes.margemMensal) < 0);
  const piorMes = evolucao.reduce((pior, mes) =>
    pior === null || numero(mes.margemMensal) < numero(pior.margemMensal) ? mes : pior, null);
  const totalMargens = evolucao.reduce((soma, mes) => soma + numero(mes.margemMensal), 0);
  const reserva = numero(resultado.totalReservaPlanejada);
  const aporte = numero(resultado.totalAportadoMetas);
  const temMetas = (resultado.projecoesMetas || []).length > 0;
  const alerta = comDeficit.length > 0;
  const titulo = alerta
    ? `O orçamento ficaria negativo em ${comDeficit.length} de ${evolucao.length} meses.`
    : semFolga.length > 0
      ? `O orçamento fecha, mas fica sem folga em ${semFolga.length} meses.`
      : "O orçamento cobre seus compromissos em todos os meses.";
  return (
    <div className="mt-6">
      <div className={"rounded-2xl border p-5 " + (alerta ? "border-amber-200 bg-amber-50" : "border-cyan-100 bg-cyan-50")}>
        <p className={"text-lg font-extrabold " + (alerta ? "text-amber-900" : "text-cyan-900")}>{titulo}</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {alerta
            ? `A menor folga seria ${formatarMoeda(piorMes?.margemMensal)} em ${formatarMesReferencia(piorMes?.mesReferencia)}. Isso exige revisar renda, gastos ou quanto pretende guardar e aportar às metas.`
            : `A menor folga mensal seria ${formatarMoeda(piorMes?.margemMensal)}. Essa folga não é automaticamente guardada.`}
        </p>
        {evolucao.length > 0 && <p className="mt-2 text-xs font-semibold text-slate-600">{evolucao.length} meses analisados com as condições informadas.</p>}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniInfo label="Soma dos valores mensais disponíveis" valor={formatarMoeda(totalMargens)} destaque />
        <MiniInfo label="Reserva planejada no período" valor={formatarMoeda(reserva)} />
        <MiniInfo label="Aportes às metas no período" valor={formatarMoeda(aporte)} />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        A folga acumulada é a soma das margens mensais, não dinheiro já economizado.
        Reserva e aportes são destinações planejadas durante estes meses, sem incluir valores que você já tinha guardado.
      </p>

      {!temMetas && <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        Você não possui metas cadastradas. A análise considera renda, despesas e reserva; criar metas é opcional.
      </p>}
      {reserva <= 0 && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
        Neste cenário não há valor destinado à reserva. A quantia disponível não é automaticamente guardada nem investida.
        <Link to="/planejamento" className="ml-1 font-bold text-cyan-800 underline underline-offset-2">Ajustar orçamento</Link>
      </div>}
      {reserva > 0 && <p className="mt-4 text-sm leading-6 text-slate-700">
        Se você conseguir seguir o plano, destinaria <strong>{formatarMoeda(reserva)}</strong> à reserva nesse período.
        Este valor representa aportes planejados, sem cálculo de rendimentos ou confirmação de depósitos.
      </p>}
    </div>
  );
}

function Comparacao({ label, atual, depois }) {
  const antes = numero(atual);
  const depoisNumero = numero(depois);
  const diferenca = depoisNumero - antes;
  return <div className="rounded-2xl bg-slate-50 p-5">
    <p className="text-sm font-bold text-slate-700">{label}</p>
    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
      <div><p className="text-slate-500">Sem mudanças</p><p className="finia-number mt-1 text-base font-bold text-slate-700">{formatarMoeda(antes)}</p></div>
      <div><p className="text-slate-500">Na simulação</p><p className="finia-number mt-1 text-base font-bold text-cyan-900">{formatarMoeda(depoisNumero)}</p></div>
    </div>
    <p className="finia-number mt-3 text-xs font-extrabold text-slate-700">Diferença: {diferenca > 0 ? "+" : ""}{formatarMoeda(diferenca)}</p>
  </div>;
}

function LinhaMes({ titulo, valor }) {
  return <div className="flex items-center justify-between gap-3">
    <dt className="text-slate-500">{titulo}</dt>
    <dd className="finia-number font-bold text-slate-800">{formatarMoeda(valor)}</dd>
  </div>;
}

function PontoPartida({ titulo, valor, destaque = false }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{titulo}</p>
      <p className={`finia-number mt-2 text-xl font-extrabold ${destaque ? "text-cyan-800" : "text-[#0A192F]"}`}>{valor}</p>
    </div>
  );
}

function MiniInfo({ label, valor, destaque = false }) {
  return (
    <div className={`rounded-xl p-4 ${destaque ? "bg-cyan-50" : "bg-slate-50"}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`finia-number mt-1 font-extrabold ${destaque ? "text-cyan-800" : "text-[#0A192F]"}`}>{valor}</p>
    </div>
  );
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

export default Simulacoes;
