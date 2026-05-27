import { useEffect, useRef } from "react";

interface Props {
  /** WebSocket URL (wss:// for WebCodecs, ws:// for legacy JPEG) */
  url: string;
  alt: string;
  className?: string;
  /** Called once the first frame has been painted. */
  onLoad?: () => void;
  /** Called when the WebSocket or decoder emits an error. */
  onError?: (message: string) => void;
}

interface CodecHandshake {
  codec: string;
  aspect: number;
}

const RECONNECT_DELAY_MS = 1500;

type Protocol = "unknown" | "webcodecs" | "jpeg";

/**
 * Renders a live camera feed from a WebSocket stream. Auto-detects the
 * server protocol on connect:
 *
 *   • WebCodecs: first message is a JSON text handshake { codec, aspect },
 *     followed by binary frames with a 1-byte key-frame header + encoded
 *     bitstream (AV1 / HEVC). Decoded via VideoDecoder and painted to canvas.
 *
 *   • Legacy JPEG: every message is a binary Blob containing a complete JPEG.
 *     Decoded via createImageBitmap and painted to canvas.
 *
 * Both paths use requestAnimationFrame to drop stale frames and avoid
 * accumulating delay.
 *
 * Changing `url` tears down the current socket and opens a fresh one.
 * Remount via React `key` to force a reconnect.
 */
export function WsStreamImg({ url, alt, className, onLoad, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx2d = cvs.getContext("2d");
    if (!ctx2d) return;
    const canvas: HTMLCanvasElement = cvs;
    const ctx: CanvasRenderingContext2D = ctx2d;

    let destroyed = false;
    let ws: WebSocket | null = null;
    let decoder: VideoDecoder | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let frameTimestamp = 0;
    let firedOnLoad = false;
    let protocol: Protocol = "unknown";

    // --- WebCodecs frame scheduling (drops stale frames) ---

    let pendingFrame: VideoFrame | null = null;
    let rafId: number | null = null;

    function paintFrame() {
      rafId = null;
      if (!pendingFrame) return;
      const frame = pendingFrame;
      pendingFrame = null;

      canvas.width = frame.displayWidth;
      canvas.height = frame.displayHeight;
      canvas.style.aspectRatio = `${frame.displayWidth}/${frame.displayHeight}`;
      ctx.drawImage(frame, 0, 0);
      frame.close();

      if (!firedOnLoad) {
        firedOnLoad = true;
        onLoadRef.current?.();
      }
    }

    function scheduleVideoFrame(frame: VideoFrame) {
      pendingFrame?.close();
      pendingFrame = frame;
      if (rafId === null) rafId = requestAnimationFrame(paintFrame);
    }

    // --- WebCodecs path ---

    function createDecoder(codec: string, aspect: number) {
      if (typeof VideoDecoder === "undefined") {
        onErrorRef.current?.(
          "WebCodecs not available — secure context (HTTPS) required",
        );
        return;
      }

      if (aspect > 0) {
        canvas.style.aspectRatio = String(aspect);
      }

      decoder = new VideoDecoder({
        output: (frame) => {
          if (destroyed) {
            frame.close();
            return;
          }
          scheduleVideoFrame(frame);
        },
        error: (e) => {
          onErrorRef.current?.(`Decoder error: ${e.message}`);
        },
      });

      decoder.configure({ codec });
    }

    function handleWebCodecsBinary(data: ArrayBuffer) {
      if (data.byteLength < 2) return;
      if (!decoder || decoder.state !== "configured") return;

      const view = new Uint8Array(data);
      const isKey = view[0] === 0x01;
      const payload = data.slice(1);

      const chunk = new EncodedVideoChunk({
        type: isKey ? "key" : "delta",
        timestamp: frameTimestamp,
        data: payload,
      });
      frameTimestamp += 1;

      try {
        decoder.decode(chunk);
      } catch {
        // Decoder may throw if flushing / closed.
      }
    }

    // --- Legacy JPEG path (createImageBitmap → canvas) ---

    let pendingBitmap: ImageBitmap | null = null;
    let bmpRafId: number | null = null;

    function paintBitmap() {
      bmpRafId = null;
      if (!pendingBitmap) return;
      const bmp = pendingBitmap;
      pendingBitmap = null;

      canvas.width = bmp.width;
      canvas.height = bmp.height;
      canvas.style.aspectRatio = `${bmp.width}/${bmp.height}`;
      ctx.drawImage(bmp, 0, 0);
      bmp.close();

      if (!firedOnLoad) {
        firedOnLoad = true;
        onLoadRef.current?.();
      }
    }

    function scheduleBitmap(bmp: ImageBitmap) {
      pendingBitmap?.close();
      pendingBitmap = bmp;
      if (bmpRafId === null) bmpRafId = requestAnimationFrame(paintBitmap);
    }

    function handleJpegBlob(blob: Blob) {
      const typed = new Blob([blob], { type: "image/jpeg" });
      createImageBitmap(typed)
        .then((bmp) => {
          if (destroyed) {
            bmp.close();
            return;
          }
          scheduleBitmap(bmp);
        })
        .catch(() => {
          /* corrupt frame — skip */
        });
    }

    // --- connection ---

    function connect() {
      if (destroyed) return;

      firedOnLoad = false;
      frameTimestamp = 0;
      protocol = "unknown";

      ws = new WebSocket(url);
      ws.binaryType = "blob";

      ws.onmessage = (e: MessageEvent) => {
        if (protocol === "unknown") {
          if (typeof e.data === "string") {
            protocol = "webcodecs";
            ws!.binaryType = "arraybuffer";
            try {
              const handshake: CodecHandshake = JSON.parse(e.data);
              createDecoder(handshake.codec, handshake.aspect);
            } catch (err) {
              onErrorRef.current?.(
                `Bad handshake: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
            return;
          }
          protocol = "jpeg";
        }

        if (protocol === "jpeg") {
          if (e.data instanceof Blob) handleJpegBlob(e.data);
          return;
        }

        if (e.data instanceof ArrayBuffer) {
          handleWebCodecsBinary(e.data);
        }
      };

      ws.onerror = () => {
        onErrorRef.current?.("Stream connection error");
      };

      ws.onclose = () => {
        if (decoder && decoder.state !== "closed") {
          try {
            decoder.close();
          } catch {
            /* already closing */
          }
        }
        decoder = null;

        if (!destroyed) {
          retryTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      pendingFrame?.close();
      pendingFrame = null;
      if (bmpRafId !== null) cancelAnimationFrame(bmpRafId);
      pendingBitmap?.close();
      pendingBitmap = null;
      ws?.close();
      if (decoder && decoder.state !== "closed") {
        try {
          decoder.close();
        } catch {
          /* already closing */
        }
      }
    };
  }, [url]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={alt}
    />
  );
}
