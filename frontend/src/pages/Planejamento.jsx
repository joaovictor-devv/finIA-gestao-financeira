import { useEffect, useState } from "react";
import {
  buscarPerfilFinanceiro,
  salvarPerfilFinanceiro,
  atualizarPerfilFinanceiro,
} from "../services/perfilFinanceiroService";

function Planejamento() {
  const [perfilId, setPerfilId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [editando, setEditando] = useState(false);
  const [formOriginal, setFormOriginal] = useState(null);

  const [form, setForm] = useState({
    rendaMensal: "",
    rendaExtra: "",
    gastoMoradia: "",
    gastoAgua: "",
    gastoEnergia: "",
    gastoInternet: "",
    gastoTransporte: "",
    gastoAlimentacao: "",
    outrasDespesas: "",
    valorPlanejadoGuardar: "",
    objetivoPrincipal: "",
  });

  useEffect(() => {
    carregarPerfilFinanceiro();
  }, []);

  const carregarPerfilFinanceiro = async () => {
    try {
      const response = await buscarPerfilFinanceiro();
      const dados = response.data;

      if (dados) {
        setPerfilId(dados.id);

        const dadosFormatados = {
          rendaMensal: dados.rendaMensal || "",
          rendaExtra: dados.rendaExtra || "",
          gastoMoradia: dados.gastoMoradia || "",
          gastoAgua: dados.gastoAgua || "",
          gastoEnergia: dados.gastoEnergia || "",
          gastoInternet: dados.gastoInternet || "",
          gastoTransporte: dados.gastoTransporte || "",
          gastoAlimentacao: dados.gastoAlimentacao || "",
          outrasDespesas: dados.outrasDespesas || "",
          valorPlanejadoGuardar: dados.valorPlanejadoGuardar || "",
          objetivoPrincipal: dados.objetivoPrincipal || "",
        };

        setForm(dadosFormatados);
        setFormOriginal(dadosFormatados);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil financeiro:", error);
    }
  };

  const atualizarCampo = (campo, valor) => {
    if (!editando) return;

    setForm({
      ...form,
      [campo]: valor,
    });
  };

  const converterNumero = (valor) => {
    return Number(valor || 0);
  };

  const receitaTotal =
    converterNumero(form.rendaMensal) + converterNumero(form.rendaExtra);

  const despesasPrevistas =
    converterNumero(form.gastoMoradia) +
    converterNumero(form.gastoAgua) +
    converterNumero(form.gastoEnergia) +
    converterNumero(form.gastoInternet) +
    converterNumero(form.gastoTransporte) +
    converterNumero(form.gastoAlimentacao) +
    converterNumero(form.outrasDespesas);

  const saldoPlanejado = receitaTotal - despesasPrevistas;

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const ativarEdicao = () => {
    setMensagem("");
    setEditando(true);
  };

  const cancelarEdicao = () => {
    if (formOriginal) {
      setForm(formOriginal);
    }

    setMensagem("Alterações descartadas.");
    setEditando(false);
  };

  const salvarPlanejamento = async (e) => {
    e.preventDefault();
    setMensagem("");

    if (!editando) {
      setMensagem("Clique em Editar planejamento antes de alterar os dados.");
      return;
    }

    const dadosParaBackend = {
      rendaMensal: converterNumero(form.rendaMensal),
      rendaExtra: converterNumero(form.rendaExtra),
      gastoMoradia: converterNumero(form.gastoMoradia),
      gastoAgua: converterNumero(form.gastoAgua),
      gastoEnergia: converterNumero(form.gastoEnergia),
      gastoInternet: converterNumero(form.gastoInternet),
      gastoTransporte: converterNumero(form.gastoTransporte),
      gastoAlimentacao: converterNumero(form.gastoAlimentacao),
      outrasDespesas: converterNumero(form.outrasDespesas),
      valorPlanejadoGuardar: converterNumero(form.valorPlanejadoGuardar),
      objetivoPrincipal: form.objetivoPrincipal,
    };

    try {
      if (perfilId) {
        await atualizarPerfilFinanceiro(perfilId, dadosParaBackend);
        setMensagem("Planejamento atualizado com sucesso.");
      } else {
        await salvarPerfilFinanceiro(dadosParaBackend);
        setMensagem("Planejamento cadastrado com sucesso.");
      }

      setEditando(false);
      await carregarPerfilFinanceiro();
    } catch (error) {
      console.error("Erro ao salvar planejamento:", error);
      setMensagem("Erro ao salvar planejamento.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <section className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Planejamento Financeiro
          </h1>

          <p className="mt-2 text-lg text-slate-500">
            Organize sua renda, seus gastos previstos e acompanhe quanto pode
            sobrar no mês.
          </p>
        </div>

        {!editando ? (
          <button
            type="button"
            onClick={ativarEdicao}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Editar planejamento
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelarEdicao}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Cancelar edição
          </button>
        )}
      </section>

      {mensagem && (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-700">
          {mensagem}
        </div>
      )}

      {!editando && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Os dados estão em modo visualização. Clique em{" "}
          <strong>Editar planejamento</strong> para alterar as informações.
        </div>
      )}

      {editando && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
          Você está editando o planejamento. As alterações só serão salvas após
          clicar em <strong>Salvar planejamento</strong>.
        </div>
      )}

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <CardResumo
          icone="payments"
          titulo="Receita total"
          valor={formatarMoeda(receitaTotal)}
          descricao="Renda mensal somada com renda extra."
        />

        <CardResumo
          icone="receipt_long"
          titulo="Despesas previstas"
          valor={formatarMoeda(despesasPrevistas)}
          descricao="Soma dos gastos planejados para o mês."
        />

        <CardResumo
          icone="account_balance_wallet"
          titulo="Saldo planejado"
          valor={formatarMoeda(saldoPlanejado)}
          descricao="Receita total menos despesas previstas."
          destaque={saldoPlanejado >= 0 ? "positivo" : "negativo"}
        />
      </section>

      <section className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <span className="material-symbols-outlined">psychology</span>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">
                Base para IA futura
              </h2>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                IA futura
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              Os dados informados nesta tela serão usados futuramente pela IA do
              FinIA para gerar análises, sugestões e orientações financeiras
              personalizadas.
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={salvarPlanejamento}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Receitas mensais
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informe sua renda principal e possíveis valores extras.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <CampoNumero
              label="Renda mensal"
              value={form.rendaMensal}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("rendaMensal", valor)}
              placeholder="Ex: 2500"
            />

            <CampoNumero
              label="Renda extra"
              value={form.rendaExtra}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("rendaExtra", valor)}
              placeholder="Ex: 300"
            />
          </div>
        </section>

        <section className="mb-8 border-t border-slate-100 pt-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Despesas previstas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Cadastre os principais gastos planejados para o mês.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <CampoNumero
              label="Moradia"
              value={form.gastoMoradia}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("gastoMoradia", valor)}
              placeholder="Ex: 800"
            />

            <CampoNumero
              label="Água"
              value={form.gastoAgua}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("gastoAgua", valor)}
              placeholder="Ex: 80"
            />

            <CampoNumero
              label="Energia"
              value={form.gastoEnergia}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("gastoEnergia", valor)}
              placeholder="Ex: 150"
            />

            <CampoNumero
              label="Internet"
              value={form.gastoInternet}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("gastoInternet", valor)}
              placeholder="Ex: 100"
            />

            <CampoNumero
              label="Transporte"
              value={form.gastoTransporte}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("gastoTransporte", valor)}
              placeholder="Ex: 250"
            />

            <CampoNumero
              label="Alimentação"
              value={form.gastoAlimentacao}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("gastoAlimentacao", valor)}
              placeholder="Ex: 600"
            />

            <CampoNumero
              label="Outras despesas"
              value={form.outrasDespesas}
              disabled={!editando}
              onChange={(valor) => atualizarCampo("outrasDespesas", valor)}
              placeholder="Ex: 200"
            />

            <CampoNumero
              label="Valor planejado para guardar"
              value={form.valorPlanejadoGuardar}
              disabled={!editando}
              onChange={(valor) =>
                atualizarCampo("valorPlanejadoGuardar", valor)
              }
              placeholder="Ex: 400"
            />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Objetivo principal
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informe o principal foco financeiro do momento.
          </p>

          <textarea
            value={form.objetivoPrincipal}
            disabled={!editando}
            onChange={(e) =>
              atualizarCampo("objetivoPrincipal", e.target.value)
            }
            rows="4"
            className={`mt-6 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 ${
              !editando ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""
            }`}
            placeholder="Ex: montar reserva de emergência, quitar dívidas, comprar um notebook..."
          ></textarea>
        </section>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Resumo do planejamento
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Saldo planejado:{" "}
              <span
                className={`font-semibold ${
                  saldoPlanejado >= 0 ? "text-blue-600" : "text-red-500"
                }`}
              >
                {formatarMoeda(saldoPlanejado)}
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={!editando}
            className={`rounded-xl px-6 py-3 font-semibold shadow-sm transition ${
              editando
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-300 text-slate-500"
            }`}
          >
            Salvar planejamento
          </button>
        </div>
      </form>
    </main>
  );
}

function CardResumo({ icone, titulo, valor, descricao, destaque }) {
  const corValor =
    destaque === "positivo"
      ? "text-blue-600"
      : destaque === "negativo"
      ? "text-red-500"
      : "text-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
        <span className="material-symbols-outlined text-blue-600">{icone}</span>
      </div>

      <p className="text-sm font-medium text-slate-500">{titulo}</p>

      <h2 className={`mt-2 text-2xl font-bold ${corValor}`}>{valor}</h2>

      <p className="mt-2 text-sm text-slate-500">{descricao}</p>
    </div>
  );
}

function CampoNumero({ label, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 ${
          disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}

export default Planejamento;