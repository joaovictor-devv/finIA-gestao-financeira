import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import EventosCenario from "../components/EventosCenario";
import CurrencyInput from "../components/CurrencyInput";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { formatarMesReferencia, formatarMoeda } from "../utils/finance";

const cenarios = [
  { id: "normal", icon: "calendar_month", titulo: "Mês normal", descricao: "Veja a evolução mantendo tudo como está." },
  { id: "compra", icon: "shopping_bag", titulo: "Fazer uma compra", descricao: "Teste uma compra antes de decidir." },
  { id: "imprevisto", icon: "warning", titulo: "Gasto inesperado", descricao: "Veja o impacto de um imprevisto." },
  { id: "aumento", icon: "trending_up", titulo: "Minha renda aumentar", descricao: "Teste uma nova renda mensal." },
  { id: "reducao", icon: "trending_down", titulo: "Minha renda diminuir", descricao: "Entenda como uma queda afetaria você." },
  { id: "aporte", icon: "flag", titulo: "Guardar mais para uma meta", descricao: "Acelere uma meta e veja o efeito." },
  { id: "personalizado", icon: "tune", titulo: "Cenário personalizado", descricao: "Teste renda e gastos diferentes." },
];

function Simulacoes() {
  const [eventos, setEventos] = useState([]);
  const [capacidade, setCapacidade] = useState(null);
  const [metas, setMetas] = useState([]);
  const [cenario, setCenario] = useState("normal");
  const [meses, setMeses] = useState(6);
  const [valor, setValor] = useState("");
  const [mesEvento, setMesEvento] = useState(1);
  const [novaRenda, setNovaRenda] = useState("");
  const [rendaPersonalizada, setRendaPersonalizada] = useState("");
  const [gastosPersonalizados, setGastosPersonalizados] = useState("");
  const [metaId, setMetaId] = useState("");
  const [resultado, setResultado] = useState(null);
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
    setUltimoPayload(null);
    setExplicacaoIA("");
    setErro("");
  }

  function selecionarCenario(novoCenario) {
    setEventos([]);
    setCenario(novoCenario);
    setResultado(null);
    setUltimoPayload(null);
    setExplicacaoIA("");
    setErro("");
    setMesEvento(1);
    setValor("");

    if (capacidade) {
      setNovaRenda(String(capacidade.rendaMensal ?? ""));
      setRendaPersonalizada(String(capacidade.rendaMensal ?? ""));
      setGastosPersonalizados(String(capacidade.gastosMensais ?? ""));
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

    if (cenario === "aporte") {
      payload.aporteExtraMetasMensal = numero(valor);
      if (metaId) payload.metaPrioritariaId = Number(metaId);
    }

    if (cenario === "personalizado") {
      payload.rendaMensal = numero(rendaPersonalizada);
      payload.gastosMensais = numero(gastosPersonalizados);
      payload.eventos = eventos.map(({ mes, tipo, valor, metaId }) => ({ mes: Number(mes), tipo, valor: Number(valor), ...(metaId ? { metaId: Number(metaId) } : {}) }));
    }

    return payload;
  }

  function validarCenario() {
    if (["compra", "imprevisto", "aporte"].includes(cenario) && numero(valor) <= 0) {
      return "Informe um valor maior que zero para essa simulação.";
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
      const response = await api.post("/simulacoes", payload);
      setResultado(response.data);
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
        pergunta="Explore possibilidades"
        titulo="Simulações"
        descricao="Experimente uma decisão. Veja o impacto antes de dar o próximo passo."
      />

      <p className="mb-6 flex items-start gap-2 text-xs leading-6 text-slate-600"><Icon name="science" className="text-cyan-800" /><span>Você está simulando. Seu saldo, orçamento e metas permanecem como estão.</span></p>

      {erro && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</div>}

      {capacidade && (
        <section className="finia-metric-strip" aria-label="Ponto de partida">
          <PontoPartida titulo="Saldo hoje" valor={formatarMoeda(capacidade.saldoAtual)} />
          <PontoPartida titulo="Renda por mês" valor={formatarMoeda(capacidade.rendaMensal)} />
          <PontoPartida titulo="Gastos por mês" valor={formatarMoeda(capacidade.gastosMensais)} />
          <PontoPartida titulo="Sobra depois de tudo" valor={formatarMoeda(capacidade.margemAposMetas)} destaque />
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-[#0A192F]">1. O que você quer testar?</h2>
        <p className="mt-1 text-sm text-slate-500">Escolha a situação mais parecida com a sua ideia.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cenarios.map((item) => {
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
          <h2 className="text-xl font-extrabold text-[#0A192F]">2. Informe os detalhes</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{cenarioAtual?.descricao}</p>

          <div className="mt-6 space-y-5">
            {(cenario === "compra" || cenario === "imprevisto") && (
              <CurrencyInput
                label={cenario === "compra" ? "Quanto custa a compra?" : "Qual seria o valor do imprevisto?"}
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                placeholder="1.500,00"
                required
              />
            )}

            {cenario === "imprevisto" && (
              <label className="block">
                <span className="text-sm font-bold text-[#0A192F]">Em qual mês isso aconteceria?</span>
                <select value={mesEvento} onChange={(event) => setMesEvento(Number(event.target.value))} className="finia-input mt-2 h-12 px-4">
                  {Array.from({ length: meses }, (_, index) => index + 1).map((mes) => (
                    <option key={mes} value={mes}>Mês {mes}</option>
                  ))}
                </select>
              </label>
            )}

            {(cenario === "aumento" || cenario === "reducao") && (
              <CurrencyInput
                label="Qual seria sua nova renda mensal?"
                ajuda={`Hoje sua renda é ${formatarMoeda(capacidade?.rendaMensal)}.`}
                value={novaRenda}
                onChange={(event) => setNovaRenda(event.target.value)}
                required
              />
            )}

            {cenario === "aporte" && (
              <>
                <CurrencyInput
                  label="Quanto a mais você quer guardar por mês para a meta?"
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
                  label="Renda mensal do cenário"
                  value={rendaPersonalizada}
                  onChange={(event) => setRendaPersonalizada(event.target.value)}
                />
                <CurrencyInput
                  label="Gastos mensais do cenário"
                  value={gastosPersonalizados}
                  onChange={(event) => setGastosPersonalizados(event.target.value)}
                />
              </>
            )}

            {cenario === "personalizado" && <EventosCenario eventos={eventos} metas={metas} meses={meses} onChange={(novos) => { setEventos(novos); limparResultado(); }} />}
            <div>
              <span className="text-sm font-bold text-[#0A192F]">Por quanto tempo você quer olhar?</span>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[3, 6, 12, 24].map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    onClick={() => {
                      limparResultado();
                      setMeses(opcao);
                      setMesEvento((atual) => Math.min(atual, opcao));
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${meses === opcao ? "border-cyan-600 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    {opcao}m
                  </button>
                ))}
              </div>
              <label className="mt-3 block text-xs font-semibold text-slate-500">
                Outro período (1 a 60 meses)
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={meses}
                  onChange={(event) => {
                    const novo = Math.max(1, Math.min(60, Number(event.target.value) || 1));
                    setMeses(novo);
                    setMesEvento((atual) => Math.min(atual, novo));
                  }}
                  className="finia-input mt-1 h-11 px-3"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={simulando || !capacidade || (cenario === "aporte" && metas.length === 0)}
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
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Escolha um cenário e veja a projeção do seu saldo e das suas metas.</p>
            </div>
          ) : (
            <ResultadoSimulacao resultado={resultado} />
          )}
        </section>
      </section>

      {resultado && (
        <>
          <section className="finia-card mt-6 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-[#0A192F]">Hoje x cenário simulado</h2>
            <p className="mt-1 text-sm text-slate-500">Compare rapidamente o ponto de partida com o resultado da decisão.</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <Comparacao label="Saldo" atual={resultado.saldoInicial} depois={resultado.saldoFinalProjetado} />
              <Comparacao label="Renda mensal" atual={resultado.situacaoAtual?.rendaMensal} depois={resultado.evolucaoMensal?.at(-1)?.rendaMensal} />
              <Comparacao label="Gastos mensais" atual={resultado.situacaoAtual?.gastosMensais} depois={resultado.evolucaoMensal?.at(-1)?.gastosMensais} inverter />
            </div>
          </section>

          <section className="finia-card mt-6 p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#0A192F]">Evolução mês a mês</h2>
                <p className="mt-1 text-sm text-slate-500">Saldo disponível projetado em cada mês.</p>
              </div>
              <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800">PROJEÇÃO</span>
            </div>
            <MiniGrafico dados={resultado.evolucaoMensal || []} />
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {(resultado.evolucaoMensal || []).map((mes) => (
                <article key={mes.indiceMes} className="min-w-44 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{formatarMesReferencia(mes.mesReferencia)}</p>
                  <p className="finia-number mt-2 text-lg font-extrabold text-[#0A192F]">{formatarMoeda(mes.saldoDisponivelProjetado)}</p>
                  <p className={`finia-number mt-1 text-xs font-bold ${Number(mes.margemMensal) < 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {Number(mes.margemMensal) >= 0 ? "+" : ""}{formatarMoeda(mes.margemMensal)} no mês
                  </p>
                  {mes.eventosAplicados?.length > 0 && (
                    <p className="mt-2 text-xs leading-5 text-slate-500">{mes.eventosAplicados.join(" · ")}</p>
                  )}
                </article>
              ))}
            </div>
          </section>

          {resultado.projecoesMetas?.length > 0 && (
            <section className="finia-card mt-6 p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-[#0A192F]">E suas metas?</h2>
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
                <h2 className="mt-2 text-xl font-extrabold">Vamos entender esse cenário?</h2>
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
  const melhorou = Number(resultado.variacaoSaldo) >= 0;
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge valor={resultado.classificacaoFinal} />
        <span className="text-xs font-bold text-slate-500">{resultado.meses} meses simulados</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniInfo label="Saldo hoje" valor={formatarMoeda(resultado.saldoInicial)} />
        <MiniInfo label={`Saldo depois de ${resultado.meses} meses`} valor={formatarMoeda(resultado.saldoFinalProjetado)} destaque />
      </div>

      <div className={`mt-5 rounded-2xl border p-5 ${melhorou ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <p className={`font-extrabold ${melhorou ? "text-emerald-800" : "text-amber-800"}`}>
          {melhorou
            ? `Seu saldo aumentaria ${formatarMoeda(resultado.variacaoSaldo)} nesse período.`
            : `Seu saldo diminuiria ${formatarMoeda(Math.abs(Number(resultado.variacaoSaldo)))} nesse período.`}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{resultado.mensagem}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniInfo label="Total guardado como reserva" valor={formatarMoeda(resultado.totalReservaPlanejada)} />
        <MiniInfo label="Total destinado às metas" valor={formatarMoeda(resultado.totalAportadoMetas)} />
      </div>
    </div>
  );
}

function Comparacao({ label, atual, depois, inverter = false }) {
  const atualNumero = Number(atual || 0);
  const depoisNumero = Number(depois || 0);
  const diferenca = depoisNumero - atualNumero;
  const melhorou = inverter ? diferenca < 0 : diferenca > 0;
  const piorou = inverter ? diferenca > 0 : diferenca < 0;

  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">Hoje</p>
          <p className="finia-number mt-1 font-extrabold text-slate-700">{formatarMoeda(atualNumero)}</p>
        </div>
        <span className={`material-symbols-outlined ${melhorou ? "text-emerald-600" : piorou ? "text-red-500" : "text-slate-400"}`}>
          {melhorou ? "trending_up" : piorou ? "trending_down" : "trending_flat"}
        </span>
        <div className="text-right">
          <p className="text-xs text-slate-400">No final</p>
          <p className="finia-number mt-1 font-extrabold text-[#0A192F]">{formatarMoeda(depoisNumero)}</p>
        </div>
      </div>
    </div>
  );
}

function MiniGrafico({ dados }) {
  if (!dados.length) return null;
  const valores = dados.map((item) => Number(item.saldoDisponivelProjetado) || 0);
  const min = Math.min(0, ...valores);
  const max = Math.max(0, ...valores);
  const amplitude = Math.max(1, max - min);
  const coordenadas = valores.map((valor, index) => ({
    x: dados.length === 1 ? 300 : 12 + index / (dados.length - 1) * 576,
    y: 176 - (valor - min) / amplitude * 156,
  }));
  const pontos = coordenadas.map(({ x, y }) => x + "," + y).join(" ");
  const base = 176 - (0 - min) / amplitude * 156;
  const area = coordenadas[0].x + "," + base + " " + pontos + " " + coordenadas.at(-1).x + "," + base;

  return (
    <figure className="finia-chart">
      <figcaption className="finia-chart-scale">
        <span>Saldo projetado · R$</span><span>Escala: {formatarMoeda(min)} a {formatarMoeda(max)}</span>
      </figcaption>
      <svg role="img" viewBox="0 0 600 200" className="h-44 w-full sm:h-52" preserveAspectRatio="none" aria-label="Gráfico de evolução do saldo">
        <title>Projeção de saldo disponível</title>
        <desc>{"De " + formatarMoeda(valores[0]) + " no primeiro mês a " + formatarMoeda(valores.at(-1)) + " no último. Os valores de cada mês aparecem abaixo."}</desc>
        {[20, 98, 176].map((y) => <line key={y} x1="12" x2="588" y1={y} y2={y} stroke="#e5ecf2" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />)}
        <line x1="12" x2="588" y1={base} y2={base} stroke="#b4c8d7" vectorEffect="non-scaling-stroke" />
        <polygon points={area} fill="#0E7490" fillOpacity="0.06" />
        <polyline points={pontos} fill="none" stroke="#0E7490" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {coordenadas.map(({ x, y }, index) => (
          <circle key={index} cx={x} cy={y} r="3.5" fill="#0E7490" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
            <title>{formatarMesReferencia(dados[index].mesReferencia) + ": " + formatarMoeda(valores[index])}</title>
          </circle>
        ))}
      </svg>
      <div className="finia-chart-dates"><span>{formatarMesReferencia(dados[0].mesReferencia)}</span>{dados.length > 1 && <span>{formatarMesReferencia(dados.at(-1).mesReferencia)}</span>}</div>
    </figure>
  );
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
