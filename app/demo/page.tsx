
'use client';

import { useState, useEffect } from 'react';

export default function DemoPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/metrics?period=7d');
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const analyzeContent = async () => {
    if (!newContent.trim()) return;
    
    setProcessing(true);
    setResult(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setNewContent('');
        await loadMetrics();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '2rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🤖 AI Content Analyzer
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            Real-time AI processing powered by Claude + Supabase + Next.js
          </p>
          
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ background: '#dbeafe', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '500' }}>Total Items</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>{metrics.total_items?.toLocaleString()}</div>
              </div>
              <div style={{ background: '#d1fae5', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ color: '#059669', fontSize: '0.875rem', fontWeight: '500' }}>Processed</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#047857' }}>{metrics.processed_items?.toLocaleString()}</div>
              </div>
              <div style={{ background: '#e9d5ff', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ color: '#7c3aed', fontSize: '0.875rem', fontWeight: '500' }}>Avg Time</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6d28d9' }}>{metrics.avg_processing_time_ms}ms</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            ⚡ Try Live AI Analysis
          </h2>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Paste any content here for instant AI analysis (sentiment, summary, tags)..."
            style={{ width: '100%', height: '120px', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem', resize: 'none' }}
            disabled={processing}
          />
          <button
            onClick={analyzeContent}
            disabled={processing || !newContent.trim()}
            style={{ 
              marginTop: '1rem', 
              padding: '0.75rem 2rem', 
              background: processing || !newContent.trim() ? '#d1d5db' : '#2563eb', 
              color: 'white', 
              fontWeight: '600', 
              borderRadius: '0.5rem', 
              border: 'none',
              cursor: processing || !newContent.trim() ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {processing ? '🔄 Analyzing...' : '✨ Analyze with AI'}
          </button>

          {result && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Analysis Result</h3>
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.875rem', 
                  fontWeight: '600',
                  background: result.sentiment === 'positive' ? '#d1fae5' : result.sentiment === 'negative' ? '#fee2e2' : '#f3f4f6',
                  color: getSentimentColor(result.sentiment)
                }}>
                  {result.sentiment}
                </span>
              </div>
              <p style={{ marginBottom: '1rem', color: '#374151' }}><strong>Summary:</strong> {result.summary}</p>
              {result.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {result.tags.map((tag: string, idx: number) => (
                    <span key={idx} style={{ padding: '0.25rem 0.75rem', background: '#e5e7eb', color: '#374151', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Processed in {result.processing_time_ms}ms
              </p>
            </div>
          )}
        </div>

        <div style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', borderRadius: '1rem', padding: '2rem', color: 'white' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🔍 Verify Everything</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>📂 GitHub Repo</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Complete source code + SQL files</div>
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>🗄️ Live Database</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Read-only access to run queries</div>
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>⚡ Query Performance</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>See before/after optimization</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
