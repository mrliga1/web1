import { parseLocation } from './locationMapping';

export function matchesProductLocation(district: string | undefined, selected: string): boolean {
  if (!selected || selected === 'all') return true;
  const parsed = parseLocation(district || '');
  return district?.trim() === selected || [parsed.province, parsed.district, parsed.ward].includes(selected);
}
