-- =========================================================================
-- HUSTLE KNOWLEDGE ENGINE (COMMENTS UPGRADE)
-- Comments are no longer disposable; they represent the foundation of the
-- Hustle Knowledge Graph. Every comment can become a Question, an Answer,
-- and eventually Extracted AI Knowledge.
-- =========================================================================

-- Add Knowledge Graph extensions to the content_comments table
ALTER TABLE public.content_comments
ADD COLUMN IF NOT EXISTS is_question BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_answer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_accepted_answer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_extracted_knowledge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS knowledge_quality_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS knowledge_topic VARCHAR(100),
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Create an index to quickly find high-quality knowledge or unanswered questions
CREATE INDEX IF NOT EXISTS idx_comments_knowledge
ON public.content_comments(ai_extracted_knowledge, knowledge_quality_score DESC)
WHERE ai_extracted_knowledge = true;

CREATE INDEX IF NOT EXISTS idx_comments_unanswered_questions
ON public.content_comments(is_question, is_answer)
WHERE is_question = true;

-- We could also create a materialized view or dedicated table for the Extracted Knowledge
CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_comment_id UUID REFERENCES public.content_comments(id) ON DELETE SET NULL,
    post_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    topic VARCHAR(100) NOT NULL,
    confidence_score FLOAT DEFAULT 1.0,
    extracted_by_model VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_topic ON public.knowledge_nodes(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_post ON public.knowledge_nodes(post_id);
