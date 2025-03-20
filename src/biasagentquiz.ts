import { Agent, Plugin } from 'elizaos';

// Mock LLM plugin (replace with real plugin later)
const mockLLMPlugin: Plugin = {
  name: 'mockLLM',
  execute: async (input: string) => {
    if (input.toLowerCase().includes('biased')) return { response: 'Why do you think it’s biased?', score: 1 };
    if (input.toLowerCase().includes('trust')) return { response: 'What makes you trust that?', score: -1 };
    return { response: 'Tell me more.', score: 0 };
  },
};

export class BiasQuizAgent {
  private agent: Agent;
  private questions: string[] = [
    'What’s your opinion on fact-checking in news?',
    'Do you trust mainstream news outlets?',
    'How do you feel about government regulation of media?',
  ];
  private currentQuestion: number = 0;
  private score: number = 0;

  constructor() {
    this.agent = new Agent('BiasQuizAgent');
    this.agent.addPlugin(mockLLMPlugin);
  }

  async startQuiz(): Promise<string> {
    this.currentQuestion = 0;
    this.score = 0;
    return this.questions[this.currentQuestion];
  }

  async processResponse(userId: number, response: string): Promise<{ nextQuestion: string | null, score: number }> {
    const result = await this.agent.executePlugin('mockLLM', response) as { response: string, score: number };
    this.score += result.score;

    // Save response to DB
    await new Promise((resolve) => {
      const db = require('../db/database').default;
      db.run(
        'INSERT INTO quiz_responses (user_id, question, answer) VALUES (?, ?, ?)',
        [userId, this.questions[this.currentQuestion], response],
        resolve
      );
    });

    this.currentQuestion++;
    if (this.currentQuestion < this.questions.length) {
      return { nextQuestion: this.questions[this.currentQuestion], score: this.score };
    } else {
      return { nextQuestion: null, score: this.score };
    }
  }
}

export default BiasQuizAgent;
