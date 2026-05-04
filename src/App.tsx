import { useMemo, useState } from "react";
import { BackendSelector } from "@/components/BackendSelector";
import { DisplaySource } from "@/components/DisplaySource";
import { PowerButtons } from "@/components/PowerButtons";
import { PrimaryPadActions } from "@/components/PrimaryPadActions";
import { PupilMonitor } from "@/components/PupilMonitor";
import { ScriptRunner } from "@/components/ScriptRunner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { BackendProvider } from "@/context/BackendContext";
import { cn } from "@/lib/utils";

type SheetKind = "scripts" | "display" | "pupil" | null;

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
  const [sheet, setSheet] = useState<SheetKind>(null);

  const openOrToggle = (next: Exclude<SheetKind, null>) => {
    setSheet((cur) => (cur === next ? null : next));
  };

  const sheetMeta = useMemo(() => {
    switch (sheet) {
      case "scripts":
        return { title: "Scripts", titleId: "sheet-scripts-title" };
      case "display":
        return { title: "Display source", titleId: "sheet-display-title" };
      case "pupil":
        return { title: "Pupil monitor", titleId: "sheet-pupil-title" };
      default:
        return { title: "", titleId: "sheet-empty" };
    }
  }, [sheet]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div
          className={cn(
            "mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5",
            "pt-[max(0.75rem,env(safe-area-inset-top))]",
          )}
        >
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Interaction Board
            </h1>
            <p className="text-xs text-muted-foreground">VETi control panel</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <BackendSelector />
            <PowerButtons />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10",
          // pb must equal pt + nav-height so justify-center lands in the visible area.
          // nav ≈ 4.35rem (pt-2 + min-h-14 buttons + pb-0.35rem); base pt=2rem, sm pt=2.5rem.
          "pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(7rem+env(safe-area-inset-bottom))]",
        )}
      >
        <PrimaryPadActions />
      </main>

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-md",
          "pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2",
        )}
        aria-label="More controls"
      >
        <div className="mx-auto flex max-w-lg gap-2 px-3">
          <DockButton
            label="Scripts"
            onClick={() => openOrToggle("scripts")}
            active={sheet === "scripts"}
          />
          <DockButton
            label="Display"
            onClick={() => openOrToggle("display")}
            active={sheet === "display"}
          />
          <DockButton
            label="Pupil"
            onClick={() => openOrToggle("pupil")}
            active={sheet === "pupil"}
          />
        </div>
      </nav>

      <Sheet
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) setSheet(null);
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton
          className={cn(
            "max-h-[min(92dvh,920px)] gap-0 rounded-t-2xl border-t p-0",
            "motion-safe:animate-[sheet-rise_0.22s_ease-out]",
            "sm:max-h-[min(88dvh,800px)] sm:max-w-2xl sm:rounded-2xl sm:border",
          )}
        >
          <SheetHeader className="border-b border-border px-4 py-3 text-left sm:px-5">
            <SheetTitle id={sheetMeta.titleId}>{sheetMeta.title}</SheetTitle>
          </SheetHeader>
          <div className="max-h-[calc(100%-3.5rem)] min-h-0 overflow-y-auto overscroll-y-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
            {sheet === "scripts" && <ScriptRunner embedded />}
            {sheet === "display" && <DisplaySource embedded />}
            {sheet === "pupil" && <PupilMonitor embedded />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DockButton({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "touch-manipulation flex min-h-14 flex-1 select-none flex-col items-center justify-center rounded-xl py-3 text-base font-semibold transition-colors active:opacity-90",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
