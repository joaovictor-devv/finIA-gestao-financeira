import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { path: "/", label: "Dashboard", icon: "space_dashboard" },
  { path: "/planejamento", label: "Meu Orçamento", icon: "account_balance_wallet" },
  { path: "/metas", label: "Metas", icon: "flag" },
  { path: "/simulacoes", label: "Simulações", icon: "query_stats" },
  { path: "/insights", label: "FinIA", icon: "auto_awesome" },
  { path: "/perfil", label: "Perfil", icon: "person" },
];

const mobileItems = menuItems.filter((item) => item.path !== "/perfil");

function Sidebar() {
  const location = useLocation();

  function estaAtivo(path) {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-6 pb-6 pt-7">
          <Link to="/" className="flex items-center gap-3 rounded-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7490] to-[#22D3EE] text-white shadow-sm">
              <span className="material-symbols-outlined !text-[23px]">auto_awesome</span>
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-[#0A192F]">FinIA</p>
              <p className="text-xs font-medium text-slate-500">Seu dinheiro, mais claro</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Navegação principal">
          {menuItems.map((item) => {
            const active = estaAtivo(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-cyan-50 text-cyan-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0A192F]"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${active ? "[font-variation-settings:'FILL'_1]" : ""}`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
          <p className="text-sm font-bold text-[#0A192F]">Como o FinIA funciona?</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Você informa o básico. O sistema calcula, simula e a FinIA explica.
          </p>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7490] to-[#22D3EE] text-white">
            <span className="material-symbols-outlined !text-[20px]">auto_awesome</span>
          </div>
          <span className="text-lg font-extrabold text-[#0A192F]">FinIA</span>
        </Link>
        <Link
          to="/perfil"
          aria-label="Abrir perfil"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            estaAtivo("/perfil") ? "bg-cyan-50 text-cyan-800" : "bg-slate-50 text-slate-600"
          }`}
        >
          <span className="material-symbols-outlined">person</span>
        </Link>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
        aria-label="Navegação móvel"
      >
        {mobileItems.map((item) => {
          const active = estaAtivo(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                active ? "text-cyan-800" : "text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined !text-[22px]">{item.icon}</span>
              <span className="max-w-full truncate">{item.label === "Meu Orçamento" ? "Orçamento" : item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Sidebar;
