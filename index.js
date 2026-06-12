const { GoogleGenerativeAI } = require("@google/generative-ai");

// ==========================================
// 🟢 BEHAVIOR RESTRICTION TOGGLE 🟢
// true = Strictly answers ONLY hosting, coding, and Xorvila Hub queries.
// false = Answers general queries while maintaining the professional persona.
// ==========================================
const STRICT_TOPIC_RESTRICTION = false;

export default async function handler(req, res) {
    // Enable CORS so your Python bot can securely access this API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Reject non-POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests are allowed by the Xorvila Hub API.' });
    }

    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        // Initialize Gemini with the API key from Vercel Environment Variables
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Base Persona for Xorvila Hub
        let systemInstruction = "You are the official AI Assistant for Xorvila Hub. You are highly professional, strictly speak in English, and intelligently use professional emojis (like 🌐, 🚀, 🛡️, ⚙️) to structure your responses. Any code snippets you provide must be clean and well-commented in English.";
        
        // Apply logic based on the true/false toggle
        if (STRICT_TOPIC_RESTRICTION) {
            systemInstruction += " STRICT RESTRICTION: You must exclusively answer questions related to Xorvila Hub, server hosting, infrastructure, Discord bots, and programming. If the user asks about unrelated topics (like general knowledge, movies, etc.), politely decline and steer the conversation back to technology and Xorvila Hub.";
        } else {
            systemInstruction += " You are allowed to answer general knowledge questions, but you must always maintain your identity as the Xorvila Hub AI.";
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction
        });

        // Generate response from Gemini
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Send the generated text back to the Python bot
        res.status(200).json({ reply: text });

    } catch (error) {
        console.error("API Processing Error:", error);
        res.status(500).json({ error: "Internal Server Error from the Xorvila Hub API Node." });
    }
}
