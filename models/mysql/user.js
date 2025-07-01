import db from '../adapters/mysql.js';

const User = {
  async findUserById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },
  async createUser(data) {
    const { email, password } = data;
    await db.execute('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
  }
};

export default User;
