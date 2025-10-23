"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Component to clean up orphaned Radix UI overlays on route changes
 * This prevents blocking overlays from persisting across page navigations
 */
export function OverlayCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    // Clean up any orphaned Radix UI overlays
    const cleanupOverlays = () => {
      // Remove any orphaned portal containers
      const portals = document.querySelectorAll('[data-radix-portal]');
      portals.forEach((portal) => {
        // Only remove if it doesn't have any visible content
        const hasVisibleContent = portal.querySelector('[data-state="open"]');
        if (!hasVisibleContent) {
          portal.remove();
        }
      });

      // Remove any orphaned overlays
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-popover-content]');
      overlays.forEach((overlay) => {
        const state = overlay.getAttribute('data-state');
        if (state === 'closed' || !state) {
          overlay.remove();
        }
      });

      // Reset body styles that might have been set by modals
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    };

    // Clean up on route change
    cleanupOverlays();

    // Also clean up after a short delay to catch any delayed renders
    const timeoutId = setTimeout(cleanupOverlays, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
