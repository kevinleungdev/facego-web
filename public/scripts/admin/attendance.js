(function() {
    var grid = $('#attendance_grid');
    var pageSize = 10;
    
    grid.dataTable({
        "language": {
            "emptyTable": "No data available in table",
            "info": "Showing _START_ to _END_ of _TOTAL_ records",
            "infoEmpty": "No records found",
            "lengthMenu": " _MENU_ records",
            "paging": {
                "previous": "Prev",
                "next": "Next"
            }
        },
        "bStateSave": true,
        "lengthChange": false,
        "pageLength": pageSize,
        "processing": true,
        "serverSide": true,
        "ajax": "/admin/attendance/list?length=" + pageSize,
        "columns": [
            { "data": "room" },
            { "data": "meeting_name" },
            { "data": "employee" },
            { "data": "signing_time" }
        ],
        "ordering": false,
        "searching": false
    });
})();