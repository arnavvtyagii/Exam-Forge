import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getStudySets().then(setSets).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this study set?')) return;
    await api.deleteStudySet(id);
    setSets(sets.filter(s => s.id !== id));
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {sets.length === 0 ? 'Upload your first set of notes to get started.' : `You have ${sets.length} study set${sets.length !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <Link to="/create" className="btn btn-primary">✦ New set</Link>
      </div>

      {/* Study sets grid */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading your sets...</p>
      ) : sets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📚</div>
          <h3 style={{ marginBottom: 8 }}>No study sets yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Upload your notes and let AI generate practice questions.</p>
          <Link to="/create" className="btn btn-primary">Create your first set</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {sets.map(set => (
            <div key={set.id} className="card" onClick={() => navigate(`/practice/${set.id}`)} style={{ cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {set.topic && (
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent)', background: 'rgba(6,214,160,0.1)', padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 10 }}>
                  {set.topic}
                </span>
              )}
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{set.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {set.question_count} question{set.question_count !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Practice →</span>
                <button onClick={(e) => handleDelete(set.id, e)} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: 6, fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
