module.exports = (req, res) => {
  const { code } = req.query;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (code) {
    console.log('Authorization code received successfully:', code);
    res.send(`<h1>✅ Authentication Success</h1><p>The authorization code from Cafe24 is: [${code}]</p><p>The next step is to exchange this code for an Access Token.</p>`);
  } else {
    res.status(400).send('<h1>❌ Authentication Failed</h1><p>Authorization code was not received.</p>');
  }
};
