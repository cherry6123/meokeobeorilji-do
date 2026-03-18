module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
  if (!KAKAO_KEY) return res.status(200).json({ places: [], count: 0 });

  const seen = new Set();
  const results = [];

  function parse(doc) {
    if (seen.has(doc.id)) return;
    seen.add(doc.id);
    const c = doc.category_name || '', cg = doc.category_group_name || '';
    let g = '기타', ct = 'restaurant';
    if (cg === '카페') { g = '카페'; ct = 'cafe'; }
    else if (c.includes('베이커리') || c.includes('제과')) { g = '베이커리'; ct = 'bakery'; }
    else if (c.includes('술집') || c.includes('바') || c.includes('호프') || c.includes('이자카야')) { g = '바'; ct = 'bar'; }
    else if (c.includes('한식')) g = '한식';
    else if (c.includes('일식') || c.includes('일본식')) g = '일식';
    else if (c.includes('중식') || c.includes('중국')) g = '중식';
    else if (c.includes('양식') || c.includes('이탈리') || c.includes('프랑스')) g = '양식';
    else if (c.includes('분식')) g = '분식';
    else if (c.includes('퓨전')) g = '퓨전';
    else if (c.includes('동남아') || c.includes('베트남') || c.includes('태국')) g = '동남아';
    else if (c.includes('멕시')) g = '멕시칸';
    else if (c.includes('버거')) g = '버거';
    else if (c.includes('돈까스') || c.includes('돈카츠')) g = '돈까스';
    else if (cg === '음식점') g = '한식';
    results.push({
      id:'k'+doc.id, nk:doc.place_name, g, sg:c.split('>').pop().trim(),
      rn:0,rg:0,rk:0,rv:0,
      ad:(doc.road_address_name||doc.address_name||'').replace('서울 성동구 ','').replace('서울특별시 성동구 ',''),
      ph:doc.phone||'', lt:+doc.y, ln:+doc.x,
      hr:'',avg:0,mo:[],wt:['맑음','흐림'],
      ds:c,wa:'정보없음',ig:null,ct,
      added:new Date().toISOString().slice(0,7),
      kakaoUrl:doc.place_url,
      dist:doc.distance?+doc.distance:null
    });
  }

  async function fetchCat(code, lat, lng, rad) {
    const docs = [];
    for (let p = 1; p <= 45; p++) {
      const r = await fetch(`https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${code}&y=${lat}&x=${lng}&radius=${rad}&size=15&page=${p}&sort=distance`,
        { headers: { 'Authorization': `KakaoAK ${KAKAO_KEY}` } });
      if (!r.ok) break;
      const d = await r.json();
      if (!d.documents || !d.documents.length) break;
      d.documents.forEach(doc => docs.push(doc));
      if (d.meta && d.meta.is_end) break;
    }
    return docs;
  }

  async function fetchKw(kw) {
    const docs = [];
    for (let p = 1; p <= 5; p++) {
      const r = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(kw)}&y=37.5445&x=127.0560&radius=3000&size=15&page=${p}&sort=accuracy`,
        { headers: { 'Authorization': `KakaoAK ${KAKAO_KEY}` } });
      if (!r.ok) break;
      const d = await r.json();
      if (!d.documents || !d.documents.length) break;
      d.documents.forEach(doc => docs.push(doc));
      if (d.meta && d.meta.is_end) break;
    }
    return docs;
  }

  try {
    const zones = [
      [37.5390, 127.0440, 500],[37.5390, 127.0500, 500],[37.5390, 127.0560, 500],[37.5390, 127.0620, 500],[37.5390, 127.0680, 500],
      [37.5420, 127.0440, 500],[37.5420, 127.0500, 500],[37.5420, 127.0560, 500],[37.5420, 127.0620, 500],[37.5420, 127.0680, 500],
      [37.5450, 127.0440, 500],[37.5450, 127.0500, 500],[37.5450, 127.0560, 500],[37.5450, 127.0620, 500],[37.5450, 127.0680, 500],
      [37.5480, 127.0440, 500],[37.5480, 127.0500, 500],[37.5480, 127.0560, 500],[37.5480, 127.0620, 500],[37.5480, 127.0680, 500],
      [37.5510, 127.0440, 500],[37.5510, 127.0500, 500],[37.5510, 127.0560, 500],[37.5510, 127.0620, 500],[37.5510, 127.0680, 500],
    ];

    const catJobs = [];
    for (const [lat, lng, rad] of zones) {
      catJobs.push(fetchCat('FD6', lat, lng, rad));
      catJobs.push(fetchCat('CE7', lat, lng, rad));
    }

    const keywords = [
      '성수동 맛집','성수동 음식점','성수동 카페','성수동 술집','성수동 베이커리',
      '성수동 브런치','성수동 파스타','성수동 라멘','성수동 고기','성수동 삼겹살',
      '성수동 치킨','성수동 피자','성수동 돈까스','성수동 국밥','성수동 냉면',
      '성수동 도넛','성수동 디저트','성수동 와인바','성수동 이자카야','성수동 샌드위치',
      '성수동2가 맛집','성수동1가 맛집','성수동2가 카페','성수동1가 카페',
      '뚝섬역 맛집','뚝섬역 카페','성수역 맛집','성수역 카페',
      '서울숲 맛집','서울숲 카페','서울숲 브런치','서울숲 디저트',
    ];

    const kwJobs = keywords.map(kw => fetchKw(kw));

    const allResults = await Promise.all([...catJobs, ...kwJobs]);
    allResults.forEach(docs => docs.forEach(parse));

    res.status(200).json({ places: results, count: results.length });
  } catch (e) {
    res.status(200).json({ error: e.message, places: results, count: results.length });
  }
};
