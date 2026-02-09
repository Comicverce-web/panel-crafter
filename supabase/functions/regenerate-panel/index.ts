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

async function generatePanelImage(
  description: string,
  style: string,
  apiKey: string
): Promise<string | null> {
  try {
    const stylePrompt = style === 'manga'
      ? 'black and white manga art style with dynamic angles, speed lines, screentones, and dramatic ink work. No color.'
      : 'colorful comic book art style with bold outlines, vibrant colors, cel shading, and dynamic composition.';

    const prompt = `Create a comic panel illustration in ${stylePrompt}
Scene: ${description}
This is a single comic panel with cinematic composition. Professional quality comic/manga art. Wide aspect ratio suitable for a comic panel.`;

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
    console.error("Error generating panel image:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { panel, feedback, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const systemPrompt = `You are a comic panel designer. Based on the feedback, modify the panel description while maintaining story continuity.
Current panel:
- Number: ${panel.panel_number}
- Description: ${panel.description}

User feedback: ${feedback}

Update the panel description to incorporate this feedback while keeping it fitting for a ${style} style comic.`;

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
          { role: "user", content: `Regenerate this panel based on the feedback.` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "update_panel",
              description: "Update panel description based on feedback",
              parameters: {
                type: "object",
                properties: {
                  description: { type: "string" }
                },
                required: ["description"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "update_panel" } }
      }),
    });

    if (!response.ok) {
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
      const updatedPanel = JSON.parse(toolCall.function.arguments);
      
      const base64Url = await generatePanelImage(updatedPanel.description, style, LOVABLE_API_KEY);
      let imageUrl: string | null = null;
      if (base64Url) {
        imageUrl = await uploadImageToStorage(supabase, base64Url, `panels/regen`, `${Date.now()}`);
      }

      return new Response(JSON.stringify({ 
        panel: { 
          ...updatedPanel,
          panel_number: panel.panel_number,
          image_url: imageUrl || panel.image_url,
          dialogue: panel.dialogue
        } 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from AI");
  } catch (error) {
    console.error("regenerate-panel error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});