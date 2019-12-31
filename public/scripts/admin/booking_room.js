(function($) {

    // 表单处理
    var form = $('#form_booking'),
        formURL = $(form).attr('action'),
        success = $('.alert-success', form),
        error = $('.alert-danger', form);

    // 判断更新还是新建
    var isUpdate = form.attr('data-action') === 'update' ? true : false;

    var setCurrentDate = function() {
        // 初始化当前日期
        var date = new Date();
        $('input[name="date"]').val(date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate());
    };

    var setCurrentTime = function() {
        var date = new Date(),
            hour = date.getHours(),
            minute = date.getMinutes();

        var timeStr = (hour <= 9 ? '0' + hour : hour) + ':' + (minute <= 9 ? '0' + minute : minute);
        $('.timepicker-24').timepicker('setTime', timeStr);
    }

    // 日期控件初始化。文档：http://bootstrap-datepicker.readthedocs.io/en/latest/
    $('.date-picker').datepicker({
        orientation: "left",
        autoclose: true,
        clearBtn: true
    });
    // 初始化当前日期
    setCurrentDate();

    // 时间控件初始化, http://jdewit.github.io/bootstrap-timepicker/
    $('.timepicker-24').timepicker({
        autoclose: true,
        minuteStep: 5,
        showSeconds: false,
        showMeridian: false, 
        defaultTime: false
    });
    // 初始化当前时间
    setCurrentTime();

    // Room下拉框的数据加载
    $.get('/admin/room/list')
     .done(function(data, textStatus, jqXHR) {
         data.forEach(ele => {
             $('#room_select').append($('<option>', {
                value: ele.id,
                text : ele.name
             }));
         }, this);
     });
    
    // 参加会议人员的多选控件初始化. http://loudev.com/
    $('#attandant_select').multiSelect();

    $.get('/admin/employee/list')
     .done(function(data, textStatus, jqXHR) {
        data.forEach(ele => {
            $('#attandant_select').append($('<option>', {
               value: ele.id,
               text : ele.firstname + ' ' + ele.lastname
            }));
        }, this);

        $('#attandant_select').multiSelect('refresh');
    })
    .then(function() {
        // 一定要在这里进行更新
        if (isUpdate) {
            var slices = formURL.split('/');
            var id = parseInt(slices[slices.length - 1]);
    
            $.get('/admin/booking/' + id)
             .done(function(data, textStatus, jqXHR) {
                 $('input', form).each(function() {
                    var $this = $(this);
    
                    var name = $this.attr('name');
                    if (name === 'date') {
                        $this.val(data.date);
                    }
                    else if (name === 'from') {
                        $this.val(data.from);
                    }
                    else if (name === 'to') {
                        $this.val(data.to);
                    }
                 });
    
                 $('textarea[name="comment"]').val(data.comment);
                 $('#room_select').val(data.room);

                 $('#attandant_select').multiSelect('select', data.attendants.split(','));
             });
        }
    });

    // 表单校验：http://docs.jquery.com/Plugins/Validation
    form.validate({
        errorElement: 'span',                       // 错误提示信息的Tag，缺省是label
        errorClass: 'help-block help-block-error',  // 错误提示信息的样式，缺省是error
        focusInvalid: false,                        // 是否focus最后校验不通过的输入
        ignore: '',                                 // 不进行校验的input字段
        messages: {
            comment: {
                maxlength: jQuery.validator.format("Max {0} characters"),
                minlength: jQuery.validator.format("At least {0} characters")
            },
            attandant: {
                minlength: jQuery.validator.format("At least {0} item must be selected")
            }
        },
        rules: {
            room: {
                required: true
            },
            date: {
                required: true
            },
            from: {
                required: true
            },
            to: {
                required: true
            },
            comment: {
                required: true,
                minlength: 10,
                maxlength: 254
            },
            attandant: {
                required: true,
                minlength: 1
            }
        },
        invalidHandler: function (event, validator) { // 校验不通过时，显示出错信息              
            success.hide();
            error.text('You have some form errors. Please check below.')
            error.show();
        },
        highlight: function (element) { // 输入有错的字段高亮显示
            $(element)
                .closest('.form-group').addClass('has-error'); 
        },
        unhighlight: function (element) {
            $(element)
                .closest('.form-group').removeClass('has-error');
        },
        success: function (label) {
            label
                .closest('.form-group').removeClass('has-error');
        },
        submitHandler: function (form) { // 当校验通过后，调用该方法
            var postData = $(form).serializeArray();

            // 防止重复提交
            $('#btn_submit').prop('disabled', true);
            
            // 提交表单
            $.ajax({
                url : formURL,
                type: "POST",
                data : postData,
            })
            .done(function(data, textStatus, jqXHR) {
                if (data.errno === 0) {
                    if (!isUpdate) {
                        // 重置表单
                        form.reset();
                   
                        // 重置时间
                        setCurrentDate();
                        setCurrentTime();
                   
                        // 刷新多选控件
                        $('#attandant_select').multiSelect('refresh');
                   
                        // 显示成功信息
                        success.text('Booking room successfully.')
                    }
                    else {
                        success.text('Booking room update successfully.')
                    }
 
                    success.show();
                    error.hide();
                }
                else {
                    error.text(data.message || 'Unknown reasons');
                    error.show();
                    success.hide();
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                error.text('Server error: ' + errorThrown || 'Unknown reasons');
                error.show();

                success.hide();
            })
            .always(function() {
                $('#btn_submit').prop('disabled', false);
            });
        }
    });
})(jQuery);