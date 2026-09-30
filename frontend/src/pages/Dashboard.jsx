import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BudgetBreakdown from "../components/BudgetBreakdown";
import CurrencyInput from "../components/CurrencyInput";
import GoalProgress from "../components/GoalProgress";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { formatarMoeda } from "../utils/finance";

const atalhos = [
  { to: "/planejamento", icon: "tune", titulo: "Meu orçamento" },
  { to: "/metas#form-meta", icon: "add", titulo: "Nova meta" },
  { to: "/simulacoes", icon: "query_stats", titulo: "Simular decisão" },
  { to: "/insights", icon: "auto_awesome", titulo: "Perguntar à FinIA" },
];

function Dashboard() {
  const [perfil, setPerfil] = useState(null);
  const [capacidade, setCapacidade] = useState(null);
  const [metas, setMetas] = useState([]);
  const [carregandoMetas, setCarregandoMetas] = useState(true);
  const [erroMetas, setErroMetas] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [semDados, setSemDados] = useState(false);
  const [erro, setErro] = useState("");
  const [erroGasto, setErroGasto] = useState("");
  const [valorGasto, setValorGasto] = useState("");
  const [resultadoGasto, setResultadoGasto] = useState(null);
  const [simulando, setSimulando] = useState(false);
  const [oculto, setOculto] = useState(() => {
    try { return sessionStorage.getItem("finia:ocultar-valores") === "true"; }
    catch { return false; }
  });

  useEffect(() => {
    let ativo = true;
    Promise.all([api.get("/perfil-financeiro"), api.get("/analise/capacidade-gastos")])
      .then(([perfilResponse, capacidadeResponse]) => {
        if (!ativo) return;
        setPerfil(perfilResponse.data);
        setCapacidade(capacidadeResponse.data);
      })
      .catch((error) => {
        if (!ativo) return;
        if (error.response?.status === 404) setSemDados(true);
        else setErro(error.response?.data?.mensagem || "Não foi possível carregar sua situação financeira. Tente recarregar a página.");
      })
      .finally(() => { if (ativo) setCarregando(false); });
    api.get("/metas/resumo")
      .then((response) => { if (ativo) setMetas(response.data || []); })
      .catch((error) => { if (ativo && error.response?.status !== 404) setErroMetas(true); })
      .finally(() => { if (ativo) setCarregandoMetas(false); });
    return () => { ativo = false; };
  }, []);

  function alternarVisibilidade() {
    const proximo = !oculto;
    setOculto(proximo);
    try { sessionStorage.setItem("finia:ocultar-valores", String(proximo)); }
    catch { /* A preferência continua funcionando nesta tela. */ }
  }

  async function analisarGasto(event) {
    event.preventDefault();
    setErroGasto("");
    setResultadoGasto(null);
    const valor = Number(valorGasto);
    if (!Number.isFinite(valor) || valor <= 0) {
      setErroGasto("Informe quanto você pretende gastar.");
      return;
    }
    setSimulando(true);
    try {
      const response = await api.post("/analise/simular-gasto", { valor });
      setResultadoGasto(response.data);
    } catch (error) {
      setErroGasto(error.response?.data?.mensagem || "Não foi possível verificar esse gasto.");
    } finally {
      setSimulando(false);
    }
  }

  const dinheiro = (valor) => oculto ? "••••" : formatarMoeda(valor);
  const revisarMetas = ["METAS_ACIMA_DA_CAPACIDADE", "APERTADA_POR_METAS"].includes(capacidade?.classificacao);

  return (
    <main className="finia-page">
      <PageHeader pergunta="Visão geral"
        titulo={perfil?.nome ? "Olá, " + primeiroNome(perfil.nome) + "." : "Seu dinheiro, mais claro."}
        descricao="Seu ponto de partida para cuidar do hoje e planejar o que vem."
        acao={<Link to="/perfil" className="finia-button-secondary inline-flex items-center gap-2 px-4 py-3"><Icon name="person" />Meu perfil</Link>}
      />

      {carregando && <div role="status" className="finia-card finia-panel flex items-center gap-3 text-sm text-slate-600"><Icon name="hourglass_top" />Organizando seus números...</div>}
      {erro && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</div>}

      {semDados && (
        <section className="finia-card finia-panel max-w-2xl">
          <span className="finia-icon-tile"><Icon name="person_add" /></span>
          <h2 className="mt-5 text-2xl font-extrabold tracking-tight">Vamos começar pelo básico?</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">Informe seu nome e quanto você tem hoje. Depois, organize o orçamento e crie sua primeira meta.</p>
          <Link to="/perfil" className="finia-button-primary mt-6 inline-flex items-center gap-3 px-5 py-3">Configurar perfil<Icon name="arrow_forward" /></Link>
        </section>
      )}

      {capacidade && (
        <>
          <section className="finia-card finia-overview" aria-label="Resumo financeiro">
            <div className="finia-overview-main">
              <div className="finia-balance">
                <div className="finia-balance-label">
                  <span>Seu saldo atual</span>
                  <button type="button" onClick={alternarVisibilidade} aria-label={oculto ? "Mostrar valores" : "Ocultar valores"} aria-pressed={oculto} className="finia-icon-button">
                    <Icon name={oculto ? "visibility_off" : "visibility"} />
                  </button>
                </div>
                <p className="finia-balance-value finia-number" data-testid="saldo-atual">{dinheiro(capacidade.saldoAtual)}</p>
                <p className="finia-balance-note">Saldo informado por você. <Link to="/perfil" className="font-bold text-cyan-800 underline underline-offset-4">Atualizar</Link></p>
              </div>
              <div className="finia-monthly">
                <p className="finia-monthly-label">Sobra no seu mês</p>
                <p className={"finia-monthly-value finia-number " + (Number(capacidade.margemAposMetas) < 0 ? "is-negative" : "")}>{dinheiro(capacidade.margemAposMetas)}</p>
                <p>Depois dos gastos, da reserva e das metas.</p>
              </div>
            </div>
            <div className="finia-cashflow">
              <div><span className="finia-icon-tile"><Icon name="south_west" /></span><div className="min-w-0"><small>Entra por mês</small><strong className="finia-number">{dinheiro(capacidade.rendaMensal)}</strong></div></div>
              <div><span className="finia-icon-tile"><Icon name="north_east" /></span><div className="min-w-0"><small>Gastos por mês</small><strong className="finia-number">{dinheiro(capacidade.gastosMensais)}</strong></div></div>
            </div>
          </section>

          <nav className="finia-quick-actions" aria-label="Ações rápidas">
            {atalhos.map((atalho) => (
              <Link key={atalho.to} to={atalho.to} className="finia-quick-action"><span><Icon name={atalho.icon} /></span><span>{atalho.titulo}</span></Link>
            ))}
          </nav>

          <div className="finia-dashboard-grid">
            <div className="space-y-6">
              <section className="finia-card finia-panel">
                <div className="finia-section-heading">
                  <div><h2>Seu mês em perspectiva</h2><p>Como sua renda e seus compromissos se comparam.</p></div>
                  <Link to="/planejamento" className="finia-text-link">Ajustar<Icon name="arrow_forward" /></Link>
                </div>
                <BudgetBreakdown capacidade={capacidade} oculto={oculto} />
                <div className="finia-situation">
                  <StatusBadge valor={capacidade.classificacao} />
                  <h3>{tituloSituacao(capacidade.classificacao)}</h3>
                  <p>{oculto ? "Mostre os valores para consultar o resumo do seu orçamento." : explicarSituacao(capacidade)}</p>
                  <Link className="finia-text-link mt-2" to={revisarMetas ? "/metas" : "/planejamento"}>{revisarMetas ? "Revisar minhas metas" : "Ver meu orçamento"}<Icon name="arrow_forward" /></Link>
                </div>
              </section>
              <section className="finia-assistant-banner !mt-0">
                <span className="finia-icon-tile"><Icon name="auto_awesome" /></span>
                <div><h2>Clareza para o próximo passo.</h2><p>A FinIA ajuda você a entender seus números e suas opções.</p></div>
                <Link to="/insights">Conversar<Icon name="arrow_forward" /></Link>
              </section>
            </div>

            <div className="space-y-6">
              <section className="finia-card finia-panel" aria-label="Resumo das metas">
                <div className="finia-section-heading">
                  <div><h2>Seus próximos objetivos</h2><p>Um passo de cada vez.</p></div>
                  <Link to="/metas" className="finia-text-link">Ver metas<Icon name="arrow_forward" /></Link>
                </div>
                {carregandoMetas ? <p className="text-sm text-slate-500">Carregando metas...</p> : erroMetas ? (
                  <p className="text-sm leading-6 text-slate-600">Não foi possível carregar suas metas. <Link to="/metas" className="font-bold text-cyan-800 underline">Tentar na tela de Metas</Link></p>
                ) : metas.length === 0 ? (
                  <div className="finia-empty"><span className="finia-icon-tile"><Icon name="flag" /></span><h3>O que você quer conquistar?</h3><p>Transforme uma ideia em um plano que cabe no seu mês.</p><Link to="/metas#form-meta" className="finia-text-link mt-3">Criar minha primeira meta<Icon name="add" /></Link></div>
                ) : (
                  <div>{metas.slice(0, 2).map(({ meta }) => (
                    <Link key={meta.id} to="/metas" className="finia-goal-preview">
                      <div className="finia-goal-topline"><span className="finia-icon-tile"><Icon name="flag" /></span><div><h3>{meta.nome}</h3><p>Prazo planejado: {meta.prazoMeses} meses</p></div><Icon name="chevron_right" className="text-slate-400" /></div>
                      <GoalProgress nome={meta.nome} atual={meta.valorInicial} alvo={meta.valorAlvo} oculto={oculto} />
                    </Link>
                  ))}</div>
                )}
              </section>

              <section className="finia-card finia-panel">
                <div className="finia-section-heading">
                  <div><h2>Essa compra cabe?</h2><p>Teste o valor antes de decidir.</p></div><span className="finia-icon-tile"><Icon name="shopping_bag" /></span>
                </div>
                <form onSubmit={analisarGasto}>
                  <CurrencyInput label="Valor da compra" value={valorGasto} disabled={simulando}
                    onChange={(event) => { setValorGasto(event.target.value); setResultadoGasto(null); setErroGasto(""); }} placeholder="500,00" />
                  <button type="submit" disabled={simulando} className="finia-button-primary mt-4 w-full px-5 py-3">{simulando ? "Verificando..." : "Verificar gasto"}</button>
                  <p className="mt-3 text-center text-xs text-slate-500">A simulação mantém seu saldo e suas metas.</p>
                </form>
                {erroGasto && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{erroGasto}</p>}
                {resultadoGasto && (
                  <div role="status" className={"mt-5 rounded-2xl border p-5 " + corResultadoGasto(resultadoGasto.classificacao)}>
                    <p className="text-sm font-extrabold">{tituloResultadoGasto(resultadoGasto.classificacao)}</p>
                    {!oculto && <p className="mt-2 text-sm leading-6">{explicarGasto(resultadoGasto)}</p>}
                    <p className="mt-3 text-xs font-bold">Margem após a compra: {dinheiro(resultadoGasto.margemLivreAposGasto)}</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function tituloSituacao(classificacao) {
  if (classificacao === "SAUDAVEL") return "Seu orçamento está sob controle";
  if (["APERTADA", "APERTADA_POR_METAS"].includes(classificacao)) return "Você ainda tem margem, mas ela está pequena";
  if (classificacao === "EQUILIBRADA") return "Sua renda já está totalmente comprometida";
  if (classificacao === "SEM_RENDA") return "Falta informar sua renda mensal";
  if (["GASTOS_ACIMA_DA_RENDA", "DESPESAS_ACIMA_DA_RENDA"].includes(classificacao)) return "Seus gastos estão maiores que sua renda";
  if (classificacao === "RESERVA_INVIAVEL") return "O valor que você quer guardar não cabe hoje";
  if (classificacao === "METAS_ACIMA_DA_CAPACIDADE") return "Suas metas estão exigindo mais do que cabe no orçamento";
  return "Veja sua situação financeira";
}

function explicarSituacao(capacidade) {
  const sobra = Number(capacidade.margemAposMetas || 0);
  if (capacidade.classificacao === "SEM_RENDA") {
    return "Informe sua renda em Meu Orçamento para o FinIA calcular quanto realmente fica disponível.";
  }
  if (["GASTOS_ACIMA_DA_RENDA", "DESPESAS_ACIMA_DA_RENDA"].includes(capacidade.classificacao)) {
    return `Você gasta cerca de ${formatarMoeda(capacidade.gastosMensais)} por mês, acima da renda de ${formatarMoeda(capacidade.rendaMensal)}.`;
  }
  if (capacidade.classificacao === "RESERVA_INVIAVEL") {
    return "Depois dos gastos, não sobra o suficiente para guardar o valor planejado. Ajuste o orçamento para voltar a ter margem.";
  }
  if (capacidade.classificacao === "METAS_ACIMA_DA_CAPACIDADE") {
    return "Depois dos gastos e do valor que você quer guardar, suas metas exigem mais dinheiro por mês do que está disponível.";
  }
  if (sobra <= 0) {
    return "Depois dos seus gastos, do valor que quer guardar e das metas, não sobra margem para uma nova compra neste mês.";
  }
  return `Depois dos seus gastos, do valor que quer guardar e das metas, sobram ${formatarMoeda(sobra)} por mês para novas decisões.`;
}

function tituloResultadoGasto(classificacao) {
  if (classificacao === "RECOMENDADO") return "Sim, esse gasto cabe no seu orçamento";
  if (classificacao === "ATENCAO") return "Esse gasto cabe, mas vai usar boa parte da sua margem";
  if (classificacao === "SALDO_INSUFICIENTE") return "Você não tem saldo suficiente para essa compra";
  return "Esse gasto não é recomendado agora";
}

function explicarGasto(resultado) {
  if (resultado.classificacao === "RECOMENDADO") {
    return "A compra respeita seu saldo e ainda mantém seus gastos, valor para guardar e metas dentro da capacidade atual.";
  }
  if (resultado.classificacao === "ATENCAO") {
    return "A compra ainda é possível, mas deixará pouco espaço para outros gastos. Vale pensar se ela é prioridade agora.";
  }
  if (resultado.classificacao === "SALDO_INSUFICIENTE") {
    return `Seu saldo atual é ${formatarMoeda(resultado.saldoAtual)}, menor que o valor que você quer gastar.`;
  }
  return "Mesmo que exista saldo, essa compra prejudicaria a margem reservada para seu orçamento e suas metas.";
}

function corResultadoGasto(classificacao) {
  if (classificacao === "RECOMENDADO") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (classificacao === "ATENCAO") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function primeiroNome(nome) {
  return String(nome).trim().split(/\s+/)[0] || "";
}

export default Dashboard;
