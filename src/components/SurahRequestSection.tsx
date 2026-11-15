import { Check } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  SurahRequestInput,
  SurahRequestRecord,
  formatAzerbaijaniDate,
  validateSurahRequest,
} from '../lib/channel';
import { parseJsonSafely } from '../lib/quranClient';

interface SurahRequestSectionProps {
  requests: SurahRequestRecord[];
  onSubmitted: (newRequest: SurahRequestRecord) => void;
}

export function SurahRequestSection({
  requests,
  onSubmitted,
}: SurahRequestSectionProps) {
  const [form, setForm] = useState<SurahRequestInput>({
    surahName: '',
    reciter: '',
    email: '',
    note: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SurahRequestInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccessMessage('');
    setSubmitError('');

    const validation = validateSurahRequest(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await parseJsonSafely<{
        request?: SurahRequestRecord;
        error?: string;
        errors?: Partial<Record<keyof SurahRequestInput, string>>;
      }>(response);

      if (!response.ok || !payload?.request) {
        if (payload?.errors) setErrors(payload.errors);
        setSubmitError(payload?.error || 'Sorğu göndərilərkən xəta baş verdi.');
        return;
      }

      onSubmitted(payload.request);
      setForm({ surahName: '', reciter: '', email: '', note: '' });
      setSuccessMessage('Təklifiniz qəbul olundu. Növbəti yayımlarımızda nəzərə alınacaq.');
    } catch {
      setSubmitError('Şəbəkə xətası baş verdi. Zəhmət olmasa bir daha yoxlayın.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="istek"
      className="border-b border-stone-200/80 py-16 lg:py-20 dark:border-stone-800/80"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left: Form */}
          <div className="lg:col-span-6">
            <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
              Dinləyici İstəkləri
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
              Növbəti yayımda hansı surəni eşitmək istərdiniz?
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              Arzuladığınız surəni və ya qarini qeyd edin. Kanal heyəti tərcümə və səs montajını
              hazırlayaraq YouTube kanalında yayımlayacaq.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="req-surah"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  Surə və ya ayə adı <span aria-hidden="true">*</span>
                </label>
                <input
                  id="req-surah"
                  type="text"
                  required
                  value={form.surahName}
                  onChange={(e) => setForm((f) => ({ ...f, surahName: e.target.value }))}
                  placeholder="Məsələn: Yasin surəsi və ya Bəqərə 255"
                  aria-invalid={Boolean(errors.surahName)}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#86C7AE]"
                />
                {errors.surahName && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                    {errors.surahName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="req-reciter"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                  >
                    Qari (istəyə bağlı)
                  </label>
                  <input
                    id="req-reciter"
                    type="text"
                    value={form.reciter}
                    onChange={(e) => setForm((f) => ({ ...f, reciter: e.target.value }))}
                    placeholder="Məsələn: Maher Al-Muaiqly"
                    className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#86C7AE]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="req-email"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                  >
                    E-poçt (bildiriş üçün)
                  </label>
                  <input
                    id="req-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="ad@numune.az"
                    aria-invalid={Boolean(errors.email)}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#86C7AE]"
                  />
                  {errors.email && (
                    <p role="alert" className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="req-note"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  Əlavə qeyd (istəyə bağlı)
                </label>
                <textarea
                  id="req-note"
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Tərcümə və ya qiraət üslubu haqqında qeydiniz..."
                  className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#86C7AE]"
                />
                {errors.note && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                    {errors.note}
                  </p>
                )}
              </div>

              {submitError && (
                <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
                  {submitError}
                </p>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-lg border border-[#0F4C3A]/30 bg-[#0F4C3A]/8 px-4 py-3 text-xs font-medium text-[#0F4C3A] dark:border-[#86C7AE]/30 dark:bg-[#86C7AE]/10 dark:text-[#86C7AE]"
                >
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-[#0F4C3A] px-6 py-3 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#0B3A2C] disabled:opacity-60 dark:bg-[#196B52] dark:hover:bg-[#1E7F61] min-h-[44px]"
              >
                {submitting ? 'Göndərilir...' : 'Surə istəyini göndər'}
              </button>
            </form>
          </div>

          {/* Right: Recent Community Requests */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-stone-200 bg-[#F3F1EC] p-6 sm:p-8 dark:border-stone-800 dark:bg-[#141916]">
              <h3 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
                Son dinləyici təklifləri
              </h3>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                İcma üzvlərinin növbəti buraxılışlar üçün göndərdiyi surələr
              </p>

              <ul
                data-testid="request-list"
                className="mt-6 divide-y divide-stone-200/80 dark:divide-stone-800"
              >
                {requests.map((item) => (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {item.surahName}
                      </span>
                      <span className="font-mono-tabular text-xs text-stone-500 dark:text-stone-400 shrink-0">
                        {formatAzerbaijaniDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      Qari: {item.reciter || 'Redaksiya seçimi'}
                    </p>
                    {item.note && (
                      <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                        {item.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
