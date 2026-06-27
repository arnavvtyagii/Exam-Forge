const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { pool } = require('../db/pool');

// POST /api/sessions — start a new practice session
router.post('/', requireAuth, async (req, res) => {
  const { study_set_id, question_ids } = req.body;
  if (!study_set_id) return res.status(400).json({ error: 'study_set_id required' });

  try {
    // Verify ownership
    const setCheck = await pool.query(
      'SELECT id FROM study_sets WHERE id=$1 AND user_id=$2',
      [study_set_id, req.user.id]
    );
    if (!setCheck.rows.length) return res.status(404).json({ error: 'Study set not found' });

    const result = await pool.query(
      `INSERT INTO sessions (user_id, study_set_id, total_questions)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, study_set_id, question_ids?.length || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sessions/:id/attempt — submit a single answer
router.post('/:id/attempt', requireAuth, async (req, res) => {
  const { question_id, user_answer, time_taken_ms } = req.body;
  if (!question_id || user_answer === undefined)
    return res.status(400).json({ error: 'question_id and user_answer required' });

  try {
    // Get correct answer
    const qResult = await pool.query(
      'SELECT correct_answer, explanation, type FROM questions WHERE id=$1',
      [question_id]
    );
    if (!qResult.rows.length) return res.status(404).json({ error: 'Question not found' });

    const { correct_answer, explanation, type } = qResult.rows[0];

    // For short answer, do a loose match (case-insensitive contains)
    let is_correct = false;
    if (type === 'short') {
      is_correct = correct_answer.toLowerCase().split(' ').some(word =>
        word.length > 4 && user_answer.toLowerCase().includes(word)
      );
    } else {
      is_correct = user_answer.trim().toLowerCase() === correct_answer.trim().toLowerCase();
    }

    await pool.query(
      `INSERT INTO attempts (session_id, question_id, user_answer, is_correct, time_taken_ms)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, question_id, user_answer, is_correct, time_taken_ms || null]
    );

    res.json({ is_correct, correct_answer, explanation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/sessions/:id/complete — finalize the session
router.patch('/:id/complete', requireAuth, async (req, res) => {
  try {
    const attemptsResult = await pool.query(
      'SELECT COUNT(*) AS total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct FROM attempts WHERE session_id=$1',
      [req.params.id]
    );
    const { total, correct } = attemptsResult.rows[0];
    const score = total > 0 ? ((correct / total) * 100).toFixed(2) : 0;

    const result = await pool.query(
      `UPDATE sessions SET completed_at=NOW(), correct_answers=$1, score_percent=$2
       WHERE id=$3 AND user_id=$4 RETURNING *`,
      [correct, score, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/sessions — user's session history
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, ss.title AS study_set_title
       FROM sessions s
       JOIN study_sets ss ON ss.id = s.study_set_id
       WHERE s.user_id=$1 AND s.completed_at IS NOT NULL
       ORDER BY s.completed_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
