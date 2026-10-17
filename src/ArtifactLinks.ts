import path from 'path';
import { z } from 'zod';
import { ArtifactLink, ArtifactLinksOptions } from '.';

export const isArtifactUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return /^https?:\/\//i.test(value) && ['http:', 'https:'].includes(url.protocol)
      && !url.username && !url.password && !/[\s<>|\\]/.test(value);
  } catch {
    return false;
  }
};

const hostedUrl = z.string().refine(isArtifactUrl, 'Use an HTTP(S) URL without credentials or whitespace');
export const ArtifactLinksSchema = z.object({
  baseUrl: hostedUrl.refine(value => !/[?#]/.test(value),
    'baseUrl must not contain a query or fragment').optional(),
  pathPrefix: z.string().trim().min(1).optional(),
  reportUrl: hostedUrl.optional(),
}).refine(options => !options.pathPrefix || !!options.baseUrl,
  'pathPrefix requires baseUrl');

/** Resolve only files inside the configured upload directory. No files are read or uploaded. */
export const resolveArtifactLinks = (
  attachments: { name: string; path?: string; contentType: string }[] = [],
  options?: ArtifactLinksOptions,
): ArtifactLink[] => {
  if (!options) return [];
  const links: ArtifactLink[] = [];
  if (options.reportUrl) links.push({ name: 'HTML report', url: options.reportUrl });
  if (!options.baseUrl) return links;

  const prefix = options.pathPrefix ?? process.cwd();
  // CLI reports can originate on a different operating system.
  const windowsPrefix = /^[a-z]:[\\/]|^\\\\/i.test(prefix)
    || (!path.posix.isAbsolute(prefix) && process.platform === 'win32');
  const paths = windowsPrefix ? path.win32 : path.posix;
  const root = paths.resolve(prefix.replace(/\\/g, '/'));
  const base = options.baseUrl.endsWith('/') ? options.baseUrl : `${options.baseUrl}/`;
  for (const attachment of attachments) {
    if (!attachment.path || /^[a-z][a-z\d+.-]*:\/\//i.test(attachment.path)) continue;
    const normalized = attachment.path.replace(/\\/g, '/');
    // A foreign absolute path must never be treated as a relative file name.
    if (paths === path.posix && /^[a-z]:/i.test(normalized)) continue;
    const relative = paths.relative(root, paths.resolve(normalized));
    if (!relative || relative === '..' || relative.startsWith(`..${paths.sep}`)
      || paths.isAbsolute(relative)) continue;
    const url = new URL(relative.split(paths.sep).map(encodeURIComponent).join('/'), base).href;
    if (!links.some(link => link.url === url)) {
      links.push({ name: attachment.name, url, contentType: attachment.contentType });
    }
  }
  return links;
};
