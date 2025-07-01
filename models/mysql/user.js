import db from '../adapters/mysql.js';

export async function findUserById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
}

export async function createUser(userData) {
  const { name, email } = userData;
  const [result] = await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
  return { id: result.insertId, name, email };
}
