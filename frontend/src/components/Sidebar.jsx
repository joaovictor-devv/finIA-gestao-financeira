import { Link, useLocation } from "react-router-dom";
import Icon from "./Icon";

const menuItems = [
  { path: "/", label: "Início", icon: "space_dashboard" },
  { path: "/planejamento", label: "Meu Orçamento", icon: "account_balance_wallet" },
  { path: "/metas", label: "Metas", icon: "flag" },
  { path: "/simulacoes", label: "Simulações", icon: "query_stats" },
  { path: "/insights", label: "FinIA", icon: "auto_awesome" },
];
const mobileItems = menuItems;

function Sidebar() {
  const { pathname } = useLocation();
  const estaAtivo = (path) => path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <>
      <a href="#conteudo" className="finia-skip-link">Pular para o conteúdo</a>
      <aside className="finia-sidebar">
        <div className="px-6 pb-9 pt-8">
          <Link to="/" className="flex items-center gap-3 rounded-xl" aria-label="FinIA — Início">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7490] to-[#22D3EE] text-white shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined !text-[23px]">auto_awesome</span>
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-[#0A192F]">FinIA</p>
              <p className="text-xs font-medium text-slate-500">Seu dinheiro, mais claro</p>
            </div>
          </Link>
        </div>
        <p className="finia-nav-caption">SEU DIA A DIA</p>
        <nav className="space-y-1.5 px-4" aria-label="Navegação principal">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} aria-current={estaAtivo(item.path) ? "page" : undefined}
              className={"finia-nav-link " + (estaAtivo(item.path) ? "is-active" : "")}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {estaAtivo(item.path) && <span aria-hidden="true" className="finia-nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="finia-sidebar-bottom">
          <Link to="/insights" className="finia-assistant-link">
            <Icon name="auto_awesome" />
            <span><strong>Uma ajuda para decidir</strong><small>Converse com a FinIA</small></span>
            <Icon name="arrow_forward" />
          </Link>
          <Link to="/perfil" aria-current={estaAtivo("/perfil") ? "page" : undefined}
            className={"finia-nav-link mt-5 " + (estaAtivo("/perfil") ? "is-active" : "")}>
            <Icon name="person" /><span>Meu perfil</span><Icon name="chevron_right" className="ml-auto" />
          </Link>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2.5" aria-label="FinIA — Início">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7490] to-[#22D3EE] text-white">
            <span aria-hidden="true" className="material-symbols-outlined !text-[20px]">auto_awesome</span>
          </div>
          <span className="text-lg font-extrabold text-[#0A192F]">FinIA</span>
        </Link>
        <Link to="/perfil" aria-label="Abrir perfil" className={"finia-icon-button " + (estaAtivo("/perfil") ? "bg-cyan-50 text-cyan-800" : "bg-slate-50 text-slate-600")}>
          <Icon name="person" />
        </Link>
      </header>

      <nav className="finia-mobile-nav" aria-label="Navegação móvel">
        {mobileItems.map((item) => (
          <Link key={item.path} to={item.path} aria-current={estaAtivo(item.path) ? "page" : undefined}
            className={estaAtivo(item.path) ? "is-active" : ""}>
            <span className="finia-mobile-icon"><Icon name={item.icon} /></span>
            <span>{item.label === "Meu Orçamento" ? "Orçamento" : item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

export default Sidebar;
