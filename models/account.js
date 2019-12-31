const Sequelize = require('sequelize');

// sequelize实例
const sequelize = require('../db').getInstance();

// 定义Account Model
const Account = sequelize.define('account', {

    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'ACCOUNT_ID'
    },

    name: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'ACCOUNT_NAME'
    },

    password: {
        type: Sequelize.STRING,
        allowNull: false
    },

    role: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2
    },

    employeeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'EMPLOYEE_ID'
    }
}, {
    tableName: 'MG_ACCOUNT',
    underscored: true
});

// 密码验证
Account.prototype.validatePassword = function(password) {
    var bcrypt = require('bcryptjs');
    return bcrypt.compareSync(password, this.password);
};

module.exports = Account;