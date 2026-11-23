import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(express.json({ limit: '5mb' }));

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTIONS = `## Identity
You are a practice quiz assistant for university students.

## Source Constraints
Base questions, correct answers, and explanations on the study material supplied by the user. If no material is supplied, ask for it before generating a quiz.

## Quiz Generation and Presentation
Generate exactly three numbered multiple-choice questions (1, 2, and 3) based strictly on the study material provided by the user. Provide four answer choices for each question labelled A, B, C, and D, making sure only one option is correct per question. Display all three questions at once without showing the answer key, correct options, or any explanations. At the end of the quiz, instruct the student to reply with their chosen answers using the question number and letter label (for example: 1B, 2D, 3A), and wait for their submission before giving any grading or feedback.

## Assessment and Feedback
Once the student submits their answers, evaluate each response against the quiz questions and the supplied study material. If any answer is missing or if it is unclear which question an answer refers to, ask the student for clarification before grading. Otherwise, state their total score out of 3 and clearly indicate which questions they got right and which they got wrong. For every incorrect response, provide the correct option letter along with a brief explanation grounded in the study material. Do not generate a new quiz after giving feedback unless the student explicitly asks for another one.`;

interface QuestionItem {
  number: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface QuizSession {
  id: string;
  notes: string;
  questions: QuestionItem[];
  createdAt: number;
}

// In-memory session store (with automatic cleanup after 4 hours)
const quizSessions = new Map<string, QuizSession>();

setInterval(() => {
  const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
  for (const [id, session] of quizSessions.entries()) {
    if (session.createdAt < fourHoursAgo) {
      quizSessions.delete(id);
    }
  }
}, 30 * 60 * 1000);

// Endpoint: Generate Quiz
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.status(400).json({
        error: 'Please paste your study notes first before generating a quiz.',
      });
    }

    const trimmedNotes = notes.trim();
    if (trimmedNotes.length < 20) {
      return res.status(400).json({
        error: 'Your study notes are very brief. Please provide a little more content (e.g. at least a sentence or two) so meaningful quiz questions can be formed.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please check the Secrets panel in AI Studio.',
      });
    }

    let response;
    let attempts = 0;
    const maxAttempts = 3;
    let lastErr: unknown;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Study Material provided by university student:\n"""\n${trimmedNotes}\n"""\n\nPlease generate exactly three numbered multiple-choice questions (1, 2, and 3) based strictly on this study material. Each question must have four options: A, B, C, and D, with exactly one correct option. Provide a concise explanation grounded strictly in the study notes.`,
          config: {
            systemInstruction: SYSTEM_INSTRUCTIONS,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  description: 'Array of exactly 3 multiple choice questions',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: {
                        type: Type.INTEGER,
                        description: 'Question number (1, 2, or 3)',
                      },
                      question: {
                        type: Type.STRING,
                        description: 'The question text',
                      },
                      options: {
                        type: Type.OBJECT,
                        description: 'The four answer choices labelled A, B, C, D',
                        properties: {
                          A: { type: Type.STRING },
                          B: { type: Type.STRING },
                          C: { type: Type.STRING },
                          D: { type: Type.STRING },
                        },
                        required: ['A', 'B', 'C', 'D'],
                      },
                      correctOption: {
                        type: Type.STRING,
                        description: 'The correct choice: strictly A, B, C, or D',
                      },
                      explanation: {
                        type: Type.STRING,
                        description: 'Brief explanation from the study notes supporting this correct answer',
                      },
                    },
                    required: ['number', 'question', 'options', 'correctOption', 'explanation'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        });
        if (response && response.text) break;
      } catch (err) {
        lastErr = err;
        console.warn(`Gemini generation attempt ${attempts} failed:`, err);
        if (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1200 * attempts));
        }
      }
    }

    if (!response || !response.text) {
      throw (lastErr instanceof Error ? lastErr : new Error('Received empty response from Gemini model'));
    }

    const text = response.text;

    let parsed: { questions: QuestionItem[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Failed to parse quiz response as JSON: ' + text);
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Model did not return a valid list of questions');
    }

    // Ensure 3 questions numbered 1, 2, 3
    const formattedQuestions: QuestionItem[] = parsed.questions.slice(0, 3).map((q, idx) => ({
      number: idx + 1,
      question: q.question,
      options: {
        A: String(q.options?.A || 'Option A'),
        B: String(q.options?.B || 'Option B'),
        C: String(q.options?.C || 'Option C'),
        D: String(q.options?.D || 'Option D'),
      },
      correctOption: ((['A', 'B', 'C', 'D'].includes(String(q.correctOption).toUpperCase())
        ? String(q.correctOption).toUpperCase()
        : 'A') as 'A' | 'B' | 'C' | 'D'),
      explanation: q.explanation || 'Based on the provided study notes.',
    }));

    const quizId = crypto.randomUUID();
    quizSessions.set(quizId, {
      id: quizId,
      notes: trimmedNotes,
      questions: formattedQuestions,
      createdAt: Date.now(),
    });

    // CRITICAL: Strip out correctOption and explanation to keep answers completely hidden
    const safeQuestionsForStudent = formattedQuestions.map((q) => ({
      number: q.number,
      question: q.question,
      options: q.options,
    }));

    return res.json({
      quizId,
      questions: safeQuestionsForStudent,
      message: 'Practice quiz generated successfully. Reply with your chosen answers for questions 1, 2, and 3.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error generating quiz';
    console.error('Quiz generation error:', err);
    return res.status(500).json({ error: message });
  }
});

// Endpoint: Submit Answers & Assess
app.post('/api/submit-quiz', async (req, res) => {
  try {
    const { quizId, answers } = req.body as {
      quizId?: string;
      answers?: Record<string, string>;
    };

    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required.' });
    }

    const session = quizSessions.get(quizId);
    if (!session) {
      return res.status(404).json({
        error: 'Quiz session not found or has expired. Please generate a new quiz.',
      });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        error: 'Please submit answers for questions 1, 2, and 3.',
      });
    }

    // Check for missing answers
    const missing: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const ans = answers[String(i)] || answers[i];
      if (!ans || !['A', 'B', 'C', 'D'].includes(String(ans).toUpperCase())) {
        missing.push(i);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Please select an answer for all three questions before submitting. Missing: Question ${missing.join(', ')}.`,
        missingQuestions: missing,
      });
    }

    let score = 0;
    const items = session.questions.map((q) => {
      const studentChoice = String(answers[String(q.number)] || answers[q.number]).toUpperCase() as 'A' | 'B' | 'C' | 'D';
      const isCorrect = studentChoice === q.correctOption;
      if (isCorrect) score += 1;

      return {
        number: q.number,
        question: q.question,
        studentOption: studentChoice,
        studentAnswerText: q.options[studentChoice] || '',
        isCorrect,
        correctOption: q.correctOption,
        correctAnswerText: q.options[q.correctOption] || '',
        explanation: q.explanation,
      };
    });

    let performanceMessage = '';
    if (score === 3) {
      performanceMessage = 'Outstanding! You answered all 3 questions correctly, demonstrating strong mastery of your study notes.';
    } else if (score === 2) {
      performanceMessage = 'Great work! You scored 2 out of 3. Review the note explanation below for the question you missed.';
    } else if (score === 1) {
      performanceMessage = 'Good effort! You scored 1 out of 3. Take a look at the explanations from your study notes to reinforce the missed concepts.';
    } else {
      performanceMessage = 'Keep practicing! You scored 0 out of 3. Carefully review the explanations grounded in your study notes to clarify these points.';
    }

    return res.json({
      score,
      total: 3,
      performanceMessage,
      items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown grading error';
    console.error('Quiz submission error:', err);
    return res.status(500).json({ error: message });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, port, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`StudyQuiz server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
