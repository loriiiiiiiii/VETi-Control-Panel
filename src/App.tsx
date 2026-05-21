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
        <header
          className={cn(
            "sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md",
            "pt-[env(safe-area-inset-top)]",
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

        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-6 sm:px-10 sm:py-8">
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

        {/* Spacer matching the fixed tab bar height so content scrolls clear of it */}
        <div className="h-[calc(4rem+env(safe-area-inset-bottom))]" aria-hidden />
        <TabBarList items={TAB_ITEMS} />
      </div>
    </TabBarRoot>
  );
}
