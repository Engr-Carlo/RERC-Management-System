const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(username, password, role = 'reviewer') {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, role });
        }
      );
    });
  }

  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, role, created_at FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, username, role, created_at FROM users',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, userId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static delete(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM users WHERE id = ?',
        [userId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }
}

module.exports = User;
