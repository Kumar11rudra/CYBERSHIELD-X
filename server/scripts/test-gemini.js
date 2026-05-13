require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log('Key:', key);
    if (!key) throw new Error('No key');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hello");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
