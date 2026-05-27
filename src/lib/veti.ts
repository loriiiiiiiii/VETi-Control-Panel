/** VETi device constants. The single source of truth for port and mDNS service identity. */

export const VETI_PORT = 8888;
export const VETI_SECURE_PORT = 8443;
export const VETI_SERVICE_TYPE = "_veti._tcp.";
export const VETI_SERVICE_DOMAIN = "local.";

/** Returns the base URL for a VETi device. Port 8443 → https, otherwise http. */
export function vetiUrl(ip: string, port = VETI_PORT): string {
  const scheme = port === VETI_SECURE_PORT ? "https" : "http";
  return `${scheme}://${ip}:${port}`;
}
