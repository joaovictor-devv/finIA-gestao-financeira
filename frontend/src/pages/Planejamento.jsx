import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BudgetBreakdown from "../components/BudgetBreakdown";
import Icon from "../components/Icon";
import CampoMonetarioOrcamento from "../components/CampoMonetarioOrcamento";
import { editarComoMoeda, lerValorMonetario } from "../utils/valorMonetario";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { formatarMoeda } from "../utils/finance";

const formularioInicial = {
  rendaMensal: "",
  gastosMensais: "",
  valorPlanejadoGuardar: "",
};

function Planejamento() {
  const [form, setForm] = useState(formularioInicial);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.get("/orcamento");
        const dados = response.data;
        setResumo(dados);
        setForm({
          rendaMensal: editarComoMoeda(dados.rendaMensal ?? ""),
          gastosMensais: editarComoMoeda(dados.gastosMensais ?? ""),
          valorPlanejadoGuardar: editarComoMoeda(dados.reservaPlanejada ?? ""),
        });
      } catch (error) {
        if (error.response?.status !== 404) {
          setErro(error.response?.data?.mensagem || "Não foi possível carregar seu orçamento.");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const previa = useMemo(() => {
    const renda = lerValorMonetario(form.rendaMensal);
    const gastos = lerValorMonetario(form.gastosMensais);
    const guardar = lerValorMonetario(form.valorPlanejadoGuardar);
    const valido = [renda, gastos, guardar].every(Number.isFinite);
    const metas = numero(resumo?.comprometimentoMensalMetas);
    const antesMetas = valido ? renda - gastos - guardar : null;
    const depoisMetas = valido ? antesMetas - metas : null;
    return { renda, gastos, guardar, metas, antesMetas, depoisMetas, valido };
  }, [form, resumo]);

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setSucesso("");
  }

  async function salvar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    if (!previa.valido) {
      setErro("Revise os valores do orçamento. Utilize reais, sem valores negativos e com até duas casas decimais.");
      return;
    }
    setSalvando(true);

    try {
      const response = await api.put("/orcamento", {
        rendaMensal: previa.renda,
        gastosMensais: previa.gastos,
        valorPlanejadoGuardar: previa.guardar,
      });
      setResumo(response.data);
      setSucesso("Orçamento salvo. As análises, metas e simulações já usarão esses valores.");
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível salvar seu orçamento.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="finia-page">
        <p className="font-semibold text-slate-600">Carregando seu orçamento...</p>
      </main>
    );
  }

  return (
    <main className="finia-page">
      <PageHeader
        pergunta="Seu planejamento"
        titulo="Meu Orçamento"
        descricao="Informe sua renda, suas despesas e o valor reservado mensalmente para planejar com mais segurança."
      />

      {erro && <Feedback tipo="erro">{erro}</Feedback>}
      {sucesso && <Feedback>{sucesso}</Feedback>}

      <section className="finia-form-layout">
        <form onSubmit={salvar} className="finia-card p-6 sm:p-8"><fieldset disabled={salvando || !previa.valido}>
          <div className="finia-form-intro">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A192F]">Planejamento mensal</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Preencha os valores médios de um mês. O resumo ao lado será atualizado antes de salvar.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-6">
            <section aria-labelledby="orcamento-movimentos">
              <h3 id="orcamento-movimentos" className="text-sm font-extrabold uppercase tracking-wide text-slate-700">1. Entradas e despesas</h3>
              <div className="mt-4 grid gap-5 xl:grid-cols-2">
                <CampoMonetarioOrcamento id="orcamento-renda" label="Renda mensal"
                  ajuda="Total normalmente recebido por mês, após descontos."
                  value={form.rendaMensal}
                  onChange={(valor) => alterar("rendaMensal", valor)} />
                <CampoMonetarioOrcamento id="orcamento-gastos" label="Despesas mensais"
                  ajuda="Média de contas, alimentação, transporte e outros gastos."
                  value={form.gastosMensais}
                  onChange={(valor) => alterar("gastosMensais", valor)} />
              </div>
            </section>

            <section aria-labelledby="orcamento-reserva" className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="finia-icon-tile shrink-0"><Icon name="savings" /></span>
                <div className="min-w-0">
                  <h3 id="orcamento-reserva" className="text-sm font-extrabold uppercase tracking-wide text-slate-700">2. Reserva financeira</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Defina quanto pretende separar da renda mensal para guardar ou investir. Esse valor é independente dos aportes calculados para suas metas.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <CampoMonetarioOrcamento id="orcamento-reserva-valor" label="Valor mensal para a reserva"
                  ajuda="Informe R$ 0,00 caso não pretenda reservar um valor fixo. Não inclui rendimentos de investimentos."
                  value={form.valorPlanejadoGuardar}
                  onChange={(valor) => alterar("valorPlanejadoGuardar", valor)} />
              </div>
              <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                As metas cadastradas são consideradas separadamente no cálculo da disponibilidade mensal. Evite incluir o mesmo aporte nas duas categorias.
              </p>
            </section>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="finia-button-primary mt-8 w-full px-5 py-3.5 sm:w-auto"
          >
            {salvando ? "Salvando..." : "Salvar orçamento"}
          </button>
        </fieldset></form>

        <div className="space-y-6">
          <section className="finia-card finia-result-panel">
            <p className="finia-eyebrow">PRÉVIA DO SEU MÊS</p>
            <h2 className="text-xl font-extrabold">Resumo do orçamento mensal</h2>
            <p className="mt-2 text-xs leading-6 text-slate-500">Os valores desta prévia não são gravados até você selecionar “Salvar orçamento”.</p>
            {previa.valido ? (
              <>
                <div className="my-6 rounded-2xl bg-cyan-50 p-6">
                  <p className="text-sm font-semibold text-slate-600">Disponibilidade mensal estimada</p>
                  <p className={"finia-number mt-2 text-3xl font-extrabold " + (previa.depoisMetas < 0 ? "text-red-700" : "text-cyan-800")}>{formatarMoeda(previa.depoisMetas)}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {previa.depoisMetas < 0
                      ? "Os compromissos ultrapassam a renda. Revise despesas, reserva ou metas."
                      : "Valor disponível após despesas, reserva planejada e aportes às metas. Não significa dinheiro já guardado."}
                  </p>
                </div>
                <BudgetBreakdown capacidade={{ rendaMensal: previa.renda, gastosMensais: previa.gastos, reservaPlanejada: previa.guardar, comprometimentoMensalMetas: previa.metas }} />
              </>
            ) : (
              <p className="my-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Preencha os três valores para visualizar a distribuição do orçamento.</p>
            )}
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
              <div className="flex justify-between gap-3"><span className="text-slate-600">Aportes mensais das metas</span><strong className="finia-number">{formatarMoeda(previa.metas)}</strong></div>
              {previa.valido && <div className="flex justify-between gap-3"><span className="text-slate-600">Disponível antes dos aportes às metas</span><strong className="finia-number">{formatarMoeda(previa.antesMetas)}</strong></div>}
            </div>
            {resumo?.classificacao && <div className="mt-5 flex flex-wrap items-center gap-2"><span className="text-xs text-slate-500">Último orçamento salvo:</span><StatusBadge valor={resumo.classificacao} /></div>}
            <Link to="/metas" className="finia-text-link mt-4">Revisar minhas metas<Icon name="arrow_forward" /></Link>
          </section>
          <details className="finia-help mx-2">
            <summary>O que considerar no orçamento?</summary>
            <p>Considere a renda líquida habitual e a média mensal das despesas. A reserva é o valor planejado para poupar, sem incluir o dinheiro separado para metas específicas.</p>
            <p>Os valores servem para planejar e não são movimentações automáticas. Atualize-os sempre que suas condições mudarem.</p>
          </details>
        </div>
      </section>
    </main>
  );
}

function Feedback({ children, tipo }) {
  const classes = tipo === "erro"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <div role={tipo === "erro" ? "alert" : "status"} className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${classes}`}>{children}</div>;
}

export default Planejamento;
