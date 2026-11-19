import { useMemo } from 'react';
import {
  TAJWEED_RULES,
  TAJWEED_RULE_ORDER,
  tokenizeTajweedSegments,
} from '../lib/tajweed';

interface TajweedArabicTextProps {
  text: string;
  enabled: boolean;
}

export function TajweedArabicText({ text, enabled }: TajweedArabicTextProps) {
  const segments = useMemo(() => {
    if (!enabled) return null;
    return tokenizeTajweedSegments(text);
  }, [text, enabled]);

  if (!enabled || !segments) {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((seg, idx) => {
        if (!seg.rule) {
          return <span key={idx}>{seg.text}</span>;
        }
        const meta = TAJWEED_RULES[seg.rule];
        return (
          <span
            key={idx}
            data-tajweed-rule={seg.rule}
            title={`${meta.label}: ${meta.description}`}
            className={`${meta.textClass} transition-colors`}
          >
            {seg.text}
          </span>
        );
      })}
    </>
  );
}

interface TajweedLegendBarProps {
  onClose?: () => void;
}

export function TajweedLegendBar({ onClose }: TajweedLegendBarProps) {
  return (
    <div
      data-testid="tajweed-legend"
      role="region"
      aria-label="Təcvid rəng qaydaları"
      className="mt-4 rounded-xl border border-stone-200 bg-[#F7F5F0] px-4 py-3.5 dark:border-stone-800 dark:bg-[#141916]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80 dark:border-stone-800">
        <div>
          <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
            Təcvid Rəngli Oxunuş Qaydaları
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Rəngli hərflərin üzərinə gəldikdə qaydanın qısa izahını görə bilərsiniz.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 whitespace-nowrap"
          >
            Təcvidi bağla
          </button>
        )}
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {TAJWEED_RULE_ORDER.map((key) => {
          const rule = TAJWEED_RULES[key];
          return (
            <div
              key={rule.key}
              className="flex items-start gap-2 rounded-lg border border-stone-200/80 bg-white px-2.5 py-2 dark:border-stone-800 dark:bg-[#181E1B]"
            >
              <span
                aria-hidden="true"
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${rule.swatchClass}`}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                  {rule.label}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-stone-500 dark:text-stone-400">
                  {rule.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
