import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, LocateFixed, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  PrayerLocation,
  WORLD_PRAYER_CITIES,
  computeQiblaDirection,
} from '../lib/prayerTimes';

interface PrayerMapPickerProps {
  location: PrayerLocation;
  isDark: boolean;
  onSelectCity: (cityId: string) => void;
  onSelectCoordinates: (lat: number, lng: number) => void;
}

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const KAABA_COORDS: [number, number] = [21.422487, 39.826206];

function createActivePinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'quranqiraeti-map-pin',
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:#0F4C3A;border:3px solid #C6A769;box-shadow:0 3px 10px rgba(0,0,0,0.35);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function PrayerMapPicker({
  location,
  isDark,
  onSelectCity,
  onSelectCoordinates,
}: PrayerMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);
  const qiblaLineRef = useRef<L.Polyline | null>(null);

  const onSelectCityRef = useRef(onSelectCity);
  const onSelectCoordsRef = useRef(onSelectCoordinates);
  onSelectCityRef.current = onSelectCity;
  onSelectCoordsRef.current = onSelectCoordinates;

  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'error'>('idle');
  const [geoMessage, setGeoMessage] = useState<string>('');

  const qibla = computeQiblaDirection(location.lat, location.lng);

  // Initialize Leaflet map once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [location.lat, location.lng],
      zoom: location.isCustom ? 7 : 6,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(OSM_TILE_URL, {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    // Render clickable city dots across catalog cities
    for (const c of WORLD_PRAYER_CITIES) {
      const dot = L.circleMarker([c.lat, c.lng], {
        radius: 5,
        color: '#0F4C3A',
        weight: 1.5,
        fillColor: '#C6A769',
        fillOpacity: 0.9,
      }).addTo(map);
      dot.bindTooltip(`${c.name} (${c.countryName})`, { direction: 'top', offset: [0, -4] });
      dot.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        setGeoStatus('idle');
        setGeoMessage('');
        onSelectCityRef.current(c.id);
      });
    }

    const activeMarker = L.marker([location.lat, location.lng], {
      icon: createActivePinIcon(),
      zIndexOffset: 500,
    }).addTo(map);
    activeMarkerRef.current = activeMarker;

    const qiblaLine = L.polyline([[location.lat, location.lng], KAABA_COORDS], {
      color: '#C6A769',
      weight: 1.75,
      opacity: 0.85,
      dashArray: '5, 6',
    }).addTo(map);
    qiblaLineRef.current = qiblaLine;

    map.on('click', (ev: L.LeafletMouseEvent) => {
      const lat = Number(ev.latlng.lat.toFixed(4));
      const lng = Number(ev.latlng.lng.toFixed(4));
      setGeoStatus('idle');
      setGeoMessage('');
      onSelectCoordsRef.current(lat, lng);
    });

    mapRef.current = map;
    const raf = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(raf);
      map.remove();
      mapRef.current = null;
      activeMarkerRef.current = null;
      qiblaLineRef.current = null;
    };
  }, []);

  // Pan and update active pin + Qibla line whenever selected location changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = activeMarkerRef.current;
    const line = qiblaLineRef.current;
    if (!map || !marker || !line) return;

    const nextLatLng: [number, number] = [location.lat, location.lng];
    marker.setLatLng(nextLatLng);
    line.setLatLngs([nextLatLng, KAABA_COORDS]);

    const currentCenter = map.getCenter();
    const distMoved = Math.hypot(currentCenter.lat - location.lat, currentCenter.lng - location.lng);
    if (distMoved > 0.01) {
      map.flyTo(nextLatLng, Math.max(map.getZoom(), 6), { duration: 0.65 });
    }
  }, [location.lat, location.lng]);

  function handleAutoLocate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('error');
      setGeoMessage('Brauzeriniz avtomatik məkan təyinini dəstəkləmir. Xəritəyə klikləyərək seçin.');
      return;
    }

    setGeoStatus('locating');
    setGeoMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        setGeoStatus('idle');
        setGeoMessage('');
        onSelectCoordinates(lat, lng);
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 8, { duration: 0.7 });
        }
      },
      () => {
        setGeoStatus('error');
        setGeoMessage('Məkan icazəsi verilmədi və ya tapılmadı. Xəritə üzərində istənilən nöqtəyə klikləyin.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <section
      aria-label="Xəritə üzərində məkan seçimi"
      data-testid="prayer-map-picker"
      className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#141916]"
    >
      <div className="flex flex-col gap-3 border-b border-stone-200 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-stone-900 dark:text-stone-100">
            <MapPin className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
            <span>
              {location.isCustom
                ? `${location.name} (${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°)`
                : `${location.countryName} · ${location.name}`}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 font-mono-tabular text-stone-500 dark:text-stone-400">
            <Compass className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
            <span>
              Qiblə: {qibla.bearingDegrees}° ({qibla.cardinalLabel}) · {qibla.distanceKm.toLocaleString('az-AZ')} km
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleAutoLocate}
          disabled={geoStatus === 'locating'}
          data-testid="auto-locate-btn"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3.5 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#0B3A2C] disabled:opacity-60 dark:bg-[#196B52]"
        >
          <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{geoStatus === 'locating' ? 'Məkan axtarılır...' : 'Məkanımı avtomatik tap'}</span>
        </button>
      </div>

      {geoMessage && (
        <p
          role="status"
          className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
        >
          {geoMessage}
        </p>
      )}

      <div
        ref={containerRef}
        data-testid="prayer-map-canvas"
        className={`relative z-0 h-[300px] w-full sm:h-[340px] ${
          isDark
            ? 'bg-[#181E1B] [&_.leaflet-tile-pane]:brightness-90 [&_.leaflet-tile-pane]:invert [&_.leaflet-tile-pane]:hue-rotate-180 [&_.leaflet-tile-pane]:contrast-95 [&_.leaflet-tile-pane]:saturate-75'
            : 'bg-[#EAE6DC]'
        }`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 px-5 py-2.5 text-[11px] text-stone-500 dark:border-stone-800 dark:text-stone-400">
        <span>
          Xəritədə istənilən şəhərə və ya nöqtəyə klikləyərək namaz vaxtlarını avtomatik hesablayın.
        </span>
        <span className="font-mono-tabular">
          Qızılı xətt: Kəbə (Qiblə) istiqaməti
        </span>
      </div>
    </section>
  );
}
