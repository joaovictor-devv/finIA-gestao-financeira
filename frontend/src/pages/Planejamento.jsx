import { useEffect, useMemo, useState } from "react";
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
      <main className="min-h-screen bg-[#F6FAFE] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
        <p className="font-semibold text-slate-600">Carregando seu orçamento...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6FAFE] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
      <PageHeader
        pergunta="Quanto entra e quanto sai?"
        titulo="Meu Orçamento"
        descricao="Informe só três valores. O FinIA usa isso para calcular quanto sobra para suas metas e para novos gastos."
      />

      {erro && <Feedback tipo="erro">{erro}</Feedback>}
      {sucesso && <Feedback>{sucesso}</Feedback>}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <form onSubmit={salvar} className="finia-card p-6 sm:p-8"><fieldset disabled={salvando}>
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A192F]">Seu mês em 3 números</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Não precisa separar contas por categoria. Use uma média que represente sua rotina.
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
              ajuda="Esse valor fica protegido antes de calcular quanto pode gastar."
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
          <section className="finia-card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">Resultado</p>
                <h2 className="mt-1 text-xl font-extrabold text-[#0A192F]">Quanto sobra?</h2>
              </div>
              {resumo?.classificacao && <div><span className="block text-xs text-slate-500">Último orçamento salvo</span><StatusBadge valor={resumo.classificacao} /></div>}
            </div>

            <div className="mt-6 space-y-4">
              <Linha label="Renda" valor={previa.renda} sinal="+" />
              <Linha label="Gastos" valor={previa.gastos} sinal="−" />
              <Linha label="Quanto quer guardar" valor={previa.guardar} sinal="−" />
              <div className="border-t border-slate-200 pt-4">
                <Linha label="Sobra antes das metas" valor={previa.antesMetas} forte />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-cyan-50/70 p-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-slate-600">Suas metas usam por mês</span>
                <strong className="finia-number text-[#0A192F]">− {formatarMoeda(previa.metas)}</strong>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4 border-t border-cyan-100 pt-4">
                <div>
                  <p className="text-sm font-bold text-slate-600">Disponível depois de tudo</p>
                  <p className="mt-1 text-xs text-slate-500">Esse é o valor usado para avaliar novas decisões.</p>
                </div>
                <strong className={`finia-number whitespace-nowrap text-2xl font-extrabold ${previa.depoisMetas < 0 ? "text-red-600" : "text-cyan-800"}`}>
                  {formatarMoeda(previa.depoisMetas)}
                </strong>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/60 p-5">
            <div className="flex gap-3">
              <span className="material-symbols-outlined mt-0.5 text-cyan-800">lightbulb</span>
              <div>
                <p className="font-bold text-[#0A192F]">Por que só três valores?</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  O objetivo do FinIA é ser rápido. Você informa o básico e o sistema faz os cálculos mais difíceis por trás.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Linha({ label, valor, sinal = "", forte = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 text-sm ${forte ? "font-extrabold text-[#0A192F]" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="finia-number whitespace-nowrap">
        {sinal && <span className="mr-1 text-slate-400">{sinal}</span>}
        {formatarMoeda(valor)}
      </span>
    </div>
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
