var express = require('express');
var router = express.Router();
var config = require('../config.json');

// 用户登录
router.route('/login')
    .get(function(req, res) {
        res.render('admin/login');
    })
    .post(function(req, res) {
        const Account = require('../models/account');

        var account = req.body.account;
        var password = req.body.password;

        // 查找账号
        Account.findOne({where: {name: account}})
               .then(obj => {
                    if (!obj) {
                        res.render('admin/login', {errors: 'Account does not exist'});
                    }
                    else if (!obj.validatePassword(password)) {
                        res.render('admin/login', {errors: 'Password is wrong'});
                    }
                    else {
                        req.session.regenerate(function(err) {
                            if (err) {
                                throw err;
                            }

                            // 保存到session中
                            req.session.loginUser = obj.name;

                            // 登录成功后跳转到员工管理的页面
                            res.redirect(301, 'employee');
                        })
                    }
               })
               .catch(err => {
                    console.log('error: %s', err);

                    res.status(500);
                    res.render('500');
               });
    });

// employee管理
router.get('/employee', function(req, res) {
    var Employee = require('../models/employee').Employee;

    Employee.findAll().then(employees => {
        res.render('admin/employee', {
            user: req.session.loginUser,
            employees: employees
        });
    });
});

router.route('/employee/add').get(function(req, res) {
    res.render('admin/employee_editor', {
        user: req.session.loginUser, 
        create: true,
        form_url: config.employee.new_url
    });
});

router.route('/employee/update/:id')
        .get(function(req, res) {
            var Employee = require('../models/employee').Employee;
            var EmployeeInfo = require('../models/employee').EmployeeInfo;
    
            Employee.findOne({
                where: { id: req.params.id },
                include: [{
                    model: EmployeeInfo
                }]
            }).then(employee => {
                res.render('admin/employee_update', {
                    user: req.session.loginUser,
                    employee: employee,
                    change_avatar_url: config.employee.change_avatar_url
                });
            });
        })
        .post(function(req, res) {
            var Employee = require('../models/employee').Employee;

            Employee.findById(req.params.id).then(employee => {
                employee.firstname = req.body.firstname;
                employee.lastname = req.body.lastname;
                employee.engName = req.body.engname;
                employee.title = req.body.title;
                employee.group = req.body.group;
                employee.gender = req.body.gender;
                employee.email = req.body.email;

                employee.save()                
                    .then(() => {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({'errno': 0}));
                    })
                    .catch(err => {
                        throw err;
                    });
            })
            .catch(err => {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({'errno': 100, 'message': 'Database operation error'}));
    
                console.log(err);
            });
        });

// 会议预订记录列表
router.route('/booking/history').get(function(req, res) {
    var Booking = require('../models/booking').Booking;
    var Room = require('../models/booking').Room;

    Booking.findAll({
        include: [{
            model: Room
        }],
        order: [
            ['startTime', 'DESC']
        ]
    }).then(records => {
        res.render('admin/booking_history', {
            user: req.session.loginUser,
            records: records
        });
    });
});

router.route('/booking/add')
    .get(function(req, res) {
        res.render('admin/booking_room', {
            user: req.session.loginUser,
            booking_id: -1
        });
    })
    .post(function(req, res) {
        var Booking = require('../models/booking').Booking;

        var startTime = Date.parse(req.body.date + ' ' + req.body.from),
            endTime = Date.parse(req.body.date + ' ' + req.body.to),
            attendants = typeof req.body.attandants === 'string' ? req.body.attandants : req.body.attandants.join(',');
        
        Booking.create({
            startTime: startTime,
            endTime: endTime,
            roomId: req.body.room,
            booker: req.session.loginUser,
            comment: req.body.comment,
            attendants: attendants
        })
        .then(booking => {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({'errno': 0}));
        })
        .catch(err => {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({'errno': 100, 'message': 'Database operation error'}));

            console.log(err);
        });
    });

router.route('/booking/update/:id')
    .get(function(req, res) {
        res.render('admin/booking_room', {
            user: req.session.loginUser,
            booking_id: req.params.id
        });
    })
    .post(function(req, res) {
        var Booking = require('../models/booking').Booking,
            id = parseInt(req.params.id),
            startTime = Date.parse(req.body.date + ' ' + req.body.from),
            endTime = Date.parse(req.body.date + ' ' + req.body.to);
        
        Booking.findById(id).then(booking => {
            booking.startTime = startTime;
            booking.endTime = endTime;
            booking.roomId = req.body.room;
            booking.comment = req.body.comment;
            booking.attendants = typeof req.body.attandants === 'string' ? req.body.attandants : req.body.attandants.join(',');

            booking.save()
                .then(() => {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({'errno': 0}));
                })
                .catch(err => {
                    throw err;
                });
        })
        .catch(err => {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({'errno': 100, 'message': 'Database operation error'}));

            console.log(err);
        });
    });

router.get('/booking/:id', function(req, res) {
    var Booking = require('../models/booking').Booking,
        id = parseInt(req.params.id);

    Booking.findById(id).then(booking => {
        res.writeHead(200, {'Content-Type': 'applicaiton/json'});

        if (booking) {
            res.end(JSON.stringify({
                attendants: booking.attendants,
                room: booking.roomId,
                date: booking.startDate,
                from: booking.from,
                to: booking.to,
                comment: booking.comment
            }));
        }
        else {
            res.end();
        }

    });
});

// 会议室列表
router.get('/room/list', function(req, res) {
    var Room = require('../models/booking').Room;

    Room.findAll({ attributes: ['id', 'name'] }).then(records => {
        rooms = [];

        if (records.length !== 0) {
            records.forEach(record => {
                rooms.push(record.get({plain: true}))
            });
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(rooms));
    });
});

// 员工列表
router.get('/employee/list', function(req, res) {
    var Employee = require('../models/employee').Employee;
    
    Employee.findAll({ attributes: ['id', 'firstname', 'lastname', 'engName'] }).then(records => {
        employees = [];
        
        if (records.length !== 0) {
            records.forEach(record => {
                employees.push(record.get({plain: true}))
            });
        }
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(employees));
    });
});

// 会议出勤记录
router.get('/attendance/main', function(req, res) {
    res.render('admin/attendance_records', {
        user: req.session.loginUser
    });
});

router.get('/attendance/list', function(req, res) {
    var start = parseInt(req.query.start || 0);
    var pageSize = parseInt(req.query.length);

    var countSql = "select count(*) as total from MG_ATTENDANCE_RECORD";
    var sql = "select d.ROOM_NAME as room, b.COMMENT as meeting_name, concat(c.FIRST_NAME, ' ', c.LAST_NAME) as employee, date_format(a.SIGN_TIME, '%Y/%m/%d %H:%i') as signing_time \
                 from MG_ATTENDANCE_RECORD a \
	             left outer join MG_MEETING_SCHEDULE b on a.MEETING_ID = b.SCHEDULE_ID \
	             left outer join MG_EMPLOYEE c on a.EMPLOYEE_ID = c.EMPLOYEE_ID \
                 left outer join MG_ROOM d on b.ROOM_ID = d.ROOM_ID limit :offset, :size";

    var db = require('../db').getInstance();

    db.query(countSql, { type: db.QueryTypes.SELECT })
      .then(result => {
        db.query(sql, { 
            replacements:{ offset: start, size: pageSize }, 
            type: db.QueryTypes.SELECT 
        })
        .then(rows => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: rows, recordsTotal: result[0].total, recordsFiltered: result[0].total }));
        });
      });
});

// 用户注销
router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            throw err;
        }
        else {
            res.clearCookie('megokey');
            res.render('admin/login', {errors: 'Please sign in again'});
        }
    });
});

// router.all('*', function(req, res, next) {
//     if (req.url.startsWith('/login')) {
//         next();
//     }
//     else {
//         if (req.session && req.session.loginUser) {
//             res.render('admin/main', {user: req.session.loginUser});
//         }
//         else {
//             res.render('admin/login', {errors: 'Please sign in first'});
//         }
//     }
// });

module.exports = router;