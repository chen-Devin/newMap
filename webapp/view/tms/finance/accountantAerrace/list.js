$(function(){
    layui.use(['form', 'layer', 'table', 'tms_tab'], function(){
        var form = layui.form,
            layer = layui.layer,
            table = layui.table,
            tmsTab = layui.tms_tab,
            $ = layui.jquery;

            form.render();

        setTableData();

        //子系统接口
        // $.get('/ucenter/code/common/system/search.shtml', function(d){
        //   var $code = d.code,
        //       $msg = d.msg,
        //       $objects = d.objects;

        //   if($code != 'SUCCESS') return false;
        
        //   if($objects.length > 0){
        //     for(var $i = 0; $i < $objects.length; $i++){
        //       $('select[name="platformId"]').append('<option value="'+ $objects[$i].id +'">'+ $objects[$i].name +'</option>');
        //     }
        //     form.render('select');
        //   }
        // }, 'json');
        
        //监听提交
        form.on('submit(search)', function(data){
        var $courseTitle = $.trim(data.field.courseTitle),
        $stairSubject = $.trim(data.field.stairSubject);
        setTableData($courseTitle, $stairSubject);
        return false;
        });
        
        //方法级渲染
        function setTableData($courseTitle,  $stairSubject){
        typeof $courseTitle != 'undefined' ? $courseTitle = $courseTitle : $courseTitle = '';
        typeof $stairSubject != 'undefined' ? $stairSubject = $stairSubject : $stairSubject = '';
        var $pageSize = 15;
        table.render({
            elem: '#tableList',
            url: '/ucenter/general/finance/financeSubject/fsapPlateformList.shtml?activateStatus=' + $stairSubject + '&courseTitle=' + $courseTitle,
            response: {
            statusCode: 'SUCCESS',
            countName: 'objects.total', //数据总数的字段名称，默认：count
            dataName: 'objects.list'
            },
            request: {
            pageName: 'pageNum', //页码的参数名称，默认：page
            limitName: 'pageSize' //每页数据量的参数名，默认：limit
            },
            cols: [[
            {field:'subjectCode', title: '科目编号', width:100, align: 'center' },
            {field:'subjectName', title: '一级科目名称', width:150, align: 'center'},
            {field:'gradeHeadings', title: '二级科目名称', width:150, align: 'center'},
            {field:'type', title: '所属类型', width:100, align: 'center', templet: "#typeTpl"},
            {field:'hasReceived', title: '应收', width:80, align: 'center', templet: "#hasReceivedTpl"},
            {field:'hasHandle', title: '应付',  width:80, align: 'center', templet: "#hasHandleTpl"},
            {field:'status', title: '状态', width:80, align: 'center', templet: "#statusTpl"},
            {field:'creator', title: '创建人', width:100, align: 'center'},
            {align:"createDate", title: '创建时间',  width:200, align: 'center', templet: "#createDateTpl"}
            ]],
            id: 'dataReload',
            page: true,
            limits: [15, 30, 50, 100],
            limit: $pageSize,
            height: 'full-90',
            even: true,
            done: function(res, curr, count){}
        });
        }
        form.render();
    });
});