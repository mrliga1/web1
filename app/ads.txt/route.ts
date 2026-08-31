import { getPublicSettings } from '../../src/lib/serverContent';
import {
  normalizeAdSenseSettings,
  toAdsTxtPublisherId,
} from '../../src/lib/adsense';

export const revalidate = 3600;

export async function GET() {
  const generalSettings = await getPublicSettings('general').catch(() => null);
  const settings = normalizeAdSenseSettings(generalSettings?.adSenseSettings);
  const body = `google.com, ${toAdsTxtPublisherId(settings.publisherId)}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
