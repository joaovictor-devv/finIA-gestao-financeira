import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BudgetBreakdown from "../components/BudgetBreakdown";
import Icon from "../components/Icon";
import CurrencyInput from "../components/CurrencyInput";
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
          rendaMensal: String(dados.rendaMensal ?? ""),
          gastosMensais: String(dados.gastosMensais ?? ""),
          valorPlanejadoGuardar: String(dados.reservaPlanejada ?? ""),
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
    const renda = numero(form.rendaMensal);
    const gastos = numero(form.gastosMensais);
    const guardar = numero(form.valorPlanejadoGuardar);
    const metas = numero(resumo?.comprometimentoMensalMetas);
    const antesMetas = renda - gastos - guardar;
    const depoisMetas = antesMetas - metas;

    return { renda, gastos, guardar, metas, antesMetas, depoisMetas };
  }, [form, resumo]);

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setSucesso("");
  }

  async function salvar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      const response = await api.put("/orcamento", {
        rendaMensal: numero(form.rendaMensal),
        gastosMensais: numero(form.gastosMensais),
        valorPlanejadoGuardar: numero(form.valorPlanejadoGuardar),
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
        descricao="Organize o que entra, o que sai e o que fica para você."
      />

      {erro && <Feedback tipo="erro">{erro}</Feedback>}
      {sucesso && <Feedback>{sucesso}</Feedback>}

      <section className="finia-form-layout">
        <form onSubmit={salvar} className="finia-card p-6 sm:p-8"><fieldset disabled={salvando}>
          <div className="finia-form-intro">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A192F]">Seu mês em 3 números</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Use valores mensais que representem sua rotina.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-6">
            <CurrencyInput
              label="Quanto você ganha por mês?"
              ajuda="Use sua renda mensal que costuma se repetir."
              value={form.rendaMensal}
              onChange={(event) => alterar("rendaMensal", event.target.value)}
              placeholder="2.500,00"
              required
            />
            <CurrencyInput
              label="Quanto você costuma gastar por mês?"
              ajuda="Pense na média dos gastos necessários e do dia a dia."
              value={form.gastosMensais}
              onChange={(event) => alterar("gastosMensais", event.target.value)}
              placeholder="1.300,00"
              required
            />
            <CurrencyInput
              label="Quanto você quer guardar por mês?"
              ajuda="Separe sua reserva mensal além do valor destinado às metas."
              value={form.valorPlanejadoGuardar}
              onChange={(event) => alterar("valorPlanejadoGuardar", event.target.value)}
              placeholder="300,00"
              required
            />
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
            <h2 className="text-xl font-extrabold">Quanto sobra para você?</h2>
            <p className="mt-2 text-xs leading-6 text-slate-500">A prévia acompanha os campos. Salve para aplicar as mudanças.</p>
            <div className="my-6 rounded-2xl bg-cyan-50 p-6">
              <p className="text-xs font-semibold text-slate-600">Depois da reserva e das metas</p>
              <p className={"finia-number mt-2 text-3xl font-extrabold " + (previa.depoisMetas < 0 ? "text-red-700" : "text-cyan-800")}>{formatarMoeda(previa.depoisMetas)}</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">{previa.depoisMetas < 0 ? "Os compromissos ultrapassam a renda. Ajuste os valores ou revise suas metas." : "Essa é a margem mensal que resta para novas decisões."}</p>
            </div>
            <BudgetBreakdown capacidade={{ rendaMensal: previa.renda, gastosMensais: previa.gastos, reservaPlanejada: previa.guardar, comprometimentoMensalMetas: previa.metas }} />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <span className="text-xs text-slate-500">Sobra antes das metas</span>
              <strong className="finia-number text-sm">{formatarMoeda(previa.antesMetas)}</strong>
            </div>
            {resumo?.classificacao && <div className="mt-5 flex flex-wrap items-center gap-2"><span className="text-xs text-slate-500">Último orçamento salvo:</span><StatusBadge valor={resumo.classificacao} /></div>}
            <Link to="/metas" className="finia-text-link mt-4">Revisar minhas metas<Icon name="arrow_forward" /></Link>
          </section>
          <details className="finia-help mx-2">
            <summary>Como definir esses valores?</summary>
            <p>Use sua renda habitual e a média dos gastos do dia a dia. A reserva é o que você pretende guardar todo mês, além das suas metas.</p>
            <p>Os valores servem para planejar. Você pode atualizá-los quando sua rotina mudar.</p>
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

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

export default Planejamento;
