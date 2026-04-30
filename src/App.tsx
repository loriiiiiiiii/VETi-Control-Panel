import { DisplaySource } from "@/components/DisplaySource";
import { PupilMonitor } from "@/components/PupilMonitor";
import { ScriptRunner } from "@/components/ScriptRunner";
import { SystemControls } from "@/components/SystemControls";
import { ToastProvider } from "@/components/Toast";
import { API_BASE_URL } from "@/lib/api";

export function App() {
  return (
    <ToastProvider>
      <div className="flex min-h-full flex-col">
        <header className="border-b border-border bg-bg-panel/60 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">
                Interaction Board
              </h1>
              <p className="text-xs text-slate-400">
                VETi control panel
              </p>
            </div>
            <div className="hidden text-right text-xs text-slate-400 sm:block">
              <div className="font-medium text-slate-300">Backend</div>
              <code className="font-mono text-[11px] text-slate-400">
                {API_BASE_URL}
              </code>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3">
              <SystemControls />
            </div>

            <div className="md:col-span-2 xl:col-span-2">
              <ScriptRunner />
            </div>

            <div className="md:col-span-2 xl:col-span-1">
              <DisplaySource />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <PupilMonitor />
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
