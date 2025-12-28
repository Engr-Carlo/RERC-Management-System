const AuditLog = require('../models/AuditLog');

class AuditService {
  static async logUpdate(user, application, fieldName, oldValue, newValue) {
    try {
      await AuditLog.create({
        user_id: user.id,
        username: user.username,
        action: 'UPDATE',
        application_row: application.rowIndex,
        application_title: application['APPROVED RESEARCH TITLE'] || 'N/A',
        field_name: fieldName,
        old_value: oldValue || '',
        new_value: newValue || ''
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  static async logView(user, application) {
    try {
      await AuditLog.create({
        user_id: user.id,
        username: user.username,
        action: 'VIEW',
        application_row: application.rowIndex,
        application_title: application['APPROVED RESEARCH TITLE'] || 'N/A',
        field_name: null,
        old_value: null,
        new_value: null
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  static async getApplicationHistory(applicationRow) {
    try {
      return await AuditLog.getByApplicationRow(applicationRow);
    } catch (error) {
      console.error('Error fetching application history:', error);
      throw error;
    }
  }

  static async getAllLogs(limit = 100) {
    try {
      return await AuditLog.getAll(limit);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
}

module.exports = AuditService;
