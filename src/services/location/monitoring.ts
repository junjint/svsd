import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import type { Coordinates } from '@/types';

export const BACKGROUND_LOCATION_TASK = 'sidequest-background-location';
export const GEOFENCE_TASK = 'sidequest-geofence';

export type LocationUpdateHandler = (coords: Coordinates, speedMps?: number) => void;

let foregroundSubscription: Location.LocationSubscription | null = null;
let updateHandler: LocationUpdateHandler | null = null;

export function setLocationUpdateHandler(handler: LocationUpdateHandler | null): void {
  updateHandler = handler;
}

/**
 * Define background tasks once at module load.
 * OS may defer delivery — never assume exact boundary timing.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[Sidequest] background location error', error);
    return;
  }
  const locations = (data as { locations?: Location.LocationObject[] })?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest || !updateHandler) return;
  updateHandler(
    {
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
    },
    latest.coords.speed ?? undefined
  );
});

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[Sidequest] geofence error', error);
    return;
  }
  const event = data as {
    eventType?: Location.GeofencingEventType;
    region?: Location.LocationRegion;
  };
  if (
    event.eventType === Location.GeofencingEventType.Enter &&
    event.region &&
    updateHandler
  ) {
    updateHandler({
      latitude: event.region.latitude,
      longitude: event.region.longitude,
    });
  }
});

export async function startForegroundWatching(
  handler: LocationUpdateHandler
): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) return false;

  await stopForegroundWatching();
  updateHandler = handler;

  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60_000,
      distanceInterval: 120,
    },
    (loc) => {
      handler(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        },
        loc.coords.speed ?? undefined
      );
    }
  );
  return true;
}

export async function stopForegroundWatching(): Promise<void> {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }
}

export async function startBackgroundUpdates(): Promise<boolean> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) return false;

  const started = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );
  if (started) return true;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5 * 60_000,
    distanceInterval: 200,
    deferredUpdatesInterval: 5 * 60_000,
    deferredUpdatesDistance: 200,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Sidequest exploring',
      notificationBody: 'Looking for nearby detours. Tap to manage.',
      notificationColor: '#2F5D50',
    },
    pausesUpdatesAutomatically: true,
    activityType: Location.ActivityType.Fitness,
  });
  return true;
}

export async function stopBackgroundUpdates(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );
  if (started) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

export async function startGeofences(
  regions: Location.LocationRegion[]
): Promise<boolean> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) return false;
  if (regions.length === 0) return false;

  const active = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  if (active) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions.slice(0, 20));
  return true;
}

export async function stopGeofences(): Promise<void> {
  const active = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  if (active) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}

export async function stopAllLocationMonitoring(): Promise<void> {
  await stopForegroundWatching();
  await stopBackgroundUpdates();
  await stopGeofences();
  updateHandler = null;
}

export function inferTravelMode(speedMps?: number): 'walking' | 'driving' | 'unknown' {
  if (speedMps == null || Number.isNaN(speedMps) || speedMps < 0) return 'unknown';
  if (speedMps < 2.5) return 'walking';
  if (speedMps > 8) return 'driving';
  return 'unknown';
}
