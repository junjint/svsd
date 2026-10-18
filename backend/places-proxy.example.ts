/**
 * Example Edge/server handler for Google Places API (New).
 * Keep GOOGLE_PLACES_API_KEY on the server only.
 *
 * Deploy as a Supabase Edge Function, Cloudflare Worker, or similar,
 * then set EXPO_PUBLIC_PLACES_BACKEND_URL to that base URL.
 *
 * POST /places/nearby
 * body: { location: { latitude, longitude }, radiusMeters, includedTypes, maxResultCount }
 */

export async function handleNearbySearch(request: Request): Promise<Response> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Server missing GOOGLE_PLACES_API_KEY' }, { status: 500 });
  }

  const body = (await request.json()) as {
    location: { latitude: number; longitude: number };
    radiusMeters: number;
    includedTypes?: string[];
    maxResultCount?: number;
  };

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.priceLevel,places.currentOpeningHours,places.editorialSummary',
    },
    body: JSON.stringify({
      locationRestriction: {
        circle: {
          center: {
            latitude: body.location.latitude,
            longitude: body.location.longitude,
          },
          radius: body.radiusMeters,
        },
      },
      includedTypes: body.includedTypes?.slice(0, 5),
      maxResultCount: body.maxResultCount ?? 20,
    }),
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}
