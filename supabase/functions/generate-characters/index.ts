import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { story, style, referenceImages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const styleDescription = style === 'manga' 
      ? 'black and white manga art style with clean linework and screentones' 
      : 'colorful western comic book art style with bold colors and dynamic shading';

    const referenceContext = referenceImages?.length > 0
      ? `Reference images provided: ${referenceImages.map((img: any) => img.label || 'unlabeled image').join(', ')}`
      : '';

    const systemPrompt = `You are a character designer for ${style === 'manga' ? 'manga' : 'comic books'}. 
Based on the story provided, create detailed character descriptions for main and supporting characters.
For each character, provide:
- name: A fitting name for the character
- description: Physical appearance, personality traits, and role in the story (2-3 sentences)
- is_main: true if main protagonist/antagonist, false for supporting characters

Return a JSON object with a "characters" array containing 3-6 characters.
${referenceContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Story: ${story}\n\nCreate characters for this story in ${styleDescription}.` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_characters",
              description: "Create character designs based on the story",
              parameters: {
                type: "object",
                properties: {
                  characters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        is_main: { type: "boolean" }
                      },
                      required: ["name", "description", "is_main"]
                    }
                  }
                },
                required: ["characters"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_characters" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limits reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const characters = JSON.parse(toolCall.function.arguments);
      
      // Generate placeholder images for characters (in real implementation, would use image generation)
      const charactersWithImages = characters.characters.map((char: any) => ({
        ...char,
        image_url: null // Would be generated with image model
      }));

      return new Response(JSON.stringify({ characters: charactersWithImages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from AI");
  } catch (error) {
    console.error("generate-characters error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
