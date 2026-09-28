import { useEffect, useState } from "react";
import CurrencyInput from "../components/CurrencyInput";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

function Perfil() {
  const [nome, setNome] = useState("");
  const [saldo, setSaldo] = useState("");
  const [perfil, setPerfil] = useState(null);
  const [quantidadeMetas, setQuantidadeMetas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.get("/perfil-financeiro");
        setPerfil(response.data);
        setNome(response.data.nome || "");
        setSaldo(String(response.data.saldoAtual ?? ""));
      } catch (error) {
        if (error.response?.status !== 404) {
          setErro(error.response?.data?.mensagem || "Não foi possível carregar seu perfil.");
        }
      }

      try {
        const response = await api.get("/metas");
        setQuantidadeMetas(response.data?.length || 0);
      } catch {
        setQuantidadeMetas(0);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  async function salvar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      const response = await api.put("/perfil-financeiro", {
        nome: nome.trim() || "Usuário",
        saldoAtual: numero(saldo),
      });
      setPerfil(response.data);
      setNome(response.data.nome || "");
      setSaldo(String(response.data.saldoAtual ?? ""));
      setSucesso("Perfil atualizado. Seu novo saldo já será usado nos cálculos do FinIA.");
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível salvar seu perfil.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-[#F6FAFE] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
        <p className="font-semibold text-slate-600">Carregando perfil...</p>
      </main>
    );
  }

  const orcamentoConfigurado = perfil && (
    Number(perfil.rendaMensal || 0) > 0 ||
    Number(perfil.gastosMensais || 0) > 0 ||
    Number(perfil.valorPlanejadoGuardar || 0) > 0
  );

  return (
    <main className="min-h-screen bg-[#F6FAFE] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
      <PageHeader
        pergunta="Quanto tenho agora?"
        titulo="Perfil"
        descricao="Mantenha seu nome e saldo atualizados. O saldo é o dinheiro que você possui disponível hoje."
      />

      {erro && <Feedback tipo="erro">{erro}</Feedback>}
      {sucesso && <Feedback>{sucesso}</Feedback>}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <form onSubmit={salvar} className="finia-card p-6 sm:p-8"><fieldset disabled={salvando}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A192F]">Seus dados básicos</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Só usamos aqui o que realmente ajuda o sistema a funcionar.</p>
            </div>
          </div>

          <div className="mt-7 space-y-6">
            <label className="block">
              <span className="text-sm font-bold text-[#0A192F]">Como quer ser chamado?</span>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Seu nome"
                maxLength={100}
                className="finia-input mt-2 h-12 px-4"
              />
            </label>

            <CurrencyInput
              label="Quanto dinheiro você possui disponível hoje?"
              ajuda="Você pode atualizar esse valor manualmente quando quiser. Não é preciso cadastrar transações."
              value={saldo}
              onChange={(event) => setSaldo(event.target.value)}
              placeholder="1.200,00"
              required
            />
          </div>

          <button type="submit" disabled={salvando} className="finia-button-primary mt-8 w-full px-5 py-3.5 sm:w-auto">
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </fieldset></form>

        <div className="space-y-6">
          <section className="finia-card p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-[#0A192F]">Seu FinIA</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Um resumo rápido do que já está configurado.</p>
            <div className="mt-6 space-y-3">
              <StatusLinha
                icon="account_balance_wallet"
                titulo="Saldo atual"
                descricao={perfil ? "Informado" : "Ainda não informado"}
                ok={Boolean(perfil)}
              />
              <StatusLinha
                icon="receipt_long"
                titulo="Orçamento"
                descricao={orcamentoConfigurado ? "Configurado" : "Falta informar renda e gastos"}
                ok={Boolean(orcamentoConfigurado)}
              />
              <StatusLinha
                icon="flag"
                titulo="Metas"
                descricao={`${quantidadeMetas} ${quantidadeMetas === 1 ? "meta cadastrada" : "metas cadastradas"}`}
                ok={quantidadeMetas > 0}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <div className="flex gap-3">
              <span className="material-symbols-outlined mt-0.5 text-cyan-800">info</span>
              <div>
                <p className="font-extrabold text-[#0A192F]">Saldo não é orçamento</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">O saldo diz quanto você tem agora. O orçamento diz quanto entra, sai e deve ficar reservado a cada mês.</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatusLinha({ icon, titulo, descricao, ok }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[#0A192F]">{titulo}</p>
        <p className="mt-0.5 text-xs text-slate-500">{descricao}</p>
      </div>
      <span className={`material-symbols-outlined !text-[20px] ${ok ? "text-emerald-600" : "text-slate-300"}`}>
        {ok ? "check_circle" : "radio_button_unchecked"}
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

export default Perfil;
