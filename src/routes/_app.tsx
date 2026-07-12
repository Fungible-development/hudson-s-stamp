import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardCheck, LayoutDashboard, FileText, MapPin } from "lucide-react";
import { useActiveRole, useStore } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const adminNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/audits", label: "Audits", icon: ClipboardCheck },
];
const managerNav: NavItem[] = [{ to: "/manager", label: "Home", icon: LayoutDashboard }];

function AppLayout() {
  const role = useActiveRole();
  const nav = role === "admin" ? adminNav : managerNav;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <TopBar />
      <div className="mx-auto flex w-full max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground md:block">
          <nav className="flex flex-col gap-1 p-3">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`font-display flex items-center gap-3 rounded-sm px-3 py-2 text-sm uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24 md:pb-8">
          {hydrated ? <Outlet /> : null}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-sidebar text-sidebar-foreground md:hidden">
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`font-display flex flex-1 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-widest ${
                active ? "text-sidebar-primary" : "text-sidebar-foreground/70"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function TopBar() {
  const activeLocationId = useStore((s) => s.activeLocationId);
  const setActiveLocation = useStore((s) => s.setActiveLocation);
  const locations = useStore((s) => s.locations);
  const devRole = useStore((s) => s.devRole);
  const setDevRole = useStore((s) => s.setDevRole);
  const role = useActiveRole();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-ink px-3 text-paper sm:px-5">
      <Link to="/dashboard" className="font-display flex items-center gap-2 text-lg font-bold uppercase tracking-wider">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-paper text-ink">H</span>
        <span className="hidden sm:inline">Hudson&apos;s Compliance</span>
        <span className="sm:hidden">Hudson&apos;s</span>
      </Link>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        {role === "admin" && (
          <label className="flex min-w-0 items-center gap-2 rounded-sm border border-paper/20 bg-ink px-2 py-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-paper/70" />
            <select
              className="min-w-0 bg-transparent text-paper outline-none"
              value={activeLocationId}
              onChange={(e) => setActiveLocation(e.target.value)}
            >
              <option value="all" className="text-ink">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id} className="text-ink">
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          onClick={() => setDevRole(role === "admin" ? "manager" : "admin")}
          className="font-mono flex shrink-0 items-center gap-1.5 rounded-sm border border-flag/60 bg-flag/10 px-2 py-1 text-[10px] uppercase tracking-widest text-flag"
          title="Developer role toggle"
        >
          <span className="opacity-70">dev</span>
          <span>{role}</span>
          {devRole && <span className="opacity-70">·override</span>}
        </button>
      </div>
    </header>
  );
}