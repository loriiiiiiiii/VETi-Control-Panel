import { useEffect, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import Lightbox, {
  type CaptionsRef,
  type ThumbnailsRef,
} from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { useBackend } from "@/context/BackendContext";
import type { Frame } from "@/lib/api";

declare module "yet-another-react-lightbox" {
  interface SlideImage {
    /** Display aspect ratio (width/height) from frame metadata; corrects
     *  for non-square pixels. Unset when the device reports it unknown. */
    frameAspect?: number;
  }
}

type FrameViewerProps = {
  frames: Frame[];
  /** Index of the frame to show, or -1 when the viewer is closed. */
  index: number;
  onClose: () => void;
  /** Called when the user navigates to another frame inside the viewer. */
  onIndexChange: (index: number) => void;
};

function formatTimestamp(ts: string | null): string | null {
  if (!ts) return null;
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? ts : date.toLocaleString();
}

function frameTitle(frame: Frame): string {
  return `${frame.modality.toUpperCase()} ${frame.side} · ${frame.seq_cur}/${frame.seq_total}`;
}

function frameDescription(frame: Frame): string {
  const parts: string[] = [];
  const ts = formatTimestamp(frame.timestamp);
  if (ts) parts.push(ts);
  if (frame.score !== undefined) parts.push(`Score ${frame.score.toFixed(2)}`);
  if (frame.pos_mm !== undefined)
    parts.push(`Position ${frame.pos_mm.toFixed(2)} mm`);
  if (frame.description) parts.push(frame.description);
  return parts.join(" · ");
}

export function FrameViewer({
  frames,
  index,
  onClose,
  onIndexChange,
}: FrameViewerProps) {
  const { client } = useBackend();
  const captionsRef = useRef<CaptionsRef>(null);
  const thumbnailsRef = useRef<ThumbnailsRef>(null);
  const [infoVisible, setInfoVisible] = useState(true);

  const open = index >= 0;

  // Plugins remount visible on every open; reset our state to match.
  useEffect(() => {
    if (open) setInfoVisible(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (infoVisible) {
      captionsRef.current?.show();
      thumbnailsRef.current?.show();
    } else {
      captionsRef.current?.hide();
      thumbnailsRef.current?.hide();
    }
  }, [open, infoVisible]);

  const slides = useMemo(
    () =>
      frames.map((frame) => ({
        src: client.frameImageUrl(frame),
        thumbnail: client.frameThumbUrl(frame),
        title: frameTitle(frame),
        description: frameDescription(frame),
      })),
    [frames, client],
  );

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={open ? index : 0}
      slides={slides}
      plugins={[Captions, Thumbnails, Zoom]}
      captions={{ ref: captionsRef }}
      thumbnails={{
        ref: thumbnailsRef,
        position: "start",
        width: 64,
        height: 48,
        gap: 8,
        padding: 0,
      }}
      zoom={{ maxZoomPixelRatio: 5 }}
      animation={{ swipe: 300 }}
      // preload also determines how many thumbnails render: 2 * preload + 1
      carousel={{ finite: true, preload: 5 }}
      controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
      toolbar={{
        buttons: [
          <button
            key="info-toggle"
            type="button"
            className="yarl__button"
            aria-label={infoVisible ? "Hide info" : "Show info"}
            onClick={() => setInfoVisible((v) => !v)}
          >
            <Info className="yarl__icon" />
          </button>,
          "close",
        ],
      }}
      on={{
        view: ({ index: newIndex }) => onIndexChange(newIndex),
        // Hide the info chrome while zoomed in; restore it at full zoom-out.
        zoom: ({ zoom }) => setInfoVisible(zoom <= 1),
      }}
    />
  );
}
