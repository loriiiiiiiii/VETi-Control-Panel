import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useToast } from "@/components/Toast";
import {
  describeError,
  DISPLAY_SCENES,
  setDisplaySource,
  type DisplayScene,
} from "@/lib/api";

export function DisplaySource() {
  const toast = useToast();
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

  return (
    <Card
      title="Display source"
      description="Switch the HMD display scene"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {DISPLAY_SCENES.map((scene) => (
          <Button
            key={scene}
            variant={activeScene === scene ? "primary" : "secondary"}
            size="md"
            active={activeScene === scene}
            loading={pending === scene}
            disabled={pending !== null && pending !== scene}
            onClick={() => handleClick(scene)}
            className="w-full"
          >
            {scene}
          </Button>
        ))}
      </div>
    </Card>
  );
}
