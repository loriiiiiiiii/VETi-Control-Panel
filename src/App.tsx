import { useState } from "react";
import { Eye, House, Play } from "lucide-react";
import { BackendSelector } from "@/components/BackendSelector";
import { HomeView } from "@/components/HomeView";
import { MonitorView } from "@/components/MonitorView";
import { PowerButtons } from "@/components/PowerButtons";
import { ScriptRunner } from "@/components/ScriptRunner";
import {
  TabBarRoot,
  TabBarList,
  TabBarContent,
  type TabBarItem,
} from "@/components/ui/tab-bar";
import { Toaster } from "@/components/ui/sonner";
import { BackendProvider } from "@/context/BackendContext";
import { cn } from "@/lib/utils";

const TAB_ITEMS: TabBarItem[] = [
  { id: "home", label: "Home", icon: House },
  { id: "scripts", label: "Scripts", icon: Play },
  { id: "monitor", label: "Monitor", icon: Eye },
];

export function App() {
  return (
    <BackendProvider>
      <AppShell />
      <Toaster
        richColors
        closeButton
        position="top-center"
        className="pt-[max(0.5rem,env(safe-area-inset-top))]"
      />
    </BackendProvider>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <TabBarRoot value={activeTab} onValueChange={setActiveTab}>
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
          <div
            className={cn(
              "mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3",
              "pt-[max(0.75rem,env(safe-area-inset-top))]",
            )}
          >
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

        <main
          className={cn(
            "mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8",
            "pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
          )}
        >
          <TabBarContent value="home" className="flex flex-1 flex-col justify-center outline-none">
            <HomeView />
          </TabBarContent>
          <TabBarContent value="scripts" className="flex-1 outline-none">
            <ScriptRunner />
          </TabBarContent>
          <TabBarContent value="monitor" className="flex-1 outline-none">
            <MonitorView />
          </TabBarContent>
        </main>

        <TabBarList items={TAB_ITEMS} />
      </div>
    </TabBarRoot>
  );
}
