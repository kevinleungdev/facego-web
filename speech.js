var config = require('./config.json');
var AipSpeechClient = require("./duai").speech;

// 初始化百度语音引擎的客户端
var APP_ID = config.baidu.app_id;
var APP_KEY = config.baidu.api_key;
var SECRET_KEY = config.baidu.secret_key;

var speechClient = new AipSpeechClient(APP_ID, APP_KEY, SECRET_KEY);

exports.speechClient = speechClient;