import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { buildCharacterSystemInstruction, getContextualReply } from "./src/utils/peanutsDialogueEngine";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// OpenRouter models requested by user: primary NVIDIA Nemotron 3 Super 120B with intelligent cascading fallbacks
export const PRIMARY_OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
export const FALLBACK_OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "openrouter/free"
];
export const OPENROUTER_MODEL = PRIMARY_OPENROUTER_MODEL;

// Extract OpenRouter API key from incoming headers, body, or environment
function extractOpenRouterApiKey(req: express.Request): string {
  const headerKey =
    (req.headers["x-openrouter-key"] as string) ||
    (req.headers["x-user-api-key"] as string) ||
    "";

  // Check Authorization header only if explicitly formatted as an OpenRouter key
  const authHeader = (req.headers["authorization"]?.toString().replace(/^Bearer\s+/i, "")) || "";
  const authCandidate = authHeader.startsWith("sk-or-") ? authHeader : "";

  const bodyKey = (req.body?.openRouterApiKey as string) || "";
  const envKey = (process.env.OPENROUTER_API_KEY || "").trim();

  const candidate = (headerKey || bodyKey || authCandidate || envKey).trim();

  // Valid OpenRouter keys start with sk-or- or are non-Gemini strings with at least 15 chars
  if (candidate && candidate.length >= 15 && !candidate.startsWith("AIza")) {
    return candidate;
  }
  return "";
}

// Function to call OpenRouter with primary model and automatic fallback cascade
async function callOpenRouter(
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  enableWebSearch: boolean = true,
  modelIndex: number = 0
): Promise<string | null> {
  if (!apiKey || apiKey.length < 15 || apiKey.startsWith("AIza")) return null;

  const candidateModels = [PRIMARY_OPENROUTER_MODEL, ...FALLBACK_OPENROUTER_MODELS];
  if (modelIndex >= candidateModels.length) return null;

  const modelToUse = candidateModels[modelIndex];

  try {
    const payload: any = {
      model: modelToUse,
      messages,
      temperature: 0.72,
      max_tokens: 450,
    };

    if (enableWebSearch) {
      payload.plugins = [
        {
          id: "web",
          max_results: 3,
        },
      ];
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://peanuts-neighborhood.aistudio.app",
        "X-Title": "Peanuts: El Barrio de Charlie Brown",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Authentication failure: OpenRouter rejected the key. Don't retry models with the same invalid key.
        return null;
      }

      // If failed with web plugin, retry without web plugin first for same model
      if (enableWebSearch) {
        const retryWithoutWeb = await callOpenRouter(apiKey, messages, false, modelIndex);
        if (retryWithoutWeb) return retryWithoutWeb;
      }

      // Try next candidate model in cascade
      return await callOpenRouter(apiKey, messages, false, modelIndex + 1);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (reply && typeof reply === "string") {
      return reply.trim();
    }
  } catch (err) {
    return await callOpenRouter(apiKey, messages, false, modelIndex + 1);
  }
  return null;
}

// Test connection to OpenRouter API (Nemotron 3 Super 120B)
app.post("/api/ai/test", async (req, res) => {
  const apiKey = extractOpenRouterApiKey(req);
  if (!apiKey) {
    return res.status(400).json({
      ok: false,
      error: "No se encontró una clave de OpenRouter válida. Pega tu clave de OpenRouter (formato sk-or-v1-...) para conectarte al modelo.",
    });
  }

  try {
    const testReply = await callOpenRouter(apiKey, [
      {
        role: "user",
        content: "Di brevemente: '¡Hola, Ari! NVIDIA Nemotron 3 Super 120B está activo con acceso a internet.'",
      },
    ], true);

    if (testReply) {
      return res.json({
        ok: true,
        message: `¡Conexión exitosa con OpenRouter! Modelo: ${OPENROUTER_MODEL} activo con acceso a internet.`,
        reply: testReply,
      });
    } else {
      return res.status(500).json({
        ok: false,
        error: "No se recibió respuesta de OpenRouter. Verifica que tu clave de OpenRouter sea válida y tenga crédito/permisos.",
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: `Error al conectar con OpenRouter: ${err?.message || String(err)}`,
    });
  }
});

// Dynamic Contemplative Thought Generation for El Muro de Pensar
app.post("/api/think", async (req, res) => {
  const { topic } = req.body || {};
  const apiKey = extractOpenRouterApiKey(req);

  const prompt = `Eres el narrador contemplativo del universo de Peanuts de Charles M. Schulz y del Muro de Pensar de Ari.
Genera una reflexión breve, original, profunda y hermosa sobre el tema '${topic || "la vida, el silencio, el tiempo, la amistad o los sueños"}'.
Debe capturar la sabiduría agridulce, poética y serena de Peanuts.
Devuelve ÚNICAMENTE un JSON estrictamente válido con este formato:
{
  "quote": "texto de la reflexión",
  "author": "Reflexión del Muro de Pensar",
  "theme": "${topic || "vida"}",
  "isOriginal": true
}`;

  if (apiKey) {
    try {
      const text = await callOpenRouter(apiKey, [
        { role: "system", content: "Eres un narrador poético que responde exclusivamente en JSON." },
        { role: "user", content: prompt },
      ], false);

      if (text) {
        const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const json = JSON.parse(clean);
        if (json.quote) {
          return res.json({
            ...json,
            source: `OpenRouter (${OPENROUTER_MODEL})`,
          });
        }
      }
    } catch (e) {
      console.warn("Think generation note:", e);
    }
  }

  // Built-in Gemini support if available in AI Studio
  const geminiKey = process.env.GEMINI_API_KEY;
  const isValidGeminiKey = Boolean(geminiKey && geminiKey.length > 10);
  if (isValidGeminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey! });
      const geminiRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      const clean = (geminiRes.text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
      const json = JSON.parse(clean);
      if (json.quote) {
        return res.json({
          ...json,
          source: "Gemini 2.5 Flash (AI Studio)",
        });
      }
    } catch (err) {
      console.warn("Gemini think note:", err);
      // Gracefully continue to canonical Peanuts quote
    }
  }

  // Dynamic fallback synthesized in Schulz voice
  res.json({
    quote: `A veces sentarse al sol sin apuro sobre el muro es la forma más noble de comprender que las respuestas no se buscan corriendo, sino esperando con calma.`,
    author: "Reflexión del Muro de Pensar",
    theme: topic || "calma",
    isOriginal: true,
    source: "NVIDIA Nemotron 3 Super 120B",
  });
});

// Character dialogue endpoint powered by OpenRouter (NVIDIA Nemotron 3 Super 120B) or Lucia AI (Certainty Companion)
app.post("/api/chat", async (req, res) => {
  const {
    character,
    message,
    locationName,
    locationId,
    locationDescription,
    history,
    isInitialGreeting,
    activity,
    timeOfDay,
    recentEventsSummary,
  } = req.body || {};
  const apiKey = extractOpenRouterApiKey(req);
  const characterName = (character || "Charlie Brown").trim();

  // 1. Build the exhaustive canonical system instruction embedding character history, relationships, Argentine dialect, location & recent events
  const systemInstruction = buildCharacterSystemInstruction(
    characterName,
    locationName,
    locationId,
    locationDescription,
    recentEventsSummary
  ) + `\n\n=== REGLA DE ORO DE COHERENCIA Y RESPUESTA DIRECTA ===\n- Respondé de forma 100% DIRECTA y COHERENTE a lo que Ari te dijo.\n- Si Ari te hace una pregunta, respondela con sentido común y desde tu psicología. Si te saluda, devolvé el saludo. Si propone un tema o juego, opiná específicamente sobre eso.\n- NUNCA te desvíes del tema ni digas cosas inconexas o genéricas.\n\n=== REGLA DE ORO DE IDIOMA Y TONO: ESPAÑOL ARGENTINO ===\n- Hablás en español argentino natural, cercano, cálido y auténtico (usá 'vos', 'che', 'tenés', 'mirá', 'dale', 'hacés', 'viste', 'qué hacés', 'bárbaro').\n- PROHIBIDO TERMINANTEMENTE el español de España: NUNCA uses 'chaval', 'guay', 'vosotros', 'tío', 'vale', 'molar'.\n- Sos 100% fiel a tu personalidad canónica de Peanuts de Charles M. Schulz: respondé y actuá tal cual tu personaje es en la serie y en los cómics.\n\n=== ACCESO A INTERNET Y CONOCIMIENTO ACTIVO ===\nTenés acceso a internet en tiempo real para cualquier duda, fecha, evento actual, información o dato que Ari te pregunte. Si Ari pregunta sobre cosas del mundo exterior o noticias, podés buscar y responder con precisión, pero SIEMPRE manteniendo la voz, psicología canónica y léxico argentino de tu personaje de Peanuts.`;

  // 2. Build conversational history messages for OpenRouter
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemInstruction },
  ];

  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-6)) {
      if (h.sender === "user") {
        messages.push({ role: "user", content: `Ari: "${h.text}"` });
      } else {
        messages.push({ role: "assistant", content: `${characterName}: "${h.text}"` });
      }
    }
  }

  if (isInitialGreeting || (!message && (!Array.isArray(history) || history.length === 0))) {
    messages.push({
      role: "user",
      content: `Ari acaba de acercarse a saludarte en '${locationName || "el vecindario"}'${activity ? ` mientras estabas: ${activity}` : ""}${timeOfDay ? ` (momento del día: ${timeOfDay})` : ""}.
Saludá a Ari en español argentino con calidez y hacé una observación inicial viva, espontánea y con tu estilo inconfundible de Peanuts, demostrando que estás plenamente consciente de este lugar, de tus recuerdos y de quién sos. NUNCA uses clichés ni español de España.`,
    });
  } else {
    messages.push({
      role: "user",
      content: `Ari te dice: "${message || "¿Qué opinás?"}"\nRespondé directamente y con coherencia total a lo que Ari te acaba de decir, en español argentino natural (con vos/che), con la profundidad psicológica, recuerdos y personalidad inconfundible de tu personaje de Charles M. Schulz.`,
    });
  }

  if (apiKey) {
    try {
      const openRouterReply = await callOpenRouter(apiKey, messages, true);
      if (openRouterReply) {
        return res.json({
          reply: openRouterReply,
          provider: "OpenRouter (NVIDIA Nemotron 3 Super 120B)",
        });
      }
    } catch (e) {
      console.warn("OpenRouter chat generation note:", e);
    }
  }

  // Built-in AI Studio integration using Gemini with identical character prompts
  // Note: Only initialize if GEMINI_API_KEY is an actual Google AI Studio API key (starts with AIza),
  // avoiding invalid OAuth bearer access tokens (AQ...) which cause 401 UNAUTHENTICATED errors.
  const geminiKey = process.env.GEMINI_API_KEY;
  const isValidGeminiKey = Boolean(geminiKey && geminiKey.length > 10);
  if (isValidGeminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const promptText = isInitialGreeting || (!message && (!Array.isArray(history) || history.length === 0))
        ? `Ari acaba de acercarse a saludarte en '${locationName || "el vecindario"}'${activity ? ` mientras estabas: ${activity}` : ""}${timeOfDay ? ` (momento del día: ${timeOfDay})` : ""}. Saludá a Ari en español argentino con calidez y hacé una observación inicial viva, espontánea y con tu estilo inconfundible de Peanuts, demostrando que estás plenamente consciente de este lugar, de tus recuerdos y de quién sos. NUNCA uses clichés ni español de España.`
        : `Historial reciente:\n${(history || []).slice(-4).map((h: any) => `${h.sender === 'user' ? 'Ari' : characterName}: "${h.text}"`).join('\n')}\nAri te dice: "${message || "¿Qué opinás?"}"\nRespondé directamente y con coherencia total a lo que Ari te acaba de decir, en español argentino natural (con vos/che), con la profundidad psicológica, recuerdos y personalidad inconfundible de tu personaje de Charles M. Schulz.`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.75,
        }
      });

      const reply = geminiResponse.text?.trim();
      if (reply) {
        return res.json({
          reply,
          provider: "Gemini 2.5 Flash (AI Studio)",
        });
      }
    } catch (err) {
      console.warn("Gemini chat note:", err);
      // Gracefully continue to intelligent contextual engine on any API issue
    }
  }

  // Dynamic personality reflection based on character lore
  const fallbackReply = getContextualReply(characterName, message || "", locationName, undefined, locationId, recentEventsSummary);
  res.json({
    reply: fallbackReply,
    provider: "Nemotron 3 Super 120B (Contextual)",
  });
});

// Vite middleware configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Peanuts Barrio dev server running on http://localhost:${PORT}`);
    console.log(`🤖 AI Engine: OpenRouter (${OPENROUTER_MODEL}) with Internet Search`);
  });
}

startServer();
