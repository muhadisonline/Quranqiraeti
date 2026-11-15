import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
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

export function SeoHead({ title, description, path, prevPath, nextPath, jsonLd }: SeoHeadProps) {
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${path}`;

    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    syncRelLink('canonical', canonicalUrl);
    syncRelLink('prev', prevPath ? `${origin}${prevPath}` : undefined);
    syncRelLink('next', nextPath ? `${origin}${nextPath}` : undefined);

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
  }, [title, description, path, prevPath, nextPath, jsonLd]);

  return null;
}
