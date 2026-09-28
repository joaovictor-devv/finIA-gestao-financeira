import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CurrencyInput from "../components/CurrencyInput";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { formatarMoeda } from "../utils/finance";

function Dashboard() {
  const [perfil, setPerfil] = useState(null);
  const [capacidade, setCapacidade] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [semDados, setSemDados] = useState(false);
  const [erro, setErro] = useState("");
  const [valorGasto, setValorGasto] = useState("");
  const [resultadoGasto, setResultadoGasto] = useState(null);
  const [simulando, setSimulando] = useState(false);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro("");

      try {
        const [perfilResponse, capacidadeResponse] = await Promise.all([
          api.get("/perfil-financeiro"),
          api.get("/analise/capacidade-gastos"),
        ]);
        setPerfil(perfilResponse.data);
        setCapacidade(capacidadeResponse.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setSemDados(true);
        } else {
          setErro(error.response?.data?.mensagem || "Não foi possível carregar sua situação financeira.");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  async function analisarGasto(event) {
    event.preventDefault();
    setErro("");
    setResultadoGasto(null);

    const valor = Number(valorGasto);
    if (!valor || valor <= 0) {
      setErro("Informe quanto você pretende gastar.");
      return;
    }

    setSimulando(true);
    try {
      const response = await api.post("/analise/simular-gasto", { valor });
      setResultadoGasto(response.data);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível verificar esse gasto.");
    } finally {
      setSimulando(false);
    }
  }

  if (carregando) {
    return <LoadingPage texto="Organizando seus números..." />;
  }

  if (semDados) {
    return (
      <main className="min-h-screen bg-[#F6FAFE] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
        <PageHeader
          pergunta="Como estou hoje?"
          titulo="Visão geral"
          descricao="Comece informando quanto você possui agora. Depois o FinIA usa seu orçamento e suas metas para fazer os cálculos."
        />
        <div className="finia-card max-w-2xl p-7 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-[#0A192F]">Primeiro, configure seu perfil</h2>
          <p className="mt-2 leading-7 text-slate-600">
            É rápido: informe seu nome e seu saldo atual. Depois você configura quanto ganha, quanto gasta e quanto quer guardar.
          </p>
          <Link to="/perfil" className="finia-button-primary mt-6 inline-flex px-5 py-3">
            Configurar perfil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6FAFE] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
      <PageHeader
        pergunta="Como estou hoje?"
        titulo={perfil?.nome ? `Olá, ${primeiroNome(perfil.nome)} 👋` : "Visão geral"}
        descricao="Veja quanto você tem, quanto entra, quanto sai e quanto realmente sobra depois dos seus compromissos."
        acao={
          <Link to="/insights" className="finia-button-secondary inline-flex items-center gap-2 px-4 py-2.5">
            <span className="material-symbols-outlined">auto_awesome</span>
            Perguntar à FinIA
          </Link>
        }
      />

      {erro && <Feedback tipo="erro">{erro}</Feedback>}

      {capacidade && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ResumoCard
              icon="account_balance_wallet"
              titulo="Você tem agora"
              valor={formatarMoeda(capacidade.saldoAtual)}
              ajuda="Seu saldo atual informado no Perfil."
              destaque
            />
            <ResumoCard
              icon="payments"
              titulo="Entra por mês"
              valor={formatarMoeda(capacidade.rendaMensal)}
              ajuda="Sua renda mensal cadastrada."
            />
            <ResumoCard
              icon="shopping_cart"
              titulo="Sai por mês"
              valor={formatarMoeda(capacidade.gastosMensais)}
              ajuda="Quanto você costuma gastar no mês."
            />
            <ResumoCard
              icon="savings"
              titulo="Sobra depois de tudo"
              valor={formatarMoeda(capacidade.margemAposMetas)}
              ajuda="Depois de gastos, valor para guardar e metas."
              negativo={Number(capacidade.margemAposMetas) < 0}
              destaque
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="finia-card p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">Sua situação hoje</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[#0A192F]">
                    {tituloSituacao(capacidade.classificacao)}
                  </h2>
                </div>
                <StatusBadge valor={capacidade.classificacao} />
              </div>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {explicarSituacao(capacidade)}
              </p>

              <div className="mt-7 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-extrabold text-[#0A192F]">De onde vem esse valor?</p>
                <div className="mt-4 space-y-3 text-sm">
                  <LinhaCalculo label="Renda mensal" valor={capacidade.rendaMensal} sinal="+" />
                  <LinhaCalculo label="Gastos mensais" valor={capacidade.gastosMensais} sinal="−" />
                  <LinhaCalculo label="Quanto você quer guardar" valor={capacidade.reservaPlanejada} sinal="−" />
                  <LinhaCalculo label="Metas" valor={capacidade.comprometimentoMensalMetas} sinal="−" />
                  <div className="border-t border-slate-200 pt-3">
                    <LinhaCalculo
                      label="Disponível depois de tudo"
                      valor={capacidade.margemAposMetas}
                      forte
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="finia-card p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                <span className="material-symbols-outlined">shopping_bag</span>
              </div>
              <h2 className="mt-4 text-xl font-extrabold text-[#0A192F]">Posso gastar isso?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Digite o valor de uma compra. O FinIA verifica sem alterar seu saldo.
              </p>

              <form onSubmit={analisarGasto} className="mt-5">
                <CurrencyInput
                  label="Valor da compra"
                  value={valorGasto}
                  disabled={simulando}
                onChange={(event) => { setValorGasto(event.target.value); setResultadoGasto(null); }}
                  placeholder="500,00"
                />
                <button
                  type="submit"
                  disabled={simulando}
                  className="finia-button-primary mt-4 w-full px-5 py-3"
                >
                  {simulando ? "Verificando..." : "Verificar gasto"}
                </button>
              </form>

              {resultadoGasto && (
                <div className={`mt-5 rounded-2xl border p-5 ${corResultadoGasto(resultadoGasto.classificacao)}`}>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5">
                      {resultadoGasto.recomendado ? "check_circle" : "warning"}
                    </span>
                    <div>
                      <p className="font-extrabold">{tituloResultadoGasto(resultadoGasto.classificacao)}</p>
                      <p className="mt-1 text-sm leading-6">
                        {explicarGasto(resultadoGasto)}
                      </p>
                      <p className="mt-3 text-xs font-bold opacity-80">
                        Depois da compra: {formatarMoeda(resultadoGasto.margemLivreAposGasto)} de margem.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-extrabold text-[#0A192F]">O que você quer fazer agora?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Atalho
                to="/planejamento"
                icon="account_balance_wallet"
                titulo="Ajustar orçamento"
                descricao="Mude quanto entra, sai e quer guardar."
              />
              <Atalho
                to="/metas"
                icon="flag"
                titulo="Ver minhas metas"
                descricao="Descubra se seus objetivos cabem no orçamento."
              />
              <Atalho
                to="/simulacoes"
                icon="query_stats"
                titulo="Testar uma decisão"
                descricao="Veja o que pode acontecer nos próximos meses."
              />
              <Atalho
                to="/insights"
                icon="auto_awesome"
                titulo="Entender meus números"
                descricao="Peça para a FinIA explicar sua situação."
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function LoadingPage({ texto }) {
  return (
    <main className="min-h-screen bg-[#F6FAFE] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
      <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center text-center">
        <div>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-700" />
          <p className="mt-4 font-semibold text-slate-600">{texto}</p>
        </div>
      </div>
    </main>
  );
}

function Feedback({ children, tipo }) {
  const classes = tipo === "erro"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <div role={tipo === "erro" ? "alert" : "status"} className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${classes}`}>{children}</div>;
}

function ResumoCard({ icon, titulo, valor, ajuda, destaque = false, negativo = false }) {
  let valorClass = "text-[#0A192F]";
  if (negativo) valorClass = "text-red-600";
  else if (destaque) valorClass = "text-cyan-800";

  return (
    <article className="finia-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <p className="text-sm font-bold text-slate-600">{titulo}</p>
      </div>
      <p className={`finia-number mt-5 text-2xl font-extrabold tracking-tight ${valorClass}`}>{valor}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{ajuda}</p>
    </article>
  );
}

function LinhaCalculo({ label, valor, sinal = "", forte = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${forte ? "font-extrabold text-[#0A192F]" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="finia-number whitespace-nowrap">
        {sinal && <span className="mr-1 text-slate-400">{sinal}</span>}
        {formatarMoeda(valor)}
      </span>
    </div>
  );
}

function Atalho({ to, icon, titulo, descricao }) {
  return (
    <Link
      to={to}
      className="finia-card group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800 transition group-hover:bg-cyan-100">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="font-extrabold text-[#0A192F]">{titulo}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">{descricao}</p>
      </div>
    </Link>
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
