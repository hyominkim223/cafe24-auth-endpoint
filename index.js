const express = require('express');
const fetch = require('node-fetch');
const app = express();

// --- 메인 페이지 ---
// '/auth/cafe24' 링크에 mall_id를 전달하는 역할
app.get('/', (req, res) => {
  const mallId = req.query.mall_id;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <h1>🎉 Cafe24 App Server is running!</h1>
    <p>쇼핑몰 ID: ${mallId || 'ID not found'}</p>
    <p>아래 링크를 클릭하여 카페24 인증을 시작하세요.</p>
    <a href="/auth/cafe24?mall_id=${mallId}">Start Cafe24 Authentication</a>
  `);
});

// --- 인증 시작 (수정됨) ---
// state 파라미터에 mall_id를 포함시켜서 카페24 인증 URL로 보냄
app.get('/auth/cafe24', (req, res) => {
  const mallId = req.query.mall_id;
  if (!mallId) {
    return res.status(400).send('Error: Mall ID is required.');
  }

  // 1. state 파라미터에 mall_id를 포함하여 생성합니다.
  //    CSRF 방지를 위해 랜덤 문자열과 함께 조합하는 것이 좋습니다.
  const state = `CSRF_TOKEN_RANDOM_STRING_${mallId}`;

  const scopes = [
    'mall.read_application', 'mall.write_application',
    'mall.read_category', 'mall.write_category',
    'mall.read_product', 'mall.write_product',
    'mall.read_collection', 'mall.write_collection',
    'mall.read_order', 'mall.write_order',
    'mall.read_customer', 'mall.write_customer',
    'mall.read_store', 'mall.write_store',
    'mall.read_shipping', 'mall.write_shipping'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CAFE24_CLIENT_ID,
    redirect_uri: 'https://cafe24-auth-endpoint.vercel.app/api/callback',
    state: state, // mall_id가 포함된 state 사용
    scope: scopes
  });

  const authorizationUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?${params.toString()}`;
  res.redirect(authorizationUrl);
});


// --- 액세스 토큰 발급 콜백 (수정됨) ---
// 돌아온 state 파라미터에서 mall_id를 다시 추출하여 사용
app.get('/api/callback', async (req, res) => {
  // 1. URL 쿼리에서 code와 state를 가져옵니다.
  const code = req.query.code;
  const state = req.query.state;

  if (!code || !state) {
    return res.status(400).send('Authentication Failed: Required parameters (code, state) are missing.');
  }

  // 2. state에서 mall_id를 추출합니다.
  //    (실제 앱에서는 state의 CSRF 토큰 부분도 검증해야 합니다.)
  const mallId = state.split('_').pop(); // 'CSRF_TOKEN_RANDOM_STRING_mallId' 형식에서 맨 뒤 mallId 추출

  const clientId = process.env.CAFE24_CLIENT_ID;
  const clientSecret = process.env.CAFE24_CLIENT_SECRET;
  const redirectUri = 'https://cafe24-auth-endpoint.vercel.app/api/callback';

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const data = new URLSearchParams();
  data.append('grant_type', 'authorization_code');
  data.append('code', code);
  data.append('redirect_uri', redirectUri);

  try {
    // 3. 토큰 요청 URL에 추출한 mallId를 사용합니다.
    const response = await fetch(`https://${mallId}.cafe24api.com/api/v2/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: data
    });

    const tokenData = await response.json();

    if (tokenData.error) {
      return res.status(400).json(tokenData);
    }

    res.status(200).json({
      message: '🎉 Access Token successfully issued!',
      data: tokenData
    });

  } catch (error) {
    console.error('Token request failed:', error);
    res.status(500).json({
      message: 'Failed to issue access token.',
      error: error.message
    });
  }
});


module.exports = app;
