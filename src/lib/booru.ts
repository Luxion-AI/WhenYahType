// Booru API client for Waifu Search & Gallery
export interface BooruWaifu {
  id: string;
  url: string;
  previewUrl: string;
  source: string;
  name: string;
  tags: string[];
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

// Curated verified waifus across popular anime series (instant offline/initial availability)
export const CURATED_WAIFUS: BooruWaifu[] = [
  {
    id: 'konachan-maomao',
    url: 'https://konachan.net/sample/cb0405e90a962078d985c05846114bfa/Konachan.com%20-%20409854%20sample%20animal%20bird%20brown_hair%20chinese_clothes%20clouds%20grass%20kusuriya_no_hitorigoto%20maomao_%28kusuriya_no_hitorigoto%29%20purple_eyes%20sky%20sunset%20yurun_%28yurun_ume%29.jpg',
    previewUrl: 'https://konachan.net/sample/cb0405e90a962078d985c05846114bfa/Konachan.com%20-%20409854%20sample%20animal%20bird%20brown_hair%20chinese_clothes%20clouds%20grass%20kusuriya_no_hitorigoto%20maomao_%28kusuriya_no_hitorigoto%29%20purple_eyes%20sky%20sunset%20yurun_%28yurun_ume%29.jpg',
    source: 'konachan.net',
    name: 'Maomao',
    tags: ['kusuriya_no_hitorigoto', 'maomao', 'landscape'],
    width: 3000,
    height: 1747,
    orientation: 'landscape',
  },
  {
    id: 'safebooru-miku-ghost',
    url: 'https://safebooru.org/images/1365/4a36d78b3c9413f0854bec1c9687a180.jpeg',
    previewUrl: 'https://safebooru.org/images/1365/4a36d78b3c9413f0854bec1c9687a180.jpeg',
    source: 'safebooru.org',
    name: 'Hatsune Miku',
    tags: ['vocaloid', 'hatsune_miku', 'cute'],
    width: 1061,
    height: 1500,
    orientation: 'portrait',
  },
  {
    id: 'konachan-frieren',
    url: 'https://konachan.net/sample/8267b20e84b1de51f675c4565dbf6e8d/Konachan.com%20-%20408960%20sample%20animal%20bird%20boat%20boots%20bow%20building%20cape%20clouds%20dress%20frieren%20gray_hair%20green_eyes%20hat%20hood%20long_hair%20magic%20sky%20takoyoomi%20twintails%20water%20witch.jpg',
    previewUrl: 'https://konachan.net/sample/8267b20e84b1de51f675c4565dbf6e8d/Konachan.com%20-%20408960%20sample%20animal%20bird%20boat%20boots%20bow%20building%20cape%20clouds%20dress%20frieren%20gray_hair%20green_eyes%20hat%20hood%20long_hair%20magic%20sky%20takoyoomi%20twintails%20water%20witch.jpg',
    source: 'konachan.net',
    name: 'Frieren',
    tags: ['sousou_no_frieren', 'frieren', 'magic'],
    width: 3496,
    height: 2362,
    orientation: 'landscape',
  },
  {
    id: 'safebooru-frieren-portrait',
    url: 'https://safebooru.org/images/831/d6e378bf2555756d5dd6433671c99c33.jpeg',
    previewUrl: 'https://safebooru.org/images/831/d6e378bf2555756d5dd6433671c99c33.jpeg',
    source: 'safebooru.org',
    name: 'Frieren (Portrait)',
    tags: ['sousou_no_frieren', 'frieren', 'elf'],
    width: 1536,
    height: 2048,
    orientation: 'portrait',
  },
  {
    id: 'safebooru-furina',
    url: 'https://safebooru.org/images/62/e8d70a7793670b30240fb512d899e1e6.jpeg',
    previewUrl: 'https://safebooru.org/images/62/e8d70a7793670b30240fb512d899e1e6.jpeg',
    source: 'safebooru.org',
    name: 'Furina',
    tags: ['genshin_impact', 'furina', 'archon'],
    width: 973,
    height: 2048,
    orientation: 'portrait',
  },
  {
    id: 'safebooru-rem',
    url: 'https://safebooru.org/images/1090/11a2729d016347bda2461ed318267bf7.jpeg',
    previewUrl: 'https://safebooru.org/images/1090/11a2729d016347bda2461ed318267bf7.jpeg',
    source: 'safebooru.org',
    name: 'Rem',
    tags: ['re:zero', 'rem', 'maid'],
    width: 680,
    height: 680,
    orientation: 'portrait',
  },
  {
    id: 'konachan-parseval',
    url: 'https://konachan.net/sample/71ec6d8be6131ac44eb52af0dcc33fbb/Konachan.com%20-%20409851%20sample%20anthropomorphism%20august_von_parseval_%28azur_lane%29%20azur_lane%20barefoot%20black_hair%20blue_eyes%20breasts%20car%20cleavage%20dress%20horns%20junwu%20long_hair%20wristwear.jpg',
    previewUrl: 'https://konachan.net/sample/71ec6d8be6131ac44eb52af0dcc33fbb/Konachan.com%20-%20409851%20sample%20anthropomorphism%20august_von_parseval_%28azur_lane%29%20azur_lane%20barefoot%20black_hair%20blue_eyes%20breasts%20car%20cleavage%20dress%20horns%20junwu%20long_hair%20wristwear.jpg',
    source: 'konachan.net',
    name: 'August von Parseval',
    tags: ['azur_lane', 'august_von_parseval'],
    width: 3000,
    height: 1800,
    orientation: 'landscape',
  },
  {
    id: 'safebooru-sparkle',
    url: 'https://safebooru.org/images/1365/5a596ae8c622d9d11e7f3f6f62fa0687.jpeg',
    previewUrl: 'https://safebooru.org/images/1365/5a596ae8c622d9d11e7f3f6f62fa0687.jpeg',
    source: 'safebooru.org',
    name: 'Sparkle Idol',
    tags: ['solo', 'cute', 'idol'],
    width: 900,
    height: 1200,
    orientation: 'portrait',
  },
  {
    id: 'safebooru-agnes-tachyon',
    url: 'https://safebooru.org/images/1365/e56b5a2f40614c291108f37df991ca52.png',
    previewUrl: 'https://safebooru.org/images/1365/e56b5a2f40614c291108f37df991ca52.png',
    source: 'safebooru.org',
    name: 'Agnes Tachyon',
    tags: ['uma_musume', 'agnes_tachyon'],
    width: 828,
    height: 1792,
    orientation: 'portrait',
  },
  {
    id: 'konachan-columbina',
    url: 'https://konachan.net/sample/5f0a783ef8b540790071be048668ba90/Konachan.com%20-%20409842%20sample%202girls%20black_hair%20brown_hair%20garter%20genshin_impact%20gloves%20gray_eyes%20h0kori%20leaves%20long_hair%20mermaid%20navel%20purple_eyes%20thighhighs%20wings%20wristwear.jpg',
    previewUrl: 'https://konachan.net/sample/5f0a783ef8b540790071be048668ba90/Konachan.com%20-%20409842%20sample%202girls%20black_hair%20brown_hair%20garter%20genshin_impact%20gloves%20gray_eyes%20h0kori%20leaves%20long_hair%20mermaid%20navel%20purple_eyes%20thighhighs%20wings%20wristwear.jpg',
    source: 'konachan.net',
    name: 'Columbina',
    tags: ['genshin_impact', 'columbina'],
    width: 5919,
    height: 3713,
    orientation: 'landscape',
  },
];

// Clean tag name for UI display
export function formatCharacterName(tagString: string, fallback = 'Waifu Companion'): string {
  if (!tagString) return fallback;
  const tags = tagString.split(/\s+/);
  // Find known character tags (often formatted as name_(series))
  const charTag = tags.find((t) => t.includes('_(') && !t.includes('rating:') && !t.includes('1girl'))
    || tags.find((t) => ['hatsune_miku', 'frieren', 'furina', 'rem', 'bocchi', 'maomao', 'aqua'].some(k => t.includes(k)))
    || tags.find((t) => !['1girl', 'solo', 'dress', 'hair', 'eyes'].some(k => t.includes(k)));

  if (!charTag) return fallback;

  return charTag
    .replace(/_/g, ' ')
    .replace(/\s*\([^)]*\)/g, '')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const fetchWithTimeout = async (url: string, timeoutMs = 3500) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

// Search Booru APIs (Konachan & Safebooru via proxy or direct)
export async function searchBooru(query: string, source: 'all' | 'konachan' | 'safebooru' = 'all'): Promise<BooruWaifu[]> {
  const cleanTag = query.trim().toLowerCase().replace(/\s+/g, '_');
  const results: BooruWaifu[] = [];

  // Helper to query Konachan
  const queryKonachan = async () => {
    try {
      const tagParam = cleanTag ? `${cleanTag}+rating:s` : 'rating:s';
      // Try proxy first, fallback to direct
      const endpoints = [
        `/api/booru/konachan/post.json?limit=15&tags=${encodeURIComponent(tagParam)}`,
        `https://konachan.net/post.json?limit=15&tags=${encodeURIComponent(tagParam)}`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetchWithTimeout(ep);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              return data
                .filter((p: { sample_url?: string; file_url?: string }) => Boolean(p.sample_url || p.file_url))
                .map((p: { id: number; sample_url?: string; file_url?: string; preview_url?: string; width?: number; height?: number; tags?: string }) => {
                  const url = p.sample_url || p.file_url || '';
                  const width = p.width || 1920;
                  const height = p.height || 1080;
                  const orientation: 'portrait' | 'landscape' = height > width * 1.05 ? 'portrait' : 'landscape';
                  return {
                    id: `konachan-${p.id}`,
                    url,
                    previewUrl: p.preview_url || url,
                    source: 'konachan.net',
                    name: formatCharacterName(p.tags || '', `Konachan #${p.id}`),
                    tags: (p.tags || '').split(' '),
                    width,
                    height,
                    orientation,
                  };
                });
            }
          }
        } catch {
          // Try next endpoint
        }
      }
    } catch {
      // Ignore
    }
    return [];
  };

  // Helper to query Safebooru
  const querySafebooru = async () => {
    try {
      const tagParam = cleanTag ? `${cleanTag}+rating:safe` : 'solo+rating:safe';
      const endpoints = [
        `/api/booru/safebooru/index.php?page=dapi&s=post&q=index&json=1&limit=15&tags=${encodeURIComponent(tagParam)}`,
        `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=15&tags=${encodeURIComponent(tagParam)}`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetchWithTimeout(ep);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              return data
                .filter((p: { image?: string; directory?: string | number }) => Boolean(p.image && p.directory))
                .map((p: { id: number; image: string; directory: string | number; width?: number; height?: number; tags?: string }) => {
                  const url = `https://safebooru.org/images/${p.directory}/${p.image}`;
                  const width = p.width || 1200;
                  const height = p.height || 1600;
                  const orientation: 'portrait' | 'landscape' = height > width * 1.05 ? 'portrait' : 'landscape';
                  return {
                    id: `safebooru-${p.id}`,
                    url,
                    previewUrl: url,
                    source: 'safebooru.org',
                    name: formatCharacterName(p.tags || '', `Safebooru #${p.id}`),
                    tags: (p.tags || '').split(' '),
                    width,
                    height,
                    orientation,
                  };
                });
            }
          }
        } catch {
          // Try next endpoint
        }
      }
    } catch {
      // Ignore
    }
    return [];
  };

  // Execute queries in parallel for speed
  const promises: Promise<BooruWaifu[]>[] = [];
  if (source === 'all' || source === 'konachan') {
    promises.push(queryKonachan());
  }
  if (source === 'all' || source === 'safebooru') {
    promises.push(querySafebooru());
  }

  const settled = await Promise.allSettled(promises);
  settled.forEach((res) => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      results.push(...res.value);
    }
  });

  // Filter curated collection as instant fallback if network matches
  if (results.length === 0 && cleanTag) {
    const localMatches = CURATED_WAIFUS.filter((w) =>
      w.name.toLowerCase().includes(cleanTag) ||
      w.tags.some((t) => t.toLowerCase().includes(cleanTag))
    );
    if (localMatches.length > 0) {
      return localMatches;
    }
  }

  return results;
}
