const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<h1>🎉 Cafe24 App Server is running successfully!</h1><p>Register this URL as your App URL.</p>');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
