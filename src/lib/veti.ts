/** VETi device constants. The single source of truth for port and mDNS service identity. */

export const VETI_PORT = 8888;
export const VETI_SERVICE_TYPE = "_veti._tcp.";
export const VETI_SERVICE_DOMAIN = "local.";

export function vetiUrl(ip: string, port = VETI_PORT): string {
  return `http://${ip}:${port}`;
}
