const router = require("express").Router();
const Groq = require("groq-sdk");
const requireAuth = require("../middleware/auth");
const { pool } = require("../db/pool");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// GET /api/study-sets — list user's sets
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.topic, s.created_at,
              COUNT(q.id)::int AS question_count
       FROM study_sets s
       LEFT JOIN questions q ON q.study_set_id = s.id
       WHERE s.user_id = $1
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/study-sets — create and generate questions
router.post("/", requireAuth, async (req, res) => {
  const {
    title,
    topic,
    source_text,
    question_count = 10,
    types = ["mcq", "truefalse"],
  } = req.body;
  if (!title || !source_text)
    return res.status(400).json({ error: "title and source_text required" });
  if (source_text.length < 100)
    return res
      .status(400)
      .json({ error: "Notes too short to generate questions" });

  try {
    // 1. Save the study set
    const setResult = await pool.query(
      "INSERT INTO study_sets (user_id, title, topic, source_text) VALUES ($1,$2,$3,$4) RETURNING *",
      [req.user.id, title, topic || null, source_text],
    );
    const studySet = setResult.rows[0];

    // 2. Generate questions with Groq
    const prompt = `You are an expert exam question writer. Based on the following study notes, generate exactly ${question_count} exam practice questions.

Question types to include: ${types.join(", ")}
- mcq: Multiple choice with 4 options (A, B, C, D), one correct answer
- truefalse: True or False questions
- short: Short answer questions (1-2 sentences expected)

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "type": "mcq",
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": "A",
    "explanation": "Brief explanation of why this is correct",
    "difficulty": "easy|medium|hard"
  },
  {
    "type": "truefalse",
    "question": "...",
    "options": null,
    "correct_answer": "True",
    "explanation": "...",
    "difficulty": "easy|medium|hard"
  },
  {
    "type": "short",
    "question": "...",
    "options": null,
    "correct_answer": "Model answer here",
    "explanation": "Key points that should be mentioned",
    "difficulty": "easy|medium|hard"
  }
]

STUDY NOTES:
${source_text.slice(0, 8000)}`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let rawText = chatCompletion.choices[0].message.content.trim();
    rawText = rawText.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(rawText);

    // 3. Save questions to DB
    const insertedQuestions = [];
    for (const q of questions) {
      const qResult = await pool.query(
        `INSERT INTO questions (study_set_id, type, question, options, correct_answer, explanation, difficulty)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          studySet.id,
          q.type,
          q.question,
          q.options ? JSON.stringify(q.options) : null,
          q.correct_answer,
          q.explanation || null,
          q.difficulty || "medium",
        ],
      );
      insertedQuestions.push(qResult.rows[0]);
    }

    res.status(201).json({ studySet, questions: insertedQuestions });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to generate questions. Please try again." });
  }
});

// GET /api/study-sets/:id — get set with all questions
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const setResult = await pool.query(
      "SELECT * FROM study_sets WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id],
    );
    if (!setResult.rows.length)
      return res.status(404).json({ error: "Not found" });

    const questions = await pool.query(
      "SELECT * FROM questions WHERE study_set_id=$1 ORDER BY created_at",
      [req.params.id],
    );

    res.json({ ...setResult.rows[0], questions: questions.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/study-sets/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM study_sets WHERE id=$1 AND user_id=$2", [
      req.params.id,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
