import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router";
import { ClipboardList, Eye, House, Play } from "lucide-react";
import { BackendSelector } from "@/components/BackendSelector";
import { HomeView } from "@/components/HomeView";
import { MonitorView } from "@/components/MonitorView";
import { PowerButtons } from "@/components/PowerButtons";
import { ResultsView } from "@/components/ResultsView";
import { ScriptRunner } from "@/components/ScriptRunner";
import {
  TabBarRoot,
  TabBarList,
  type TabBarItem,
} from "@/components/ui/tab-bar";
import { Toaster } from "@/components/ui/sonner";
import { BackendProvider } from "@/context/BackendContext";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { cn } from "@/lib/utils";

const TAB_ITEMS: TabBarItem[] = [
  { id: "home", label: "Home", icon: House },
  { id: "scripts", label: "Scripts", icon: Play },
  { id: "results", label: "Results", icon: ClipboardList },
  { id: "monitor", label: "Monitor", icon: Eye },
];

export function App() {
  return (
    <BackendProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomeView />} />
          <Route path="scripts" element={<ScriptRunner />} />
          <Route path="results/*" element={<ResultsView />} />
          <Route path="monitor" element={<MonitorView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster
        richColors
        closeButton
        position="top-center"
        className="pt-[max(0.5rem,var(--inset-top))]"
      />
    </BackendProvider>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  useAndroidBackButton();

  const firstSegment = location.pathname.split("/").filter(Boolean)[0];
  const activeTab = firstSegment ?? "home";

  return (
    <TabBarRoot
      value={activeTab}
      onValueChange={(id) => {
        const path = id === "home" ? "/" : `/${id}`;
        const replace = id === "home" || activeTab !== "home";
        navigate(path, { replace });
      }}
    >
      <div className="flex min-h-dvh flex-col bg-background">
        <header
          className={cn(
            "sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md",
            "pt-[var(--inset-top)]",
          )}
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Interaction Board
              </h1>
              <p className="text-xs text-muted-foreground sm:block">VETi control panel</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <BackendSelector />
              <PowerButtons />
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-[10%] py-6 sm:px-10 sm:py-8">
          <Outlet />
        </main>

        <div className="h-[calc(4rem+var(--inset-bottom))]" aria-hidden />
        <TabBarList items={TAB_ITEMS} />
      </div>
    </TabBarRoot>
  );
}
