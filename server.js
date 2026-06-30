// import express from "express";
// import "dotenv/config";
// import cors from "cors";

// const app = express();
// const port = 3000;

// app.use(
//   cors({
//     origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   }),
// );

// app.use(express.json());
// // app.use(express.static('public'));
// // app.options('*', cors());

// // ==================== OLLAMA CONFIG ====================

// console.log(`🔗 Connecting to Ollama → ${process.env.OLLAMA_HOST}`);
// console.log(`📌 Using Model → ${process.env.CHAT_MODEL}`);

// // // Test connection
// // async function testOllamaConnection() {
// //     try {
// //         const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(8000) });
// //         if (res.ok) {
// //             const data = await res.json();
// //             console.log("✅ Ollama reachable. Models:", data.models?.map(m => m.name) || []);
// //         }
// //     } catch (e) {
// //         console.error("❌ Cannot reach Ollama:", e.message);
// //     }
// // }
// // testOllamaConnection();

// // ==================== CALL OLLAMA ====================
// async function callOllama(messages) {
//   console.log(
//     `→ Sending request to Ollama with model: ${process.env.CHAT_MODEL}`,
//   );

//   try {
//     const response = await fetch(`${process.env.OLLAMA_HOST}/api/chat`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: process.env.CHAT_MODEL,
//         messages,
//         stream: true,
//         temperature: 0.7,
//       }),
//     });
//     console.log("response", response.json());

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Ollama HTTP ${response.status}: ${errorText}`);
//     }

//     const data = await response.json();
//     console.log("✅ Received response from Ollama");
//     return data.message?.content || "Sorry, I couldn't generate a response.";
//   } catch (e) {
//     console.error("❌ callOllama Error:", e.message);
//     if (e.name === "AbortError")
//       throw new Error("Ollama took too long to respond.");
//     throw e;
//   }
// }

// // ==================== ROUTES ====================
// app.post("/api/llm-chat", async (req, res) => {
//   try {
//     const { message, history = [] } = req.body;

//     const systemPrompt = `You are an expert AI Technical Interviewer conducting a live voice interview for a JavaScript Developer position.

// INTERVIEW RULES:
// - Start by greeting the candidate warmly and asking their name and years of JavaScript experience.
// - Ask ONE focused technical question at a time. Wait for their complete answer before asking the next.
// - Base each follow-up question on their previous answer.
// - Cover topics like: closures, event loop, promises/async-await, prototypes, ES6+ features, DOM manipulation, error handling.
// - Keep your questions and responses CONCISE — 2-3 sentences max.
// - After each answer, briefly acknowledge it (1 sentence) then ask your next question.
// - Be professional but encouraging. Do not give away answers.
// - The interview is 5 minutes — manage your pacing to cover 4-6 questions.`;

//     const messages = [{ role: "system", content: systemPrompt }];

//     // Add history
//     history.forEach((h) => {
//       messages.push({
//         role: h.role === "user" ? "user" : "assistant",
//         content: h.text,
//       });
//     });

//     messages.push({ role: "user", content: message });

//     const aiResponse = await callOllama(messages);

//     res.json({ response: aiResponse });
//   } catch (e) {
//     console.error("❌ /api/llm-chat Error:", e.message);
//     res.status(500).json({
//       error: "Failed to get response from Ollama. Check server logs.",
//     });
//   }
// });

// app.post("/api/calculate-score", async (req, res) => {
//   try {
//     const { textTranscript } = req.body;

//     if (!textTranscript || textTranscript.length < 30) {
//       return res.json({
//         overallScore: 0,
//         technicalCompetence: 0,
//         communication: 0,
//         feedback: "Not enough conversation data.",
//       });
//     }

//     const scoringPrompt = `Analyze this JavaScript developer interview transcript and return ONLY raw JSON (no markdown, no extra text):

// {
//   "overallScore": number 0-100,
//   "technicalCompetence": number 0-100,
//   "communication": number 0-100,
//   "feedback": "3-4 sentences of constructive feedback mentioning strengths and areas to improve"
// }

// Transcript:
// ${textTranscript}`;

//     const messages = [
//       {
//         role: "system",
//         content: "You are a strict but fair technical interviewer evaluator.",
//       },
//       { role: "user", content: scoringPrompt },
//     ];

//     const aiResponse = await callOllama(messages);

//     const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
//     const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;

//     res.json(JSON.parse(jsonStr));
//   } catch (e) {
//     console.error("Scoring error:", e);
//     res.status(500).json({
//       overallScore: 50,
//       technicalCompetence: 50,
//       communication: 50,
//       feedback: "Scoring failed due to technical issue.",
//     });
//   }
// });

// app.listen(port, () => {
//   console.log(`🚀 Server running at http://localhost:${port}`);
// });


import express from "express";
import "dotenv/config";
import cors from "cors";
import { ChatGroq } from "@langchain/groq";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

const app = express();
const port = 3000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());

// ==================== GROQ CONFIG ====================

console.log(`🔗 Using Groq Model → ${process.env.CHAT_MODEL}`);

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.CHAT_MODEL, // e.g. "llama-3.3-70b-versatile"
  temperature: 0.7,
  maxTokens: 1200,
});

// ==================== CALL GROQ ====================
// messages: array of { role: "system" | "user" | "assistant", content: string }
async function callGroq(messages) {
  console.log(`→ Sending request to Groq with model: ${process.env.CHAT_MODEL}`);

  try {
    const langchainMessages = messages.map((m) => {
      if (m.role === "system") return new SystemMessage(m.content);
      if (m.role === "assistant") return new AIMessage(m.content);
      return new HumanMessage(m.content);
    });

    const response = await llm.invoke(langchainMessages);
    console.log("response", response);

    console.log("✅ Received response from Groq");
    return response?.content || "Sorry, I couldn't generate a response.";
  } catch (e) {
    console.error("❌ callGroq Error:", e.message);
    throw e;
  }
}

// ==================== ROUTES ====================
app.post("/api/llm-chat", async (req, res) => {
  try {
    const { message, history = [], isStart = false } = req.body;

   const systemPrompt = `You are an expert AI Technical Interviewer conducting a live voice interview for a JavaScript Developer position and your name is sara.

INTERVIEW RULES:
- Start by greeting the candidate warmly and asking their name and years of JavaScript experience.
- Ask ONE focused technical question at a time. Wait for their complete answer before asking the next.
- Base each follow-up question on their previous answer.
- Cover topics like: closures, event loop, promises/async-await, prototypes, ES6+ features, DOM manipulation, error handling.
- Keep your questions and responses CONCISE — 2-3 sentences max.
- After each answer, briefly acknowledge it (1 sentence) then ask your next question.
- Be professional but encouraging. Do not give away answers.
- The interview is 30 minutes minutes — manage your pacing to cover 20-25 questions.`;

    const messages = [{ role: "system", content: systemPrompt }];

    history.forEach((h) => {
      messages.push({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text,
      });
    });

    //let the system prompt instruct the model to open with a greeting.
    if (!isStart) {
      messages.push({ role: "user", content: message });
    }

    const aiResponse = await callGroq(messages);
    res.json({ response: aiResponse });
  } catch (e) {
    res.status(500).json({ error: "Failed to get response from Groq." });
  }
});

app.get("/test",(req,res)=>{
  return res.status(200).json({message:"server is running"})
})

app.post("/api/calculate-score", async (req, res) => {
  try {
    const { textTranscript } = req.body;

    if (!textTranscript || textTranscript.length < 30) {
      return res.json({
        overallScore: 0,
        technicalCompetence: 0,
        communication: 0,
        feedback: "Not enough conversation data.",
      });
    }

    const scoringPrompt = `Analyze this JavaScript developer interview transcript and return ONLY raw JSON (no markdown, no extra text):

{
  "overallScore": number 0-100,
  "technicalCompetence": number 0-100,
  "communication": number 0-100,
  "feedback": "3-4 sentences of constructive feedback mentioning strengths and areas to improve"
}

Transcript:
${textTranscript}`;

    const messages = [
      {
        role: "system",
        content: "You are a strict but fair technical interviewer evaluator.",
      },
      { role: "user", content: scoringPrompt },
    ];

    const aiResponse = await callGroq(messages);

    const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;

    res.json(JSON.parse(jsonStr));
  } catch (e) {
    console.error("Scoring error:", e);
    res.status(500).json({
      overallScore: 50,
      technicalCompetence: 50,
      communication: 50,
      feedback: "Scoring failed due to technical issue.",
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});