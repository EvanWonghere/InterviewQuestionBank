const QUESTIONS_URL = `${import.meta.env.BASE_URL}questions.json`;

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {number} order
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} categoryId
 * @property {string} title
 * @property {string} question
 * @property {string} answer
 * @property {string[]} [tags]
 * @property {'easy'|'medium'|'hard'} [difficulty]
 * @property {number} [order]
 */

/**
 * @typedef {Object} QuestionsData
 * @property {string} version
 * @property {Category[]} categories
 * @property {Question[]} questions
 */

/**
 * Load and parse questions.json. Fetches from public path.
 * @returns {Promise<QuestionsData>}
 */
export async function loadQuestions() {
  const res = await fetch(QUESTIONS_URL);
  if (!res.ok) throw new Error(`Failed to load questions: ${res.status}`);
  const data = await res.json();
  if (!data.categories?.length || !data.questions?.length) {
    throw new Error('Invalid questions data: missing categories or questions');
  }
  return data;
}
