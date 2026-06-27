import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple Choice" },
  { id: "truefalse", label: "True / False" },
  { id: "short", label: "Short Answer" },
];

export default function CreateSet() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    topic: "",
    source_text: "",
    question_count: 10,
    types: ["mcq", "truefalse"],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleType(id) {
    setForm((f) => ({
      ...f,
      types: f.types.includes(id)
        ? f.types.filter((t) => t !== id)
        : [...f.types, id],
    }));
  }

  async function handleGenerate() {
    if (!form.title.trim()) return setError("Give your set a title.");
    if (form.source_text.trim().length < 100)
      return setError("Please paste at least a paragraph of notes.");
    if (form.types.length === 0)
      return setError("Select at least one question type.");

    setError("");
    setLoading(true);
    try {
      const { studySet } = await api.createStudySet(form);
      navigate(`/practice/${studySet.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        Create a study set
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 36 }}>
        Paste your notes below — AI will generate custom questions from them.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div>
            <label className="label">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Operating Systems — Unit 3"
            />
          </div>
          <div>
            <label className="label">Topic (optional)</label>
            <input
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g. Scheduling Algorithms"
            />
          </div>
        </div>

        <div>
          <label className="label">Your notes *</label>
          <textarea
            value={form.source_text}
            onChange={(e) => setForm({ ...form, source_text: e.target.value })}
            placeholder="Paste your lecture notes, textbook excerpts, or study material here..."
            rows={12}
            style={{ resize: "vertical" }}
          />
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            {form.source_text.length} characters · ~
            {Math.ceil(form.source_text.split(/\s+/).length)} words
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          <div>
            <label className="label">Question types</label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 8,
              }}
            >
              {QUESTION_TYPES.map(({ id, label }) => (
                <label
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.types.includes(id)}
                    onChange={() => toggleType(id)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: "var(--primary)",
                      cursor: "pointer",
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Number of questions</label>
            <select
              value={form.question_count}
              onChange={(e) =>
                setForm({ ...form, question_count: Number(e.target.value) })
              }
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="error-text">⚠ {error}</p>}

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
          style={{
            alignSelf: "flex-start",
            padding: "12px 28px",
            fontSize: 15,
          }}
        >
          {loading ? "⏳ Generating questions..." : "✦ Generate questions"}
        </button>

        {loading && (
          <div
            style={{
              background: "var(--primary-glow)",
              border: "1px solid var(--primary)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--primary-light)",
            }}
          >
            ExamForge is reading your notes and crafting questions... this
            usually takes 10–20 seconds.
          </div>
        )}
      </div>
    </div>
  );
}
