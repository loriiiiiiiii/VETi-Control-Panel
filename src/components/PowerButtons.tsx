import { Loader2, Pause, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBackend } from "@/context/BackendContext";
import { describeError } from "@/lib/api";
import { cn } from "@/lib/utils";

type Pending = "wakeup" | "sleep" | null;

type PowerButtonsProps = {
  className?: string;
};

export function PowerButtons({ className }: PowerButtonsProps) {
  const { client } = useBackend();
  const [pending, setPending] = useState<Pending>(null);

  const handleWakeup = async () => {
    setPending("wakeup");
    try {
      const res = await client.wakeup(true);
      if (res.success) {
        toast.success("System woken up");
      } else {
        toast.error(res.error ?? "Wakeup failed");
      }
    } catch (err) {
      toast.error(`Wakeup failed: ${describeError(err)}`);
    } finally {
      setPending(null);
    }
  };

  const handleSleep = async () => {
    setPending("sleep");
    try {
      const res = await client.sleep();
      if (res.success) {
        toast.success("System asleep");
      } else {
        toast.error(res.error ?? "Sleep failed");
      }
    } catch (err) {
      toast.error(`Sleep failed: ${describeError(err)}`);
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Wake up"
        className="size-11 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        disabled={pending !== null && pending !== "wakeup"}
        onClick={handleWakeup}
      >
        {pending === "wakeup" ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Play className="size-5" aria-hidden />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sleep"
        className="size-11 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        disabled={pending !== null && pending !== "sleep"}
        onClick={handleSleep}
      >
        {pending === "sleep" ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Pause className="size-5" aria-hidden />
        )}
      </Button>
    </div>
  );
}
