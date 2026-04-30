import type { ScriptInfo } from "@/lib/api";

function normHotkey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/**
 * Resolves the two primary pad actions from the live script list from the device.
 */
export function resolveQuickScripts(scripts: ScriptInfo[]): {
  scan: ScriptInfo | null;
  visionTest: ScriptInfo | null;
} {
  const scan =
    scripts.find(
      (s) =>
        normHotkey(s.hotkey ?? "") === "shift+f5" ||
        /shift\+f5/i.test(s.filename) ||
        s.name.toLowerCase().includes("full process both"),
    ) ?? null;

  const visionTest =
    scripts.find(
      (s) =>
        s.name === "Vision Test" ||
        normHotkey(s.hotkey ?? "") === "f10" ||
        /\[APP[^\]]*F10\]/i.test(s.filename),
    ) ?? null;

  return { scan, visionTest };
}
