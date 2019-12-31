(function () {
    'use strict';

    var UNKOWN_PERSON = 'Unknown';

    var ZOOM_OUT_FACTOR = 1.0;
    var ZOOM_IN_FACTOR = 1/ZOOM_OUT_FACTOR;

    // 已检测到的参与者
    var attandants_expected = [];
    var attandants_unmatch = [];

    // 已检测到的参与者的ID
    var attandants_id = [];

    // 是否在处理Frame
    var processingFrame = false;

    // 相似度的阈值
    var tolerance = 0.10;

    var Cameo = function(id, ws_url, ids) {
        var self = this;

        // 添加到参与人员的列表中
        if (ids && ids.length > 0) {
            for (var i = 0; i < ids.length; i++) {
                attandants_id.push(ids[i]);
            }
        }
        
        // 初始化camera管理器
        var cameraManager = new CameraManager('camera');
        // 初始化session管理器
        var sessionManager = new WebSocketSessionManager(id, ws_url);

        // canvas的宽和高
        var canvasWidth = cameraManager.getCanvasSize().width;
        var canvasHeight = cameraManager.getCanvasSize().height;

        // 发送到服务器的图片缩小为原来的1/4，加快图片的传输和处理的速度
        var smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.floor(canvasWidth * ZOOM_OUT_FACTOR);
        smallCanvas.height = Math.floor(canvasHeight * ZOOM_OUT_FACTOR);

        var smallContext = smallCanvas.getContext('2d');

        // 服务器已处理帧的回调函数
        var onframeCallback = function(frame, canvas, videoSize) {
            var ctx = canvas.getContext('2d');

            // 清除所有的rect
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // 将视频流的图像插入到画布中
            ctx.drawImage(frame, 0, 0, videoSize.width, videoSize.height, 0, 0, canvasWidth, canvasHeight);
            
            // 考虑到流畅性，每隔一帧进行人脸识别的处理
            if (processingFrame == false) {
                processingFrame = true;

                smallContext.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
                // 发送到后台处理
                sessionManager.processFrame(smallCanvas.toDataURL('image/jpeg'));
            }

            // 对识别出来的人脸进行画框线图定位
            // 非常重要，如果不加上这句，clearRect()不起作用
            ctx.beginPath();    

            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';
            
            for (var i = 0, len = attandants_expected.length; i < len; i++) {
                var p = attandants_expected[i];

                var location = p.face_location,
                    x = Math.floor(location[0] * ZOOM_IN_FACTOR),
                    y = Math.floor(location[1] * ZOOM_IN_FACTOR),
                    w = Math.floor((location[2] - location[0]) * ZOOM_IN_FACTOR),
                    h = Math.floor((location[3] - location[1]) * ZOOM_IN_FACTOR);

                ctx.rect(x, y, w, h);

                var nh = 35;
                var fontStyle = '20px Consolas';

                if (w >= 150 && w < 200) {
                    nh = 32;
                    fontStyle = '18px Consolas';
                }
                else if (w >= 100 && w < 150) {
                    nh = 29;
                    fontStyle = '16px Consolas';
                }
                else if (w >= 50 && w < 100) {
                    nh = 26;
                    fontStyle = '14px Consolas';
                }
                else if (w < 50) {
                    nh = 23;
                    fontStyle = '12px Consolas';
                }

                // fill rect
                ctx.fillStyle = 'red';

                var ny = (y + h) - nh;
                ctx.fillRect(x, ny, w, nh);
                
                ctx.stroke();

                // draw text
                var text = p.name || 'No Name';

                ctx.fillStyle = 'white';
                ctx.font = fontStyle;

                ctx.fillText(text, x + 6, ny + 24);
            }

            ctx.strokeStyle = '#99ffcc';
            for (var i = 0, len = attandants_unmatch.length; i < len; i++) {
                var p = attandants_unmatch[i];

                var location = p.face_location,
                    x = Math.floor(location[0] * ZOOM_IN_FACTOR),
                    y = Math.floor(location[1] * ZOOM_IN_FACTOR),
                    w = Math.floor((location[2] - location[0]) * ZOOM_IN_FACTOR),
                    h = Math.floor((location[3] - location[1]) * ZOOM_IN_FACTOR);

                ctx.rect(x, y, w, h);
                ctx.stroke();
            }

            ctx.restore();
        };
        cameraManager.onframe = onframeCallback;
        
        self.addDetectedCallback = function(callback) {
            sessionManager.addDetectedCallback(callback);
        };

        self.closeWebSocketSession = function() {
            sessionManager.close();
        };

        self.setWebsocketStateListener = function(listener) {
            sessionManager.setSocketStateListener(listener);
        };

        self.setTolerance = function(val) {
            var target = parseFloat(val);

            if (isNaN(target)) {
                console.log('%s is NaN', val);
                return;
            }
            else if (target < 0 || target > 1) {
                console.log('Invalid tolerance value: ' + target);
            }
            else {
                tolerance = target;
                console.log('Now tolerance is ' + tolerance);
            }
        };

        self.getTolerance = function() {
            return tolerance;
        };

        self.setScaleFactor = function(val) {
            var factor = parseFloat(val);

            if (isNaN(factor)) {
                console.log('%s is NaN', val);
                return;
            }
            else if (factor != ZOOM_OUT_FACTOR) {
                ZOOM_OUT_FACTOR = factor;
                ZOOM_IN_FACTOR = 1 / ZOOM_OUT_FACTOR;

                smallCanvas.width = Math.floor(canvasWidth * ZOOM_OUT_FACTOR);
                smallCanvas.height = Math.floor(canvasHeight * ZOOM_OUT_FACTOR);
            }

            console.log('Now scale factor is ' + ZOOM_OUT_FACTOR);
        };

        self.getScaleFactor = function() {
            return ZOOM_OUT_FACTOR;
        };

        self.addAttendance = function(id) {
            if (!id) return;

            if (attandants_id.indexOf(id) != -1) {
                console.log('attendance id %s exists!', id);
            }
            else {
                attandants_id.push(id);
            }
        };

        // 语音合成管理器
        var ttsManager = new TTSManager();

        self.getTTSManager = function() {
            return ttsManager;
        };
    };

    var CameraManager = function(ele) {
        // camera获取视频流，并通过canvas进行人脸检测，识别，并且显示
        // video永远不显示
        var self = this;
        var debug = false;
        var gUM = (navigator.getUserMedia || 
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia || null);

        if (location.hash == '#videodebug') debug = true;

        var root = document.getElementById(ele);

        var cameraRoot;
        var sourceManager;

        if (gUM == null) {
            cameraRoot = root.querySelector('.camera-fallback');
        } else {
            cameraRoot = root.querySelector('.camera-realtime');
            sourceManager = new WebCamManager(root);
        }
        
        if (debug) root.classList.add('debug');

        cameraRoot.classList.remove('hidden');

        // Browser不支持Webcam，立即返回
        if (sourceManager == null) return;

        var cameraCanvas = root.querySelector('.camera-display');

        var videoWidth = 0;
        var videoHeight = 0;
        var canvasWidth = cameraCanvas.width;
        var canvasHeight = cameraCanvas.height;

        // 当视频的数据准备完成后时的回调函数
        sourceManager.onframeready = function(frameData) {
            // 获取camera的分辨率，如：640x480(px)
            if (videoWidth == 0 || videoHeight == 0) {
                videoWidth = sourceManager.getDimensions().width;
                videoHeight = sourceManager.getDimensions().height;
            }

            if (self.onframe) self.onframe(frameData, cameraCanvas, {'width': videoWidth, 'height': videoHeight});
        };

        this.getCanvasSize = function() {
            return {
                width: canvasWidth,
                height: canvasHeight
            };
        };
    };

    // webcam的抽象
    var WebCamManager = function(root) {
        var cameraFallback = document.getElementById('camera-fallback');

        // 切换视频输入设备的开关
        var cameraToggle = root.querySelector('.camera-toggle');
        var cameraToggleInput = root.querySelector('.camera-toggle-input');
        
        var cameraVideo = root.querySelector('.camera-video');

        // 视频的大小
        var videoRect = cameraVideo.getBoundingClientRect();

        var source = new CameraSource(cameraVideo);
        
        this.getDimensions = function() {
            return source.getDimensions();
        };
        
        // 获取所有的视频输入设备
        source.getCameras(function(cameras) {
            if (cameras.length == 0) {
                cameraFallback.classList.remove('hidden');
                return;
            }

            if(cameras.length == 1) {
                cameraToggle.style.display="none";
            }
            // 使用缺省的视频输入设备
            source.setCamera(0);
        });
        
        source.onframeready = function(imageData) {
            this.onframeready(imageData);
        }.bind(this);

        
        cameraToggleInput.addEventListener('change', function(e) {
            // toggle
            cameraToggle.querySelectorAll('img').forEach(function(img) {
                if (img.style.display == 'none') {
                    img.style.display = 'inline-block';
                }
                else {
                    img.style.display = 'none';
                }
            });

            // this is the input element, not the control
            var cameraIdx = 0;
  
            if(e.target.checked === true) {
                cameraIdx = 1;
            }
            source.stop();
            source.setCamera(cameraIdx);
        });

        document.addEventListener('visibilitychange', function(e) {
            if(document.visibilityState === 'hidden') {
                source.stop();
            }
            else {
                var cameraIdx = 0;
  
                if(this.checked === true) {
                    cameraIdx = 1;
                }
                // 主要在这里设置视频输入设备和回调函数
                source.setCamera(cameraIdx);
            }
        });
    };

    // 视频的输入设备的抽象，比如：相机、屏幕共享等
    var CameraSource = function(videoEle) {
        var stream;
        var animationFrameId;
        var cameras = [];
        var self = this;

        // 该方法提醒用户需要使用音频（0或者1）和（0或者1）视频输入设备
        var gUM = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia || null);

        // 暂停视频的输入
        this.stop = function() {
            if (stream) {
                stream.getTracks().forEach(function(t) { t.stop(); });
            }
        };

        // 获取视频元素的大小
        this.getDimensions = function() {
            return {
                width: videoEle.videoWidth,
                height: videoEle.videoHeight,
                shouldLayout: true
            }
        };

        this.getCameras = function(cb) {
            cb = cb || function() {};

            if ('enumerateDevices' in navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices()
                  .then(function(sources) {
                    // 过滤所有的非视频输入设备  
                    return sources.filter(function(source) {
                        return source.kind == 'videoinput'
                    });
                  })
                  .then(function(sources) {
                    sources.forEach(function(source) {
                      // 过滤所有背面的Camera
                      if(source.label.indexOf('facing back') >= 0) {
                        cameras.unshift(source);
                      }
                      else {
                        cameras.push(source);
                      }
                    });
        
                    cb(cameras);
                    return cameras;
                  })
                  .catch(error => {
                    console.error("Enumeration Error", error); 
                  });
            }
            else if('getSources' in MediaStreamTrack) {
                MediaStreamTrack.getSources(function(sources) {
        
                    for(var i = 0; i < sources.length; i++) {
                        var source = sources[i];
                        if(source.kind === 'video') {
                            if(source.facing === 'environment') {
                                cameras.unshift(source);
                            }
                            else {
                                cameras.push(source);
                            }
                        }
                    }
                    cb(cameras);
                });
            }
            else {
                cb(cameras);
            }
        };

        this.setCamera = function(idx) {
            var params;
            var videoSource = cameras[idx];
            
            // 取消正在处理的frame
            cancelAnimationFrame(animationFrameId);
      
            if(videoSource === undefined && cameras.length == 0) {
              params = { video: true, audio: false };
            }
            else {
              params = { video: { deviceId: { exact: videoSource.deviceId || videoSource.id } }, audio: false };
            }
      
            // navigator.getUserMedia ( constraints, successCallback, errorCallback ), 
            // constraints请参考：https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/getUserMedia
            gUM.call(navigator, params, function(cameraStream) {
                // 获取视频流
                stream = cameraStream;
      
                // 数据加载完成后
                videoEle.addEventListener('loadeddata', function(e) {
                    // 处理每一frame
                    var onframe = function() {
                        if(videoEle.videoWidth > 0) self.onframeready(videoEle);
                        animationFrameId = requestAnimationFrame(onframe);
                    };
      
                    animationFrameId = requestAnimationFrame(onframe);
                });
      
                videoEle.srcObject = stream;
                videoEle.load();
                videoEle.play()
                    .catch(error => {
                        console.error("Auto Play Error", error);
                    });
            }, console.error);
        };
    };

    // websocket会话管理
    var WebSocketSessionManager = function(id, wsUrl) {
        var self = this;

        if ('WebSocket' in window) {
            var sock = new WebSocket(wsUrl);

            sock.onopen = function() {
                // 在页面显示成功连接到服务器的状态
                console.log('Websocket connection opened');

                // 发送到服务器
                sock.send(JSON.stringify({'type': 'OPEN', 'meeting_id': id}));
            };

            sock.onmessage = function(evt) {
                var msg = JSON.parse(evt.data);

                if (msg.type == 'PROCESSED') {
                    var ret = [], ret2 = [];

                    // 对图像进行人脸识别完成
                    if (msg.data && msg.data.length > 0) {
                        msg.data.forEach(function(item) {
                            if (item.score < tolerance || item.no == -1) {
                                console.log('unknown person: %s[%s], score is %s', item.name, item.no, item.score);
                                ret2.push(item);
                            }
                            else {
                                if (item.id && item.is_attendant && attandants_id.indexOf(item.id) == -1) {
                                    // 检测到新来人员
                                    attandants_id.push(item.id);
                                    // 通知新人员的到来
                                    self.notifyAttandantDetected(item);
                                }
                                else {
                                    console.log('detected %s[%s] but not an attendant, score is %s', item.name, item.no, item.score);
                                }
                                ret.push(item);
                            }
                        });
                    }

                    // 当前检测到的人员
                    attandants_expected = ret;
                    // 当前检测到的不匹配的人员
                    attandants_unmatch = ret2;

                    // 这一帧已处理完成
                    processingFrame = false;
                }
                else if (msg.type == 'OPENED') {
                    // 打开session成功并返回session的唯一标识
                    this.sessionId = msg.session_id;
                    // 通知session已经打开成功
                    self.notifyStateChange({'state': 'open', 'session': msg.session_id});
                }
                else if (msg.type == 'CLOSED') {
                    if (msg.message) console.log(msg.message);
                    // 主动关闭websocket的连接
                    sock.close();
                    // 通知session已经关闭
                    self.notifyStateChange({'state': 'close'});
                }
                else {
                    console.log('Unkown message type: ' + msg.type);
                }
            }.bind(this);

            sock.onclose = function() {
                console.log('Websocket connection closed');

                // 清空session id
                this.sessionId = null;
                // 通知session已经关闭
                self.notifyStateChange({'state': 'close'});
            }.bind(this);

            // 关闭websocket session
            self.close = function() {
                if (self.sessionId) {
                    sock.send(JSON.stringify({'type': 'CLOSE', 'session_id': self.sessionId}));
                }
            };

            // 发送图像到服务器，由服务器进行人脸识别，并将结果以异步的方式返回客户端
            self.processFrame = function(dataURL) {
                if (self.sessionId == null || self.sessionId == undefined) {
                    console.log('Websocket session id is none!');
                }
                else {
                    sock.send(JSON.stringify({'type': 'PROCESSING', 'session_id': self.sessionId, 'data_url': dataURL}));
                }
            };

            self.detectedCallbacks = [];
        
            self.addDetectedCallback = function(callback) {
                self.detectedCallbacks.push(callback);
            };
        
            self.notifyAttandantDetected = function(item) {
                for (var i = 0; i < self.detectedCallbacks.length; i++) {
                    self.detectedCallbacks[i](item);
                }
            };

            self.socketStateListener = function(params) {};

            self.setSocketStateListener = function(listener) {
                self.socketStateListener = listener;
            };

            self.notifyStateChange = function(params) {
                self.socketStateListener(params);
            }
        }
        else {
            console.error('WebSocket not supported by your browser!');
        }
    };

    // tts语音合成管理
    var TTSManager = function() {
        var player = document.getElementById('tts_player');
        var source = document.getElementById('tts_player_source');

        var self = this;

        var timerId = -1;

        // 是否正在播放
        var playing = false;
        // 是否在播放列表, 防止上次循环还没有完成
        var playing_playlist = false;

        // 待转换成音频的文本列表
        var contents = [];
        
        // 合成后的音频播放列表
        var playlist = [];

        // 执行语音合成的代码
        var _exec = function() {
            // 判断是否有待合成的文本
            if (contents.length > 0) {
                var text = contents.splice(0, contents.length).join(',').trim();

                if (text !== "") {
                    text = 'Welcome ' + text;
                    
                    // 发送到后台，进行语音合成
                    $.get('/tts/' + text, function(data) {
                        if (data.err_no == 0 && data.audio_url) {
                            // 加入到播放列表中
                            playlist.push(data.audio_url);
                        }
                        else {
                            console.log("Text to speech failed! error_no: %d, error_message: %s", data.err_no, data.err_msg);
                        }
                    });
                }
            }

            // 判断播放列表中是否有音频要播放
            while (playlist.length > 0 && !playing_playlist) {
                // 正在播放列表中的音频
                playing_playlist = true;

                if (playing) {
                    continue;
                }

                playing = true;
                source.src = playlist.shift();

                // 加载音频
                player.load();
                // 播放音频
                player.play().then(_ => {
                    playing = false;
                })
                .catch(error => {
                    playing = false;
                    console.log('player error: ' + error);
                });
            }
            // 本次播放完成
            playing_playlist = false;
        };

        // 启动语音合成功能
        self.start = function() {
            if (timerId == -1) {
                // 每1秒运行一次
                timerId = window.setInterval(_exec, 1000);
            }
        };

        // 停止语音合成功能
        self.stop = function() {
            if (timerId != -1) {
                window.clearInterval(timerId)
                timerId = -1;
            }
        };

        self.isRunning = function() {
            return timerId != -1;
        }

        // 添加待合成的文本
        self.queueContent = function(text) {
            if (text && text !== '') {
                contents.push(text);
            }
        };
    };

    window.Cameo = Cameo;
})();