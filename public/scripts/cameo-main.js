$(document).ready(function() {
    Metronic.init();
    Layout.init();

    var id = parseInt($('#meeting_id').val());
    var wsUrl = $('#websocket_url').val();

    if (!id || !wsUrl) {
        return;
    }

    // 生成人员列表Item的模板
    var genAttandantItemHtml = function(name, signingTime, avatar) {
        return [                                        
            '<div class="attandant-list-item attandant-list-item-border-green">',
                '<img class="attandant-avatar pull-left" src="', avatar, '" width="48px" height="48px">',
                '<div class="attandant-list-item-title">', name, '</div>',
                '<div class="attandant-list-controls pull-left">',
                    '<span class="attandant-list-date">',
                        '<i class="fa fa-clock-o"></i> Sign in ', signingTime,
                    '</span>',
                '</div>',
            '</div>'
        ].join('');
    };

    var DEFAULT_AVATAR = '/img/avatar.png';

    // 获取当前会议已签到的人员列表
    var attendanceList = [];

    $.get('/attendants/' + id)
     .done(function(rows) {
        if (rows && rows.length > 0) {
            $('.text-no-attandant').addClass('hide');
        }

        rows.forEach(row => {
            var $ele = $(genAttandantItemHtml(row.name, row.sign_time, row.avatar || DEFAULT_AVATAR));
            $('#attandant_list').append($ele);

            // 添加到已签到的人员列表中 
            if (row.id) attendanceList.push(row.id);
        }, this);
     })
     .fail(function(err) {
         console.log(err);
     })
     .always(function() {
        var cameo = new Cameo(id, wsUrl, attendanceList),
            ttsManager = cameo.getTTSManager();

        // 检测到人后的回调函数
        cameo.addDetectedCallback(function(item) {
            // 隐藏no attandants的tips
            if (!$('.text-no-attandant').hasClass('hide')) {
                $('.text-no-attandant').addClass('hide');
            }
            console.log('%s[%s] signing now. score is %s', item.name, item.no, item.score);
        
            // 当前登录时间
            var today = new Date();
            var timestr = today.getHours() + ':' + today.getMinutes();
        
            // 获取头像信息
            $.get('/cameo/avatar/' + item.id)
             .done(function(data) {
                var $ele = $(genAttandantItemHtml(item.name, timestr, data.img || DEFAULT_AVATAR));
                // 添加到人员列表
                $('#attandant_list').append($ele);
            })
            .fail(function(err) {
                var $ele = $(genAttandantItemHtml(item.name, timestr, DEFAULT_AVATAR));
                // 添加到人员列表
                $('#attandant_list').append($ele);
        
                console.log(err);
            });
        
            // 将记录插入到数据库中
            $.post('/attendants/add', { meetingId: id, employeeId: item.id });

            // 通过语音合成管理器，合成问候语
            ttsManager.queueContent(item.english_name);
        });
        
        // web session状态
        cameo.setWebsocketStateListener(function(params) {
            if (params.state == 'open') {
                $('#session_indicator').removeClass('font-red');
                $('#session_indicator').addClass('font-green-sharp');
            }
            else if (params.state == 'close') {
                $('#session_indicator').removeClass('font-green-sharp');
                $('#session_indicator').addClass('font-red');
            }
        });
        
        // Settings对话框
        $('#settings_dialog').on('show.bs.modal', function () {
            $('#tolerance_input').val(cameo.getTolerance());

            var scale = cameo.getScaleFactor();
            $('#settings_scale_factor')
                .children('option')
                .each(function() {
                    var $this = $(this);
                    if (scale == $this.val()) {
                        $this.attr('selected', true);
                    }
            });
        });
        
        // 设置按钮
        $('#btn_settings').click(function() {
            $('#settings_dialog').modal('show');
        });
        
        // 保存设置按钮
        $('#btn_settings_ok').click(function() {
            cameo.setTolerance($('#tolerance_input').val());
            cameo.setScaleFactor($('#settings_scale_factor').val());

            // 隐藏对话框
            $('#settings_dialog').modal('hide');
        });
        
        // 保存设置按钮
        $('#btn_logout_ok').click(function() {
            // 发出退出session的请求到服务器上
            cameo.closeWebSocketSession();
                             
            setTimeout(function() {
                // 100ms后跳转到首页
                window.location.href = '/';
            }, 100);
                    
            // 隐藏对话框
            $('#logout_dialog').modal('hide');
        });
        
        // 退出按钮
        $('#btn_logout').click(function() {
            $('#logout_dialog').modal('show');
        });

        // 启动语音合成
        ttsManager.start();
        
        // 监听事件
        $('#settings_tts_switch').change(function () {
            if (this.checked) {
                console.log('Turn on TTS engine');
                ttsManager.start();
            }
            else {
                console.log('Turn off TTS engine');
                ttsManager.stop();
            }
        });
    });
});