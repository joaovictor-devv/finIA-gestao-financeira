import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { formatarMoeda } from "../utils/finance";
import { carregarHistoricoChat, observarHistoricoChat, salvarHistoricoChat } from "../utils/historicoChat";

const perguntasProntas = [
  { icon: "shopping_bag", texto: "Quanto posso gastar sem prejudicar minhas metas?" },
  { icon: "lightbulb", texto: "Por que minha situação está assim?" },
  { icon: "savings", texto: "O que posso mudar para ter mais dinheiro disponível?" },
  { icon: "flag", texto: "Minhas metas estão pesando muito no orçamento?" },
];

function Insights() {
  const [falhaStatus, setFalhaStatus] = useState(false);
  const [statusIA, setStatusIA] = useState(null);
  const [capacidade, setCapacidade] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [conversa, setConversa] = useState(carregarHistoricoChat);
  const mensagensAtuais = useRef(conversa);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const conversaRef = useRef(null);
  const perguntaRef = useRef(null);

  useEffect(() => {
    let ativo = true;
    api.get("/ia/status")
      .then((response) => { if (ativo) setStatusIA(response.data); })
      .catch(() => { if (ativo) setFalhaStatus(true); });
    api.get("/analise/capacidade-gastos")
      .then((response) => { if (ativo) setCapacidade(response.data); })
      .catch(() => { /* O chat continua disponível sem o resumo lateral. */ });
    return () => { ativo = false; };
  }, []);

  useEffect(() => observarHistoricoChat((mensagens) => {
    mensagensAtuais.current = mensagens;
    setConversa(mensagens);
  }), []);

  function atualizarConversa(mensagens) {
    const atualizadas = salvarHistoricoChat(mensagens);
    mensagensAtuais.current = atualizadas;
    setConversa(atualizadas);
  }

  function limparConversa() {
    atualizarConversa([]);
    setErro("");
    setPergunta("");
  }

  useEffect(() => {
    const painel = conversaRef.current;
    if (painel) painel.scrollTop = painel.scrollHeight;
  }, [conversa, enviando]);

  async function enviar(event) {
    event.preventDefault();
    const texto = pergunta.trim();
    if (!texto || enviando || !statusIA?.configurada) return;
    setErro("");
    const anteriores = mensagensAtuais.current;
    atualizarConversa([...anteriores, { tipo: "usuario", texto }]);
    setPergunta("");
    setEnviando(true);
    try {
      const response = await api.post("/ia/perguntar", { pergunta: texto });
      atualizarConversa([...mensagensAtuais.current, { tipo: "finia", texto: response.data.resposta }]);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível falar com a FinIA agora. Tente novamente.");
      setPergunta(texto);
      // Uma pergunta sem resposta não deve parecer concluída ao reabrir a tela.
      const ultimo = mensagensAtuais.current.at(-1);
      if (ultimo?.tipo === "usuario" && ultimo.texto === texto) {
        atualizarConversa(mensagensAtuais.current.slice(0, -1));
      }
    } finally {
      setEnviando(false);
    }
  }

  function usarPerguntaPronta(texto) {
    setPergunta(texto);
    perguntaRef.current?.focus({ preventScroll: true });
  }

  return (
    <main className="finia-page">
      <PageHeader pergunta="Sua assistente" titulo="Pergunte à FinIA"
        descricao="Tire dúvidas sobre seu planejamento financeiro e consulte suas respostas durante esta sessão." />
      {erro && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</div>}

      <div className="finia-chat-layout">
        <section className="finia-card finia-chat" aria-label="Conversa com a FinIA">
          <div className="finia-chat-header">
            <div className="flex items-center gap-3">
              <span className="finia-icon-tile"><Icon name="auto_awesome" /></span>
              <div><p className="text-sm font-extrabold">FinIA</p><p className="mt-0.5 text-xs text-slate-500">Assistente de planejamento financeiro</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {conversa.length > 0 && (
                <button type="button" disabled={enviando} onClick={limparConversa}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:text-red-700 disabled:opacity-50">
                  Limpar conversa
                </button>
              )}
              <span className={"rounded-full px-3 py-1.5 text-[11px] font-bold " + (statusIA?.configurada ? "bg-cyan-50 text-cyan-800" : "bg-slate-100 text-slate-600")}>
                {falhaStatus ? "Conexão indisponível" : !statusIA ? "Verificando..." : statusIA.configurada ? "IA configurada" : "IA não configurada"}
              </span>
            </div>
          </div>

          <div ref={conversaRef} role="log" aria-label="Mensagens da conversa" aria-live="polite" aria-relevant="additions text" className="finia-chat-log">
            {conversa.length === 0 ? (
              <div className="finia-chat-welcome">
                <span className="finia-chat-orb"><Icon name="auto_awesome" /></span>
                <h2>O que vamos entender hoje?</h2>
                <p>Escolha uma pergunta ou escreva do seu jeito. Vamos olhar para o que importa para você.</p>
                <div className="finia-chat-prompts">
                  {perguntasProntas.map(({ texto, icon }) => (
                    <button key={texto} type="button" onClick={() => usarPerguntaPronta(texto)} disabled={!statusIA?.configurada} className="finia-chat-prompt">
                      <Icon name={icon} /><span>{texto}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : conversa.map((mensagem, index) => (
              <div key={index} className={"finia-chat-message " + (mensagem.tipo === "usuario" ? "is-user" : "")}>
                <div className="finia-chat-bubble"><small>{mensagem.tipo === "usuario" ? "VOCÊ" : "FINIA"}</small>{mensagem.texto}</div>
              </div>
            ))}
            {enviando && <div className="finia-chat-message"><div className="finia-chat-bubble"><small>FINIA</small>Preparando sua resposta...</div></div>}
          </div>

          <form onSubmit={enviar} className="finia-chat-composer">
            {!statusIA?.configurada && (
              <p>{falhaStatus ? "Não foi possível verificar o serviço. Recarregue a página para tentar novamente." : !statusIA ? "Verificando disponibilidade..." : "As explicações por IA ainda não estão disponíveis. Os cálculos e simulações continuam funcionando."}</p>
            )}
            <div>
              <textarea ref={perguntaRef} value={pergunta} onChange={(event) => setPergunta(event.target.value)}
                placeholder="Como posso te ajudar com seu dinheiro?" rows="2" aria-label="Sua pergunta para a FinIA"
                maxLength={2000} className="finia-input" disabled={!statusIA?.configurada || enviando} />
              <button type="submit" disabled={!statusIA?.configurada || enviando || !pergunta.trim()} className="finia-button-primary" aria-label="Enviar pergunta"><Icon name="arrow_upward" /></button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              O histórico fica somente nesta aba do navegador, inclusive ao navegar entre páginas ou atualizar a tela.
              Você pode apagá-lo a qualquer momento; ele não é salvo na conta do FinIA.
            </p>
          </form>
        </section>

        <aside className="finia-chat-context space-y-5">
          <section className="finia-card finia-panel">
            <p className="finia-eyebrow">SEU CONTEXTO</p>
            <h2 className="text-lg font-extrabold tracking-tight">Seu mês, agora</h2>
            {capacidade ? (
              <>
                <p className="mt-5 text-xs text-slate-500">Sobra após reserva e metas</p>
                <p className={"finia-number mt-2 text-2xl font-extrabold " + (Number(capacidade.margemAposMetas) < 0 ? "text-red-700" : "text-cyan-800")}>{formatarMoeda(capacidade.margemAposMetas)}</p>
                <div className="mt-4"><StatusBadge valor={capacidade.classificacao} /></div>
                <details className="finia-help mt-5"><summary>Entender esse valor</summary><p>{explicacaoCurta(capacidade)}</p></details>
              </>
            ) : <p className="mt-3 text-sm leading-7 text-slate-600">Seu resumo aparece aqui quando o perfil e o orçamento estiverem disponíveis.</p>}
            <Link to="/planejamento" className="finia-text-link mt-4">Abrir meu orçamento<Icon name="arrow_forward" /></Link>
          </section>
          <section className="px-2">
            <details className="finia-help !border-0 !pt-0">
              <summary>Como aproveitar a FinIA?</summary>
              <p>Pergunte sobre gastos, prazos e metas. Mantenha seu orçamento atualizado para receber explicações com base na sua situação.</p>
              <p>Para mudar valores ou testar uma decisão, use as telas de Orçamento, Metas e Simulações.</p>
            </details>
            <Link to="/simulacoes" className="finia-text-link mt-2"><Icon name="query_stats" />Testar uma decisão</Link>
          </section>
        </aside>
      </div>
    </main>
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
