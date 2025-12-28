const db = require('../config/database');

class AuditLog {
  static create(logData) {
    const {
      user_id,
      username,
      action,
      application_row,
      application_title,
      field_name,
      old_value,
      new_value
    } = logData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO audit_logs 
        (user_id, username, action, application_row, application_title, field_name, old_value, new_value) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, username, action, application_row, application_title, field_name, old_value, new_value],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  static getAll(limit = 100) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getByApplicationRow(applicationRow) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM audit_logs WHERE application_row = ? ORDER BY timestamp DESC',
        [applicationRow],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getByUser(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM audit_logs WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
        [startDate, endDate],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = AuditLog;
