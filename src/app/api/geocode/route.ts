import { NextResponse } from 'next/server';
import { INITIAL_JURISDICTIONS } from '@/data/mockData';
import { calculateDistanceMeters } from '@/lib/store';
import { exec } from 'child_process';
import path from 'path';

// Cached device hardware coordinates (initial fallback is Chennai West / Irungattukottai / REC corridor)
let cachedDeviceCoords: { lat: number; lng: number; accuracy: number; timestamp: number } = {
  lat: 13.007549,
  lng: 79.994887,
  accuracy: 80,
  timestamp: Date.now(),
};

// Background refresh of device coordinates via PowerShell on Windows
function refreshDeviceLocationAsync() {
  if (process.platform !== 'win32') return;
  const scriptPath = path.join(process.cwd(), 'scripts', 'test_gps.ps1');
  exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { timeout: 8000 }, (err, stdout) => {
    if (!err && stdout && stdout.includes('SUCCESS:')) {
      const latMatch = stdout.match(/Latitude=([0-9.-]+)/);
      const lngMatch = stdout.match(/Longitude=([0-9.-]+)/);
      const accMatch = stdout.match(/Accuracy=([0-9.-]+)/);
      if (latMatch && lngMatch) {
        cachedDeviceCoords = {
          lat: Number(parseFloat(latMatch[1]).toFixed(6)),
          lng: Number(parseFloat(lngMatch[1]).toFixed(6)),
          accuracy: accMatch ? parseFloat(accMatch[1]) : 50,
          timestamp: Date.now(),
        };
      }
    }
  });
}

// Pre-warm device location on first module load
try {
  refreshDeviceLocationAsync();
} catch {
  // ignore
}

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

  // 1. DEVICE HARDWARE GPS (from Windows location subsystem)
  if (action === 'device') {
    if (Date.now() - cachedDeviceCoords.timestamp > 30000) {
      refreshDeviceLocationAsync();
    }
    const nearestWard = findNearestWard(cachedDeviceCoords.lat, cachedDeviceCoords.lng);
    return NextResponse.json({
      success: true,
      source: 'device_hardware',
      lat: cachedDeviceCoords.lat,
      lng: cachedDeviceCoords.lng,
      accuracy: cachedDeviceCoords.accuracy,
      nearestWard,
    });
  }

  // 2. IP GEOLOCATION FALLBACK
  if (action === 'ip') {
    try {
      // First try ipwho.is (fast, HTTPS, free, accurate for India)
      const ipRes = await fetch('https://ipwho.is/', {
        headers: { 'User-Agent': 'CivicLens-App/1.0' },
        signal: AbortSignal.timeout(3000),
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

    // Default to cached device coords if available, else Chennai South center
    return NextResponse.json({
      success: true,
      source: 'device_fallback',
      lat: cachedDeviceCoords.lat,
      lng: cachedDeviceCoords.lng,
      city: 'Chennai',
      region: 'Tamil Nadu',
      nearestWard: findNearestWard(cachedDeviceCoords.lat, cachedDeviceCoords.lng),
    });
  }

  // 3. SEARCH LANDMARK / ADDRESS
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
        const road = addr.road || addr.pedestrian || addr.footway || addr.building || '';
        const locality = addr.neighbourhood || addr.suburb || addr.residential || addr.village || addr.town || '';
        const shortName = [item.name || road, locality].filter(Boolean).join(', ') || item.display_name.split(',')[0];

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

  // 4. REVERSE GEOCODING (DEFAULT)
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
      const primary = addr.road || addr.pedestrian || addr.footway || addr.building || '';
      const locality = addr.neighbourhood || addr.suburb || addr.residential || addr.village || addr.town || '';
      const area = addr.city_district || addr.suburb || addr.municipality || addr.city || addr.county || 'Chennai';
      const pin = addr.postcode ? `PIN: ${addr.postcode}` : '';

      const parts = [primary, locality, area, pin].filter(Boolean);
      const uniqueParts = Array.from(new Set(parts));

      let cleanAddress = uniqueParts.length > 1 ? uniqueParts.join(', ') : data.display_name?.split(',').slice(0, 3).join(', ');
      if (!cleanAddress || cleanAddress.trim().length < 5) {
        cleanAddress = data.display_name || `${nearestWard.name}, Chennai`;
      }

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
    address: `${nearestWard.name}, Chennai (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    displayName: `${nearestWard.name}, ${nearestWard.zone}, Chennai, Tamil Nadu`,
    lat,
    lng,
    nearestWard,
  });
}
