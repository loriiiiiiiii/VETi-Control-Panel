import { Check, ChevronDown, Loader2, RotateCw } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { useBackend, type Backend } from "@/context/BackendContext";
import { vetiUrl, VETI_PORT } from "@/lib/veti";
import { cn } from "@/lib/utils";

function isValidIp(value: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value.trim());
}

function makeBackend(ip: string): Backend {
  const clean = ip.trim();
  return {
    ip: clean,
    url: vetiUrl(clean),
    label: `${clean}:${VETI_PORT}`,
  };
}

export function BackendSelector() {
  const { isNative, backends, active, scanning, setActive, rescan } =
    useBackend();
  const [open, setOpen] = useState(false);
  const [manualIp, setManualIp] = useState("");
  const [manualError, setManualError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (b: Backend) => {
    setActive(b);
    setOpen(false);
  };

  const handleManualConnect = () => {
    if (!isValidIp(manualIp)) {
      setManualError("Enter a valid IPv4 address");
      return;
    }
    setManualError("");
    handleSelect(makeBackend(manualIp));
    setManualIp("");
  };

  const handleManualKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleManualConnect();
    if (e.key === "Escape") setOpen(false);
  };

  const triggerLabel = active
    ? active.label
    : scanning
      ? "Scanning…"
      : "No backend";

  const sectionTitle = isNative ? "Discovered" : "Backends";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select backend"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm transition-colors",
          "hover:bg-muted",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          !active && "border-amber-500/50 bg-amber-500/10 text-amber-500",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            scanning && !active
              ? "animate-pulse bg-amber-500"
              : active
                ? "bg-emerald-500"
                : "bg-red-500",
          )}
        />
        <span className="max-w-[200px] truncate font-mono text-xs">
          {triggerLabel}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Backend selection"
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5 w-80",
            "overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/40",
          )}
        >
          {/* Section: backends list */}
          <div className="border-b border-border px-3 py-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {sectionTitle}
              </span>
              {isNative && (
                <button
                  type="button"
                  onClick={rescan}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
                >
                  {scanning ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : (
                    <RotateCw className="size-3" aria-hidden />
                  )}
                  {scanning ? "Scanning" : "Rescan"}
                </button>
              )}
            </div>

            {backends.length === 0 ? (
              <p className="py-1 text-xs text-muted-foreground">
                {scanning
                  ? "Listening for VETi backends on the LAN…"
                  : isNative
                    ? "No backends found yet."
                    : "No backends configured."}
              </p>
            ) : (
              <ul role="listbox" aria-label={sectionTitle}>
                {backends.map((b) => {
                  const isActive = b.url === active?.url;
                  return (
                    <li key={b.url} role="option" aria-selected={isActive}>
                      <button
                        type="button"
                        onClick={() => handleSelect(b)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "hover:bg-muted",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            isActive ? "bg-primary" : "bg-muted-foreground",
                          )}
                        />
                        <span className="flex-1 truncate font-mono text-xs">
                          {b.label}
                        </span>
                        {isActive && (
                          <Check
                            aria-label="Active"
                            className="size-3.5 shrink-0 text-primary"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Section: Manual IP */}
          <div className="px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Manual IP
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={manualIp}
                onChange={(e) => {
                  setManualIp(e.target.value);
                  setManualError("");
                }}
                onKeyDown={handleManualKeyDown}
                placeholder="192.168.1.42"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                className={cn(
                  "h-9 flex-1 rounded-md border bg-background px-2.5 font-mono text-xs text-foreground",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  manualError ? "border-destructive/60" : "border-border",
                )}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleManualConnect}
                className="h-9"
              >
                Connect
              </Button>
            </div>
            {manualError && (
              <p className="mt-1 text-[11px] text-destructive">{manualError}</p>
            )}
            {!isNative && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                mDNS auto-discovery is only available in the Android app.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
