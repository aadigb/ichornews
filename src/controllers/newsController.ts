import axios from 'axios';
import { Request, Response } from 'express';
import db from '../db/database';

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
// Mock Grok API (replace with real calls later)
const mockGrokBiasAnalysis = (text: string): string => {
  if (text.toLowerCase().includes('government')) return 'left-leaning';
  if (text.toLowerCase().includes('corporate')) return 'right-leaning';
  return 'neutral';
};

export const getNews = async (req: Request, res: Response) => {
  try {
    const { category = 'general', biasScore } = req.query;
    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: { category, country: 'us', apiKey: NEWSAPI_KEY },
    });

    const articles = response.data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      bias: mockGrokBiasAnalysis(article.description || article.title),
    }));

    const filteredArticles = biasScore
      ? articles.filter((article: any) => {
          const score = parseInt(biasScore as string);
          if (score < -3) return article.bias === 'left-leaning';
          if (score > 3) return article.bias === 'right-leaning';
          return article.bias === 'neutral';
        })
      : articles;

    res.json(filteredArticles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

export const takeQuiz = async (req: Request, res: Response) => {
  const { username, response } = req.body;
  const BiasQuizAgent = require('../agents/biasQuizAgent').default;
  const quizAgent = new BiasQuizAgent();

  try {
    let userId: number;
    await new Promise((resolve) => {
      db.get('SELECT id FROM users WHERE username = ?', [username], (err, row: any) => {
        if (row) {
          userId = row.id;
          resolve(null);
        } else {
          db.run('INSERT INTO users (username, bias_score) VALUES (?, 0)', [username], function () {
            userId = this.lastID;
            resolve(null);
          });
        }
      });
    });

    if (!response) {
      const firstQuestion = await quizAgent.startQuiz();
      res.json({ question: firstQuestion });
    } else {
      const { nextQuestion, score } = await quizAgent.processResponse(userId!, response);
      if (!nextQuestion) {
        db.run('UPDATE users SET bias_score = ? WHERE id = ?', [score, userId]);
        res.json({ message: 'Quiz completed', biasScore: score });
      } else {
        res.json({ question: nextQuestion });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Quiz error' });
  }
};
