const express = require('express');
const app = express();

// --- 서버 확인용 메인 페이지 (수정됨) ---
// 사용자가 앱의 기본 URL로 접속했을 때 보여주는 화면입니다.
app.get('/', (req, res) => {
  // 1. URL로 전달받은 mall_id를 변수에 저장합니다.
  const mallId = req.query.mall_id;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // 2. 인증 링크에 mall_id를 포함시켜 다음 단계로 전달합니다.
  res.send(`
    <h1>🎉 Cafe24 App Server is running!</h1>
    <p>쇼핑몰 ID: ${mallId || 'ID not found'}</p>
    <p>아래 링크를 클릭하여 카페24 인증을 시작하세요.</p>
    <a href="/auth/cafe24?mall_id=${mallId}">Start Cafe24 Authentication</a>
  `);
});

// --- 카페24 인증 시작을 위한 코드 (수정됨) ---
// 사용자가 /auth/cafe24 경로로 접속하면 인증 절차를 시작합니다.
app.get('/auth/cafe24', (req, res) => {
  // 3. 이전 단계에서 전달받은 mall_id를 사용합니다. (하드코딩 제거)
  const mallId = req.query.mall_id;

  // mall_id가 없으면 에러 처리
  if (!mallId) {
    return res.status(400).send('Error: Mall ID is required.');
  }

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
    state: 'RANDOM_STATE_STRING',
    scope: scopes
  });

  const authorizationUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?${params.toString()}`;
  
  res.redirect(authorizationUrl);
});

module.exports = app;
