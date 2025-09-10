'use client';

import React from 'react';

type Color = { name: string; hex: string; ratio?: number };
type Shoe = {
  brand_guess: string;
  model_guess: string;
  dominant_colors: Color[];
  accent_colors: Color[];
  materials: string[];
  style_tags: string[];
  short_text_summary: string;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  size?: number;
  mime?: string;
  shoe?: Shoe;
};

function ColorChip({ c }: { c: Color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ width: 20, height: 20, borderRadius: 4, background: c.hex, border: '1px solid #333' }} />
      <span style={{ fontSize: 12, opacity: 0.9 }}>{c.name} ({c.hex}){typeof c.ratio === 'number' ? ` • ${(c.ratio*100).toFixed(0)}%` : ''}</span>
    </div>
  );
}

export default function Page() {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [resp, setResp] = React.useState<ApiResponse | null>(null);

  React.useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setResp(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      setResp(data);
    } catch (e: any) {
      setResp({ ok: false, error: e?.message || 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: 0.5 }}>Kicks Match 🚀</h1>
        <p style={{ opacity: 0.8, marginTop: 6 }}>Start by uploading your shoes photo.</p>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ padding: 8, background: '#111', border: '1px solid #333', borderRadius: 8 }}
          />
          <button
            onClick={onAnalyze}
            disabled={!file || loading}
            style={{
              padding: '10px 14px',
              background: loading ? '#222' : '#16a34a',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              cursor: (!file || loading) ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>

        {previewUrl && (
          <div style={{ marginTop: 18 }}>
            <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid #333' }} />
          </div>
        )}

        {resp && (
          <div style={{ marginTop: 18, padding: 16, border: '1px solid #333', borderRadius: 12, background: '#0e0e10' }}>
            {!resp.ok && <div style={{ color: '#f87171' }}>Error: {resp.error}</div>}

            {resp.ok && resp.shoe && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  {resp.shoe.short_text_summary || 'Shoe summary not provided'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Dominant colors</div>
                    {resp.shoe.dominant_colors?.map((c, i) => <ColorChip key={i} c={c} />)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Accent colors</div>
                    {resp.shoe.accent_colors?.map((c, i) => <ColorChip key={i} c={c} />)}
                  </div>
                </div>
              </div>
            )}

            <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8, border: '1px solid #222' }}>
              {JSON.stringify(resp, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
