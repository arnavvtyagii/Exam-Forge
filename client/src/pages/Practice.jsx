import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function Practice() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [studySet, setStudySet] = useState(null);
  const [session, setSession] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState(null); // { is_correct, correct_answer, explanation }
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const startTime = useRef(null);

  useEffect(() => {
    async function init() {
      const data = await api.getStudySet(setId);
      setStudySet(data);
      const sess = await api.startSession({ study_set_id: setId, question_ids: data.questions.map(q => q.id) });
      setSession(sess);
      startTime.current = Date.now();
      setLoading(false);
    }
    init().catch(console.error);
  }, [setId]);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading practice session...</div>;

  const questions = studySet.questions;
  const question = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  async function handleSubmit() {
    if (!userAnswer) return;
    setSubmitting(true);
    const elapsed = Date.now() - startTime.current;
    try {
      const res = await api.submitAttempt(session.id, {
        question_id: question.id,
        user_answer: userAnswer,
        time_taken_ms: elapsed,
      });
      setResult(res);
      setScore(s => ({ correct: s.correct + (res.is_correct ? 1 : 0), total: s.total + 1 }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      // Finish session
      const completed = await api.completeSession(session.id);
      setFinalScore(completed);
      setFinished(true);
    } else {
      setCurrentIdx(i => i + 1);
      setUserAnswer('');
      setResult(null);
      startTime.current = Date.now();
    }
  }

  if (finished) {
    const pct = parseFloat(finalScore?.score_percent || 0);
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📖';
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>{emoji}</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Session complete</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>{studySet.title}</p>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: pct >= 80 ? 'var(--accent)' : pct >= 60 ? 'var(--primary-light)' : 'var(--danger)', fontFamily: 'var(--mono)' }}>
            {pct.toFixed(0)}%
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{score.correct} of {score.total} correct</p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Practice again</button>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
          <button className="btn btn-ghost" onClick={() => navigate('/analytics')}>View analytics</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{studySet.title}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {currentIdx + 1} of {questions.length}</p>
        </div>
        <div style={{ fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
          {score.correct}/{score.total} ✓
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 32 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      {/* Question card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'truefalse' ? 'True / False' : 'Short Answer'}
          </span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: 4, background: 'var(--surface2)', color: question.difficulty === 'easy' ? 'var(--accent)' : question.difficulty === 'hard' ? 'var(--danger)' : 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {question.difficulty}
          </span>
        </div>

        <p style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.5, marginBottom: 24 }}>{question.question}</p>

        {/* MCQ options */}
        {question.type === 'mcq' && question.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((opt, i) => {
              const letter = opt.split('.')[0];
              const isSelected = userAnswer === letter;
              const isCorrect = result && letter === result.correct_answer;
              const isWrong = result && isSelected && !result.is_correct;

              return (
                <button key={i} onClick={() => !result && setUserAnswer(letter)}
                  style={{
                    textAlign: 'left', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14,
                    border: `1px solid ${isCorrect ? 'var(--accent)' : isWrong ? 'var(--danger)' : isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    background: isCorrect ? 'rgba(6,214,160,0.1)' : isWrong ? 'rgba(248,113,113,0.1)' : isSelected ? 'var(--primary-glow)' : 'var(--surface2)',
                    color: 'var(--text)',
                    cursor: result ? 'default' : 'pointer',
                  }}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* True/False */}
        {question.type === 'truefalse' && (
          <div style={{ display: 'flex', gap: 12 }}>
            {['True', 'False'].map(val => {
              const isSelected = userAnswer === val;
              const isCorrect = result && val === result.correct_answer;
              const isWrong = result && isSelected && !result.is_correct;
              return (
                <button key={val} onClick={() => !result && setUserAnswer(val)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600,
                    border: `1px solid ${isCorrect ? 'var(--accent)' : isWrong ? 'var(--danger)' : isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    background: isCorrect ? 'rgba(6,214,160,0.1)' : isWrong ? 'rgba(248,113,113,0.1)' : isSelected ? 'var(--primary-glow)' : 'var(--surface2)',
                    color: 'var(--text)',
                    cursor: result ? 'default' : 'pointer',
                  }}>
                  {val}
                </button>
              );
            })}
          </div>
        )}

        {/* Short answer */}
        {question.type === 'short' && (
          <textarea
            value={userAnswer}
            onChange={e => !result && setUserAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={4}
            disabled={!!result}
            style={{ resize: 'none' }}
          />
        )}
      </div>

      {/* Feedback */}
      {result && (
        <div style={{
          padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 20,
          background: result.is_correct ? 'rgba(6,214,160,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1px solid ${result.is_correct ? 'var(--accent)' : 'var(--danger)'}`,
        }}>
          <p style={{ fontWeight: 600, color: result.is_correct ? 'var(--accent)' : 'var(--danger)', marginBottom: 6 }}>
            {result.is_correct ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          {!result.is_correct && (
            <p style={{ fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Correct answer: </span>
              <strong>{result.correct_answer}</strong>
            </p>
          )}
          {result.explanation && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{result.explanation}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        {!result ? (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!userAnswer || submitting} style={{ padding: '12px 28px' }}>
            {submitting ? 'Checking...' : 'Submit answer'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext} style={{ padding: '12px 28px' }}>
            {currentIdx + 1 >= questions.length ? 'Finish →' : 'Next question →'}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Exit</button>
      </div>
    </div>
  );
}
