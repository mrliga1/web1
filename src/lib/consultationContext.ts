export interface ConsultationContext {
  sourceUrl: string;
  pageTitle: string;
  propertyId: string;
  propertyTitle: string;
}

export function createConsultationContext(href: string, title: string): ConsultationContext {
  try {
    const url = new URL(href);
    if (!/^https?:$/.test(url.protocol)) throw new Error('URL không hợp lệ');
    url.hash = '';
    const pageTitle = title.trim().slice(0, 500) || 'Greenia Homes';
    return { sourceUrl: url.href, pageTitle, propertyId: url.pathname, propertyTitle: pageTitle };
  } catch {
    return { sourceUrl: '', pageTitle: 'Greenia Homes', propertyId: '', propertyTitle: 'Greenia Homes' };
  }
}

export function readConsultationContext(): ConsultationContext {
  if (typeof window === 'undefined') return createConsultationContext('', '');
  return createConsultationContext(
    window.location.href,
    document.querySelector('main h1')?.textContent || document.title,
  );
}
