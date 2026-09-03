/**
 * Platform-abstracted mDNS discovery provider.
 *
 * Native (Android): wraps @byrds/capacitor-mdns discover().
 * Web: null provider — discovery is unsupported.
 */

import { Capacitor } from "@capacitor/core";
import { mDNS } from "@byrds/capacitor-mdns";
import { vetiUrl, VETI_SERVICE_TYPE } from "@/lib/veti";

export type DiscoveredInstance = {
  url: string;
  ip: string;
  label: string;
};

export interface DiscoveryProvider {
  /** Whether the platform supports mDNS scanning. */
  readonly supported: boolean;
  /**
   * Run one discovery window (~3 s). Returns the instances found in that
   * window. Throws on platform errors.
   */
  scanOnce(): Promise<DiscoveredInstance[]>;
}

const isIpv4 = (host: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

const DISCOVER_TIMEOUT_MS = 3000;

function createNativeProvider(): DiscoveryProvider {
  return {
    supported: true,
    async scanOnce(): Promise<DiscoveredInstance[]> {
      const result = await mDNS.discover({
        type: VETI_SERVICE_TYPE,
        timeout: DISCOVER_TIMEOUT_MS,
      });

      if (result.error) {
        throw new Error(result.errorMessage ?? "Unknown mDNS error");
      }

      const instances: DiscoveredInstance[] = [];
      for (const svc of result.services) {
        const ip = svc.hosts.find(isIpv4);
        if (!ip) continue;
        const friendly = svc.name?.trim() || `VETi @ ${ip}`;
        instances.push({
          url: vetiUrl(ip, svc.port),
          ip,
          label: `${friendly} [${ip}]`,
        });
      }
      return instances;
    },
  };
}

function createWebProvider(): DiscoveryProvider {
  return {
    supported: false,
    async scanOnce(): Promise<DiscoveredInstance[]> {
      return [];
    },
  };
}

/** Singleton provider for the current platform. */
export const discovery: DiscoveryProvider = Capacitor.isNativePlatform()
  ? createNativeProvider()
  : createWebProvider();
