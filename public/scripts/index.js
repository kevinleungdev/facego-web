$(document).ready(function() {
    Metronic.init();
    Layout.init();

    $('#empty_info').css('margin-top', (window.innerHeight/2 - 120));

    var getColHtml = function(col) {
        var short = $.trim(col.comment).substr(0, 30).split(' ').slice(0, -1).join(' ') + '...';

        return [
            '<div class="col-md-3">',
                '<div class="portlet light">',
                    '<div class="portlet-title">',
                        '<div class="caption">',
                            '<i class="icon-speech font-green-sharp"></i>',
                            '<span class="caption-subject font-green-sharp">', short, '</span>',
                        '</div>',
                    '</div>',
                    '<div class="portlet-body">',
                        '<div class="row static-info">',
                            '<div class="col-sm-2 name font-green-sharp">Room:</div>',
                            '<div class="col-sm-10 value form-normal">', col.room, '</div>',
                        '</div>',
                        '<div class="row static-info">',
                            '<div class="col-sm-2 name font-green-sharp">Date:</div>',
                            '<div class="col-sm-10 value form-normal">', col.date, '</div>',
                        '</div>',
                        '<div class="row static-info">',
                            '<div class="col-sm-2 name font-green-sharp">Time:</div>',
                            '<div class="col-sm-10 value form-normal">', col.from, '~', col.to, '</div>',
                        '</div>',
                        '<div class="row" style="margin-top: 30px;">',
                            '<div class="col-md-12">',
                                '<a class="btn btn-success uppercase" href="/cameo/', col.id, '?title=', encodeURIComponent(col.comment), '">',
                                    '<i class="icon-login"></i>&nbsp;Enter',
                                '</a>',
                            '</div>',
                        '</div>',
                    '</div>',
                '</div>',
            '</div>'
        ].join('');
    };

    var getRowHtml = function(cols) {
        var html = '<div class="row">'
        for (var i = 0; i < cols.length; i++) {
            html += getColHtml(cols[i]);
        }
        html += '</div><div class="clearfix"></div>';

        return html;
    }

    // 获取会议列表
    $.get('/meeting/list')
        .done(function(datas) {
            // 清空信息
            $('.list-info').html('');

            if (datas != null && datas.length > 0) {
                // 填写会议列表信息
                var html = '';
                for (var i = 0; i < datas.length; i += 4) {
                    html += getRowHtml(datas.slice(i, Math.min(datas.length, i+4)));
                }    
                $('.list-info').html(html);

                // 隐藏空信息提示
                $('#empty_info').addClass('hide');
            }
            else {
                // 显示空信息提示
                $('#empty_info').removeClass('hide');
            }
        })
        .fail(function(err) {
            console.error(err);
        });
});