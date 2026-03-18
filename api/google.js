module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!KEY) return res.status(200).json({ places: [], count: 0, error: 'no key' });

  const part = req.query.part || '1';
  const seen = new Set();
  const results = [];

  function parse(p) {
    if (!p.id || seen.has(p.id)) return;
    seen.add(p.id);
    const types = p.types || [];
    let g = '기타', ct = 'restaurant';
    if (types.includes('cafe') || types.includes('coffee_shop')) { g = '카페'; ct = 'cafe'; }
    else if (types.includes('bakery')) { g = '베이커리'; ct = 'bakery'; }
    else if (types.includes('bar') || types.includes('night_club')) { g = '바'; ct = 'bar'; }
    else if (types.includes('korean_restaurant')) g = '한식';
    else if (types.includes('japanese_restaurant') || types.includes('ramen_restaurant') || types.includes('sushi_restaurant')) g = '일식';
    else if (types.includes('chinese_restaurant')) g = '중식';
    else if (types.includes('italian_restaurant') || types.includes('french_restaurant') || types.includes('mediterranean_restaurant')) g = '양식';
    else if (types.includes('hamburger_restaurant')) g = '버거';
    else if (types.includes('pizza_restaurant')) g = '피자';
    else if (types.includes('mexican_restaurant')) g = '멕시칸';
    else if (types.includes('thai_restaurant') || types.includes('vietnamese_restaurant') || types.includes('indonesian_restaurant')) g = '동남아';
    else if (types.includes('restaurant') || types.includes('meal_delivery') || types.includes('meal_takeaway')) g = '한식';
    const name = p.displayName ? p.displayName.text : '';
    const addr = (p.formattedAddress || '').replace('대한민국 ', '').replace('서울특별시 성동구 ', '').replace('서울 성동구 ', '');
    results.push({
      id: 'g' + p.id, nk: name, g, sg: (p.primaryType || '').replace(/_/g, ' '),
      rn: p.rating || 0, rg: p.rating || 0, rk: p.rating || 0, rv: p.userRatingCount || 0,
      ad: addr, ph: p.nationalPhoneNumber || '',
      lt: p.location ? p.location.latitude : 0, ln: p.location ? p.location.longitude : 0,
      hr: p.regularOpeningHours && p.regularOpeningHours.weekdayDescriptions ? p.regularOpeningHours.weekdayDescriptions.join(' | ') : '',
      avg: p.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' ? 10000 : p.priceLevel === 'PRICE_LEVEL_MODERATE' ? 20000 : p.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? 40000 : p.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE' ? 60000 : 15000,
      mo: [], wt: ['맑음', '흐림'], ds: name + ' · ' + g,
      wa: '정보없음', ig: null, ct,
      added: new Date().toISOString().slice(0, 7),
      googleId: p.id, dist: null
    });
  }

  async function nearby(lat, lng, rad, types) {
    const body = {
      includedTypes: types,
      maxResultCount: 20,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: rad } }
    };
    const r = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.primaryType,places.types,places.priceLevel,places.regularOpeningHours'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) return;
    const d = await r.json();
    (d.places || []).forEach(parse);
  }

  async function textSearch(query) {
    const body = {
      textQuery: query,
      locationBias: { circle: { center: { latitude: 37.5445, longitude: 127.056 }, radius: 3000 } },
      maxResultCount: 20
    };
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.primaryType,places.types,places.priceLevel,places.regularOpeningHours'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) return;
    const d = await r.json();
    (d.places || []).forEach(parse);
  }

  try {
    if (part === 'kw') {
      const q = req.query.q || '';
      if (q) await textSearch(q);
      return res.status(200).json({ places: results, count: results.length, part: 'kw' });
    }

    const types1 = ['restaurant', 'korean_restaurant', 'japanese_restaurant', 'chinese_restaurant', 'italian_restaurant', 'hamburger_restaurant', 'pizza_restaurant', 'ramen_restaurant', 'sushi_restaurant'];
    const types2 = ['cafe', 'coffee_shop', 'bakery', 'bar', 'night_club'];

    if (part === '1') {
      const zones = [
        [37.5400, 127.0460], [37.5400, 127.0520], [37.5400, 127.0580], [37.5400, 127.0640],
        [37.5430, 127.0460], [37.5430, 127.0520], [37.5430, 127.0580], [37.5430, 127.0640],
        [37.5460, 127.0460], [37.5460, 127.0520], [37.5460, 127.0580], [37.5460, 127.0640],
      ];
      const jobs = [];
      for (const [lat, lng] of zones) {
        jobs.push(nearby(lat, lng, 500, types1));
      }
      await Promise.all(jobs);
    }
    else if (part === '2') {
      const zones = [
        [37.5490, 127.0460], [37.5490, 127.0520], [37.5490, 127.0580], [37.5490, 127.0640],
        [37.5520, 127.0460], [37.5520, 127.0520], [37.5520, 127.0580], [37.5520, 127.0640],
        [37.5400, 127.0460], [37.5400, 127.0520], [37.5400, 127.0580], [37.5400, 127.0640],
        [37.5430, 127.0460], [37.5430, 127.0520], [37.5430, 127.0580], [37.5430, 127.0640],
        [37.5460, 127.0460], [37.5460, 127.0520], [37.5460, 127.0580], [37.5460, 127.0640],
        [37.5490, 127.0460], [37.5490, 127.0520], [37.5490, 127.0580], [37.5490, 127.0640],
        [37.5520, 127.0460], [37.5520, 127.0520], [37.5520, 127.0580], [37.5520, 127.0640],
      ];
      const jobs = [];
      for (const [lat, lng] of zones) {
        jobs.push(nearby(lat, lng, 500, types2));
      }
      await Promise.all(jobs);
    }
    else if (part === '3') {
      const keywords = [
        '성수동 맛집', '성수동 한식', '성수동 일식', '성수동 중식', '성수동 양식',
        '성수동 카페', '성수동 술집', '성수동 베이커리', '성수동 브런치',
        '성수동 삼겹살', '성수동 파스타', '성수동 라멘', '성수동 돈까스',
        '성수동 피자', '성수동 치킨', '성수동 국밥', '성수동 도넛',
        '성수역 맛집', '성수역 카페', '뚝섬역 맛집', '서울숲 카페',
      ];
      const jobs = keywords.map(kw => textSearch(kw));
      await Promise.all(jobs);
    }

    res.status(200).json({ places: results, count: results.length, part });
  } catch (e) {
    res.status(200).json({ error: e.message, places: results, count: results.length, part });
  }
};
