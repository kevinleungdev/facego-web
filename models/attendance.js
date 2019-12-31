const Sequelize = require('sequelize');

// sequelize实例
const sequelize = require('../db').getInstance();

// 定义AttendanceRecord Model
const AttendanceRecord = sequelize.define('attendance', {
    
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'RECORD_ID'
    },
    
    meetingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'MEETING_ID'
    },
    
    employeeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'EMPLOYEE_ID'
    },
    
    signTime: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'SIGN_TIME'
    }
}, {
    tableName: 'MG_ATTENDANCE_RECORD',
    underscored: true,
    timestamps: false
});

module.exports = AttendanceRecord;