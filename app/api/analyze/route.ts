import { NextResponse } from 'next/server';

export const runtime = 'edge'; // works with fetch

type Shoe = {
  brand_guess: string;
  model_guess: string;
  dominant_colors: { name: string; hex: string; ratio?: number }[];
  accent_colors: { name: string; hex: string }[];
  materials: string[];
  style_tags: string[];
  short_text_summary: string;
};

function toBase64(ab: ArrayBuffer) {
  // edge-safe base64
  let str = '';
  const bytes = new Uint8Array(ab);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    str += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // @ts-ignore btoa is available in edge runtime
  return btoa(str);
}

const SYSTEM_PROMPT = `
You analyze shoe photos for fashion matching.
Return ONLY JSON with this exact shape and keys:

{
  "brand_guess": "",
  "model_guess": "",
  "dominant_colors": [{"name":"", "hex":"", "ratio":0.0}],
  "accent_colors": [{"name":"", "hex":""}],
  "materials": [],
  "style_tags": [],
  "short_text_summary": ""
}

Rules:
- Keep keys exactly as shown.
- hex must be like "#AABBCC" (uppercase or lowercase ok).
- ratio is 0..1 when known; omit or use 0 if unknown.
- If unsure about a field, use "" or [] but keep the key.
- short_text_summary ≤ 25 words.
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get('image') as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: 'No image provided' }, { status: 400 });
    }

    const mime = (file as any).type || 'image/jpeg';
    const b64 = toBase64(await file.arrayBuffer());

    // REST call to Gemini 1.5 Pro
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + apiKey;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT.trim() },
            { inlineData: { mimeType: mime, data: b64 } }
          ]
        }
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ ok: false, error: `Gemini error: ${r.status} ${t}` }, { status: 502 });
    }

    const out = await r.json();

    // The text output (JSON as a string) is usually here:
    const text =
      out?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ||
      out?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    // Try to parse JSON safely, even if model adds extra text
    let shoe: Shoe | null = null;
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          shoe = JSON.parse(match[0]);
        } catch {}
      }
    }

    // Fallback if parsing failed
    if (!shoe) {
      shoe = {
        brand_guess: '',
        model_guess: '',
        dominant_colors: [{ name: 'black', hex: '#000000', ratio: 0.5 }],
        accent_colors: [{ name: 'white', hex: '#FFFFFF' }],
        materials: [],
        style_tags: ['streetwear'],
        short_text_summary: 'Black sneaker (fallback)'
      };
    }

    return NextResponse.json({
      ok: true,
      size: file.size ?? 0,
      mime,
      shoe
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
