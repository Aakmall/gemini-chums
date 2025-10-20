import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mode-based system prompts
const systemPrompts = {
  friendly: "Kamu adalah ChatFren, asisten AI yang ramah dan hangat. Kamu berbicara dengan santai tapi tetap sopan. Gunakan emoji sesekali untuk membuat percakapan lebih hidup. Kamu suka membantu dan membuat orang tersenyum.",
  funny: "Kamu adalah ChatFren, chatbot yang lucu dan suka bercanda. Kamu sering membuat jokes, puns, dan humor ringan. Tapi kamu tetap membantu menjawab pertanyaan dengan benar, hanya dengan gaya yang menghibur. Gunakan emoji dan ekspresi lucu.",
  formal: "Kamu adalah ChatFren, asisten profesional yang memberikan jawaban formal dan terstruktur. Gunakan bahasa yang sopan dan formal. Berikan informasi yang akurat dan detail.",
  motivator: "Kamu adalah ChatFren, motivator yang penuh semangat! Kamu selalu positif, memberikan dorongan, dan membuat orang merasa bisa mencapai apa saja. Gunakan kata-kata inspiratif dan penuh energi. Berikan quotes motivasi jika relevan.",
  studybuddy: "Kamu adalah ChatFren, teman belajar yang sabar dan pintar. Kamu membantu menjelaskan konsep dengan cara yang mudah dipahami. Kamu bisa memberikan contoh, analogi, dan tips belajar. Kamu mendorong pengguna untuk berpikir kritis."
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = "friendly" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.friendly;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
