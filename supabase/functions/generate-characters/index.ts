import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function base64ToUint8Array(base64: string): Uint8Array {
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function uploadImageToStorage(
  supabase: any,
  base64DataUrl: string,
  folder: string,
  filename: string
): Promise<string | null> {
  try {
    // Extract base64 data and mime type from data URL
    const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return null;
    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType.split('/')[1] || 'png';
    const filePath = `${folder}/${filename}.${ext}`;
    const bytes = base64ToUint8Array(base64Data);

    const { error } = await supabase.storage
      .from('generated-images')
      .upload(filePath, bytes, { contentType: mimeType, upsert: true });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}

async function generateCharacterImage(
  character: { name: string; description: string; is_main: boolean },
  style: string,
  apiKey: string
): Promise<string | null> {
  try {
    const stylePrompt = style === 'manga'
      ? 'black and white manga art style with clean linework, screentones, and dramatic shading. No color.'
      : 'colorful western comic book art style with bold outlines, vibrant colors, cel shading, and dynamic lighting.';

    const prompt = `Create a character portrait illustration in ${stylePrompt}
Character: ${character.name}
Description: ${character.description}
${character.is_main ? 'This is a main character - make the portrait detailed and striking.' : 'This is a supporting character.'}
Show the character from chest up, facing slightly to the side, with an expressive face. Clean background with simple gradient. Professional comic/manga quality.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
  } catch (error) {
    console.error("Error generating character image:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { story, style, referenceImages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limits reached. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const characters = JSON.parse(toolCall.function.arguments);
      const batchId = Date.now().toString();
      
      const charactersWithImages = await Promise.all(
        characters.characters.map(async (char: any, i: number) => {
          const base64Url = await generateCharacterImage(char, style, LOVABLE_API_KEY);
          let imageUrl: string | null = null;
          if (base64Url) {
            imageUrl = await uploadImageToStorage(supabase, base64Url, `characters/${batchId}`, `char-${i}`);
          }
          return { ...char, image_url: imageUrl };
        })
      );

      return new Response(JSON.stringify({ characters: charactersWithImages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from AI");
  } catch (error) {
    console.error("generate-characters error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});