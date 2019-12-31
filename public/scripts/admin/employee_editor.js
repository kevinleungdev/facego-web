(function($) {
    var BLANK_AVATAR_URL = '/img/no-images.png';

    // 打开图片选择对话框
    $('#img_chooser_a').bind('click', function() {
        $('#img_chooser').click();
    });

    // 选中图片的事件
    $('#img_chooser').bind('change', function(e) {
        var files = e.target.files,
            img = document.getElementById('img_display');

        if (files.length == 0) {
            img.classList.remove('obj');
            img.src = BLANK_AVATAR_URL;
        }
        else {
            var file = files[0];

            if (!img.classList.contains('obj')) {
                img.classList.add('obj');
            }

            img.file = file;

            var reader = new FileReader();
            reader.onload = (function(aImg) { return function(e) {aImg.src = e.target.result; $('#avatar_input').val(e.target.result);} })(img);
            reader.readAsDataURL(file);
        }
    });

    var form = $('#form_employee'),
        success = $('.alert-success', form),
        error = $('.alert-danger', form);

    // 表单校验：http://docs.jquery.com/Plugins/Validation
    form.validate({
        errorElement: 'span',                       // 错误提示信息的Tag，缺省是label
        errorClass: 'help-block help-block-error',  // 错误提示信息的样式，缺省是error
        focusInvalid: false,                        // 是否focus最后校验不通过的输入
        ignore: '',                                 // 不进行校验的input字段
        rules: {
            firstName: {
                required: true
            },
            lastName: {
                required: true
            },
            engName: {
                required: true
            },
            title: {
                required: true
            },
            group: {
                required: true
            },
            gender: {
                required: true
            },
            email: {
                required: true
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
            // 检查是否已经选择头像
            if ($('#img_display').attr('src') === BLANK_AVATAR_URL) {
                alert('Your avatar is empty!');
                return;
            }

            var postData = $(form).serializeArray(),
                formURL = $(form).attr('action');

            // 防止重复提交
            $('#btn_submit').prop('disabled', true);
            
            // 提交表单
            $.ajax({
                url : formURL,
                type: "POST",
                data : postData,
            })
            .done(function(data, textStatus, jqXHR) {
                var ret = JSON.parse(data);
                if (ret.errno === 0) {
                    // 重置表单
                    form.reset();
                    // 清空头像
                    $('#img_display').attr('src', BLANK_AVATAR_URL);
                    $('#avatar_input').val('');
                    // 显示成功信息
                    success.text('Add new employee successfully.')
                    success.show();
                    error.hide();
                }
                else {
                    error.text(ret.message || 'Unknown reasons');
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