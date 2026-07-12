import locationData from './locationData.json';

export interface LocationNode {
  name: string;
  districts?: LocationNode[];
  wards?: string[];
}

export const locationTree = locationData as LocationNode[];

export function formatLocationName(name: string): string {
  if (!name) return '';
  return name
    .replace(/^Tỉnh\s+/i, '')
    .replace(/Tp\.?\s*Hồ\s*Chí\s*Minh/i, 'TP. HCM')
    .replace(/Thành phố Hồ Chí Minh/i, 'TP. HCM');
}

// Export a flat list of all locations for autocomplete (Province, Ward)
export const allLocationsList: string[] = [];
locationTree.forEach(prov => {
  const pName = formatLocationName(prov.name);
  allLocationsList.push(pName);
  if (prov.wards) {
    prov.wards.forEach(ward => {
      allLocationsList.push(`${ward}, ${pName}`);
    });
  }
  // Fallback for legacy data if needed
  if (prov.districts) {
    prov.districts.forEach(dist => {
      if (dist.wards) {
        dist.wards.forEach(ward => {
          allLocationsList.push(`${ward}, ${pName}`);
        });
      }
    });
  }
});

const legacyMapping: Record<string, string> = {
  'quận 2': 'TP Thủ Đức',
  'q2': 'TP Thủ Đức',
  'q.2': 'TP Thủ Đức',
  'quận 9': 'TP Thủ Đức',
  'q9': 'TP Thủ Đức',
  'q.9': 'TP Thủ Đức',
  'quận thủ đức': 'TP Thủ Đức',
  'q thủ đức': 'TP Thủ Đức',
  'phường bình an': 'Phường An Khánh',
  'p.bình an': 'Phường An Khánh',
  'phường bình khánh': 'Phường An Khánh',
  'p.bình khánh': 'Phường An Khánh',
  'tp. hcm': 'hồ chí minh',
  'tp hcm': 'hồ chí minh',
  'hcm': 'hồ chí minh',
  // Ha Noi mergers 2024 (examples, as there are many, we map common ones if needed)
  // For safety, users searching exact legacy strings will be mapped if we add them here.
};

// Normalize input string for safer searching/mapping
export function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase().trim();
}

/**
 * Given a raw location string (e.g., "Phường An Phú, Quận 2, Hồ Chí Minh"),
 * this returns the matched standard province, district, and ward names.
 */
export function parseLocation(rawLocation: string) {
  if (!rawLocation) return { province: null, district: null, ward: null };

  const lowerRaw = normalizeText(rawLocation);
  
  // 1. Try to apply legacy mapping first on segments to catch "Quận 2" -> "TP Thủ Đức"
  const segments = lowerRaw.split(',').map(s => s.trim());
  const mappedSegments = segments.map(seg => {
    let s = seg;
    // Simple replacement for known aliases
    for (const [oldName, newName] of Object.entries(legacyMapping)) {
      if (s === oldName || s.includes(' ' + oldName) || s.startsWith(oldName + ' ')) {
        s = s.replace(newName.toLowerCase(), ''); // Avoid double replacement if they typed "Quận 2, TP Thủ Đức"
        s = newName.toLowerCase();
      }
    }
    return s;
  });
  const mappedRaw = mappedSegments.join(', ');

  let matchedProvince: string | null = null;
  let matchedDistrict: string | null = null;
  let matchedWard: string | null = null;

  // Find Province
  for (const prov of locationTree) {
    const pName = normalizeText(prov.name);
    // e.g. "Hồ Chí Minh" matches "Thành phố Hồ Chí Minh"
    const pShort = pName.replace('thành phố ', '').replace('tp. ', '').replace('tỉnh ', '');
    
    if (mappedRaw.includes(pName) || mappedRaw.includes(pShort)) {
      matchedProvince = formatLocationName(prov.name);
      
      // Find Ward within Province (New 34-province 2-level structure)
      if (prov.wards) {
        const sortedWards = [...prov.wards].sort((a, b) => b.length - a.length);
        for (const ward of sortedWards) {
          const wName = normalizeText(ward);
          const wShort = wName.replace('phường ', '').replace('p. ', '').replace('xã ', '').replace('thị trấn ', '');
          const wardRegex = new RegExp(`\\b${wShort}\\b`, 'i');
          if (mappedRaw.includes(wName) || wardRegex.test(mappedRaw)) {
            matchedWard = ward;
            break;
          }
        }
      }

      // Legacy fallback for old data formats
      if (!matchedWard && prov.districts) {
        for (const dist of prov.districts) {
          const dName = normalizeText(dist.name);
          const dShort = dName.replace('quận ', '').replace('huyện ', '').replace('tp. ', '').replace('tp ', '').replace('thành phố ', '');
          const distRegex = new RegExp(`\\b${dShort}\\b`, 'i');
          
          if (mappedRaw.includes(dName) || distRegex.test(mappedRaw)) {
            matchedDistrict = dist.name;
            const sortedDistWards = [...(dist.wards || [])].sort((a, b) => b.length - a.length);
            for (const ward of sortedDistWards) {
              const wName = normalizeText(ward);
              const wShort = wName.replace('phường ', '').replace('p. ', '').replace('xã ', '').replace('thị trấn ', '');
              const wardRegex = new RegExp(`\\b${wShort}\\b`, 'i');
              if (mappedRaw.includes(wName) || wardRegex.test(mappedRaw)) {
                matchedWard = ward;
                break;
              }
            }
            break;
          }
        }
      }
      break;
    }
  }

  // Fallback: If province not explicitly stated but ward matches something unique
  if (!matchedProvince) {
    for (const prov of locationTree) {
      if (prov.wards) {
        const sortedWards = [...prov.wards].sort((a, b) => b.length - a.length);
        for (const ward of sortedWards) {
          const wName = normalizeText(ward);
          const wShort = wName.replace('phường ', '').replace('p. ', '').replace('xã ', '').replace('thị trấn ', '');
          const wardRegex = new RegExp(`\\b${wShort}\\b`, 'i');
          
          if (mappedRaw.includes(wName) || wardRegex.test(mappedRaw)) {
            matchedProvince = formatLocationName(prov.name);
            matchedWard = ward;
            break;
          }
        }
      }
      if (matchedProvince) break;
    }
  }

  return { province: matchedProvince, district: matchedDistrict, ward: matchedWard };
}
