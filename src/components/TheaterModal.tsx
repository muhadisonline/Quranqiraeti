import { ArrowLeft, ArrowRight, Bookmark, ExternalLink, X } from 'lucide-react';
import { useEffect } from 'react';
import {
  RecitationVideo,
  formatAzerbaijaniDate,
  formatViewCount,
} from '../lib/channel';

interface TheaterModalProps {
  video: RecitationVideo | null;
  isSaved: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleSave: (videoId: string) => void;
}

export function TheaterModal({
  video,
  isSaved,
  hasPrev,
  hasNext,
  onClose,
  onPrev,
  onNext,
  onToggleSave,
}: TheaterModalProps) {
  useEffect(() => {
    if (!video) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [video, onClose]);

  if (!video) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theater-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-stone-200 bg-[#FAF9F6] shadow-2xl dark:border-stone-800 dark:bg-[#121714]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              {video.categoryLabel} · {video.reciter}
            </p>
            <h2
              id="theater-modal-title"
              className="font-display truncate text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-100"
            >
              {video.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-arabic hidden sm:inline text-xl text-[#0F4C3A] dark:text-[#86C7AE]">
              {video.arabicName}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Pleyeri bağla"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Embedded YouTube 16:9 Stage */}
        <div className="relative aspect-video w-full overflow-hidden bg-[#0E1210]">
          <img
            src={video.thumbnailUrl}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover opacity-25 blur-xs"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-stone-300">
              Video pleyer hazırlanır...
            </span>
          </div>
          <iframe
            key={video.videoId}
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="relative z-10 h-full w-full border-0"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col gap-4 border-t border-stone-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
          <div className="max-w-xl">
            <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {video.reflection}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              <span className="font-mono-tabular">{formatAzerbaijaniDate(video.published)}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono-tabular">{formatViewCount(video.views)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrev}
              aria-label="Əvvəlki tilavət"
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-40 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Əvvəlki</span>
            </button>

            <button
              type="button"
              disabled={!hasNext}
              onClick={onNext}
              aria-label="Növbəti tilavət"
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-40 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <span>Növbəti</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(video.videoId)}
              aria-pressed={isSaved}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
                isSaved
                  ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#86C7AE]/15 dark:text-[#86C7AE]'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
              <span>{isSaved ? 'Saxlanılıb' : 'Saxla'}</span>
            </button>

            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3.5 text-xs font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <span>YouTube-da aç</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
