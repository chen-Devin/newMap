
$(function(){
    layui.use(['form', 'layer','laydate', 'table', 'tms_tab'], function(){
    var form = layui.form,
        layer = layui.layer,
        table = layui.table,
        laydate = layui.laydate,
        tmsTab = layui.tms_tab,
        $ = layui.jquery;

    var $settlementChannelId = $.trim(getUrlParam("id"));
    laydate.render({
        elem: '#beginTime',
        format: 'yyyy-MM-dd'
    });
    laydate.render({
        elem: '#endTime'
    });
    setTableData($settlementChannelId);

    function thisDate(){
        laydate.render({
        elem: '#beginTime',
        format: 'yyyy-MM-dd', //可任意组合
        value: getCurrentMonthFirst()
        });
        laydate.render({
        elem: '#endTime',
        value: new Date() 
        });
    }

    $('.lastDate').on('click',function(){
        //获取上个月第一天和最后一天
        var nowdays = new Date();
        var year = nowdays.getFullYear();
        var month = nowdays.getMonth();
        if (month == 0) {
        month = 12;
        year = year - 1;
        }
        if (month < 10) {
        month = "0" + month;
        }
        var firstDay = year + "-" + month + "-" + "01";// 上个月的第一天
        var myDate = new Date(year, month, 0);
        var lastDay = year + "-" + month + "-" + myDate.getDate();// 上个月的最后一天
        laydate.render({
        elem: '#beginTime',
        value: firstDay 
        });
        laydate.render({
        elem: '#endTime',
        value: lastDay
        });
        return false;
    })
    $('.thisDate').on('click',function(){
        thisDate();
        return false;
    })

    //获取当月第一天的时间
    function getCurrentMonthFirst(){
        var date=new Date();
        date.setDate(1);
        return date.format("yyyy-MM-dd");
    }
    
    //监听提交
    form.on('submit(search)', function(data){
        var $beginTime = $.trim(data.field.beginTime),
        $endTime = $.trim(data.field.endTime);
        setTableData($settlementChannelId, $beginTime, $endTime);
        return false;
    });
    
    //方法级渲染
    function setTableData($settlementChannelId, $beginTime, $endTime){
        typeof $settlementChannelId != 'undefined' ? $settlementChannelId = $settlementChannelId : $settlementChannelId = '';
        typeof $beginTime != 'undefined' ? $beginTime = $beginTime : $beginTime = '';
        typeof $endTime != 'undefined' ? $endTime = $endTime : $endTime = '';
        var $pageSize = 15;

        table.render({
        elem: '#tableList',
        url: '/ucenter/general/finance/bankFlow/page.shtml?settlementChannelId=' + $settlementChannelId + '&startTradeDate=' + $beginTime + '&endTradeDate=' + $endTime,
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
            {title: '序号', width:60, align: 'center', templet:'#idTpl'},
            {field:'tradeDate', title: '收付款日期', width:140, sort: true, align: 'center', templet:"#tradeDateTpl"},
            {field:'accountNo', title: '账户', width:220, align: 'center'},
            {field:'received', title: '收入', width:140, align: 'center'},
            {field:'handle', title: '支出', width:140, align: 'center'},
            {field:'balance', title: '余额', width:140, align: 'center'},
            {field:'tradeTarget', title: '往来单位', width:200, align: 'center'},
            {field:'described', title: '摘要', width:200, align: 'center'},
            {field:'createDate', title: '创建时间', width:140, align: 'center', templet:"#createDateTpl"}
        ]],
        id: 'dataReload',
        page: true,
        limits: [15, 30, 50, 100],
        limit: $pageSize,
        height: 'full-130',
        even: true
        });
    }
    });
});
