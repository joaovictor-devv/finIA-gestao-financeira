import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { formatarMoeda } from "../utils/finance";

const perguntasProntas = [
  "Quanto posso gastar sem prejudicar minhas metas?",
  "Por que minha situação está assim?",
  "O que posso mudar para ter mais dinheiro disponível?",
  "Minhas metas estão pesando muito no orçamento?",
];

function Insights() {
  const [falhaStatus, setFalhaStatus] = useState(false);
  const [statusIA, setStatusIA] = useState(null);
  const [capacidade, setCapacidade] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [conversa, setConversa] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const status = await api.get("/ia/status");
        setStatusIA(status.data);
      } catch {
        setFalhaStatus(true);
      }

      try {
        const response = await api.get("/analise/capacidade-gastos");
        setCapacidade(response.data);
      } catch {
        setCapacidade(null);
      }
    }

    carregar();
  }, []);

  async function enviar(event) {
    event?.preventDefault();
    const texto = pergunta.trim();
    if (!texto || enviando) return;

    setErro("");
    setConversa((atual) => [...atual, { tipo: "usuario", texto }]);
    setPergunta("");
    setEnviando(true);

    try {
      const response = await api.post("/ia/perguntar", { pergunta: texto });
      setConversa((atual) => [...atual, { tipo: "finia", texto: response.data.resposta }]);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível falar com a FinIA agora. Tente novamente.");
      setPergunta(texto);
      setConversa((atual) => atual.slice(0, -1));
    } finally {
      setEnviando(false);
    }
  }

  function usarPerguntaPronta(texto) {
    setPergunta(texto);
  }

  return (
    <main className="min-h-screen bg-[#F6FAFE] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
      <PageHeader
        pergunta="O que esses números significam?"
        titulo="Pergunte à FinIA"
        descricao="A FinIA recebe os cálculos do sistema e explica sua situação em linguagem simples."
      />

      {erro && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</div>}

      <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-6">
          <section className="finia-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-500">Sua situação agora</p>
                {capacidade ? (
                  <>
                    <div className="mt-2"><StatusBadge valor={capacidade.classificacao} /></div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{explicacaoCurta(capacidade)}</p>
                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">Disponível depois de tudo</p>
                      <p className="finia-number mt-1 text-2xl font-extrabold text-cyan-800">{formatarMoeda(capacidade.margemAposMetas)}</p>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-600">Configure seu perfil e orçamento para a FinIA ter números reais para explicar.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <p className="font-extrabold text-[#0A192F]">Como funciona?</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <Etapa numero="1" texto="O sistema calcula seus números." />
              <Etapa numero="2" texto="A FinIA recebe os resultados prontos." />
              <Etapa numero="3" texto="Ela explica o que eles significam para você." />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">A IA não substitui os cálculos do motor financeiro e não é usada como consultora de investimentos.</p>
          </section>
        </div>

        <section className="finia-card flex min-h-[620px] flex-col overflow-hidden">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A192F] text-cyan-300">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0A192F]">FinIA</h2>
                  <p className="text-xs text-slate-500">Assistente financeiro</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusIA?.configurada ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {falhaStatus ? "Conexão indisponível" : !statusIA ? "Verificando..." : statusIA.configurada ? "IA configurada" : "IA não configurada"}
              </span>
            </div>
          </div>

          <div role="log" aria-live="polite" className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            {conversa.length === 0 ? (
              <div>
                <div className="max-w-xl rounded-2xl rounded-tl-md bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                  Olá! Posso explicar sua situação, suas metas e quanto o orçamento permite gastar. Escolha uma pergunta ou escreva do seu jeito.
                </div>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {perguntasProntas.map((texto) => (
                    <button
                      key={texto}
                      type="button"
                      onClick={() => usarPerguntaPronta(texto)}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold leading-5 text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50/50 hover:text-cyan-900"
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              conversa.map((mensagem, index) => (
                <div key={`${mensagem.tipo}-${index}`} className={`flex ${mensagem.tipo === "usuario" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl p-4 text-sm leading-7 ${mensagem.tipo === "usuario" ? "rounded-br-md bg-[#0A192F] text-white" : "rounded-tl-md bg-slate-50 text-slate-700"}`}>
                    {mensagem.texto}
                  </div>
                </div>
              ))
            )}
            {enviando && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">FinIA está explicando...</div>
              </div>
            )}
          </div>

          <form onSubmit={enviar} className="border-t border-slate-100 bg-white p-4 sm:p-5">
            {!statusIA?.configurada && (
              <p className="mb-3 text-xs font-semibold leading-5 text-slate-500">{falhaStatus ? "Não foi possível verificar o serviço. Recarregue a página para tentar novamente." : !statusIA ? "Verificando disponibilidade..." : "As explicações por IA ainda não estão disponíveis. Os cálculos e simulações continuam funcionando."}</p>
            )}
            <div className="flex gap-2">
              <textarea
                value={pergunta}
                onChange={(event) => setPergunta(event.target.value)}
                placeholder="Ex.: Posso gastar R$ 800 agora?"
                rows="2"
                aria-label="Sua pergunta para a FinIA"
                maxLength={2000}
                className="finia-input min-h-12 flex-1 resize-none px-4 py-3"
                disabled={!statusIA?.configurada || enviando}
              />
              <button
                type="submit"
                disabled={!statusIA?.configurada || enviando || !pergunta.trim()}
                className="finia-button-primary flex w-12 shrink-0 items-center justify-center self-stretch"
                aria-label="Enviar pergunta"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function Etapa({ numero, texto }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-cyan-800 shadow-sm">{numero}</span>
      <span>{texto}</span>
    </div>
  );
}

function explicacaoCurta(capacidade) {
  const sobra = Number(capacidade.margemAposMetas || 0);
  if (sobra > 0) {
    return `Depois de considerar seus gastos, o valor que deseja guardar e suas metas, ainda sobram ${formatarMoeda(sobra)} por mês.`;
  }
  if (sobra === 0) {
    return "Depois de considerar seus gastos, o valor que deseja guardar e suas metas, toda a renda mensal fica comprometida.";
  }
  return `Seus compromissos mensais ultrapassam a renda em ${formatarMoeda(Math.abs(sobra))}. O ideal é ajustar o orçamento ou as metas.`;
}

export default Insights;
