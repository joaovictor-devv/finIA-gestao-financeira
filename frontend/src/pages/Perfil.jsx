import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
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
      <main className="finia-page">
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
    <main className="finia-page">
      <PageHeader
        pergunta="Seu espaço"
        titulo="Meu perfil"
        descricao="Seu planejamento começa com informações atualizadas."
      />

      {erro && <Feedback tipo="erro">{erro}</Feedback>}
      {sucesso && <Feedback>{sucesso}</Feedback>}

      <section className="finia-form-layout">
        <form onSubmit={salvar} className="finia-card p-6 sm:p-8"><fieldset disabled={salvando}>
          <div className="finia-form-intro">
            <div className="finia-profile-avatar" aria-hidden="true">{nome.trim().slice(0, 1).toLocaleUpperCase("pt-BR") || <Icon name="person" />}</div>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold tracking-tight">Do seu jeito.</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Como você quer aparecer na FinIA.</p>
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
              ajuda="Informe seu saldo disponível e atualize quando ele mudar."
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
            <p className="mt-1 text-sm leading-6 text-slate-500">Seu ponto de partida para usar a FinIA.</p>
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
                to="/planejamento"
                descricao={orcamentoConfigurado ? "Configurado" : "Falta informar renda e gastos"}
                ok={Boolean(orcamentoConfigurado)}
              />
              <StatusLinha
                icon="flag"
                titulo="Metas"
                to="/metas"
                descricao={`${quantidadeMetas} ${quantidadeMetas === 1 ? "meta cadastrada" : "metas cadastradas"}`}
                ok={quantidadeMetas > 0}
              />
            </div>
          </section>

          <details className="finia-help mx-2">
            <summary>Qual a diferença entre saldo e orçamento?</summary>
            <p>O saldo é o dinheiro disponível hoje. O orçamento mostra quanto entra, sai e fica reservado a cada mês.</p>
            <Link to="/planejamento" className="finia-text-link mt-2">Organizar meu mês<Icon name="arrow_forward" /></Link>
          </details>
        </div>
      </section>
    </main>
  );
}

function StatusLinha({ icon, titulo, descricao, ok, to }) {
  const conteudo = (
    <>
      <span className="finia-icon-tile"><Icon name={icon} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{titulo}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{descricao}</p>
      </div>
      <Icon name={to ? "chevron_right" : ok ? "check_circle" : "radio_button_unchecked"}
        className={ok && !to ? "text-emerald-700" : "text-slate-500"} />
    </>
  );
  const estilo = "flex items-center gap-3 rounded-2xl border border-slate-100 p-4";
  return to ? <Link to={to} className={estilo + " transition hover:border-cyan-200 hover:bg-cyan-50/50"}>{conteudo}</Link> : <div className={estilo}>{conteudo}</div>;
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
