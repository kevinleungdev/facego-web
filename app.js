var express = require('express');
var bodyParser = require('body-parser');
var os = require('os');
var http = require('http');
var https = require('https');
var fs = require('fs');
var config = require('./config.json');

var app = new express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false, limit: '50mb'}));

// parse application/json
app.use(bodyParser.json({limit: '50mb'}));

// 注册静态资源处理的中间件
app.use(express.static(__dirname + '/public'));

// 设置模板视图的目录
app.set('views', __dirname + '/views');
// 启动视图编译缓存
app.set('view cache', true);
// 设置模板引擎
app.set('view engine', 'ejs');

// session中间件
var session = require('express-session');
var FileStore = require('session-file-store')(session);

app.use(session({
    name: 'megokey',
    secret: 'mego!@#',           // 用来对session id相关的cookie进行签名
    store: new FileStore(),      // 本地存储session（文本文件，也可以选择其他store，比如redis的）
    saveUninitialized: false,    // 是否自动保存未初始化的会话，建议false
    resave: false,               // 是否每次都重新保存会话，建议false
    cookie: {
        maxAge: 1800 * 1000      // 有效期30分钟，单位是ms
    }
}));

// 注册路由中间件
var indexRouter = require('./routes/index');
app.use(indexRouter);

var adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

// 处理404
app.use(function(req, res) {
    res.status(404);
    res.render('404');
});

// 处理500
app.use(function(error, req, res) {
    res.status(500);
    res.render('500');
});

var httpServer = http.createServer(app);
httpServer.listen(config.web.port, function() {
    console.log('HTTP Server is running on: http://mego.hitachiconsulting.net');
});

if (config.useSSL) {
    var privateKey = fs.readFileSync(config.ssl_key);
    var certificate = fs.readFileSync(config.ssl_certificate);
    var credentials = {key: privateKey, cert: certificate};

    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(config.web.ssl_port, function() {
        console.log('HTTPS Server is running on: https://mego.hitachiconsulting.net');
    });
}