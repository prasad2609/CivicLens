'use client';

import React, { useEffect, useRef } from 'react';
import { CivicIssue } from '@/types';

interface CivicMapProps {
  issues?: CivicIssue[];
  selectedIssueId?: string;
  onSelectIssue?: (issue: CivicIssue) => void;
  center?: [number, number];
  zoom?: number;
  interactivePicker?: boolean;
  onLocationPick?: (lat: number, lng: number) => void;
  pickerLocation?: [number, number] | null;
  className?: string;
  showFilters?: boolean;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  issues = [],
  selectedIssueId,
  onSelectIssue,
  center = [13.0067, 80.2450], // Default Chennai South (Adyar/Velachery corridor)
  zoom = 13,
  interactivePicker = false,
  onLocationPick,
  pickerLocation,
  className = 'h-[500px] w-full rounded-lg shadow-inner',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);
  const onLocationPickRef = useRef(onLocationPick);
  onLocationPickRef.current = onLocationPick;

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let localMap: any = null;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const container = mapContainerRef.current;

      // If the container already has an active leaflet ID or old instance, clean it up safely
      if ((container as any)._leaflet_id) {
        try {
          delete (container as any)._leaflet_id;
        } catch {
          // ignore
        }
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }

      // Fix standard leaflet icon path issues in webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      try {
        const initialCenter = pickerLocation || center;
        localMap = L.map(container, {
          center: initialCenter,
          zoom: zoom,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(localMap);

        const markersLayer = L.layerGroup().addTo(localMap);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = localMap;

        // If interactive picker mode is enabled, register click listener
        if (interactivePicker) {
          localMap.on('click', (e: any) => {
            if (onLocationPickRef.current) {
              const { lat, lng } = e.latlng;
              onLocationPickRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
            }
          });
        }

        // Render initial markers
        renderMarkers(L, localMap, markersLayer);
      } catch (err) {
        console.warn('Leaflet map initialization caught error:', err);
      }
    });

    return () => {
      isMounted = false;
      if (localMap) {
        try {
          localMap.remove();
        } catch {
          // ignore
        }
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      markersLayerRef.current = null;
      pickerMarkerRef.current = null;
    };
  }, []); // Only initialize map once per mount!

  // Update markers and picker position reactively when dependencies change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import('leaflet').then((L) => {
      renderMarkers(L, mapInstanceRef.current, markersLayerRef.current);
    });
  }, [issues, selectedIssueId, pickerLocation, interactivePicker]);

  const renderMarkers = (L: any, map: any, markersLayer: any) => {
    if (!map || !markersLayer) return;

    try {
      markersLayer.clearLayers();

      // Render picker marker if interactive
      if (interactivePicker && pickerLocation) {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              background: #2563eb;
              border: 3px solid #ffffff;
              transform: rotate(-45deg);
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const pMarker = L.marker(pickerLocation, {
          icon: pickerIcon,
          draggable: true,
        }).addTo(markersLayer);

        pMarker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          if (onLocationPickRef.current) {
            onLocationPickRef.current(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
          }
        });

        pickerMarkerRef.current = pMarker;
      }

      // Render Issues Markers
      issues.forEach((issue) => {
        if (!issue.latitude || !issue.longitude) return;

        let pinColor = '#3b82f6';
        if (issue.status === 'resolved' || issue.status === 'closed') {
          pinColor = '#10b981';
        } else if (issue.status === 'escalated' || issue.severity === 'critical') {
          pinColor = '#ef4444';
        } else if (issue.status === 'in_progress' || issue.status === 'reopened') {
          pinColor = '#f59e0b';
        }

        const isSelected = selectedIssueId === issue.id;

        const customPin = L.divIcon({
          className: 'custom-civic-pin',
          html: `
            <div style="
              position: relative;
              width: ${isSelected ? '36px' : '28px'};
              height: ${isSelected ? '36px' : '28px'};
              border-radius: 50% 50% 50% 0;
              background: ${pinColor};
              border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
              transform: rotate(-45deg);
              box-shadow: 0 3px 8px rgba(0,0,0,0.25);
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              <div style="
                width: 6px;
                height: 6px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
              "></div>
            </div>
          `,
          iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
          iconAnchor: [isSelected ? 18 : 14, isSelected ? 36 : 28],
        });

        const marker = L.marker([issue.latitude, issue.longitude], { icon: customPin });

        const popupDiv = document.createElement('div');
        popupDiv.className = 'p-3 max-w-[280px] font-sans';
        popupDiv.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #1e3a8a; letter-spacing: 0.5px;">${issue.complaint_code}</span>
            <span style="font-size: 10px; background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 9999px; text-transform: capitalize;">${issue.status.replace('_', ' ')}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 6px 0; line-height: 1.3;">${escapeHtml(issue.title)}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; line-height: 1.4;">${escapeHtml(issue.location_text)}</p>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            <strong>Dept:</strong> ${escapeHtml(issue.department_name || 'Municipal Intake')}
          </div>
          <a href="/issues/${issue.id}" style="
            display: block;
            text-align: center;
            background: #2563eb;
            color: #ffffff;
            font-size: 11px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 6px;
            text-decoration: none;
          ">View Full Complaint Details &rarr;</a>
        `;

        marker.bindPopup(popupDiv);

        marker.on('click', () => {
          if (onSelectIssue) onSelectIssue(issue);
        });

        markersLayer.addLayer(marker);
      });
    } catch (e) {
      console.warn('Error rendering markers on map:', e);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className={className} />
      {interactivePicker && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md border border-slate-200 text-xs text-slate-700 pointer-events-none">
          Click anywhere on the map to place or drag the location pin
        </div>
      )}
    </div>
  );
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
