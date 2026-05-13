const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './server/.env' });

const testGemini = async () => {
  const key = process.env.GEMINI_API_KEY;
  console.log('Using API Key:', key ? (key.slice(0, 8) + '...') : 'NULL');
  
  if (!key) {
    console.error('No API Key found in .env');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, are you online?");
    console.log('Response:', result.response.text());
    console.log('✅ Gemini is ONLINE');
  } catch (err) {
    console.error('❌ Gemini Error:', err.message);
    if (err.stack) console.error(err.stack.split('\n')[0]);
    process.exit(1);
  }
};

testGemini();
