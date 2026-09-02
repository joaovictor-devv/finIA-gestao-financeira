import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/planejamento", label: "Planejamento", icon: "calendar_today" },
    { path: "/metas", label: "Metas", icon: "ads_click" },
    { path: "/insights", label: "Insights", icon: "lightbulb" },
    { path: "/revisao-mensal", label: "Revisão", icon: "assessment" },
    { path: "/perfil", label: "Perfil", icon: "person" },
  ];

  const mobileItems = [
    { path: "/", label: "Home", icon: "dashboard" },
    { path: "/planejamento", label: "Planejar", icon: "calendar_today" },
    { path: "/metas", label: "Metas", icon: "ads_click" },
    { path: "/insights", label: "IA", icon: "lightbulb" },
    { path: "/perfil", label: "Perfil", icon: "person" },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-slate-200 bg-white py-6 shadow-sm md:flex">
        <div className="mb-10 px-6">
          <h1 className="text-2xl font-bold text-blue-600">FinIA</h1>
          <p className="text-sm text-slate-500">Inteligência Financeira</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  active
                    ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
              U
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Usuário FinIA
              </p>
              <p className="text-xs text-slate-500">Assistente financeiro</p>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
        {mobileItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs transition-colors ${
                active ? "text-blue-600" : "text-slate-500"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${
                  active ? "font-semibold" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Sidebar;