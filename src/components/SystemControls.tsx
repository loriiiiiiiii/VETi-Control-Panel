import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useToast } from "@/components/Toast";
import { describeError, sleep, wakeup } from "@/lib/api";

type Pending = "wakeup" | "sleep" | null;

export function SystemControls() {
  const toast = useToast();
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
    <Card
      title="System"
      description="Wake the device or put it into idle mode"
    >
      <div className="flex flex-wrap gap-3">
        <Button
          variant="success"
          size="lg"
          loading={pending === "wakeup"}
          disabled={pending !== null && pending !== "wakeup"}
          onClick={handleWakeup}
        >
          Wake up
        </Button>
        <Button
          variant="danger"
          size="lg"
          loading={pending === "sleep"}
          disabled={pending !== null && pending !== "sleep"}
          onClick={handleSleep}
        >
          Sleep
        </Button>
      </div>
    </Card>
  );
}
