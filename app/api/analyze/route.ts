import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('image') as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: 'No image provided' }, { status: 400 });
    }

    // Stubbed analysis so you can deploy from mobile
    const size = file.size ?? 0;
    const mime = (file as any).type || '';

    const shoe = {
      brand_guess: '',
      model_guess: '',
      dominant_colors: [
        { name: 'cave stone', hex: '#B0A58B', ratio: 0.52 },
        { name: 'black', hex: '#000000', ratio: 0.38 }
      ],
      accent_colors: [
        { name: 'white', hex: '#FFFFFF' }
      ],
      materials: ['leather'],
      style_tags: ['streetwear', 'basketball'],
      short_text_summary: 'Taupe/black sneaker, streetwear vibe'
    };

    return NextResponse.json({ ok: true, size, mime, shoe });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
