import { useEffect, useRef } from "react";

interface Props {
  /** WebSocket URL: ws:// or wss:// */
  url: string;
  alt: string;
  className?: string;
  /** Called each time a frame is successfully decoded and displayed. */
  onLoad?: () => void;
  /** Called when the WebSocket emits an error event. */
  onError?: (message: string) => void;
}

/**
 * Renders a live camera feed delivered as WebSocket binary frames (JPEG).
 * Each binary message is treated as a complete JPEG image and displayed
 * immediately. The component auto-reconnects with a 1.5 s delay whenever
 * the socket closes. Blob object-URLs are revoked after each frame to
 * prevent memory leaks.
 *
 * Changing `url` closes the current socket and opens a fresh connection.
 * To force a manual reconnect without changing the URL, remount by changing
 * the React `key` prop on this component.
 */
export function WsStreamImg({ url, alt, className, onLoad, onError }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  // Keep latest callbacks in refs so the WebSocket handlers never go stale
  // and the effect doesn't need to reconnect when callbacks change.
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let destroyed = false;
    let ws: WebSocket | null = null;
    let currentObjectUrl: string | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (destroyed) return;

      ws = new WebSocket(url);
      ws.binaryType = "blob";

      ws.onmessage = (e: MessageEvent) => {
        if (!(e.data instanceof Blob)) return;
        const prev = currentObjectUrl;
        currentObjectUrl = URL.createObjectURL(e.data);
        if (imgRef.current) imgRef.current.src = currentObjectUrl;
        if (prev) URL.revokeObjectURL(prev);
        onLoadRef.current?.();
      };

      ws.onerror = () => {
        onErrorRef.current?.("Stream connection error");
      };

      ws.onclose = () => {
        if (!destroyed) {
          retryTimer = setTimeout(connect, 1500);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      ws?.close();
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    };
  }, [url]);

  return <img ref={imgRef} alt={alt} className={className} />;
}
