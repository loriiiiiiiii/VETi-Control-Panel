import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ImageOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  SegmentedControl,
  type Segment,
} from "@/components/ui/segmented-control";
import {
  ImageGallery,
  type ImageGalleryProps,
} from "@/components/shadix-ui/components/image-gallery";
import { FrameViewer } from "@/components/FrameViewer";
import { useBackend } from "@/context/BackendContext";
import { useSessionFrames } from "@/hooks/useSessionFrames";
import type { Modality } from "@/lib/api";

const MODALITY_SEGMENTS: Segment[] = [
  { id: "all", label: "All" },
  { id: "slo", label: "SLO" },
  { id: "oct", label: "OCT" },
];

const GALLERY_COLUMNS: ImageGalleryProps["columns"] = {
  desktop: 5,
  tablet: 4,
  mobile: 3,
};

const GALLERY_GAP = 8;

type SessionGalleryProps = {
  session: number;
  current?: boolean;
};

export function SessionGallery({ session, current }: SessionGalleryProps) {
  const navigate = useNavigate();
  const { client } = useBackend();
  const [modalityFilter, setModalityFilter] = useState("all");
  const [viewerIndex, setViewerIndex] = useState(-1);

  const modality =
    modalityFilter === "all" ? undefined : (modalityFilter as Modality);

  const { frames, loading, error, refresh } = useSessionFrames(
    session,
    modality,
  );

  const images = useMemo(
    () =>
      frames.map((f) => ({
        src: client.frameThumbUrl(f),
        alt: `${f.modality.toUpperCase()} ${f.side} #${f.seq_cur}/${f.seq_total}`,
        // Prefer the display aspect ratio (accounts for non-square pixels);
        // fall back to pixel dimensions when aspect is 0 (unknown).
        ...(f.aspect > 0
          ? { width: f.aspect, height: 1 }
          : { width: f.width || undefined, height: f.height || undefined }),
      })),
    [frames, client],
  );

  const emptyLabel =
    modalityFilter === "all"
      ? "No frames in this session"
      : `No ${modalityFilter.toUpperCase()} frames in this session`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ChevronLeft />
          Sessions
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-foreground">
            Session {session}
          </span>
          {current && (
            <Badge
              className="border-ok/40 bg-ok/15 text-ok"
              variant="outline"
            >
              Current
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={refresh}
          aria-label="Refresh frames"
          className="shrink-0"
        >
          <RefreshCw />
        </Button>
      </div>

      <SegmentedControl
        segments={MODALITY_SEGMENTS}
        activeSegment={modalityFilter}
        onSegmentChange={setModalityFilter}
        wrap
      />

      {error && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-err/40 bg-err/10 px-4 py-3 text-base text-err">
            Failed to load frames: {error}
          </div>
          <Button variant="outline" onClick={refresh} className="self-start">
            <RefreshCw />
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && images.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageOff />
            </EmptyMedia>
            <EmptyTitle>{emptyLabel}</EmptyTitle>
            <EmptyDescription className="max-w-xs text-pretty">
              Try a different filter or refresh.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw />
              Refresh
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {images.length > 0 && (
        <ImageGallery
          images={images}
          columns={GALLERY_COLUMNS}
          gap={GALLERY_GAP}
          onImageClick={(_image, index) => setViewerIndex(index)}
        />
      )}

      <FrameViewer
        frames={frames}
        index={viewerIndex}
        onClose={() => setViewerIndex(-1)}
        onIndexChange={setViewerIndex}
      />
    </div>
  );
}
