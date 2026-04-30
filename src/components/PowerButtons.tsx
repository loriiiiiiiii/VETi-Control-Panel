import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { describeError, sleep, wakeup } from "@/lib/api";
import { cn } from "@/lib/utils";

type Pending = "wakeup" | "sleep" | null;

type PowerButtonsProps = {
  className?: string;
};

export function PowerButtons({ className }: PowerButtonsProps) {
  const [pending, setPending] = useState<Pending>(null);

  const handleWakeup = async () => {
    setPending("wakeup");
    try {
      const res = await wakeup(true);
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
      const res = await sleep();
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
        "flex shrink-0 flex-wrap items-stretch justify-end gap-2 sm:gap-2.5",
        className,
      )}
    >
      <Button
        variant="secondary"
        size="lg"
        className="min-h-12 min-w-[6.5rem] flex-1 border-emerald-700/50 bg-emerald-600 text-white hover:bg-emerald-600/90 sm:flex-none"
        disabled={pending !== null && pending !== "wakeup"}
        onClick={handleWakeup}
      >
        {pending === "wakeup" && (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        )}
        Wake up
      </Button>
      <Button
        variant="destructive"
        size="lg"
        className="min-h-12 min-w-[6.5rem] flex-1 border-transparent bg-red-600 text-white hover:bg-red-600/90 sm:flex-none"
        disabled={pending !== null && pending !== "sleep"}
        onClick={handleSleep}
      >
        {pending === "sleep" && (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        )}
        Sleep
      </Button>
    </div>
  );
}
