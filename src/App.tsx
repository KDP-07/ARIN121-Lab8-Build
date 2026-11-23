import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  FileText,
  HelpCircle,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { SAMPLE_STUDY_NOTES, SampleTopic } from './sampleNotes';
import { StudentQuestion, QuizResult } from './types';

export default function App() {
  // Study notes input state
  const [studyNotes, setStudyNotes] = useState<string>('');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active quiz state
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<StudentQuestion[] | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [missingQuestions, setMissingQuestions] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Results state
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Collapsible view of original study notes while taking quiz or viewing results
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);

  // Refs for scrolling and focus
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quizSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // 1. Generate Quiz Handler
  const handleGenerateQuiz = async () => {
    setNotesError(null);
    setSubmissionError(null);
    setMissingQuestions([]);

    const trimmed = studyNotes.trim();
    if (!trimmed) {
      setNotesError('Please paste your study notes first before generating a quiz.');
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (trimmed.length < 20) {
      setNotesError('Your study notes appear too brief. Please provide a little more detail so 3 meaningful multiple-choice questions can be formed.');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quiz. Please try again.');
      }

      setQuizId(data.quizId);
      setQuestions(data.questions);
      setSelectedAnswers({});
      setQuizResult(null);

      // Scroll smoothly to quiz
      setTimeout(() => {
        quizSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while creating your quiz.';
      setNotesError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Option Selection
  const handleSelectOption = (questionNumber: number, optionLetter: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionNumber]: optionLetter,
    }));

    // If this question was flagged as missing, clear its flag
    if (missingQuestions.includes(questionNumber)) {
      const remainingMissing = missingQuestions.filter((q) => q !== questionNumber);
      setMissingQuestions(remainingMissing);
      if (remainingMissing.length === 0) {
        setSubmissionError(null);
      } else {
        setSubmissionError(`Please select an answer for all three questions before submitting (Missing: Question ${remainingMissing.join(', ')}).`);
      }
    }
  };

  // 2. Submit Answers Handler
  const handleSubmitAnswers = async () => {
    if (!quizId || !questions) return;

    // Check if student selected an answer for all three questions
    const missing: number[] = [];
    questions.forEach((q) => {
      if (!selectedAnswers[q.number]) {
        missing.push(q.number);
      }
    });

    if (missing.length > 0) {
      setMissingQuestions(missing);
      setSubmissionError(
        `Please select an answer for all three questions before submitting (Missing: Question ${missing.join(', ')}).`
      );
      // Scroll to the first missing question
      const firstMissingRef = questionRefs.current[missing[0]];
      if (firstMissingRef) {
        firstMissingRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmissionError(null);
    setMissingQuestions([]);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          answers: selectedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz.');
      }

      setQuizResult(data);
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit your answers.';
      setSubmissionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retake same quiz (clear student answers)
  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setSubmissionError(null);
    setMissingQuestions([]);
    setQuizResult(null);
    setTimeout(() => {
      quizSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Generate new quiz with same notes
  const handleGenerateNewFromSameNotes = () => {
    setQuizResult(null);
    setQuestions(null);
    setQuizId(null);
    handleGenerateQuiz();
  };

  // Edit notes
  const handleEditNotes = () => {
    setQuizResult(null);
    setQuestions(null);
    setQuizId(null);
    setSelectedAnswers({});
    setSubmissionError(null);
    setMissingQuestions([]);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Populate sample note
  const handleLoadSample = (sample: SampleTopic) => {
    setStudyNotes(sample.text);
    setNotesError(null);
  };

  // Calculate answered count
  const answeredCount = questions
    ? questions.filter((q) => selectedAnswers[q.number] !== undefined).length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Academic Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">StudyQuiz</h1>
              <p className="text-xs text-slate-500 font-medium">University Practice Quiz Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {studyNotes && (
              <button
                type="button"
                onClick={() => setShowNotesDrawer(!showNotesDrawer)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Toggle reference of pasted notes"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                <span>Reference Notes</span>
                {showNotesDrawer ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <span className="text-xs px-2.5 py-1 font-semibold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              3 Questions
            </span>
          </div>
        </div>
      </header>

      {/* Optional Collapsible Reference Bar for Pasted Notes */}
      {showNotesDrawer && studyNotes && (
        <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-3 sm:px-6 transition-all">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                Your Pasted Study Notes
              </span>
              <button
                type="button"
                onClick={() => setShowNotesDrawer(false)}
                className="text-xs text-amber-700 hover:text-amber-900 font-medium underline"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-amber-950 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto bg-white/70 p-2.5 rounded border border-amber-200/80 leading-relaxed">
              {studyNotes}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* SECTION 1: STUDY NOTES INPUT */}
        <section aria-labelledby="notes-heading" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 id="notes-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Step 1: Paste Your Study Notes
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Paste textbook sections, lecture notes, or revision summaries. We'll generate three multiple-choice questions strictly grounded in your material.
              </p>
            </div>
            {studyNotes && (
              <button
                type="button"
                onClick={() => setStudyNotes('')}
                className="self-start sm:self-auto text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
              >
                Clear text
              </button>
            )}
          </div>

          {/* Sample Note Presets */}
          <div className="mb-3.5">
            <span className="text-xs font-medium text-slate-500 mr-2">Quick sample topics:</span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
              {SAMPLE_STUDY_NOTES.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-700 font-medium transition-all"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Input Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={studyNotes}
              onChange={(e) => {
                setStudyNotes(e.target.value);
                if (notesError) setNotesError(null);
              }}
              placeholder="Paste your university lecture notes or study material here... (e.g., definitions, processes, theories, equations, or case studies)"
              rows={7}
              className={`w-full rounded-xl border p-4 text-sm sm:text-base leading-relaxed font-sans placeholder:text-slate-400 focus:outline-none transition-all ${
                notesError
                  ? 'border-red-500 ring-3 ring-red-100 bg-red-50/20 text-slate-900'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 bg-slate-50/40 focus:bg-white text-slate-900'
              }`}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                {studyNotes.trim() ? `${studyNotes.trim().split(/\s+/).length} words` : '0 words'}
              </span>
              <span>{studyNotes.length} characters</span>
            </div>
          </div>

          {/* Prompt / Error if Empty */}
          {notesError && (
            <div
              role="alert"
              className="mt-3.5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm animate-in fade-in duration-200"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Notes Required</p>
                <p className="text-red-700 text-xs sm:text-sm mt-0.5">{notesError}</p>
              </div>
            </div>
          )}

          {/* Generate Quiz Button */}
          <div className="mt-5 flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Strictly questions based on the supplied text
            </span>
            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={isGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-3 focus:ring-indigo-200"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating 3 Practice Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Generate Quiz</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Loading Skeleton Indicator */}
        {isGenerating && (
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Formulating Practice Quiz</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                Analyzing your study material to draft three multiple-choice questions with distinct options labeled A, B, C, and D.
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-2 pt-2">
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-full"></div>
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-4/5 mx-auto"></div>
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-3/5 mx-auto"></div>
            </div>
          </div>
        )}

        {/* SECTION 2: QUIZ DISPLAY SECTION */}
        {questions && questions.length > 0 && !quizResult && (
          <section
            ref={quizSectionRef}
            aria-labelledby="quiz-heading"
            className="space-y-6 animate-in fade-in duration-300"
          >
            {/* Quiz Banner & Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Practice Mode</span>
                <h2 id="quiz-heading" className="text-xl font-bold text-slate-900 mt-0.5">
                  Answer the Following 3 Questions
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Select your chosen answer for each question. Correct answers and explanations remain strictly hidden until submitted.
                </p>
              </div>

              {/* Answered Progress Tracker */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Progress</span>
                  <span className="text-xs font-bold text-slate-800">
                    {answeredCount} of 3 Answered
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-indigo-600/30 flex items-center justify-center font-bold text-xs text-indigo-700 bg-white">
                  {answeredCount}/3
                </div>
              </div>
            </div>

            {/* Missing Selections Alert */}
            {submissionError && (
              <div
                role="alert"
                className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3 text-amber-900 text-sm shadow-xs animate-shake"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950">Incomplete Submission</p>
                  <p className="text-amber-800 mt-0.5">{submissionError}</p>
                </div>
              </div>
            )}

            {/* The 3 Multiple Choice Questions */}
            <div className="space-y-6">
              {questions.map((q) => {
                const isSelected = selectedAnswers[q.number] !== undefined;
                const isMissing = missingQuestions.includes(q.number);
                const currentSelection = selectedAnswers[q.number];

                return (
                  <div
                    key={q.number}
                    ref={(el) => {
                      questionRefs.current[q.number] = el;
                    }}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                      isMissing
                        ? 'border-red-400 ring-2 ring-red-100 shadow-md'
                        : isSelected
                        ? 'border-indigo-200 shadow-xs'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {q.number}
                        </span>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Question {q.number} of 3
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Answered: ({currentSelection})
                        </span>
                      ) : isMissing ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          Selection Required
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Select one option
                        </span>
                      )}
                    </div>

                    {/* Question Prompt */}
                    <div className="p-6">
                      <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                        {q.question}
                      </p>

                      {/* 4 Radio-button Options labelled A, B, C, D */}
                      <div className="mt-5 space-y-3" role="radiogroup" aria-label={`Question ${q.number} options`}>
                        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                          const optionText = q.options[letter];
                          const checked = currentSelection === letter;
                          const inputId = `q-${q.number}-opt-${letter}`;

                          return (
                            <label
                              key={letter}
                              htmlFor={inputId}
                              className={`group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                                checked
                                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200/70 text-slate-900'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center h-6 shrink-0">
                                <input
                                  type="radio"
                                  id={inputId}
                                  name={`question-${q.number}`}
                                  value={letter}
                                  checked={checked}
                                  onChange={() => handleSelectOption(q.number, letter)}
                                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                />
                              </div>

                              <div className="flex-1 text-sm sm:text-base leading-relaxed">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs mr-2 transition-colors ${
                                    checked
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                                  }`}
                                >
                                  {letter}
                                </span>
                                <span className={checked ? 'font-medium text-slate-900' : 'text-slate-800'}>
                                  {optionText}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SECTION 3: SUBMIT ANSWERS BUTTON BENEATH QUESTIONS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Ready to evaluate?</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitting will grade your 3 answers against the study notes and reveal explanations for any missed concepts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmitAnswers}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-3 focus:ring-emerald-200 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Grading Submission...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answers</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* SECTION 4: RESULTS AREA (Appears ONLY after clicking Submit Answers) */}
        {quizResult && (
          <section
            ref={resultsSectionRef}
            aria-labelledby="results-heading"
            className="space-y-6 animate-in fade-in duration-300"
          >
            {/* Score & Evaluation Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Assessment Complete
                    </span>
                  </div>
                  <h2 id="results-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    Quiz Results
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-xl">
                    {quizResult.performanceMessage}
                  </p>
                </div>

                {/* Score Gauge Badge */}
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl self-start sm:self-auto shrink-0">
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-xs font-black ${
                      quizResult.score === 3
                        ? 'bg-emerald-600 text-white'
                        : quizResult.score === 2
                        ? 'bg-indigo-600 text-white'
                        : quizResult.score === 1
                        ? 'bg-amber-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    <span className="text-2xl leading-none">{quizResult.score}</span>
                    <span className="text-[10px] font-semibold opacity-90">OUT OF 3</span>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500 block">
                      Total Score
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-bold text-slate-900">
                        {Math.round((quizResult.score / quizResult.total) * 100)}%
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        ({quizResult.score}/{quizResult.total} Correct)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons to Retake or Start New */}
              <div className="pt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetakeQuiz}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>Retake This Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateNewFromSameNotes}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Generate New 3 Questions</span>
                </button>
                <button
                  type="button"
                  onClick={handleEditNotes}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Edit / Enter New Study Notes</span>
                </button>
              </div>
            </div>

            {/* Question Breakdown with Correct/Incorrect marks and Note Explanations */}
            <div className="space-y-5">
              <h3 className="text-base font-bold text-slate-800 px-1 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Detailed Question Breakdown
              </h3>

              {quizResult.items.map((item) => (
                <div
                  key={item.number}
                  className={`bg-white rounded-2xl border p-6 sm:p-7 shadow-sm transition-all ${
                    item.isCorrect
                      ? 'border-emerald-200/90 bg-emerald-50/10'
                      : 'border-red-200/90 bg-red-50/10'
                  }`}
                >
                  {/* Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                        {item.number}
                      </span>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Question {item.number}
                      </span>
                    </div>

                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Correct (+1)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Incorrect (0)
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <p className="text-base sm:text-lg font-semibold text-slate-900 mt-4 leading-snug">
                    {item.question}
                  </p>

                  {/* Student's Selected Answer */}
                  <div className="mt-4 p-3.5 rounded-xl border flex items-start gap-3 bg-white text-sm">
                    <div className="mt-0.5 shrink-0">
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                        Your Choice:
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        Option {item.studentOption}: {item.studentAnswerText}
                      </p>
                    </div>
                  </div>

                  {/* Correct Answer & Explanation for Incorrect Answers */}
                  {!item.isCorrect && (
                    <div className="mt-3.5 p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 text-sm">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        Correct Option:
                      </div>
                      <p className="font-bold text-emerald-950 mt-1 text-sm sm:text-base">
                        Option {item.correctOption}: {item.correctAnswerText}
                      </p>

                      <div className="mt-3 pt-3 border-t border-emerald-200/80">
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
                          Explanation from Study Notes:
                        </span>
                        <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-normal bg-white/70 p-3 rounded-lg border border-emerald-200">
                          {item.explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Explanation for Correct Answers (Reinforcement) */}
                  {item.isCorrect && item.explanation && (
                    <div className="mt-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs sm:text-sm text-slate-700">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                        Study Notes Reinforcement:
                      </span>
                      <p className="text-slate-800 leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Clean Academic Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Practice Quiz Assistant for University Students</span>
          </div>
          <span>Strictly grounded in user-supplied study material</span>
        </div>
      </footer>
    </div>
  );
}
