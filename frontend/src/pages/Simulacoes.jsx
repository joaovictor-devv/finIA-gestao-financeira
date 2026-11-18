import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import EventosCenario from "../components/EventosCenario";
import CurrencyInput from "../components/CurrencyInput";
import ResultadoPorDecisao from "../components/ResultadoPorDecisao";
import MudancasRelevantes from "../components/MudancasRelevantes";
import ResumoMetasSimuladas from "../components/ResumoMetasSimuladas";
import PageHeader from "../components/PageHeader";
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
  const [ajustarAportesRenda, setAjustarAportesRenda] = useState(true);
  const [destinarAumentoMeta, setDestinarAumentoMeta] = useState(false);
  const [extraRendaMeta, setExtraRendaMeta] = useState("");
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
          const primeiraPendente = metasResponse.data.find(
            (m) => numero(m.valorAlvo) > numero(m.valorInicial));
          setMetaId(String((primeiraPendente || metasResponse.data[0]).id));
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
  const cenarioCompleto = cenario === "normal" || cenario === "personalizado";
  const metaSelecionada = metas.find((meta) => String(meta.id) === String(metaId));
  const restanteMeta = metaSelecionada ? Math.max(0, numero(metaSelecionada.valorAlvo) - numero(metaSelecionada.valorInicial)) : 0;
  // A regra coincide com a divisão com arredondamento para cima do motor Java.
  const aporteBaseMeta = metaSelecionada && Number(metaSelecionada.prazoMeses) > 0
    ? Math.ceil((restanteMeta / Number(metaSelecionada.prazoMeses)) * 100 - 0.0000001) / 100
    : 0;
  const disponibilidadeParaExtra = numero(capacidade?.margemAposMetas);

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
    setAjustarAportesRenda(true);
    setDestinarAumentoMeta(false);
    setExtraRendaMeta("");

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
      meses: cenario === "compra" ? 1 : meses,
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
      if (cenario === "reducao" && ajustarAportesRenda && metas.length > 0) {
        payload.ajustarAportesAoOrcamento = true;
      }
      if (cenario === "aumento" && destinarAumentoMeta && metas.length > 0) {
        payload.aporteExtraMetasMensal = numero(extraRendaMeta);
        payload.metaPrioritariaId = Number(metaId);
      }
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
    if (cenario !== "compra" && !periodoValido) return "Informe um período entre 1 e 60 meses, em números inteiros.";
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
    if ((cenario === "aporte" || (cenario === "aumento" && destinarAumentoMeta))
        && (!metaSelecionada || restanteMeta <= 0)) {
      return "Escolha uma meta que ainda tenha um valor a alcançar.";
    }
    if (cenario === "aumento" && destinarAumentoMeta
        && (!extraRendaMeta.trim() || numero(extraRendaMeta) <= 0)) {
      return "Informe um aporte extra mensal maior que zero para a meta escolhida.";
    }
    if (cenario === "aumento" && destinarAumentoMeta
        && numero(extraRendaMeta) > numero(novaRenda) - rendaAtual) {
      return "O aporte adicional não pode superar o aumento da renda informado.";
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

      {capacidade && cenarioCompleto && (
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
              <>
                <CurrencyInput
                  label="Nova renda mensal total"
                  ajuda={`Renda atual: ${formatarMoeda(capacidade?.rendaMensal)}. Informe o novo valor total, não apenas a diferença.`}
                  value={novaRenda}
                  onChange={(event) => setNovaRenda(event.target.value)}
                  required
                />
                {cenario === "reducao" && metas.length > 0 && (
                  <label className="flex items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                    <input type="checkbox" checked={ajustarAportesRenda}
                      onChange={(event) => { setAjustarAportesRenda(event.target.checked); limparResultado(); }}
                      className="mt-1 h-4 w-4 accent-cyan-700" />
                    <span>
                      <span className="block text-sm font-bold text-slate-800">Adaptar os aportes das metas à renda disponível</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        Se a renda não cobrir os aportes previstos, o simulador reduzirá apenas os valores das metas,
                        priorizando as mais importantes. Despesas e reserva permanecem iguais.
                        Desmarque para ver o resultado caso tente manter todos os aportes atuais.
                      </span>
                    </span>
                  </label>
                )}
                {cenario === "aumento" && metas.some((meta) => numero(meta.valorAlvo) > numero(meta.valorInicial)) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex items-start gap-3">
                      <input type="checkbox" checked={destinarAumentoMeta}
                        onChange={(event) => { setDestinarAumentoMeta(event.target.checked); limparResultado(); }}
                        className="mt-1 h-4 w-4 accent-cyan-700" />
                      <span className="text-sm font-bold text-slate-800">Usar parte do aumento da renda para antecipar uma meta</span>
                    </label>
                    {destinarAumentoMeta && (
                      <div className="mt-4 space-y-4">
                        <label className="block text-sm font-bold text-slate-700">
                          Meta que receberá os novos aportes
                          <select value={metaId} onChange={(event) => { setMetaId(event.target.value); limparResultado(); }}
                            className="finia-input mt-2 h-12 px-4">
                            {metas.filter((meta) => numero(meta.valorAlvo) > numero(meta.valorInicial))
                              .map((meta) => <option key={meta.id} value={meta.id}>{meta.nome}</option>)}
                          </select>
                        </label>
                        <CurrencyInput label="Valor extra mensal destinado à meta"
                          ajuda={`Esse valor será somado ao aporte já previsto para a meta, limitado ao aumento de renda: ${formatarMoeda(Math.max(0, numero(novaRenda) - numero(capacidade?.rendaMensal)))}.`}
                          value={extraRendaMeta}
                          onChange={(event) => setExtraRendaMeta(event.target.value)}
                          required />
                      </div>
                    )}
                  </div>
                )}
              </>
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
                <label className="block">
                  <span className="text-sm font-bold text-[#0A192F]">Meta que receberá o aporte</span>
                  <select value={metaId} onChange={(event) => { setMetaId(event.target.value); limparResultado(); }}
                    className="finia-input mt-2 h-12 px-4">
                    {metas.filter((meta) => numero(meta.valorAlvo) > numero(meta.valorInicial))
                      .map((meta) => <option key={meta.id} value={meta.id}>{meta.nome}</option>)}
                  </select>
                </label>
                {metaSelecionada && (
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-slate-700">
                    <p>Aporte mensal já previsto para cumprir o prazo: <strong data-testid="aporte-minimo-meta">{formatarMoeda(aporteBaseMeta)}</strong></p>
                    <p>Restante da meta: <strong>{formatarMoeda(restanteMeta)}</strong> em {metaSelecionada.prazoMeses} meses.</p>
                    <p className="mt-2 text-xs text-slate-600">
                      O valor mensal acima já está incluído no orçamento. Informe abaixo somente
                      o quanto pretende adicionar, sem repetir o aporte previsto.
                    </p>
                  </div>
                )}
                <CurrencyInput
                  label="Quanto deseja adicionar por mês?"
                  ajuda="O valor digitado é adicional ao aporte mensal já planejado."
                  value={valor} onChange={(event) => setValor(event.target.value)}
                  placeholder="200" required
                />
                {metaSelecionada && numero(valor) > 0 && (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    Aporte total mensal para esta meta: <strong>{formatarMoeda(aporteBaseMeta + numero(valor))}</strong>.
                    {numero(valor) > disponibilidadeParaExtra + 0.005 && (
                      <p className="mt-2 font-semibold text-amber-800">
                        Esse valor adicional supera a disponibilidade mensal atual de {formatarMoeda(disponibilidadeParaExtra)}.
                        A simulação mostrará se o orçamento fica negativo.
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Ao atingir o valor-alvo, os aportes são interrompidos. O excedente não será transferido automaticamente a outras metas.
                    </p>
                  </div>
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
            {cenario !== "compra" && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
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
            </div>}
          </div>

          <button
            type="submit"
            disabled={simulando || !capacidade || (cenario !== "compra" && !periodoValido) || (cenario === "aporte" && metas.length === 0)}
            className="finia-button-primary mt-7 w-full px-5 py-3.5"
          >
            {simulando ? "Simulando..." : "3. Ver o que aconteceria"}
          </button>
        </fieldset></form>

        <section className="finia-card p-6 sm:p-8">
          <h2 className="text-xl font-extrabold text-[#0A192F]">Análise do cenário</h2>
          {!resultado ? (
            <div className="finia-empty mt-6 flex min-h-80 flex-col items-center justify-center rounded-2xl bg-slate-50 p-6">
              <span className="material-symbols-outlined !text-[38px] text-slate-400">query_stats</span>
              <p className="mt-4 font-extrabold text-slate-700">Toda decisão começa com uma possibilidade.</p>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Escolha um cenário para avaliar suas despesas, folga mensal, reserva planejada e metas.</p>
            </div>
          ) : (
            cenarioCompleto ? (
              <ResultadoSimulacao resultado={resultado} />
            ) : (
              <ResultadoPorDecisao
                cenario={cenario}
                resultado={resultado}
                comparacao={comparacao}
                valorInformado={ultimoPayload?.eventos?.[0]?.valor}
                mesEvento={ultimoPayload?.eventos?.[0]?.mes || 1}
                metaId={ultimoPayload?.metaPrioritariaId}
                ajusteAportes={Boolean(ultimoPayload?.ajustarAportesAoOrcamento)}
                metaOriginal={metas.find((meta) => String(meta.id) === String(ultimoPayload?.metaPrioritariaId))}
                aporteExtra={ultimoPayload?.aporteExtraMetasMensal}
              />
            )
          )}
        </section>
      </section>

      {resultado && (
        <>
          {cenario === "personalizado" && <section className="finia-card mt-6 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-[#0A192F]">Comparação com o planejamento atual</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Comparamos dois orçamentos no mesmo período, ambos calculados pelo motor financeiro. A diferença não é uma movimentação real.</p>
            {comparacao ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Comparacao label="Disponível no último mês após compromissos" atual={comparacao.evolucaoMensal?.at(-1)?.margemMensal} depois={resultado.evolucaoMensal?.at(-1)?.margemMensal} />
                <Comparacao label="Reserva planejada no período" atual={comparacao.totalReservaPlanejada} depois={resultado.totalReservaPlanejada} />
                <Comparacao label="Aportes previstos às metas no período" atual={comparacao.totalAportadoMetas} depois={resultado.totalAportadoMetas} />
              </div>
            ) : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">O cenário sem mudanças está indisponível. Os resultados da sua simulação continuam abaixo.</p>}
            <p className="mt-4 text-xs leading-5 text-slate-500">Menor disponibilidade pode ocorrer porque a reserva ou os aportes às metas aumentaram. Considere também os meses em déficit antes de decidir.</p>
          </section>}

          {cenarioCompleto && <MudancasRelevantes resultado={resultado} comparacao={comparacao} />}

          {cenarioCompleto && (
            <ResumoMetasSimuladas resultado={resultado} comparacao={comparacao} />
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
  const margemPiorMes = numero(piorMes?.margemMensal);
  const rendaPiorMes = numero(piorMes?.rendaMensal) + numero(piorMes?.rendaExtraordinaria);
  // Indicador informativo de pouco espaço para imprevistos, não uma regra universal de finanças.
  const margemMuitoPequena = margemPiorMes > 0
    && rendaPiorMes > 0
    && margemPiorMes < rendaPiorMes * 0.05;
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
            ? `O menor valor disponível após compromissos seria ${formatarMoeda(piorMes?.margemMensal)} em ${formatarMesReferencia(piorMes?.mesReferencia)}. Isso exige revisar renda, gastos ou quanto pretende guardar e aportar às metas.`
            : `O menor valor mensal disponível após compromissos seria ${formatarMoeda(piorMes?.margemMensal)}. Essa folga não é automaticamente guardada.`}
        </p>
        {evolucao.length > 0 && <p className="mt-2 text-xs font-semibold text-slate-600">{evolucao.length} meses analisados com as condições informadas.</p>}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniInfo label="Menor valor disponível em um mês" valor={formatarMoeda(margemPiorMes)} destaque />
        <MiniInfo label="Reserva planejada no período" valor={formatarMoeda(reserva)} />
        <MiniInfo label="Aportes previstos às metas" valor={formatarMoeda(aporte)} />
      </div>
      {margemMuitoPequena && (
        <p data-testid="alerta-margem-pequena" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Atenção: a menor disponibilidade mensal é de apenas {formatarMoeda(margemPiorMes)},
          menos de 5% da receita daquele mês. Uma pequena despesa imprevista pode ultrapassar
          o valor livre e exigir ajustes na reserva ou nas metas.
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Reserva e aportes são intenções de guardar durante o período, sem incluir os valores já guardados.
        Não representam depósitos confirmados nem rendimentos de investimentos.
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
