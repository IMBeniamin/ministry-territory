import { useRef, useCallback, useEffect } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { UserLocation } from '@/app/map/types';
import {
  FOLLOW_ANIMATION_MS,
  FOLLOW_RECENTER_DISTANCE_METERS,
  FOLLOW_RECENTER_INTERVAL_MS,
} from '@/app/map/config/defaults';
import { haversineDistanceMeters } from '@/app/map/utils/geoUtils';

type UseFollowModeOptions = {
  mapRef: React.RefObject<MapRef | null>;
  userLocation: UserLocation | null;
  followMode: boolean;
  preferredPitch?: number;
  onDisable: () => void;
};

export function useFollowMode({
  mapRef,
  userLocation,
  followMode,
  preferredPitch = 0,
  onDisable,
}: UseFollowModeOptions) {
  const lastUpdateRef = useRef(0);
  const previousLocationRef = useRef<UserLocation | null>(null);
  const followModeJustEnabled = useRef(false);

  const centerOnUser = useCallback(
    (immediate: boolean) => {
      const map = mapRef.current;
      if (!map || !userLocation) return;

      lastUpdateRef.current = Date.now();

      if (immediate) {
        map.jumpTo({
          center: userLocation.coordinates,
          pitch: preferredPitch,
        });
      } else {
        map.easeTo({
          center: userLocation.coordinates,
          pitch: preferredPitch,
          duration: FOLLOW_ANIMATION_MS,
        });
      }
    },
    [mapRef, userLocation, preferredPitch],
  );

  // Handle follow mode enable - immediate center
  useEffect(() => {
    if (followMode && userLocation) {
      followModeJustEnabled.current = true;
      centerOnUser(true);
    }
  }, [followMode]);

  // Handle location updates while following
  useEffect(() => {
    if (!followMode || !userLocation) return;

    // Skip if follow mode was just enabled (already centered)
    if (followModeJustEnabled.current) {
      followModeJustEnabled.current = false;
      previousLocationRef.current = userLocation;
      return;
    }

    const previous = previousLocationRef.current;
    const now = Date.now();

    if (now - lastUpdateRef.current < FOLLOW_RECENTER_INTERVAL_MS) {
      previousLocationRef.current = userLocation;
      return;
    }

    if (!previous) {
      previousLocationRef.current = userLocation;
      return;
    }

    const distance = haversineDistanceMeters(
      previous.coordinates,
      userLocation.coordinates,
    );

    if (distance >= FOLLOW_RECENTER_DISTANCE_METERS) {
      centerOnUser(false);
    }

    previousLocationRef.current = userLocation;
  }, [userLocation, followMode, centerOnUser]);

  // Handle user drag - disable follow mode
  const handleDragStart = useCallback(() => {
    if (followMode) {
      onDisable();
    }
  }, [followMode, onDisable]);

  return { handleDragStart, centerOnUser };
}
