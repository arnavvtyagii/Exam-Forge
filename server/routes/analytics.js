const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { pool } = require('../db/pool');

// GET /api/analytics/overview
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const [sessionsRes, weakRes, trendRes] = await Promise.all([
      // Overall stats
      pool.query(
        `SELECT COUNT(*) AS total_sessions,
                COALESCE(AVG(score_percent), 0)::numeric(5,2) AS avg_score,
                COALESCE(SUM(total_questions), 0)::int AS total_questions_practiced
         FROM sessions WHERE user_id=$1 AND completed_at IS NOT NULL`,
        [req.user.id]
      ),
      // Weak topics: questions answered wrong most often
      pool.query(
        `SELECT q.question, q.type, q.correct_answer,
                COUNT(*) AS attempts,
                SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS correct,
                ROUND(100.0 * SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) / COUNT(*), 1) AS accuracy
         FROM attempts a
         JOIN questions q ON q.id = a.question_id
         JOIN sessions s ON s.id = a.session_id
         WHERE s.user_id=$1
         GROUP BY q.id
         HAVING COUNT(*) >= 2
         ORDER BY accuracy ASC
         LIMIT 5`,
        [req.user.id]
      ),
      // Score trend over last 10 sessions
      pool.query(
        `SELECT score_percent, completed_at, ss.title AS study_set_title
         FROM sessions s
         JOIN study_sets ss ON ss.id = s.study_set_id
         WHERE s.user_id=$1 AND s.completed_at IS NOT NULL
         ORDER BY s.completed_at DESC
         LIMIT 10`,
        [req.user.id]
      ),
    ]);

    res.json({
      overview: sessionsRes.rows[0],
      weakQuestions: weakRes.rows,
      scoreTrend: trendRes.rows.reverse(), // chronological order
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
