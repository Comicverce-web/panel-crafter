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
    const { story, style, characters } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const styleDescription = style === 'manga' 
      ? 'black and white manga style with dynamic angles, speed lines, and expressive faces' 
      : 'colorful comic book style with bold outlines, vibrant colors, and action poses';

    const characterContext = characters?.length > 0
      ? `Characters in this story: ${characters.map((c: any) => `${c.name}: ${c.description}`).join('\n')}`
      : '';

    const systemPrompt = `You are a comic panel designer for ${style === 'manga' ? 'manga' : 'comic books'}.
Based on the story, break it down into 6-8 sequential panels that tell the story visually.
For each panel, provide:
- panel_number: Sequential number (1, 2, 3, etc.)
- description: Visual description of what happens in the panel, including character positions, expressions, and background (2-3 sentences)

Focus on visual storytelling - show action, emotion, and progression.
${characterContext}`;

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
          { role: "user", content: `Story: ${story}\n\nBreak this story into comic panels in ${styleDescription}.` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_panels",
              description: "Create comic panel descriptions based on the story",
              parameters: {
                type: "object",
                properties: {
                  panels: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        panel_number: { type: "integer" },
                        description: { type: "string" }
                      },
                      required: ["panel_number", "description"]
                    }
                  }
                },
                required: ["panels"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_panels" } }
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
      const panels = JSON.parse(toolCall.function.arguments);
      
      // Add placeholder for images (would be generated with image model)
      const panelsWithImages = panels.panels.map((panel: any) => ({
        ...panel,
        image_url: null,
        dialogue: null
      }));

      return new Response(JSON.stringify({ panels: panelsWithImages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from AI");
  } catch (error) {
    console.error("generate-panels error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
