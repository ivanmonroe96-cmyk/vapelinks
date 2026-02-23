import { defineMiddleware } from 'astro:middleware';

/**
 * Canonical host middleware.
 *
 * Ensures all traffic resolves to https://vapelinks.com.au and removes duplicate host aliases.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const host = (context.request.headers.get('x-forwarded-host') || url.host || '').toLowerCase();
  const protocol = (context.request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'https').toLowerCase();
  const canonicalHost = 'vapelinks.com.au';
  const aliasHosts = new Set(['www.vapelinks.com.au', 'vapelink.com.au', 'www.vapelink.com.au']);

  // Skip redirect for local/dev environments
  const skipHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
  const bareHost = host.split(':')[0];
  if (skipHosts.has(bareHost)) {
    return next();
  }

  if (host && (aliasHosts.has(host) || protocol !== 'https')) {
    const target = `https://${canonicalHost}${url.pathname}${url.search}`;
    return context.redirect(target, 301);
  }

  return next();
});
