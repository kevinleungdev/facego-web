var express = require('express');
var router = express.Router();

var config = require('../config.json');

router.get('/', function(req, res) {
    var today = new Date();
    res.render('index', {'today': today.toDateString() });
});

// 当天的会议列表
router.get('/meeting/list', function(req, res) {
    var Sequelize = require('sequelize');
    const Op = Sequelize.Op;

    var today = new Date(),
        datestr = [today.getFullYear(), today.getMonth() + 1, today.getDate()].join('/');
    
    var from = new Date(Date.parse(datestr + ' 00:00:00')),
        to = new Date(Date.parse(datestr + ' 23:59:59'));
    
    var Booking = require('../models/booking').Booking;
    var Room = require('../models/booking').Room;

    Booking.findAll({
        include: [{
            model: Room
        }],
        where: {
            [Op.and]: [
                { startTime: { [Op.gt]: from } },
                { startTime: { [Op.lt]: to } }
            ]
        },
        order: ['startTime']
    }).then(records => {
        ret = [];

        if (records) {
            records.forEach(function(rec) {
                ret.push({
                    comment: rec.comment,
                    date: rec.dayOfWeek,
                    from: rec.from,
                    to: rec.to,
                    id: rec.id,
                    room: rec.room.name
                });
            }, this);
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(ret));
    });
});

// 进入到会议的主界面
router.get('/cameo/:meetingId', function(req, res) {
    res.render('cameo', { 
        meetingId: req.params.meetingId,
        wsUrl: config.face.websocket_url,
        title: req.query.title
    });
});

// 获取用户的头像
router.get('/cameo/avatar/:id', function(req, res) {
    var employee = require('../models/employee').EmployeeInfo;

    employee.findById(req.params.id, { attributes: ['avatar'] })
        .then(employee => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ img: employee.avatar }));
        });
});

// 获取已经签到的会议参与人员的列表
router.get('/attendants/:meetingId', function(req, res) {
    var db = require('../db').getInstance();
    var sql = "select a.EMPLOYEE_ID as id, concat(b.FIRST_NAME, ' ', b.LAST_NAME) as name, date_format(a.SIGN_TIME, '%H:%i') as sign_time, c.AVATAR as avatar from MG_ATTENDANCE_RECORD a \
                    inner join MG_EMPLOYEE b on a.EMPLOYEE_ID = b.EMPLOYEE_ID \
                    inner join MG_EMPLOYEE_INFO c on a.EMPLOYEE_ID = c.EMPLOYEE_ID \
                    where a.MEETING_ID = :meeting_id";
    
    db.query(sql, { 
        replacements:{ meeting_id: req.params.meetingId }, 
        type: db.QueryTypes.SELECT 
    })
    .then(rows => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rows));
    })
    .catch(err => {
        console.log(err);
    });
});

// 保存员工签到记录
router.post('/attendants/add', function(req, res) {
    var AttendanceRecord = require('../models/attendance');
    var singingTime = new Date();
    
    AttendanceRecord.create({
        employeeId: req.body.employeeId,
        meetingId: req.body.meetingId,
        signTime: singingTime
    })
    .then(record => {
        res.writeHead(200, { 'Content-Type': 'text/plain'});
        res.end();
    })
    .catch(err => {
        console.log(err);
    });
});

// 语音合成的引擎
var fs = require('fs');
var speechClient = require('../speech').speechClient;

// 语音合成的音频文件的存放路径及URL地址
var audio_output_dir = config.audio.output_dir;
var audio_url_prefix = config.audio.url;

// 语音合成
router.get('/tts/:text', function(req, res) {
    var text = req.params.text;

    if (text && text !== '') {
        speechClient.text2audio(text).then(function(result) {
            if (!result.err_no) {
                var filename = Date.now() + ".mp3";

                // 把data数据写入到文件
                fs.writeFileSync(audio_output_dir + "/" + filename, result.data);

                // 返回MP3文件的路径到客户端
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ err_no: 0, audio_url: audio_url_prefix + "/" + filename }));
            }
            else {
                console.log("failed! error_no: %d, error_message: %s", result.err_no, result.err_msg);

                // 返回语音引擎的错误码
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ err_no: result.err_no, err_msg: result.err_msg }));
            }
        });
    }
    else {
        console.log('text is null');

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ err_no: -1, err_msg: "text is null" }));
    }
});

module.exports = router;