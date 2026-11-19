import { Mic, Play, Square, Trash2, Volume2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildSelfCompareLabel,
  formatRecordingDuration,
  pickSupportedAudioMimeType,
} from '../../lib/audioRecorder';
import { MuhaffizPageData, ayahKey } from '../../lib/muhaffiz';

interface MuhaffizSelfRecordPanelProps {
  isOpen: boolean;
  pageNumber: number;
  ayahs: MuhaffizPageData['ayahs'];
  palette: {
    paper: string;
    bar: string;
    ink: string;
    muted: string;
    green: string;
    gold: string;
    line: string;
    chip: string;
  };
  onListenAyahIndex: (index: number) => void;
  onClose: () => void;
}

export function MuhaffizSelfRecordPanel({
  isOpen,
  pageNumber,
  ayahs,
  palette,
  onListenAyahIndex,
  onClose,
}: MuhaffizSelfRecordPanelProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSec, setRecordingSec] = useState<number>(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedLabel, setRecordedLabel] = useState<string>('');
  const [statusError, setStatusError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);
  const recordedUrlRef = useRef<string | null>(null);

  const releaseRecordingMedia = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore stop error
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const clearRecordedClip = useCallback(() => {
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }
    setRecordedUrl(null);
    setRecordedLabel('');
  }, []);

  useEffect(() => {
    setSelectedIdx(0);
    setStatusError(null);
    releaseRecordingMedia();
    clearRecordedClip();
  }, [pageNumber, releaseRecordingMedia, clearRecordedClip]);

  useEffect(() => {
    return () => {
      releaseRecordingMedia();
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
        recordedUrlRef.current = null;
      }
    };
  }, [releaseRecordingMedia]);

  if (!isOpen) return null;

  const targetAyah = ayahs[selectedIdx] ?? ayahs[0];

  async function handleStartRecording() {
    setStatusError(null);
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setStatusError(
        'Bu brauzerdə mikrofonla səs yazma dəstəklənmir. Qari tilavətini dinləməklə təkrar edə bilərsiniz.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      durationRef.current = 0;
      setRecordingSec(0);
      clearRecordedClip();

      const mimeType = pickSupportedAudioMimeType((m) => MediaRecorder.isTypeSupported(m));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const capturedSurah = targetAyah?.surahName ?? 'Ayə';
      const capturedKey = targetAyah ? ayahKey(targetAyah) : '';

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (mediaStreamRef.current) {
          for (const track of mediaStreamRef.current.getTracks()) {
            track.stop();
          }
          mediaStreamRef.current = null;
        }
        setIsRecording(false);

        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          const nextUrl = URL.createObjectURL(blob);
          if (recordedUrlRef.current) {
            URL.revokeObjectURL(recordedUrlRef.current);
          }
          recordedUrlRef.current = nextUrl;
          setRecordedUrl(nextUrl);
          setRecordedLabel(
            buildSelfCompareLabel(capturedSurah, capturedKey, Math.max(1, durationRef.current))
          );
        }
      };

      recorder.onerror = () => {
        releaseRecordingMedia();
        setStatusError('Səs yazma zamanı xəta baş verdi. Mikrofon bağlantısını yoxlayın.');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        durationRef.current += 1;
        setRecordingSec(durationRef.current);
        if (durationRef.current >= 180) {
          releaseRecordingMedia();
        }
      }, 1000);
    } catch {
      releaseRecordingMedia();
      setStatusError(
        'Mikrofona giriş icazəsi verilmədi və ya cihaz tapılmadı. Yalnız öz brauzerinizdə lokal yazılır.'
      );
    }
  }

  function handleStopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      releaseRecordingMedia();
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Öz səsini yaz və Qari ilə müqayisə et"
      data-testid="muhaffiz-self-record-panel"
      dir="ltr"
      style={{
        backgroundColor: palette.paper,
        borderColor: palette.line,
        color: palette.ink,
      }}
      className="fixed inset-x-3 bottom-18 z-40 mx-auto max-w-[560px] rounded-2xl border p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b" style={{ borderColor: palette.line }}>
        <div>
          <h2 className="text-sm font-bold">Öz Səsini Yaz və Qari ilə Müqayisə Et</h2>
          <p className="text-[11px]" style={{ color: palette.muted }}>
            Səs yazıları serverə göndərilmir, yalnız bu brauzerdə dinlənilir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            releaseRecordingMedia();
            onClose();
          }}
          aria-label="Səs yazma panelini bağla"
          style={{ backgroundColor: palette.chip }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {ayahs.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: palette.muted }}>
          Səhifə ayələri yüklənir...
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label
              htmlFor="muhaffiz-record-ayah-select"
              className="block text-[11px] font-medium"
              style={{ color: palette.muted }}
            >
              Məşq ediləcək ayə (Səhifə {pageNumber})
            </label>
            <select
              id="muhaffiz-record-ayah-select"
              data-testid="muhaffiz-record-ayah-select"
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number.parseInt(e.target.value, 10))}
              disabled={isRecording}
              style={{
                backgroundColor: palette.bar,
                borderColor: palette.line,
                color: palette.ink,
              }}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
            >
              {ayahs.map((a, idx) => (
                <option key={ayahKey(a)} value={idx}>
                  {a.surahName.replace(/\s+surəsi$/i, '')} · {ayahKey(a)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isRecording ? (
              <button
                type="button"
                onClick={handleStopRecording}
                data-testid="muhaffiz-record-stop-btn"
                style={{ backgroundColor: '#9c2f24', color: '#ffffff' }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold whitespace-nowrap"
              >
                <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span className="font-mono-tabular">
                  Dayandır ({formatRecordingDuration(recordingSec)})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleStartRecording()}
                data-testid="muhaffiz-record-start-btn"
                style={{ backgroundColor: palette.green, color: '#ffffff' }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold whitespace-nowrap"
              >
                <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{recordedUrl ? 'Yenidən yaz' : 'Səs yaz'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onListenAyahIndex(selectedIdx)}
              data-testid="muhaffiz-compare-qari-btn"
              style={{
                backgroundColor: palette.chip,
                borderColor: palette.line,
                color: palette.ink,
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold whitespace-nowrap hover:opacity-80"
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Qarini dinlə ({targetAyah ? ayahKey(targetAyah) : ''})</span>
            </button>
          </div>

          {statusError && (
            <p
              role="status"
              data-testid="muhaffiz-record-status"
              className="rounded-xl border px-3 py-2 text-xs font-medium"
              style={{
                borderColor: palette.line,
                backgroundColor: palette.bar,
                color: '#b45309',
              }}
            >
              {statusError}
            </p>
          )}

          {recordedUrl && (
            <div
              data-testid="muhaffiz-recorded-player-box"
              style={{
                backgroundColor: palette.bar,
                borderColor: palette.line,
              }}
              className="rounded-xl border p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: palette.green }}>
                  <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                  <span>Öz yazınız: {recordedLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={clearRecordedClip}
                  data-testid="muhaffiz-record-delete-btn"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9c2f24] hover:underline"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  <span>Sil</span>
                </button>
              </div>
              <audio
                controls
                src={recordedUrl}
                className="h-9 w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
