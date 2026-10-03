import { formatarMoeda, formatarPercentual } from "../utils/finance";

export default function GoalProgress({ nome, atual, alvo, oculto = false }) {
  const total = Number(alvo) || 0;
  const percentual = total > 0 ? Math.min(100, Math.max(0, (Number(atual) || 0) / total * 100)) : 0;
  return (
    <div className="finia-goal-progress">
      <div className="finia-goal-progress-track" role={oculto ? undefined : "progressbar"}
        aria-label={oculto ? undefined : "Progresso da meta " + nome}
        aria-valuemin={oculto ? undefined : 0} aria-valuemax={oculto ? undefined : 100}
        aria-valuenow={oculto ? undefined : Number(percentual.toFixed(1))}
        aria-valuetext={oculto ? undefined : formatarPercentual(percentual) + " concluído"}>
        <div style={{ width: oculto ? "0%" : percentual + "%" }} />
      </div>
      <div className="finia-goal-progress-label">
        <span><strong className="finia-number">{oculto ? "••••" : formatarMoeda(atual)}</strong> guardados</span>
        <span>de <span className="finia-number">{oculto ? "••••" : formatarMoeda(alvo)}</span></span>
      </div>
    </div>
  );
}
