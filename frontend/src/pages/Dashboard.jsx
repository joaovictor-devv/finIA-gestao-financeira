import { useEffect, useState } from "react";
import api from "../services/api";
import { buscarPerfilFinanceiro } from "../services/perfilFinanceiroService";
import {
  buscarSaudeFinanceira,
  buscarResumoInteligente,
  buscarAnaliseGastos,
} from "../services/iaService";

function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [perfilFinanceiro, setPerfilFinanceiro] = useState(null);
  const [saudeIA, setSaudeIA] = useState(null);
  const [resumoIA, setResumoIA] = useState(null);
  const [analiseGastosIA, setAnaliseGastosIA] = useState(null);

  useEffect(() => {
    api
      .get("/analise/resumo")
      .then((response) => {
        setResumo(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar resumo financeiro:", error);
      });

    buscarPerfilFinanceiro()
      .then((response) => {
        setPerfilFinanceiro(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar perfil financeiro:", error);
      });

    buscarSaudeFinanceira()
      .then((response) => {
        setSaudeIA(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar saúde financeira IA:", error);
      });

    buscarResumoInteligente()
      .then((response) => {
        setResumoIA(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar resumo inteligente IA:", error);
      });

    buscarAnaliseGastos()
      .then((response) => {
        setAnaliseGastosIA(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar análise de gastos IA:", error);
      });
  }, []);

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const calcularReceitaTotal = () => {
    if (!perfilFinanceiro) {
      return resumo?.totalEntradas || 0;
    }

    return (
      Number(perfilFinanceiro.rendaMensal || 0) +
      Number(perfilFinanceiro.rendaExtra || 0)
    );
  };

  const calcularDespesasPrevistas = () => {
    if (!perfilFinanceiro) {
      return resumo?.totalSaidas || 0;
    }

    return (
      Number(perfilFinanceiro.gastoMoradia || 0) +
      Number(perfilFinanceiro.gastoAgua || 0) +
      Number(perfilFinanceiro.gastoEnergia || 0) +
      Number(perfilFinanceiro.gastoInternet || 0) +
      Number(perfilFinanceiro.gastoTransporte || 0) +
      Number(perfilFinanceiro.gastoAlimentacao || 0) +
      Number(perfilFinanceiro.outrasDespesas || 0)
    );
  };

  const receitaTotal = calcularReceitaTotal();
  const despesasPrevistas = calcularDespesasPrevistas();
  const saldoPlanejado = receitaTotal - despesasPrevistas;

  const categoriaMaiorGasto = resumo?.categoriaMaiorGasto || "Sem dados";
  const objetivoPrincipal =
    perfilFinanceiro?.objetivoPrincipal || "Nenhum objetivo informado";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Olá, usuário 👋
        </h1>

        <p className="mt-2 text-lg text-slate-500">
          Veja um resumo do seu planejamento financeiro atual.
        </p>
      </section>

      <section className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <CardResumo
          titulo="Receita total"
          icone="payments"
          valor={formatarMoeda(receitaTotal)}
          descricao="Renda mensal somada com renda extra."
          corIcone="text-emerald-500"
          corValor="text-slate-900"
        />

        <CardResumo
          titulo="Despesas previstas"
          icone="shopping_cart"
          valor={formatarMoeda(despesasPrevistas)}
          descricao="Soma dos gastos cadastrados no planejamento."
          corIcone="text-red-500"
          corValor="text-slate-900"
        />

        <CardResumo
          titulo="Saldo planejado"
          icone="account_balance_wallet"
          valor={formatarMoeda(saldoPlanejado)}
          descricao="Receita total menos despesas previstas."
          corIcone="text-blue-600"
          corValor={saldoPlanejado >= 0 ? "text-blue-600" : "text-red-500"}
        />

        <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg transition hover:-translate-y-1">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium opacity-80">
              Saúde Financeira
            </span>

            <span className="material-symbols-outlined">stars</span>
          </div>

          <p className="text-xl font-bold">
            {saudeIA?.status || "IA FUTURA"}
          </p>

          <p className="mt-2 text-sm leading-relaxed opacity-90">
            {saudeIA?.mensagem ||
              "A saúde financeira será calculada futuramente pela IA do FinIA."}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Resumo Inteligente
            </h2>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
              IA futura
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="material-symbols-outlined text-blue-600">
                  auto_awesome
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  {resumoIA?.recurso || "Resumo Inteligente"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {resumoIA?.mensagem ||
                    "O resumo inteligente será gerado futuramente pela IA com base no histórico financeiro do usuário."}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <span className="material-symbols-outlined text-emerald-600">
                  flag
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Objetivo principal
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {objetivoPrincipal}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <span className="material-symbols-outlined text-amber-600">
                  warning
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Maior categoria de gasto
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Atualmente, a categoria com maior gasto registrada pelo
                  sistema é <strong>{categoriaMaiorGasto}</strong>. A
                  interpretação desse comportamento será feita futuramente pela
                  IA do FinIA.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border-l-4 border-blue-600 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <span className="material-symbols-outlined text-emerald-600">
                  psychology
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Inteligência Financeira em desenvolvimento
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  No futuro, a IA do FinIA irá analisar renda, gastos, metas,
                  histórico e revisões mensais para gerar recomendações
                  personalizadas ao usuário.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Análise de Gastos
            </h2>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
              IA futura
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mx-auto my-6 flex h-48 w-48 items-center justify-center rounded-full border-[18px] border-blue-600">
              <div className="text-center">
                <p className="text-sm text-slate-500">Despesas</p>

                <p className="text-xl font-bold text-slate-900">
                  {formatarMoeda(despesasPrevistas)}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {analiseGastosIA?.recurso || "Análise Inteligente de Gastos"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {analiseGastosIA?.mensagem ||
                  "A análise inteligente dos gastos será realizada futuramente pela IA do FinIA."}
              </p>
            </div>

            <div className="space-y-3">
              <LinhaResumo
                label="Categoria principal"
                valor={categoriaMaiorGasto}
              />

              <LinhaResumo
                label="Receita total"
                valor={formatarMoeda(receitaTotal)}
                cor="text-emerald-600"
              />

              <LinhaResumo
                label="Despesas"
                valor={formatarMoeda(despesasPrevistas)}
                cor="text-red-500"
              />

              <LinhaResumo
                label="Saldo planejado"
                valor={formatarMoeda(saldoPlanejado)}
                cor={saldoPlanejado >= 0 ? "text-blue-600" : "text-red-500"}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CardResumo({ titulo, icone, valor, descricao, corIcone, corValor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{titulo}</span>

        <span className={`material-symbols-outlined ${corIcone}`}>
          {icone}
        </span>
      </div>

      <p className={`text-2xl font-bold ${corValor}`}>{valor}</p>

      <p className="mt-2 text-sm text-slate-500">{descricao}</p>
    </div>
  );
}

function LinhaResumo({ label, valor, cor = "text-slate-900" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>

      <span className={`font-semibold ${cor}`}>{valor}</span>
    </div>
  );
}

export default Dashboard;