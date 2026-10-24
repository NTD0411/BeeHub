const env = require('../config/env');
const { httpError } = require('./auth.helpers');

const NOMINATIM_HEADERS = {
  'User-Agent': 'UniMove/1.0 (booking-autocomplete)',
  From: 'no-reply@unimove.com',
};

function parseCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractLocality(pickupAddress) {
  const parts = String(pickupAddress || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (/thành phố|tp\.?\s|đà nẵng|hồ chí minh|hà nội|cần thơ|hải phòng|huế|nha trang|bình dương|đồng nai/i.test(part)) {
      return part.replace(/^thành phố\s+/i, '').trim() || part;
    }
  }

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return '';
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseHouseStreet(input) {
  const q = String(input || '').trim();
  const numbered = q.match(/^(\d+[/-]?\d*)\s+(.+)$/i);
  if (numbered) {
    return { houseNumber: numbered[1], street: numbered[2].trim(), full: q };
  }
  const soNha = q.match(/^số\s*(\d+[/-]?\d*)\s+(.+)$/i);
  if (soNha) {
    return { houseNumber: soNha[1], street: soNha[2].trim(), full: q };
  }
  return { houseNumber: null, street: q, full: q };
}

function formatMainText(row, fallbackInput) {
  const addr = row.address || {};
  const house = addr.house_number ? String(addr.house_number).trim() : '';
  const road = addr.road ? String(addr.road).trim() : '';
  if (house && road) return `${house} ${road}`;
  if (road) return road;
  const name = String(row.name || '').trim();
  if (name) return name;
  const parsed = parseHouseStreet(fallbackInput);
  if (parsed.houseNumber && road) return `${parsed.houseNumber} ${road}`;
  return String(row.display_name || '').split(',')[0].trim();
}

function mapNominatimRow(row, fallbackInput) {
  const lat = Number(row.lat);
  const lng = Number(row.lon);
  const address = String(row.display_name || '').trim();
  const mainText = formatMainText(row, fallbackInput) || fallbackInput;
  const addr = row.address || {};
  const hasHouse = Boolean(addr.house_number);
  return {
    place_id: `osm:${lat}:${lng}`,
    main_text: mainText,
    secondary_text: address,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    has_house_number: hasHouse,
  };
}

function scoreSuggestion(row, input, biasLat, biasLng) {
  const parsed = parseHouseStreet(input);
  let score = 0;
  const main = String(row.main_text || '').toLowerCase();
  const inputLower = String(input || '').toLowerCase();

  if (parsed.houseNumber) {
    const num = parsed.houseNumber.toLowerCase();
    if (main.startsWith(`${num} `) || main.startsWith(`${num}/`)) score += 120;
    else if (row.has_house_number) score += 40;
    else score -= 30;
  }

  if (parsed.street && main.includes(parsed.street.toLowerCase().split(' ')[0])) {
    score += 25;
  }
  if (inputLower.length >= 4 && main.includes(inputLower.split(' ')[0])) {
    score += 10;
  }

  if (biasLat != null && biasLng != null && row.lat != null && row.lng != null) {
    const km = haversineKm(biasLat, biasLng, row.lat, row.lng);
    score += Math.max(0, 50 - km);
    if (km > 40) score -= 80;
  }

  return score;
}

function dedupeAndRank(rows, biasLat, biasLng, limit, input = '') {
  const seen = new Set();
  const unique = [];

  for (const row of rows) {
    const key = `${row.lat?.toFixed(5)}:${row.lng?.toFixed(5)}:${row.secondary_text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }

  unique.sort((a, b) => scoreSuggestion(b, input, biasLat, biasLng) - scoreSuggestion(a, input, biasLat, biasLng));

  if (biasLat != null && biasLng != null) {
    const nearby = unique.filter(
      (r) => r.lat != null && r.lng != null && haversineKm(biasLat, biasLng, r.lat, r.lng) <= 40,
    );
    if (nearby.length > 0) return nearby.slice(0, limit);
  }

  return unique.slice(0, limit);
}

async function nominatimFetch(params) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) {
    throw httpError(502, 'Không tìm được địa chỉ (Nominatim)', 'upstream_error');
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

async function nominatimSearch(input, options = {}) {
  const q = String(input || '').trim();
  const biasLat = parseCoord(options.lat);
  const biasLng = parseCoord(options.lng);
  const locality = extractLocality(options.pickupAddress);
  const collected = [];

  const viewboxParams = {};
  if (biasLat != null && biasLng != null) {
    const delta = 0.15;
    viewboxParams.viewbox = `${biasLng - delta},${biasLat + delta},${biasLng + delta},${biasLat - delta}`;
    viewboxParams.bounded = '0';
  }

  // 1) Tìm trong vùng gần điểm đi (strict bounded)
  if (biasLat != null && biasLng != null) {
    const localRows = await nominatimFetch({
      q: locality ? `${q}, ${locality}, Việt Nam` : `${q}, Việt Nam`,
      format: 'json',
      addressdetails: 1,
      limit: 10,
      countrycodes: 'vn',
      viewbox: `${biasLng - 0.12},${biasLat + 0.12},${biasLng + 0.12},${biasLat - 0.12}`,
      bounded: 1,
    });
    collected.push(...localRows.map((row) => mapNominatimRow(row, q)));
  }

  // 2) Structured: số nhà + tên đường + thành phố
  const parsed = parseHouseStreet(q);
  if (parsed.houseNumber && locality) {
    const streetVariants = [
      `${parsed.houseNumber} ${parsed.street}`,
      parsed.street,
    ];
    for (const street of streetVariants) {
      const structuredRows = await nominatimFetch({
        street,
        city: locality,
        country: 'Vietnam',
        format: 'json',
        addressdetails: 1,
        limit: 8,
        ...viewboxParams,
      });
      collected.push(...structuredRows.map((row) => mapNominatimRow(row, q)));
    }
  } else if (locality) {
    const structuredRows = await nominatimFetch({
      street: q,
      city: locality,
      country: 'Vietnam',
      format: 'json',
      addressdetails: 1,
      limit: 8,
      ...viewboxParams,
    });
    collected.push(...structuredRows.map((row) => mapNominatimRow(row, q)));
  }

  // 3) Text search có thêm thành phố từ điểm đi
  const textQuery =
    locality && !q.toLowerCase().includes(locality.toLowerCase())
      ? `${q}, ${locality}, Việt Nam`
      : `${q}, Việt Nam`;
  const textRows = await nominatimFetch({
    q: textQuery,
    format: 'json',
    addressdetails: 1,
    limit: 10,
    countrycodes: 'vn',
    ...viewboxParams,
  });
  collected.push(...textRows.map((row) => mapNominatimRow(row, q)));

  return dedupeAndRank(collected, biasLat, biasLng, 6, q);
}

const GOONG_PREFIX = 'goong:';

function goongApiUrl(path) {
  const base = String(env.GOONG_API_URL || 'https://rsapi.goong.io').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function goongFetch(path, params) {
  if (!env.GOONG_API_KEY) {
    throw httpError(503, 'Goong API key chưa cấu hình', 'goong_config_error');
  }
  const url = new URL(goongApiUrl(path));
  url.searchParams.set('api_key', env.GOONG_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw httpError(502, `Goong HTTP ${res.status}`, 'goong_upstream_error');
  }
  if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw httpError(502, `Goong: ${data.status}`, 'goong_api_error');
  }
  return data;
}

function stripGoongPrefix(placeId) {
  return placeId.startsWith(GOONG_PREFIX) ? placeId.slice(GOONG_PREFIX.length) : placeId;
}

function pickGoongGeocodeResult(results, input) {
  if (!Array.isArray(results) || results.length === 0) return null;
  const parsed = parseHouseStreet(input);
  if (!parsed.houseNumber) return results[0];

  const num = parsed.houseNumber.toLowerCase();
  const exact = results.find((r) => {
    const addr = String(r.formatted_address || r.name || '').toLowerCase();
    const first = String(r.address_components?.[0]?.long_name || '').trim().toLowerCase();
    return first.startsWith(`${num} `) || first.startsWith(`${num}/`) || addr.startsWith(`${num} `);
  });
  return exact || results[0];
}

function mapGoongGeocodeResult(row, fallbackInput) {
  if (!row) return null;
  const lat = row.geometry?.location?.lat;
  const lng = row.geometry?.location?.lng;
  const address = String(row.formatted_address || row.name || fallbackInput).trim();
  const title = String(row.name || address.split(',')[0] || fallbackInput).trim();
  const placeId = row.place_id ? `${GOONG_PREFIX}${row.place_id}` : null;
  return {
    place_id: placeId,
    title,
    address,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
  };
}

async function goongAutocomplete(input, sessionToken, options = {}) {
  const params = { input, limit: 8, radius: 30 };
  const biasLat = parseCoord(options.lat);
  const biasLng = parseCoord(options.lng);
  if (biasLat != null && biasLng != null) {
    params.location = `${biasLat},${biasLng}`;
  }
  if (sessionToken) params.sessiontoken = sessionToken;

  const data = await goongFetch('/Place/AutoComplete', params);
  return (data.predictions || []).map((p) => ({
    place_id: `${GOONG_PREFIX}${p.place_id}`,
    main_text: p.structured_formatting?.main_text || p.description || '',
    secondary_text: p.structured_formatting?.secondary_text || '',
    lat: null,
    lng: null,
    has_house_number: /^\d+/.test(p.structured_formatting?.main_text || ''),
  }));
}

async function goongPlaceDetails(placeId, sessionToken) {
  const rawId = stripGoongPrefix(placeId);
  const params = { place_id: rawId };
  if (sessionToken) params.sessiontoken = sessionToken;

  const data = await goongFetch('/Place/Detail', params);
  const r = data.result;
  if (!r) {
    throw httpError(502, 'Goong Place Detail: không có kết quả', 'goong_api_error');
  }

  const lat = r.geometry?.location?.lat;
  const lng = r.geometry?.location?.lng;
  const address = String(r.formatted_address || r.name || '').trim();

  return {
    place_id: `${GOONG_PREFIX}${rawId}`,
    title: String(r.name || address.split(',')[0] || address).trim(),
    address,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
  };
}

async function goongForwardGeocode(address, options = {}) {
  const q = String(address || '').trim();
  if (!q) return null;

  const locality = extractLocality(options.pickupAddress);
  const query =
    locality && !q.toLowerCase().includes(locality.toLowerCase())
      ? `${q}, ${locality}, Việt Nam`
      : q;

  const data = await goongFetch('/Geocode', { address: query });
  const best = pickGoongGeocodeResult(data.results, q);
  return mapGoongGeocodeResult(best, q);
}

/** Forward geocode — ưu tiên đúng số nhà khách đã gõ */
async function resolveAddress(input, options = {}) {
  const q = String(input || '').trim();
  if (q.length < 2) return null;

  const biasOptions = {
    lat: options.lat,
    lng: options.lng,
    pickupAddress: options.pickupAddress,
  };

  if (env.GOONG_API_KEY) {
    try {
      const goong = await goongForwardGeocode(q, biasOptions);
      if (goong?.lat != null && goong?.lng != null) return goong;
    } catch (err) {
      console.warn('[Goong] resolveAddress failed:', err.message);
    }
  }

  const rows = await nominatimSearch(q, biasOptions);
  if (rows.length === 0) return null;

  const parsed = parseHouseStreet(q);
  let best = rows[0];
  if (parsed.houseNumber) {
    const num = parsed.houseNumber.toLowerCase();
    const exact = rows.find((r) => {
      const main = String(r.main_text || '').toLowerCase();
      return main.startsWith(`${num} `) || main.startsWith(`${num}/`);
    });
    if (exact) best = exact;
  }

  const title = best.main_text || q;
  const address = best.secondary_text || title;
  return {
    place_id: best.place_id,
    title,
    address: address.includes(title) ? address : `${title}, ${address}`,
    lat: best.lat,
    lng: best.lng,
  };
}

async function googleAutocomplete(input, sessionToken, options = {}) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', input);
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);
  url.searchParams.set('language', 'vi');
  url.searchParams.set('components', 'country:vn');

  const biasLat = parseCoord(options.lat);
  const biasLng = parseCoord(options.lng);
  if (biasLat != null && biasLng != null) {
    url.searchParams.set('location', `${biasLat},${biasLng}`);
    url.searchParams.set('radius', '30000');
    url.searchParams.set('strictbounds', 'false');
  }

  if (sessionToken) url.searchParams.set('sessiontoken', sessionToken);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw httpError(502, `Google Places: ${data.status}`, 'upstream_error');
  }

  return (data.predictions || []).map((p) => ({
    place_id: `google:${p.place_id}`,
    main_text: p.structured_formatting?.main_text || p.description,
    secondary_text: p.structured_formatting?.secondary_text || '',
    lat: null,
    lng: null,
  }));
}

async function googlePlaceDetails(placeId, sessionToken) {
  const googleId = placeId.startsWith('google:') ? placeId.slice(7) : placeId;
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', googleId);
  url.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);
  url.searchParams.set('language', 'vi');
  url.searchParams.set('fields', 'formatted_address,geometry,name');
  if (sessionToken) url.searchParams.set('sessiontoken', sessionToken);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.result) {
    throw httpError(502, `Google Place Details: ${data.status}`, 'upstream_error');
  }

  const r = data.result;
  const lat = r.geometry?.location?.lat;
  const lng = r.geometry?.location?.lng;
  const address = String(r.formatted_address || r.name || '').trim();

  return {
    place_id: `google:${googleId}`,
    title: String(r.name || address.split(',')[0] || address).trim(),
    address,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
  };
}

function osmPlaceDetails(placeId, fallbackAddress) {
  const parts = String(placeId || '').split(':');
  if (parts[0] !== 'osm' || parts.length < 3) {
    throw httpError(400, 'place_id OSM không hợp lệ', 'validation_error');
  }
  const lat = Number(parts[1]);
  const lng = Number(parts[2]);
  const address = String(fallbackAddress || '').trim();
  if (!address) {
    throw httpError(400, 'Thiếu địa chỉ cho place_id OSM', 'validation_error');
  }
  return {
    place_id: placeId,
    title: address.split(',')[0].trim() || address,
    address,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

/** GET /api/maps/places/autocomplete */
async function autocomplete(input, sessionToken, options = {}) {
  const q = String(input || '').trim();
  if (q.length < 2) return [];

  const biasOptions = {
    lat: options.lat,
    lng: options.lng,
    pickupAddress: options.pickupAddress,
  };

  if (env.GOONG_API_KEY) {
    try {
      const goongResults = await goongAutocomplete(q, sessionToken, biasOptions);
      if (goongResults.length > 0) {
        const biasLat = parseCoord(biasOptions.lat);
        const biasLng = parseCoord(biasOptions.lng);
        return dedupeAndRank(goongResults, biasLat, biasLng, 6, q);
      }
    } catch (err) {
      console.warn('[Goong] autocomplete failed:', err.message);
    }
  }

  if (env.GOOGLE_MAPS_API_KEY) {
    try {
      const googleResults = await googleAutocomplete(q, sessionToken, biasOptions);
      if (googleResults.length > 0) return googleResults;
    } catch (_) {
      // fallback when Google fails or quota exceeded
    }
  }

  return nominatimSearch(q, biasOptions);
}

/** GET /api/maps/places/details */
async function placeDetails(placeId, sessionToken, fallbackAddress) {
  const id = String(placeId || '').trim();
  if (!id) {
    throw httpError(400, 'Thiếu place_id', 'validation_error');
  }

  if (id.startsWith('osm:')) {
    return osmPlaceDetails(id, fallbackAddress);
  }

  if (id.startsWith(GOONG_PREFIX)) {
    if (!env.GOONG_API_KEY) {
      throw httpError(503, 'Goong API key chưa cấu hình', 'goong_config_error');
    }
    return goongPlaceDetails(id, sessionToken);
  }

  if (id.startsWith('google:')) {
    if (!env.GOOGLE_MAPS_API_KEY) {
      throw httpError(503, 'Google Maps API key chưa cấu hình', 'config_error');
    }
    return googlePlaceDetails(id, sessionToken);
  }

  throw httpError(400, 'place_id không hỗ trợ', 'validation_error');
}

module.exports = {
  autocomplete,
  placeDetails,
  resolveAddress,
};
