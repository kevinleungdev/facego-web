const Sequelize = require('sequelize');

// sequelize实例
const sequelize = require('../db').getInstance();

// 员工基本信息表
const Employee = sequelize.define('employee', {

    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'EMPLOYEE_ID'
    },

    no: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'EMPLOYEE_NO'
    },

    firstname: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'FIRST_NAME'
    },

    lastname: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'LAST_NAME'
    },

    engName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'ENGLISH_NAME'
    },

    title: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'JOB_TITLE'
    },

    group: {
        type: Sequelize.STRING,
        allowNull: true
    },

    gender: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
        get() {
            const gender = this.getDataValue('gender');

            if (gender === 1) {
                return 'Male';
            }
            else if (gender == 2) {
                return 'Female';
            }
            else {
                return '';
            }
        }
    },
    
    email: {
        type: Sequelize.STRING,
        allowNull: true
    }
}, {
    tableName: 'MG_EMPLOYEE',
    underscored: true,
    getterMethods: {
        fullname() {
            return this.firstname + ' ' + this.lastname;
        }
    },
    setterMethods: {
        fullname(value) {
            const names = value.split(' ');
            
            this.setDataValue('firstname', names.slice(0, -1).join(' '));
            this.setDataValue('lastname', names.slice(-1).join(' '));
        }
    }
});

// 员工扩展信息表
const EmployeeInfo = sequelize.define('employee_info', {

    employeeId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        field: 'EMPLOYEE_ID'
    },

    avatar: {
        type: Sequelize.TEXT,
        allowNull: false
    },

    avatarThumbnail: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'AVATAR_THUMBNAIL'
    }
}, {
    tableName: 'MG_EMPLOYEE_INFO',
    underscored: true,
    timestamps: false
});

// 员工人脸特征表
const EmployeeReps = sequelize.define('employee_reps', {
    
    employeeId: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    
    faceReps: {
        type: Sequelize.BLOB,
        allowNull: false
    }
}, {
        tableName: 'MG_EMPLOYEE_REPS',
        underscored: true,
        timestamps: false
});

// Belongs-to relation, e.g. User.belongsTo(Company, {foreignKey: 'fk_companyname', targetKey: 'name'});
Employee.hasOne(EmployeeInfo, {foreignKey: 'employeeId', targetKey: 'id'});
EmployeeInfo.belongsTo(Employee, {foreignKey: 'employeeId', targetKey: 'id'});

exports.Employee = Employee;
exports.EmployeeInfo = EmployeeInfo;
exports.EmployeeReps = EmployeeReps;
