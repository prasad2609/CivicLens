import { NextResponse } from 'next/server';
import { INITIAL_JURISDICTIONS } from '@/data/mockData';
import { calculateDistanceMeters } from '@/lib/store';

// Helper to determine the nearest municipal ward from latitude & longitude
function findNearestWard(lat: number, lng: number) {
  let nearestWard = INITIAL_JURISDICTIONS[0];
  let minDistance = Infinity;

  for (const ward of INITIAL_JURISDICTIONS) {
    const dist = calculateDistanceMeters(lat, lng, ward.center_lat, ward.center_lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestWard = ward;
    }
  }

  return {
    ...nearestWard,
    distanceMeters: Math.round(minDistance),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'reverse';

  // 1. IP GEOLOCATION FALLBACK
  if (action === 'ip') {
    try {
      // First try ipwho.is (fast, HTTPS, free, accurate for India)
      const ipRes = await fetch('https://ipwho.is/', {
        headers: { 'User-Agent': 'CivicLens-App/1.0' },
        signal: AbortSignal.timeout(4000),
      });

      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData.success && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
          const lat = Number(ipData.latitude.toFixed(6));
          const lng = Number(ipData.longitude.toFixed(6));
          const nearestWard = findNearestWard(lat, lng);
          return NextResponse.json({
            success: true,
            source: 'ip',
            lat,
            lng,
            city: ipData.city || 'Chennai',
            region: ipData.region || 'Tamil Nadu',
            nearestWard,
          });
        }
      }

      // Secondary fallback: ip-api.com
      const altRes = await fetch('http://ip-api.com/json/', {
        signal: AbortSignal.timeout(3000),
      });
      if (altRes.ok) {
        const altData = await altRes.json();
        if (altData.status === 'success') {
          const lat = Number(altData.lat.toFixed(6));
          const lng = Number(altData.lon.toFixed(6));
          const nearestWard = findNearestWard(lat, lng);
          return NextResponse.json({
            success: true,
            source: 'ip_fallback',
            lat,
            lng,
            city: altData.city || 'Chennai',
            region: altData.regionName || 'Tamil Nadu',
            nearestWard,
          });
        }
      }
    } catch (err) {
      console.warn('IP geolocation error:', err);
    }

    // Default Chennai South center fallback
    const defaultWard = INITIAL_JURISDICTIONS[0];
    return NextResponse.json({
      success: true,
      source: 'default',
      lat: defaultWard.center_lat,
      lng: defaultWard.center_lng,
      city: 'Chennai',
      region: 'Tamil Nadu',
      nearestWard: { ...defaultWard, distanceMeters: 0 },
    });
  }

  // 2. SEARCH LANDMARK / ADDRESS
  if (action === 'search') {
    const query = searchParams.get('q');
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: true, results: [] });
    }

    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query.includes('chennai') || query.includes('tamil nadu') ? query : `${query} Chennai`
      )}&countrycodes=in&limit=6&addressdetails=1`;

      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'CivicLens-Municipal-App/1.0 (contact@civiclens.local)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`Nominatim search failed with status ${res.status}`);
      }

      const items = await res.json();
      const results = items.map((item: any) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const nearestWard = findNearestWard(lat, lng);
        const addr = item.address || {};
        const road = addr.road || addr.pedestrian || addr.footway || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || '';
        const shortName = [item.name || road, suburb].filter(Boolean).join(', ') || item.display_name.split(',')[0];

        return {
          displayName: item.display_name,
          shortName,
          lat,
          lng,
          nearestWard,
        };
      });

      return NextResponse.json({ success: true, results });
    } catch (err: any) {
      console.warn('Geocode search error:', err);
      return NextResponse.json({ success: false, error: err.message, results: [] });
    }
  }

  // 3. REVERSE GEOCODING (DEFAULT)
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json({ success: false, error: 'Missing lat or lng parameter' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ success: false, error: 'Invalid coordinates' }, { status: 400 });
  }

  const nearestWard = findNearestWard(lat, lng);

  try {
    const revUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(revUrl, {
      headers: {
        'User-Agent': 'CivicLens-Municipal-App/1.0 (contact@civiclens.local)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const parts = [
        addr.road || addr.pedestrian || addr.suburb || '',
        addr.neighbourhood || addr.suburb || '',
        addr.city_district || addr.city || 'Chennai',
        addr.postcode ? `PIN: ${addr.postcode}` : '',
      ].filter(Boolean);

      // Clean duplicates in parts
      const uniqueParts = Array.from(new Set(parts));
      const cleanAddress = uniqueParts.length > 0 ? uniqueParts.join(', ') : data.display_name;

      return NextResponse.json({
        success: true,
        address: cleanAddress,
        displayName: data.display_name,
        lat,
        lng,
        nearestWard,
      });
    }
  } catch (err) {
    console.warn('Nominatim reverse error, using fallback:', err);
  }

  // Fallback if OpenStreetMap is down or times out: return formatted coordinates with nearest ward
  return NextResponse.json({
    success: true,
    address: `Near ${nearestWard.name} (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    displayName: `${nearestWard.name}, ${nearestWard.zone}, Chennai, Tamil Nadu`,
    lat,
    lng,
    nearestWard,
  });
}
