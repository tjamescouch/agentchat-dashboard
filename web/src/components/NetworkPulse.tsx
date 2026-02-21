import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { DashboardState, DashboardAction } from '../types';
import { agentColor } from '../utils';

export function NetworkPulse({ state, dispatch }: { state: DashboardState; dispatch: React.Dispatch<DashboardAction> }) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: true,
      attributionControl: false
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when agents change
  useEffect(() => {
    if (!mapRef.current) return;

    const agents = Object.values(state.agents).filter(a => a.online);
    const markers = markersRef.current;
    const map = mapRef.current;

    // Mock geo locations (you'd get this from agent metadata in reality)
    const geoLocations: Record<string, [number, number]> = {
      // Add some example locations
    };

    // Remove stale markers
    const activeIds = new Set(agents.map(a => a.id));
    for (const [id, marker] of markers) {
      if (!activeIds.has(id)) {
        map.removeLayer(marker);
        markers.delete(id);
      }
    }

    // Add/update markers
    for (const agent of agents) {
      const location = geoLocations[agent.id] || getRandomLocation();
      const color = agentColor(agent.nick || agent.id);
      const existing = markers.get(agent.id);

      if (existing) {
        existing.setLatLng(location);
        existing.setStyle({ fillColor: color });
      } else {
        const marker = L.circleMarker(location, {
          radius: 6,
          fillColor: color,
          color: '#fff',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.6
        });

        marker.bindPopup(`<b>${agent.nick || agent.id}</b><br/>${agent.verified ? '✓ Verified' : ''}`);
        marker.addTo(map);
        markers.set(agent.id, marker);
      }
    }
  }, [state.agents]);

  return (
    <div className="network-pulse-map">
      <div className="map-header">
        <h3>Network Pulse — Geographic View</h3>
        <button onClick={() => dispatch({ type: 'TOGGLE_PULSE' })}>Close</button>
      </div>
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}

// Generate random location for demo purposes
function getRandomLocation(): [number, number] {
  const lat = (Math.random() - 0.5) * 160 - 10; // -90 to 70
  const lng = (Math.random() - 0.5) * 360; // -180 to 180
  return [lat, lng];
}
