module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { query, lat, lng, radius, category } = req.query;
  const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
  
  if (!KAKAO_KEY) {
    return res.status(500).json({ error: 'KAKAO_REST_API_KEY not set' });
  }

  try {
    const results = [];
    const keywords = query 
      ? [query] 
      : category 
        ? [`성수 ${category}`]
        : ['성수 맛집', '성수 카페', '성수 베이커리', '성수 술집'];
    
    for (const kw of keywords) {
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(kw)}&y=${lat || 37.544}&x=${lng || 127.055}&radius=${radius || 2000}&size=15&sort=accuracy`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `KakaoAK ${KAKAO_KEY}` }
      });
      
      if (!response.ok) continue;
      const data = await response.json();
      
      for (const doc of (data.documents || [])) {
        if (results.find(r => r.id === doc.id)) continue;
        
        const catName = doc.category_name || '';
        const catGroup = doc.category_group_name || '';
        let genre = '기타';
        let subGenre = catName.split('>').pop().trim();
        let ct = 'restaurant';
        
        if (catGroup === '카페') { genre = '카페'; ct = 'cafe'; }
        else if (catName.includes('베이커리') || catName.includes('제과')) { genre = '베이커리'; ct = 'bakery'; }
        else if (catName.includes('술집') || catName.includes('바') || catName.includes('호프')) { genre = '바'; ct = 'bar'; }
        else if (catName.includes('한식')) genre = '한식';
        else if (catName.includes('일식')) genre = '일식';
        else if (catName.includes('중식')) genre = '중식';
        else if (catName.includes('양식') || catName.includes('이탈리') || catName.includes('프랑스')) genre = '양식';
        else if (catName.includes('분식')) genre = '분식';
        else if (catName.includes('퓨전')) genre = '퓨전';
        else if (catName.includes('동남아') || catName.includes('베트남') || catName.includes('태국')) genre = '동남아';
        else if (catName.includes('멕시')) genre = '멕시칸';
        else if (catName.includes('버거') || catName.includes('햄버거')) genre = '버거';
        else if (catName.includes('돈까스') || catName.includes('돈카츠')) genre = '돈까스';
        else if (catGroup === '음식점') genre = '한식';

        results.push({
          id: 'k' + doc.id,
          nk: doc.place_name,
          g: genre,
          sg: subGenre,
          rn: 0,
          rg: 0,
          rk: 0,
          rv: 0,
          ad: (doc.road_address_name || doc.address_name || '').replace('서울 성동구 ', '').replace('서울특별시 성동구 ', ''),
          ph: doc.phone || '',
          lt: +doc.y,
          ln: +doc.x,
          hr: '',
          avg: 0,
          mo: [],
          wt: ['맑음', '흐림'],
          ds: catName,
          wa: '정보없음',
          ig: null,
          ct: ct,
          added: new Date().toISOString().slice(0, 7),
          kakaoUrl: doc.place_url,
          dist: doc.distance ? +doc.distance : null
        });
      }
    }

    res.status(200).json({ places: results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
