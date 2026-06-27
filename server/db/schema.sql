-- ExamForge Database Schema
-- Run this in PostgreSQL to set up the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Study sets (uploaded notes → generated questions)
CREATE TABLE study_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  source_text TEXT NOT NULL,           -- extracted text from PDF/paste
  topic VARCHAR(255),                  -- e.g. "Thermodynamics", "DBMS"
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_set_id UUID REFERENCES study_sets(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('mcq', 'truefalse', 'short')),
  question TEXT NOT NULL,
  options JSONB,                       -- for MCQ: ["A", "B", "C", "D"]
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Practice sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  study_set_id UUID REFERENCES study_sets(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  score_percent NUMERIC(5,2)
);

-- Individual question attempts within a session
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  time_taken_ms INT,                   -- milliseconds to answer
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_study_sets_user ON study_sets(user_id);
CREATE INDEX idx_questions_study_set ON questions(study_set_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_attempts_session ON attempts(session_id);
CREATE INDEX idx_attempts_question ON attempts(question_id);
