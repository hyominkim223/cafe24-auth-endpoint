// /api/callback.js

// Node.js의 내장 fetch를 사용하기 위해 import 합니다. (Node.js 18+ 버전)
// 만약 이전 버전을 사용하신다면 'node-fetch' 같은 라이브러리를 설치해야 합니다.
import fetch from 'node-fetch';

// Vercel 함수는 비동기(async)로 처리하는 것이 좋습니다.
module.exports = async (req, res) => {
  // 1. URL 쿼리에서 필요한 값들을 모두 추출합니다.
  // mall_id는 토큰 발급 API의 주소를 만드는 데 사용됩니다.
  const { code, state, mall_id } = req.query;

  // CSRF 공격 방지를 위해 state 값을 검증하는 로직을 여기에 추가하는 것이 좋습니다.
  // (예: 인증 요청 시 세션에 저장했던 state 값과 일치하는지 비교)

  if (!code || !mall_id) {
    return res.status(400).send("<h1>❌ Authentication Failed</h1><p>Required parameters (code, mall_id) are missing.</p>");
  }

  // 2. Vercel 환경 변수에서 클라이언트 ID와 시크릿 키를 가져옵니다.
  // !! 중요 !!: 이 값들을 코드에 직접 쓰면 절대 안 됩니다.
  const clientId = process.env.CAFE24_CLIENT_ID;
  const clientSecret = process.env.CAFE24_CLIENT_SECRET;
  
  // 개발자센터에 등록한 Redirect URI와 정확히 일치해야 합니다.
  const redirectUri = 'https://cafe24-auth-endpoint.vercel.app/api/callback';

  // 3. Basic Authentication 헤더를 위한 Base64 인코딩
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    // 4. fetch를 사용하여 카페24 토큰 발급 API에 POST 요청을 보냅니다.
    const tokenResponse = await fetch(`https://${mall_id}.cafe24api.com/api/v2/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    // 5. 응답 결과 확인 및 처리
    if (tokenData.error) {
      // 토큰 발급 실패 시 에러 메시지 표시
      console.error('Cafe24 Token Error:', tokenData.error_description);
      return res.status(500).send(`<h1>❌ Token Issuance Failed</h1><p>${tokenData.error_description}</p>`);
    }

    // 성공! 이제 access_token을 얻었습니다.
    console.log('Access Token issued successfully for mall:', mall_id);
    
    // TODO: 이 단계에서 `tokenData.access_token`과 `tokenData.refresh_token`을
    //       DB에 `mall_id`와 함께 안전하게 저장해야 합니다.
    //       그래야 나중에 이 쇼핑몰의 API를 다시 호출할 수 있습니다.

    // 사용자에게 성공 페이지를 보여주거나 앱의 메인 페이지로 리디렉션합니다.
    res.send(`
      <h1>✅ Authentication Success!</h1>
      <p>Mall ID: ${tokenData.mall_id}</p>
      <p>Access Token: ${tokenData.access_token.substring(0, 15)}... (보안을 위해 일부만 표시)</p>
      <p><strong>이제 이 토큰을 DB에 저장하고 이 창을 닫아주세요.</strong></p>
    `);

  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).send("<h1>❌ Internal Server Error</h1><p>An unexpected error occurred.</p>");
  }
};
