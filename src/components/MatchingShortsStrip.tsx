import { Film, Play } from 'lucide-react';
import { RecitationVideo } from '../lib/channel';
import { MatchedShortVideo } from '../lib/shortsMatcher';

interface MatchingShortsStripProps {
  matches: MatchedShortVideo[];
  onPlayVideo: (video: RecitationVideo) => void;
  className?: string;
}

export function MatchingShortsStrip({
  matches,
  onPlayVideo,
  className = '',
}: MatchingShortsStripProps) {
  if (matches.length === 0) return null;

  return (
    <section
      aria-label="Oxunan ayələrə uyğun kanal Shorts tilavətləri"
      data-testid="matching-shorts-strip"
      className={`rounded-xl border border-stone-200 bg-[#F7F5F0] p-4 dark:border-stone-800 dark:bg-[#141916] ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
          <Film className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Oxunan ayələrə uyğun kanal Shorts tilavətləri</span>
        </div>
        <span className="font-mono-tabular shrink-0 whitespace-nowrap text-[11px] text-stone-500 dark:text-stone-400">
          {matches.length} video
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map(({ video, matchLabel }) => (
          <button
            key={video.videoId}
            type="button"
            onClick={() => onPlayVideo(video)}
            data-testid={`matching-short-card-${video.videoId}`}
            className="group flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-2 text-left transition-colors hover:border-[#0F4C3A] dark:border-stone-800 dark:bg-[#181E1B] dark:hover:border-[#86C7AE]"
          >
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-stone-200 dark:bg-stone-800">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white transition-colors group-hover:bg-black/40">
                <Play className="h-4 w-4 fill-current ml-0.5" aria-hidden="true" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-mono-tabular text-[11px] font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                {matchLabel}
                <span aria-hidden="true" className="mx-1 text-stone-400">·</span>
                <span className="font-normal text-stone-500 dark:text-stone-400">{video.duration}</span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium text-stone-900 group-hover:text-[#0F4C3A] dark:text-stone-100 dark:group-hover:text-[#86C7AE]">
                {video.title}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
