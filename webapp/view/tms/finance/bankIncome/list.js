$(function(){
    layui.use(['form', 'layer','laydate', 'table', 'tms_tab'], function(){
        var form = layui.form,
            layer = layui.layer,
            table = layui.table,
            laydate = layui.laydate,
            tmsTab = layui.tms_tab,
            $ = layui.jquery;
        var $beginTime,
        $endTime,
        $settlementChannelId,
        $status;

        laydate.render({
        elem: '#beginTime',
        format: 'yyyy-MM-dd'
        });
        laydate.render({
        elem: '#endTime'
        });
        var newDay = new Date().format('yyyy-MM-dd');
        setTableData(getCurrentMonthFirst(),newDay);
        thisDate();

        //加载账户下拉框数据
        $.get('/ucenter/general/finance/settlementChannel/searchBankNameAccountNo.shtml', function(d){
        var $code = d.code,
            $msg = d.msg,
            $objects = d.objects;

        if($code != 'SUCCESS') return false;
        
        if($objects.length > 0){
            for(var $i = 0; $i < $objects.length; $i++){
            if($objects[$i].accountName != null && $objects[$i].accountNo != null && $objects[$i].status == 1){
                $('select[name="settlementChannelId"]').append('<option value="'+ $objects[$i].id +'">'+ $objects[$i].accountNo + '(' + $objects[$i].accountName +')</option>');
            }
            }
            form.render('select');
        }
        }, 'json');

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
            $('.time-btns button').removeClass('time-btn-sel');
            $(this).addClass('time-btn-sel');
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
            $('.time-btns button').removeClass('time-btn-sel');
            $(this).addClass('time-btn-sel');
            thisDate();
            return false;
        })

        var lskdj = '运输支出,运费,运输支出,运费,';

        // console.log(lskdj);
        // console.log(lskdj.replace(/,/g,'>'));

        //获取当月第一天的时间
        function getCurrentMonthFirst(){
        var date=new Date();
        date.setDate(1);
        return date.format("yyyy-MM-dd");
        }


        //监听提交
        form.on('submit(search)', function(data){
        $beginTime = $.trim(data.field.beginTime),
        $endTime = $.trim(data.field.endTime),
        $settlementChannelId = $.trim(data.field.settlementChannelId),
        $type = $.trim(data.field.type);
        $status = $.trim(data.field.status);
        setTableData($beginTime, $endTime, $settlementChannelId,$type, $status);
        
        return false;
        });
        
        //方法级渲染
        function setTableData($beginTime, $endTime, $settlementChannelId, $type, $status){
        typeof $beginTime != 'undefined' ? $beginTime = $beginTime : $beginTime = '';
        typeof $endTime != 'undefined' ? $endTime = $endTime : $endTime = '';
        typeof $settlementChannelId != 'undefined' ? $settlementChannelId = $settlementChannelId : $settlementChannelId = '';
        typeof $type != 'undefined' ? $type = $type : $type = '';
        typeof $status != 'undefined' ? $status = $status : $status = '';
        var $pageSize = 15;

        table.render({
            elem: '#tableList',
            url: '/ucenter/general/finance/bankFlow/page.shtml?startTradeDate=' + $beginTime + '&endTradeDate=' + $endTime 
            + '&settlementChannelId=' + $settlementChannelId + '&type=' + $type + '&status=' + $status,
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
            {checkbox: true, fixed: true},
            {title: '序号', width:60, align: 'center', templet:'#idTpl'},
            {field:'tradeDate', title: '收支日期', width:110, sort: true, align: 'center', templet:"#tradeDateTpl"},
            {field:'status', title: '状态', width:110, align: 'center', templet:"#statusTpl"},
            {title: '收支账户', width:330, align: 'center', templet:"#accountTpl"},
            {field:'received', title: '收入', width:100, align: 'center'},
            {field:'handle', title: '支出', width:100, align: 'center'},
            {field:'balance', title: '余额', width:110, align: 'center'},
            {field:'tradeTargetType', title: '往来单位类型', width:130, align: 'center', templet:"#tradeTargetTypeTpl"},
            {field:'tradeTarget', title: '往来单位', width:130, align: 'center'},
            {field:'subjectName', title: '会计科目', width:250, align: 'center', templet:"#subjectNameTpl"},
            {field:'described', title: '摘要', width:200, align: 'center'},
            {field:'createDate', title: '创建时间', width:200, align: 'center', templet:"#createDateTpl"}
            ]],
            id: 'dataReload',
            page: true,
            limits: [15, 30, 50, 100],
            limit: $pageSize,
            height: 'full-130',
            even: true
        });
        }

        var active = {
        //新增
        addData: function(){
            parent.layer.open({
            type: 2,
            title: '收支登记',
            shadeClose: true,
            shade: 0.8,
            area: ['1000px', '500px'],
            content: 'addIncome.html'
            });
        },
         //编辑
         editData: function(){
            var checkStatus = table.checkStatus('dataReload'),
                data = checkStatus.data;
            if (data.length == 0) {
                parent.layer.alert('你还未选中数据！');
            } else if (data.length > 1) {
                parent.layer.alert('编辑只能选择一条数据！');
            } else {
                parent.layer.open({
                type: 2,
                title: '编辑收支登记',
                shadeClose: true,
                shade: 0.8,
                area: ['1000px', '500px'],
                content: 'editIncome.html?type=edit&id='+ data[0].id
                });
            }
        },
         //查看
         detailData: function(){
            var checkStatus = table.checkStatus('dataReload'),
                data = checkStatus.data;
            if (data.length == 0) {
                parent.layer.alert('你还未选中数据！');
            } else if (data.length > 1) {
                parent.layer.alert('编辑只能选择一条数据！');
            } else {
                parent.layer.open({
                type: 2,
                title: '查看收支登记',
                shadeClose: true,
                shade: 0.8,
                area: ['1000px', '500px'],
                content: 'editIncome.html?type=detail&id='+ data[0].id
                });
            }
        },
        //审核
        auditData: function(){
            var checkStatus = table.checkStatus('dataReload'),
                data = checkStatus.data;
            if (data.length == 0) {
                parent.layer.alert('你还未选中数据！');
            } else if (data.length > 1) {
                parent.layer.alert('编辑只能选择一条数据！');
            } else {
                parent.layer.open({
                type: 2,
                title: '审核收支登记',
                shadeClose: true,
                shade: 0.8,
                area: ['1000px', '500px'],
                content: 'editIncome.html?type=audit&id='+ data[0].id
                });
            }
        },
         //作废
         cancellationData: function(){
            var checkStatus = table.checkStatus('dataReload'),
                data = checkStatus.data;
            if (data.length == 0) {
                parent.layer.alert('你还未选中数据！');
            } else {
                parent.layer.confirm('作废后的收支记录，余额将改回去，且收支列表不再显示本记录，你确定要作废吗', {title: '作废确认'}, function(index) {
                    var idArr = [];
                    var count = 0;
                    $(data).each(function(i, value) {
                        if (value.status == 1) {
                            parent.layer.alert('审核通过的记录不能作废！');
                            count = 1;
                            return false;
                        } else {
                            idArr.push(value.id);
                        }
                    });
                    if ((idArr.length > 0) && (count == 0)) {
                        $.ajax({
                            type:'GET', 
                            url:'/ucenter/general/finance/bankFlow/invalid.shtml?id='+ idArr,
                            success:function(d){
                                var $code = d.code,
                                    $msg = d.msg,
                                    $objects = d.objects;
                                    if($code === 'SUCCESS'){
                                        parent.layer.close(index);
                                        parent.layer.alert('操作成功！');
                                        $(window.parent['f1'].document).find('.btn-search').click();
                                    }else{
                                        parent.layer.alert($msg);
                                    }
                                },
                            error:function(){
                                parent.layer.alert('操作失败！');
                            }
                        });
                    }
                });
            }
        },
        //导出
        deriveBrief: function(){
            typeof $beginTime != 'undefined' ? $beginTime = $beginTime : $beginTime = '';
            typeof $endTime != 'undefined' ? $endTime = $endTime : $endTime = '';
            typeof $settlementChannelId != 'undefined' ? $settlementChannelId = $settlementChannelId : $settlementChannelId = '';
            typeof $status != 'undefined' ? $status = $status : $status = '';
            $.ajax({
            type:'GET', 
            url:'/ucenter/general/finance/bankFlow/exportExcel.shtml?beginTime='+$beginTime+'&endTime='+$endTime+'&settlementChannelId='+$settlementChannelId+'&status='+ $status,
            success:function(d){
                if(d.code == 'ERROR_FINANACE_EXPORT_EXCEL'){
                    parent.layer.alert('没有查询到相关数据！');
                  }else{
                     document.location.href = '/ucenter/general/finance/bankFlow/exportExcel.shtml?beginTime='+$beginTime+'&endTime='+$endTime+'&settlementChannelId='+$settlementChannelId+'&status='+ $status;
                  }
                },
            error:function(){
                parent.layer.alert('操作失败！');
            }
            });

        }
        };
    
        $('.btns-bar .layui-btn').on('click', function(){
        var type = $(this).data('type');
        active[type] ? active[type].call(this) : '';
        });
    });
});