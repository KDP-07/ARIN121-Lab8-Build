export interface QuestionOptionMap {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface StudentQuestion {
  number: number;
  question: string;
  options: QuestionOptionMap;
}

export interface GradedItem {
  number: number;
  question: string;
  studentOption: 'A' | 'B' | 'C' | 'D';
  studentAnswerText: string;
  isCorrect: boolean;
  correctOption: 'A' | 'B' | 'C' | 'D';
  correctAnswerText: string;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  performanceMessage: string;
  items: GradedItem[];
}
