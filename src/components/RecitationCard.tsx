import { Bookmark, Play } from 'lucide-react';
import { useState } from 'react';
import { RecitationVideo, formatViewCount } from '../lib/channel';

interface RecitationCardProps {
  video: RecitationVideo;
  isSaved: boolean;
  onPlay: (video: RecitationVideo) => void;
  onToggleSave: (videoId: string) => void;
  onOpenDetail: (videoId: string) => void;
}

export function RecitationCard({
  video,
  isSaved,
  onPlay,
  onToggleSave,
  onOpenDetail,
}: RecitationCardProps) {
  const [thumbError, setThumbError] = useState(false);

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors duration-150 hover:border-stone-300 dark:border-stone-800 dark:bg-[#141916] dark:hover:border-stone-700">
      <div>
        {/* 16:9 Thumbnail Frame */}
        <div className="relative aspect-video w-full overflow-hidden border-b border-stone-200/80 bg-stone-100 dark:border-stone-800 dark:bg-stone-900">
          {!thumbError ? (
            <img
              src={video.thumbnailUrl}
              alt={`${video.title} — ${video.reciter} tilavət videosu`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setThumbError(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0F4C3A]/12 via-stone-100 to-[#9A7B3E]/15 p-4 text-center dark:from-[#0F4C3A]/30 dark:via-stone-900 dark:to-[#9A7B3E]/20">
              <span className="font-arabic text-2xl text-[#0F4C3A] dark:text-[#86C7AE]">
                {video.arabicName}
              </span>
              <span className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-300">
                {video.surahName}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onPlay(video)}
            aria-label={`${video.title} tilavətini aç`}
            className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/25 focus-visible:bg-black/35 focus-visible:outline-none"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF9F6]/95 text-[#0F4C3A] shadow-sm transition-transform duration-200 group-hover:scale-105 dark:bg-[#0E1210]/90 dark:text-[#86C7AE]">
              <Play className="h-5 w-5 fill-current ml-0.5" aria-hidden="true" />
            </span>
          </button>
        </div>

        {/* Unboxed Metadata & Editorial Content */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate">
              <span>{video.categoryLabel}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono-tabular">{video.duration}</span>
            </p>
            <span className="font-arabic text-base text-[#0F4C3A] dark:text-[#86C7AE] shrink-0">
              {video.arabicName}
            </span>
          </div>

          <h3 className="font-display mt-2.5 text-xl leading-snug font-semibold text-stone-900 dark:text-stone-100">
            <a
              href={`/video/${video.videoId}`}
              onClick={(e) => {
                e.preventDefault();
                onOpenDetail(video.videoId);
              }}
              className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE] transition-colors"
            >
              {video.title}
            </a>
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {video.reflection}
          </p>
        </div>
      </div>

      {/* Card Footer Controls */}
      <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3.5 dark:border-stone-800/80">
        <div className="text-xs text-stone-500 dark:text-stone-400 truncate pr-2">
          <span>{video.reciter}</span>
          <span aria-hidden="true" className="mx-1.5">·</span>
          <span className="font-mono-tabular">{formatViewCount(video.views)}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onToggleSave(video.videoId)}
            aria-pressed={isSaved}
            aria-label={
              isSaved
                ? `${video.title} tilavətini əlfəcinlərdən çıxar`
                : `${video.title} tilavətini əlfəcinlərə əlavə et`
            }
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] ${
              isSaved
                ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#86C7AE]/15 dark:text-[#86C7AE]'
                : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-800 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-200'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>

          <a
            href={`/video/${video.videoId}`}
            onClick={(e) => {
              e.preventDefault();
              onOpenDetail(video.videoId);
            }}
            className="inline-flex items-center rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-600"
          >
            Ətraflı
          </a>

          <button
            type="button"
            onClick={() => onPlay(video)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3.5 py-2 text-xs font-medium text-stone-900 whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#0F4C3A] hover:text-white dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-[#196B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A]"
          >
            Dinlə
          </button>
        </div>
      </div>
    </article>
  );
}
