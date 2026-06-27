import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../utils/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading analytics...</div>;

  const { overview, weakQuestions, scoreTrend } = data;
  const hasHistory = scoreTrend?.length > 0;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Analytics</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 36 }}>Track your progress and find what needs more work.</p>

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Sessions completed', value: overview.total_sessions },
          { label: 'Average score', value: `${parseFloat(overview.avg_score || 0).toFixed(0)}%` },
          { label: 'Questions practiced', value: overview.total_questions_practiced },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--primary-light)' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Score trend */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Score trend</h2>
        {!hasHistory ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Complete a practice session to see your score trend here.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid stroke="#2a2a40" strokeDasharray="3 3" />
              <XAxis dataKey="study_set_title" tick={{ fill: '#8880a0', fontSize: 11 }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#8880a0', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid #2a2a40', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: '#e8e6f0' }}
                itemStyle={{ color: '#a78bfa' }}
                formatter={(v) => [`${parseFloat(v).toFixed(0)}%`, 'Score']}
              />
              <Line type="monotone" dataKey="score_percent" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#a78bfa', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weak questions */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Questions to review</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Questions you've answered incorrectly most often.</p>

        {weakQuestions?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No weak spots identified yet — practice more to see this.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {weakQuestions.map((q, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <p style={{ fontSize: 14, lineHeight: 1.5, flex: 1 }}>{q.question}</p>
                  <span style={{ fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 600, color: q.accuracy < 50 ? 'var(--danger)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {q.accuracy}% accuracy
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Correct answer: <strong style={{ color: 'var(--text)' }}>{q.correct_answer}</strong> · attempted {q.attempts}×
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
