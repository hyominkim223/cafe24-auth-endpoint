const express = require('express');
const fetch = require('node-fetch');
const app = express();

// --- 1. 메인 페이지 ---
// 앱 최초 실행 시 접속되는 페이지입니다.
// URL로 전달된 mall_id를 /auth/cafe24 링크로 전달하는 역할을 합니다.
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

// --- 2. 인증 시작 ---
// state 파라미터에 mall_id를 포함시켜서 카페24 인증 URL로 보냅니다.
app.get('/auth/cafe24', (req, res) => {
  const mallId = req.query.mall_id;
  if (!mallId) {
    return res.status(400).send('Error: Mall ID is required.');
  }

  // state 파라미터에 mall_id를 포함하여 생성합니다.
  // (보안 강화를 위해 CSRF 랜덤 문자열과 조합하는 것이 좋습니다)
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


// --- 3. 액세스 토큰 발급 (콜백) ---
// 돌아온 state 파라미터에서 mall_id를 다시 추출하여 토큰 발급에 사용합니다.
// 토큰 발급 성공 후, 사용자에게 JSON 대신 성공 페이지를 보여줍니다.
app.get('/api/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!code || !state) {
    return res.status(400).send('Authentication Failed: Required parameters (code, state) are missing.');
  }

  const mallId = state.split('_').pop();

  const clientId = process.env.CAFE24_CLIENT_ID;
  const clientSecret = process.env.CAFE24_CLIENT_SECRET;
  const redirectUri = 'https://cafe24-auth-endpoint.vercel.app/api/callback';

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const data = new URLSearchParams();
  data.append('grant_type', 'authorization_code');
  data.append('code', code);
  data.append('redirect_uri', redirectUri);

  try {
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
      console.error('Token Error:', tokenData);
      return res.status(400).json(tokenData);
    }

    // [중요] 토큰 발급 성공 시, JSON을 보여주는 대신 성공 페이지로 이동시킵니다.
    res.redirect('/auth/success');

  } catch (error) {
    console.error('Token request failed:', error);
    res.status(500).json({
      message: 'Failed to issue access token.',
      error: error.message
    });
  }
});

// --- 4. 인증 성공 페이지 ---
// 모든 인증 과정이 끝난 후 사용자에게 보여줄 안전한 페이지입니다.
app.get('/auth/success', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <h1>✅ 인증 성공!</h1>
    <p>정상적으로 인증되었으며, 앱을 사용할 준비가 되었습니다.</p>
    <p>이 창을 닫고 쇼핑몰 관리자 페이지로 돌아가세요.</p>
  `);
});


module.exports = app;
