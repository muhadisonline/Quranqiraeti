import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  robots?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: string;
  prevPath?: string;
  nextPath?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function upsertMeta(selector: string, attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function syncRelLink(rel: 'canonical' | 'prev' | 'next', href?: string) {
  const existing = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!href) {
    if (existing) existing.remove();
    return;
  }
  const el = existing ?? document.createElement('link');
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
  if (!existing) {
    document.head.appendChild(el);
  }
}

function syncHreflangLink(hreflang: 'az' | 'x-default', href: string) {
  const existing = document.head.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`
  );
  const el = existing ?? document.createElement('link');
  el.setAttribute('rel', 'alternate');
  el.setAttribute('hreflang', hreflang);
  el.setAttribute('href', href);
  if (!existing) {
    document.head.appendChild(el);
  }
}

const DEFAULT_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

export function SeoHead({
  title,
  description,
  path,
  robots = DEFAULT_ROBOTS,
  ogImage,
  ogImageAlt,
  ogType = 'website',
  prevPath,
  nextPath,
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${path}`;
    const resolvedOgImage = ogImage
      ? ogImage.startsWith('http')
        ? ogImage
        : `${origin}${ogImage}`
      : `${origin}/og-default.png`;
    const resolvedAlt = ogImageAlt || title;

    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', robots);
    upsertMeta('meta[name="googlebot"]', 'name', 'googlebot', robots);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Quran Qiraeti');
    upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', 'az_AZ');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', resolvedOgImage);
    upsertMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', resolvedAlt);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:site"]', 'name', 'twitter:site', '@quranqiraeti');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedOgImage);

    syncRelLink('canonical', canonicalUrl);
    syncRelLink('prev', prevPath ? `${origin}${prevPath}` : undefined);
    syncRelLink('next', nextPath ? `${origin}${nextPath}` : undefined);
    syncHreflangLink('az', canonicalUrl);
    syncHreflangLink('x-default', canonicalUrl);

    const ssrScript = document.getElementById('quran-qiraeti-ssr-jsonld');
    if (ssrScript) {
      ssrScript.remove();
    }

    const scriptId = 'quran-qiraeti-jsonld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, robots, ogImage, ogImageAlt, ogType, prevPath, nextPath, jsonLd]);

  return null;
}
