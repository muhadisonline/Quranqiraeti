import { CheckCircle2, Compass, RotateCcw, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PrayerLocation, computeQiblaDirection } from '../lib/prayerTimes';

interface QiblaCompassProps {
  location: PrayerLocation;
}

type SensorStatus = 'idle' | 'active' | 'permission-required' | 'unavailable';

interface DeviceOrientationEventWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DeviceOrientationConstructorWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function QiblaCompass({ location }: QiblaCompassProps) {
  const qibla = computeQiblaDirection(location.lat, location.lng);

  const [sensorHeading, setSensorHeading] = useState<number | null>(null);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>(() => {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
      return 'unavailable';
    }
    const ctor = DeviceOrientationEvent as unknown as DeviceOrientationConstructorWithPermission;
    if (typeof ctor.requestPermission === 'function') {
      return 'permission-required';
    }
    return 'idle';
  });
  const [sensorMessage, setSensorMessage] = useState<string>('');

  const handleOrientation = useCallback((event: Event) => {
    const e = event as DeviceOrientationEventWithWebkit;
    let heading: number | null = null;
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      heading = ((e.webkitCompassHeading % 360) + 360) % 360;
    } else if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
      heading = ((360 - e.alpha) % 360 + 360) % 360;
    }
    if (heading !== null) {
      setSensorHeading(Math.round(heading));
      setSensorStatus('active');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
      return;
    }
    const ctor = DeviceOrientationEvent as unknown as DeviceOrientationConstructorWithPermission;
    if (typeof ctor.requestPermission === 'function') {
      // Wait for explicit user gesture on iOS Safari
      return;
    }

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  async function handleEnableMobileSensor() {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
      setSensorStatus('unavailable');
      setSensorMessage('Bu cihazda kompas sensoru mövcud deyil.');
      return;
    }
    const ctor = DeviceOrientationEvent as unknown as DeviceOrientationConstructorWithPermission;
    if (typeof ctor.requestPermission === 'function') {
      try {
        const res = await ctor.requestPermission();
        if (res === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          setSensorStatus('active');
          setSensorMessage('Cihaz kompas sensoru aktivləşdirildi.');
        } else {
          setSensorMessage('Sensor icazəsi rədd edildi. Aşağıdakı sürgü ilə bucağı yoxlaya bilərsiniz.');
        }
      } catch {
        setSensorMessage('Sensor icazəsi alına bilmədi.');
      }
      return;
    }

    if (sensorHeading === null) {
      setSensorMessage(
        'Masaüstü cihazlarda fiziki maqnit sensoru olmur — aşağıdakı sürgü ilə cihaz yönünü sınaqdan keçirə bilərsiniz.'
      );
    } else {
      setSensorMessage('Kompas sensoru canlı oxunur.');
    }
  }

  const activeHeading = sensorHeading !== null ? sensorHeading : manualHeading;
  // Shortest signed angular difference in [-180, 180]
  const rawDelta = ((qibla.bearingDegrees - activeHeading + 540) % 360) - 180;
  const isAligned = Math.abs(rawDelta) <= 5;

  const turnHint = isAligned
    ? 'Qiblə istiqaməti uyğundur'
    : rawDelta > 0
      ? `Sağa ${Math.round(rawDelta)}° çevirin`
      : `Sola ${Math.round(Math.abs(rawDelta))}° çevirin`;

  // Dial rotates by -activeHeading so top of SVG always reflects what user is facing
  const dialRotationDeg = -activeHeading;

  return (
    <section
      aria-labelledby="qibla-compass-heading"
      data-testid="qibla-compass-card"
      className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-[#141916]"
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              <span>İnteraktiv Qiblə Kompası</span>
            </div>
            <h2
              id="qibla-compass-heading"
              className="font-display mt-1.5 text-2xl font-semibold text-stone-900 dark:text-stone-100"
            >
              {location.name} üçün Qiblə Yönü
            </h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Şimaldan saat əqrəbi yönündə{' '}
              <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                {qibla.bearingDegrees}° ({qibla.cardinalLabel})
              </span>{' '}
              · Məkkəyə məsafə{' '}
              <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                {qibla.distanceKm.toLocaleString('az-AZ')} km
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleEnableMobileSensor}
            data-testid="qibla-sensor-btn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
          >
            <Smartphone className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
            <span>
              {sensorStatus === 'active'
                ? 'Sensor aktivdir'
                : sensorStatus === 'permission-required'
                  ? 'Kompas sensorunu aç'
                  : 'Mobil sensoru yoxla'}
            </span>
          </button>
        </div>

        {/* SVG Compass Dial */}
        <div className="mt-5 flex flex-col items-center">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 select-none">
            {/* Fixed Top Target Pointer */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 -top-1.5 z-10 -translate-x-1/2 text-[#0F4C3A] dark:text-[#86C7AE]"
            >
              <svg width="16" height="12" viewBox="0 0 16 12">
                <polygon points="8,11 1,1 15,1" fill="currentColor" />
              </svg>
            </div>

            <svg
              viewBox="0 0 240 240"
              className="w-full h-full"
              role="img"
              aria-label={`Qiblə kompası: Məkkə bucağı ${qibla.bearingDegrees} dərəcə, cihaz yönü ${activeHeading} dərəcə`}
            >
              {/* Outer Bezel */}
              <circle
                cx="120"
                cy="120"
                r="108"
                className="fill-[#FAF9F6] stroke-stone-200 dark:fill-[#181E1B] dark:stroke-stone-700"
                strokeWidth="2"
              />
              <circle
                cx="120"
                cy="120"
                r="82"
                className="fill-none stroke-stone-200/80 dark:stroke-stone-800"
                strokeWidth="1"
              />

              {/* Rotating Rose */}
              <g
                style={{
                  transform: `rotate(${dialRotationDeg}deg)`,
                  transformOrigin: '120px 120px',
                  transition: 'transform 160ms ease-out',
                }}
              >
                {/* Degree tick marks */}
                {Array.from({ length: 36 }).map((_, idx) => {
                  const deg = idx * 10;
                  const isMajor = deg % 90 === 0;
                  const isMid = deg % 30 === 0;
                  return (
                    <line
                      key={deg}
                      x1="120"
                      y1={isMajor ? 16 : isMid ? 18 : 20}
                      x2="120"
                      y2="25"
                      transform={`rotate(${deg} 120 120)`}
                      className={
                        isMajor
                          ? 'stroke-stone-700 dark:stroke-stone-300'
                          : 'stroke-stone-300 dark:stroke-stone-600'
                      }
                      strokeWidth={isMajor ? 2 : 1}
                    />
                  );
                })}

                {/* Cardinal Labels (counter-rotated so letters remain upright at any heading) */}
                <text
                  x="120"
                  y="40"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${-dialRotationDeg} 120 40)`}
                  className="fill-[#B91C1C] dark:fill-[#FB7185] text-[11px] font-bold"
                >
                  Şm
                </text>
                <text
                  x="202"
                  y="120"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${-dialRotationDeg} 202 120)`}
                  className="fill-stone-600 dark:fill-stone-400 text-[10px] font-semibold"
                >
                  Şq
                </text>
                <text
                  x="120"
                  y="202"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${-dialRotationDeg} 120 202)`}
                  className="fill-stone-600 dark:fill-stone-400 text-[10px] font-semibold"
                >
                  C
                </text>
                <text
                  x="38"
                  y="120"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${-dialRotationDeg} 38 120)`}
                  className="fill-stone-600 dark:fill-stone-400 text-[10px] font-semibold"
                >
                  Qb
                </text>

                {/* Qibla Bearing Needle */}
                <g transform={`rotate(${qibla.bearingDegrees} 120 120)`}>
                  <line
                    x1="120"
                    y1="120"
                    x2="120"
                    y2="34"
                    stroke={isAligned ? '#0F4C3A' : '#C6A769'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Arrow head / Kaaba indicator */}
                  <polygon
                    points="120,25 112,42 128,42"
                    fill={isAligned ? '#0F4C3A' : '#C6A769'}
                  />
                  {/* Small Kaaba square badge near tip */}
                  <rect
                    x="114"
                    y="45"
                    width="12"
                    height="12"
                    rx="2"
                    fill="#1C1917"
                    stroke="#C6A769"
                    strokeWidth="1.5"
                  />
                </g>
              </g>

              {/* Center Hub */}
              <circle
                cx="120"
                cy="120"
                r="14"
                className="fill-white stroke-stone-300 dark:fill-[#141916] dark:stroke-stone-600"
                strokeWidth="2"
              />
              <circle
                cx="120"
                cy="120"
                r="5"
                fill={isAligned ? '#0F4C3A' : '#C6A769'}
              />
            </svg>
          </div>

          {/* Alignment Readout */}
          <div
            data-testid="qibla-alignment-status"
            className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
              isAligned
                ? 'border-[#0F4C3A]/40 bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE]/40 dark:bg-[#86C7AE]/15 dark:text-[#86C7AE]'
                : 'border-stone-200 bg-[#FAF9F6] text-stone-700 dark:border-stone-800 dark:bg-[#181E1B] dark:text-stone-200'
            }`}
          >
            {isAligned && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            <span>{turnHint}</span>
          </div>
        </div>
      </div>

      {/* Desktop / Manual Heading Test & Calibration Controls */}
      <div className="mt-5 border-t border-stone-200/80 pt-4 dark:border-stone-800">
        <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
          <label htmlFor="qibla-manual-slider" className="font-medium text-stone-700 dark:text-stone-300">
            Cihaz yönü {sensorHeading !== null ? '(Sensor)' : '(Əl ilə kalibrasiya)'}:{' '}
            <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
              {activeHeading}°
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSensorHeading(null);
                setManualHeading(qibla.bearingDegrees);
              }}
              data-testid="qibla-align-btn"
              className="text-[11px] font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE] whitespace-nowrap"
            >
              Qibləyə yönəlt ({qibla.bearingDegrees}°)
            </button>
            <button
              type="button"
              onClick={() => {
                setSensorHeading(null);
                setManualHeading(0);
              }}
              title="Şimal (0°) istiqamətinə sıfırla"
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>0°</span>
            </button>
          </div>
        </div>

        <input
          id="qibla-manual-slider"
          type="range"
          min={0}
          max={359}
          value={activeHeading}
          onChange={(e) => {
            setSensorHeading(null);
            setManualHeading(Number(e.target.value));
          }}
          data-testid="qibla-heading-slider"
          className="mt-2 w-full accent-[#0F4C3A] dark:accent-[#86C7AE]"
        />

        {sensorMessage && (
          <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400" role="status">
            {sensorMessage}
          </p>
        )}
      </div>
    </section>
  );
}
