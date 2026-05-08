import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBackend } from "@/context/BackendContext";
import { describeError, DISPLAY_SCENES, type DisplayScene } from "@/lib/api";

const STREAMS = [
  { key: "slo" as const, label: "SLO" },
  { key: "oct" as const, label: "OCT" },
  { key: "pupil_left" as const, label: "Pupil left" },
  { key: "pupil_right" as const, label: "Pupil right" },
];

function StreamTile({
  label,
  src,
}: {
  label: string;
  src: string;
}) {
  const [imgKey, setImgKey] = useState(0);
  const [error, setError] = useState(false);

  const reconnect = useCallback(() => {
    setError(false);
    setImgKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        className="relative cursor-pointer overflow-hidden rounded-xl border border-border bg-black"
        title="Click to reconnect"
        onClick={reconnect}
      >
        <img
          key={imgKey}
          src={src}
          alt={`${label} live stream`}
          className="mx-auto block aspect-video w-full object-contain"
          onLoad={() => setError(false)}
          onError={() => setError(true)}
        />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 text-center text-xs text-err">
            <span>Stream unavailable</span>
            <span className="text-muted-foreground">Tap to retry</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DisplaySource() {
  const { client } = useBackend();
  const [activeScene, setActiveScene] = useState<DisplayScene | null>(null);
  const [pending, setPending] = useState<DisplayScene | null>(null);

  const handleClick = async (scene: DisplayScene) => {
    setPending(scene);
    try {
      const res = await client.setDisplaySource(scene);
      if (res.success) {
        setActiveScene(res.scene ?? scene);
        toast.success(`Display: ${res.scene ?? scene}`);
      } else {
        toast.error(res.error ?? `Failed to set scene: ${scene}`);
      }
    } catch (err) {
      toast.error(`Display failed: ${describeError(err)}`);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">
          Live streams
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {STREAMS.map(({ key, label }) => (
            <StreamTile key={key} label={label} src={client.streamUrls[key]} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">
          Display source
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DISPLAY_SCENES.map((scene) => (
            <Button
              key={scene}
              variant={activeScene === scene ? "default" : "outline"}
              size="lg"
              disabled={pending !== null && pending !== scene}
              onClick={() => handleClick(scene)}
              className="min-h-14 w-full capitalize"
            >
              {pending === scene && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {scene.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
