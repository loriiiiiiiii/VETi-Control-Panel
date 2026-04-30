import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  describeError,
  DISPLAY_SCENES,
  setDisplaySource,
  type DisplayScene,
} from "@/lib/api";

type DisplaySourceProps = {
  embedded?: boolean;
};

export function DisplaySource({ embedded = false }: DisplaySourceProps) {
  const [activeScene, setActiveScene] = useState<DisplayScene | null>(null);
  const [pending, setPending] = useState<DisplayScene | null>(null);

  const handleClick = async (scene: DisplayScene) => {
    setPending(scene);
    try {
      const res = await setDisplaySource(scene);
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

  const grid = (
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
  );

  if (embedded) {
    return grid;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display source</CardTitle>
        <CardDescription>Switch the HMD display scene</CardDescription>
      </CardHeader>
      <CardContent>{grid}</CardContent>
    </Card>
  );
}
