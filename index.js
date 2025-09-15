const express = require('express');
const app = express();

// --- 카페24 인증 시작을 위한 코드 ---
// 사용자가 /auth/cafe24 경로로 접속하면 인증 절차를 시작합니다.
app.get('/auth/cafe24', (req, res) => {
  // 실제 앱에서는 사용자가 접속한 쇼핑몰 ID를 동적으로 받아와야 합니다.
  // 예: const mallId = req.query.mall_id;
  const mallId = 'hyominkim222'; // 테스트를 위해 임시로 고정

  // 1. 카페24 개발자센터에서 선택한 8가지 권한(Scope) 목록입니다.
  const scopes = [
    'mall.read_application', 'mall.write_application',
    'mall.read_category', 'mall.write_category',
    'mall.read_product', 'mall.write_product',
    'mall.read_collection', 'mall.write_collection',
    'mall.read_order', 'mall.write_order',
    'mall.read_customer', 'mall.write_customer',
    'mall.read_store', 'mall.write_store',
    'mall.read_shipping', 'mall.write_shipping'
  ].join(' '); // 각 권한을 띄어쓰기로 구분하여 하나의 문자열로 만듭니다.

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CAFE24_CLIENT_ID, // Vercel 환경변수 사용
    redirect_uri: 'https://cafe24-auth-endpoint.vercel.app/api/callback',
    state: 'RANDOM_STATE_STRING', // CSRF 방지를 위해 랜덤 문자열 사용을 권장합니다.
    scope: scopes
  });

  // 2. 최종 인증 URL을 생성합니다.
  const authorizationUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?${params.toString()}`;
  
  // 3. 사용자를 생성된 인증 URL로 이동시킵니다.
  res.redirect(authorizationUrl);
});


// --- 서버 확인용 메인 페이지 ---
// 사용자가 앱의 기본 URL로 접속했을 때 보여주는 화면입니다.
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <h1>🎉 Cafe24 App Server is running!</h1>
    <p>아래 링크를 클릭하여 카페24 인증을 시작하세요.</p>
    <a href="/auth/cafe24">Start Cafe24 Authentication</a>
  `);
});

// Vercel 환경에서 서버를 실행하기 위해 module.exports를 사용합니다.
module.exports = app;
