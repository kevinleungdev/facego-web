const Sequelize = require('sequelize');

// sequelize实例
const sequelize = require('../db').getInstance();

// 员工基本信息表
const Booking = sequelize.define('booking', {
    
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'SCHEDULE_ID'
        },
    
        roomId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'ROOM_ID'
        },
    
        booker: {
            type: Sequelize.STRING,
            allowNull: true
        },
    
        startTime: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'START_TIME'
        },
    
        endTime: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'END_TIME'
        },
    
        cancled: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
    
        comment: {
            type: Sequelize.STRING,
            allowNull: false
        },
        
        attendants: {
            type: Sequelize.STRING,
            allowNull: false
        },

        emailBeforeSend: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'EMAIL_BEFORE_SEND'
        },

        emailBeforeRemind: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'EMAIL_BEFORE_REMIND'
        }
    }, 
    {
        tableName: 'MG_MEETING_SCHEDULE',
        underscored: true,
        timestamps: false,
        getterMethods: {
            dayOfWeek() {
                let day = '';

                if (this.startTime) {
                    switch(this.startTime.getDay()) {
                        case 0:
                            day = 'Sun';
                            break;
                        case 1:
                            day = 'Monday';
                            break;
                        case 2:
                            day = 'Tuesday';
                            break;
                        case 3:
                            day = 'Wednesday';
                            break;
                        case 4:
                            day = 'Thursday';
                            break;
                        case 5:
                            day = 'Friday';
                            break;
                        case 6:
                            day = 'Saturday';
                            break;
                        default:
                            break;
                    }
                }
                
                return day;
            },

            from() {
                if (this.startTime) {
                    var hours = this.startTime.getHours(),
                        minutes = this.startTime.getMinutes();

                    return (hours > 9 ? hours : ('0' + hours)) + ':' + (minutes > 9 ? minutes : ('0' + minutes));
                }
                else {
                    return '';
                }
            },

            to() {
                if (this.endTime) {
                    var hours = this.endTime.getHours(),
                        minutes = this.endTime.getMinutes();

                        return (hours > 9 ? hours : ('0' + hours)) + ':' + (minutes > 9 ? minutes : ('0' + minutes));
                }
                else {
                    return '';
                }
            },

            startDate() {
                if (this.startTime) {
                    return [this.startTime.getFullYear(), this.startTime.getMonth() + 1, this.startTime.getDate()].join('/');
                }
                else {
                    return '';
                }
            }
        }
    }
);

// 定义Room Model
const Room = sequelize.define('room', {
    
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'ROOM_ID'
    },
    
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'ROOM_NAME'
    },
    
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    
    phone: {
        type: Sequelize.STRING,
        allowNull: true
    },
    
    ipPhone: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'IP_PHONE'
    },
    
    location: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'WORK_LOCATION'
    }
}, {
    tableName: 'MG_ROOM',
    underscored: true,
    timestamps: false
});

Room.hasMany(Booking, {foreignKey: 'roomId', sourceKey: 'id'});
Booking.belongsTo(Room, {foreignKey: 'roomId', sourceKey: 'id'});

exports.Booking = Booking;
exports.Room = Room;