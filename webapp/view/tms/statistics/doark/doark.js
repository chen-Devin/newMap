// var pageMap = {
//     'doarkRecord': '每日做柜记录',
//     'doarkCount': '每日做柜统计',
//     'doarkStream': '做柜流水',
//     'bankBalance': '银行收支报表'
//     'dolistCustomer': '客户做单月度统计'
// }



layui.use(['form', 'layer', 'table', 'tms_tab', 'laydate'], function () {
    var form = layui.form,
        layer = layui.layer,
        table = layui.table,
        laydate = layui.laydate,
        tmsTab = layui.tms_tab,
        $ = layui.jquery;

    var category = $.trim(getUrlParam('category'));
    $('.search-bar').not('#' + category + '-search').remove();
    $('.search-bar').show();

    var thisMonth = {
        begin: new Date().format('yyyy-MM') + '-01',
        end: new Date().format('yyyy-MM-dd')
    }

    var search = function (options) {
        form.on('submit(search)', function (data) {
            var begin = Date.parse(new Date(data.field.beginDate));
            var end = Date.parse(new Date(data.field.endDate));
            if (isNaN(begin) || isNaN(end)) {
                setLayerAlert(layer, "日期不能为空或者格式不对");
            } else if (end - begin > 1000 * 60 * 60 * 24 * 30) {
                setLayerAlert(layer, "选择日期不能相差超过一个月");
            } else if (end - begin < 0) {
                setLayerAlert(layer, "开始时间不能大于结束时间");
            } else {
                var whereOptions = data.field;
                if(data.field.status){
                    whereOptions.status = Number(data.field.status);
                }
                table.reload("dataReload", $.extend({ where: whereOptions }, options));
            }
        });
    }

    //初始化日期时间
    var initDate = function (begin, end) {
        var setTime = function (bTime, eTime) {
            laydate.render({
                elem: begin,
                value: bTime
            });
            laydate.render({
                elem: end,
                value: eTime
            });
        }
        setTime(thisMonth.begin, thisMonth.end);

        //本月，上月
        cutGroup(function (dataId) {
            if (dataId == 'this-month') {
                setTime(thisMonth.begin, thisMonth.end);
            } else if (dataId == 'last-month') {
                var year = Number(new Date().format('yyyy'));
                var month = Number(new Date().format('MM')) - 1;
                var bTime, eTime;
                if (month === 0) {
                    bTime = (year - 1) + '-12-01';
                    eTime = (year - 1) + '-12-31';
                } else {
                    var lmonth = String(month).length > 1 ? month : '0' + month;
                    bTime = year + '-' + lmonth + '-01';
                    eTime = year + '-' + lmonth + '-' + laydate.getEndDate(month);
                }
                setTime(bTime, eTime);
            }
        });

        return setTime;

    };

    var reset = function (setDate) {
        $('.doArkReset').click(function (ev) {
            $.each($("form input"), function () {
                if ($(this).attr("name")) {
                    $(this).val("");
                }
            });
            $.each($("form select"), function () {
                this.options[0].selected = true;
                form.render('select');
            });
            $('button[data-btn="doTime"]').removeClass('time-btn-sel');
            $('button[data-btn="doTime"]').eq(0).addClass('time-btn-sel');
            if (typeof setDate === "function") {
                setDate(thisMonth.begin, thisMonth.end);
            }
        });
    };

    var setSelect = function (target) {
        var year = Number(new Date().format('yyyy')),
            month = Number(new Date().format('MM')),
            i = 0,
            str = "";
        for (i; i < 12; i++) {
            if (month === 0) {
                month = 12;
                year = year - 1;
            }
            str += "<option>" + year + "-" + month + "</option>";
            month = month - 1;
        }
        $(target).empty().append(str);
        form.render('select');
    };

    var getBeginAndEndTime = function (str) {
        var time = str.split("-");
        var lastDay = "";
        if (time.length > 1) {
            lastDay = laydate.getEndDate(time[1], time[0]);
            return {
                beginDate: str + "-01",
                endDate: str + "-" + lastDay
            }
        }
    }

    function cutGroup(fn) {
        $('button[data-btn="doTime"]').on('click', function () {
            $('button[data-btn="doTime"]').removeClass('time-btn-sel');
            $(this).addClass('time-btn-sel');
            var dataId = $(this).attr('data-id');
            fn(dataId);

        });
    }

    function initTable(options) {
        var tableOption = options;
        delete tableOption.tableOptions.url;
        tmsCommonTable.init(tableOption, table);
    }

    var initPage = {
        'commBiz': function (options) {
            var setDate = initDate("#beginDate", "#endDate");
            reset(setDate);
            search(options);
        },
        //每日做柜记录
        'doarkRecord': function () {
            setSelect($('select[name="doarkTime"]'));

             //获取客户数据
             bizUtil.layui.loadDataToSelect('#customerId');   

             //获取车辆所有人(供应商)
             bizUtil.layui.loadDataToSelect('#carCompanyId'); 

            //本月，上月
            cutGroup(function (dataId) {
                if (dataId == 'this-month') {
                    $("select[name=doarkTime]").find("option")[0].selected = true;
                    form.render('select');
                } else if (dataId == 'last-month') {
                    $("select[name=doarkTime]").find("option")[1].selected = true;
                    form.render('select');
                }
            });

            form.on('submit(search)', function (data) {
                var whereOptions = data.field;
                
                var time = getBeginAndEndTime(whereOptions.doarkTime);
                whereOptions.beginDate = time.beginDate;
                whereOptions.endDate = time.endDate;
                delete whereOptions.doarkTime;
                table.reload("dataReload", { url: '/ucenter/tms/waybill/statistics/dayConta.shtml', where: whereOptions });

            });

            var getColumns = (function () {
                var dayColumns = [],
                    i = 1,
                    tableColumns;
                for (i; i < 32; i++) {
                    dayColumns.push({
                        field: i,
                        title: i + '日',
                        width: 120,
                        align: 'center'
                    });
                }

                tableColumns = [
                    { field: 'id', title: '序号', width: 80, align: 'center', templet: '#idTpl', fixed:'left' },
                    { field: 'carNo', title: '车牌', width: 150, align: 'center', sort: true, fixed:'left' },
                    { field: 'carAtt', title: '车属性', width: 100, align: 'center', sort: true, fixed:'left' },
                    { field: 'carCompanyName', title: '供应商', width: 120, align: 'center', fixed:'left' }
                ].concat(dayColumns).concat([
                    { field: 'contaNum', title: '箱量', align: 'center', width: 120, },
                    { field: 'carNum', title: '车次', align: 'center', width: 120 },
                    { field: 'product', title: '产值', align: 'center', width: 120 }
                ]);

                return tableColumns;
            })();


            var options = {
                "tableOptions": {
                    cols: [getColumns],
                    url: '/ucenter/tms/waybill/statistics/dayConta.shtml',
                    where: { "beginDate": thisMonth.begin, "endDate": thisMonth.end },
                    response: {
                        dataName: 'objects'
                    },
                    height: 'full-79',
                    method: 'post',
                    page: false
                }
            }

            //tmsCommonTable.init(options, table);
            initTable(options);
            reset();

        },
        //每日做柜统计
        'doarkCount': function () {
            var options = {
                "tableOptions": {
                    cols: [[
                        { field: 'id', title: '序号', width: 80, align: 'center', templet: '#idTpl' },
                        { field: 'statDate', title: '日期', align: 'center', width: 120, sort: true },
                        { field: 'arkCount', title: '做柜数量', align: 'center', width: 120 },
                        { field: 'product', title: '产值', align: 'center', width: 120, },
                        { field: 'grossProfit', title: '毛利润', align: 'center', width: 120 }
                    ]],
                    response: {
                        dataName: 'objects'
                    },
                    height: 'full-79',
                    method: 'post',
                    url: '/ucenter/tms/waybill/statistics/day.shtml',
                    where: { 'beginDate': thisMonth.begin, 'endDate': thisMonth.end, 'searchType': 1 },
                    page: false
                }
            }

            //tmsCommonTable.init(options, table);
            initTable(options);
            this.commBiz({url: '/ucenter/tms/waybill/statistics/day.shtml'});
        },
        //做柜流水
        'doarkStream': function () {            
            //获取客户数据
            bizUtil.layui.loadDataToSelect('#customerId'); 
            
            //获取状态
            bizUtil.layui.loadDataToSelect('#status'); 

            var options = {
                "tableOptions": {
                    cols: [[
                        { field: 'id', title: '序号', width: 80, align: 'center', templet: '#idTpl' },
                        { field: 'businessType', title: '业务类型', align: 'center', width: 100 },
                        { field: 'status', title: '状态', width: 110, align: 'center', templet: '#statusTpl' },
                        { field: 'jobNo', title: '运单号码', width: 160, align: 'center', sort: true },
                        { field: 'jobTime', title: '作业日期', align: 'center', width: 120, sort: true },
                        { field: 'customerName', title: '客户名称', width: 250 },                      
                        { field: 'contaType', title: '箱型', align: 'center', width: 100 },
                        { field: 'freight', title: '运费',align: 'center',  width: 100 },
                        { field: 'carNo', title: '拖车车牌', align: 'center', width: 150 },
                        { field: 'carframeNo', title: '拖架车牌', align: 'center', width: 150 },
                        { field: 'driverName', title: '司机', align: 'center', width: 100 },
                        { field: 'driverMobile', title: '司机手机', align: 'center', width: 130 },
                        { field: 'sendcarName', title: '调度人员', align: 'center', width: 100 },
                        { field: 'pickupCode', title: '提柜地点', width: 150 },
                        { field: 'returnCode', title: '还柜地点', width: 150 },
                        { field: 'loadPlace', title: '装货地点', width: 150 },
                        { field: 'dischargePlace', title: '卸货地点', width: 150 }
                    ]],
                    method: 'post',
                    height: 'full-130',
                    url: '/ucenter/tms/waybill/statistics/contaFlow.shtml',
                    where: { "beginDate": thisMonth.begin, "endDate": thisMonth.end }
                }
            }

            //tmsCommonTable.init(options, table);
            initTable(options);
            this.commBiz({url: '/ucenter/tms/waybill/statistics/contaFlow.shtml'});
        },
        //银行统计
        'bankBalance': function () {
            setSelect($('select[name="doarkTime"]'));

            function formatTable(id) {
                var tr = $(id +" + .layui-table-view").find(".layui-table-body table tr");
                $.each(tr, function (i, d2) {
                    if (i % 4 === 0) {
                        $(this).find("td").eq(0).attr("rowspan", "4");
                    } else {
                        $(this).find("td").eq(0).remove();
                    }
                });
            }

            var makeTable = function (data, tableId) {
                var align = "'center'";
                var head = ["'time'", "'balance'"];
                var theadName = ['<th lay-data="{field: ' + head[0] + ' ,width: 120, align: ' + align + '}">时间</th>', 
                '<th lay-data="{field: ' + head[1] + ' ,width: 140, align: ' + align + '}">收支情况</th>'];
                var tr = [];
                var count = {
                    count: "合计"
                }            
                $.each(data.tabLabList, function (i, d) {
                    var name = "'bank" + i + "'";                   
                    theadName.push('<th lay-data="{field:' + name + ',width: 200, align: ' + align + '}">' + (count[d] || d) + '</th>')

                });

                $.each(data.statList, function (i, d) {
                    var qc = ['<tr><td>' + d.statDay + '</td><td>期初余额(元)</td>'];
                    var zs = ['<tr><td></td><td>总收入(元)</td>'];
                    var zz = ['<tr><td></td><td>总支出(元)</td>'];
                    var qm = ['<tr><td></td><td>期末余额(元)</td>'];

                    if (i == (data.statList.length - 1)) {
                        qc = ['<tr><td>合计</td><td>期初余额(元)</td>'];

                    }
                    $.each(d.initAccount, function (i, d2) {
                        for (var key in d2) {
                            qc.push('<td>' + d2[key] + '</td>');
                            zs.push('<td>' + d.totalReceived[i][key] + '</td>');
                            zz.push('<td>' + d.totalHandle[i][key] + '</td>')
                            qm.push('<td>' + d.leaveAccount[i][key] + '</td>')
                        }
                    });

                    qc.push('</tr>');
                    zs.push('</tr>');
                    zz.push('</tr>');
                    qm.push('</tr>');
                    tr.push(qc);
                    tr.push(zs);
                    tr.push(zz);
                    tr.push(qm);
                });

                var theadHtml = '<thead>' + theadName.join('') + '</thead>';
                $(tableId).html("").append(theadHtml + '<tbody>' + tr.join('') + '</tbody>');
            }

            function sendAjax(data, options) {
                HC.ajax.post({
                    url: '/ucenter/tms/waybill/statistics/bank.shtml',
                    data: data,
                    success: function (d) {
                        makeTable(d, options.tableId);
                        table.init(options.tableFilter, {
                            height: "full-165",
                            limit: 200,
                            done: function(){
                                //在隐藏状态下的tab中的table表格 渲染后会因高度计算错误（layui的bug）遮住表格最后一行,所以使用hack方式重新调整表格高度
                                if (options.adjustHeight) {
                                    $(options.tableId).next().find('.layui-table-main').css('height', '-=41px');
                                }
                            }
                        });
                        formatTable(options.tableId);                   
                    }
                });
            }

            //银行收支每日报表
            var dailyOptions = {
                tableId: "#table_list1",
                tableFilter: "table1"
            }
            form.on('select(daily)', function (data) {
                sendAjax({month: data.value}, dailyOptions);
            });
            sendAjax({month: $("select").val()}, dailyOptions);


            //银行收支每月报表
            var monthlyOptions = {
                tableId: "#table_list2",
                tableFilter: "table2",
                adjustHeight: true
            }
            
            //今年，去年
            var thisYear = Number(new Date().getFullYear());
            cutGroup(function (dataId) {
                if (dataId == 'this-year') {
                    sendAjax({ year: thisYear }, monthlyOptions);
                } else if (dataId == 'last-year') {
                    sendAjax({ year: (thisYear - 1) }, monthlyOptions);
                }
            });

            sendAjax({ year: thisYear }, monthlyOptions);


        },
        //客户做单月度统计
        'dolistCustomer': function() {    
            var yearOption = (function() {
                var thisYear = Number(new Date().getFullYear());
                var lastYear = thisYear - 1;
                return function() {
                    return '<option>' + thisYear + '</option><option>' + lastYear + '</option>';
                }
            });

            reset();

            $('.doArkReset').click(function (ev) {
                $('input[name="hasPlace"]').prop('checked', false).prop('disabled', false);
                setSelect($('select[name="statDate"]'));

                form.render();
            });

            setSelect($('select[name="statDate"]'));
            //获取客户数据
            bizUtil.layui.loadDataToSelect('#customerId');     

            form.on('select(dateType)', function (data) {
                if(data.value == 1){
                    $('input[name="hasPlace"]').prop('disabled', true).prop('checked', false);
                    $('select[name="statDate"]').empty().append(yearOption());

                }else if(data.value == 2){
                    setSelect($('select[name="statDate"]'));
                    $('input[name="hasPlace"]').prop('disabled', false);       
                    
                }else{

                }
                form.render();
            });

            //提交
            form.on('submit(search)', function (data) {
                var searchOptions = data.field;
                searchOptions.hasPlace = $('input[name="hasPlace"]')[0].checked;
                
                if(searchOptions.dateType == 1){
                    table.reload("dataReload", {cols: [getColumns('year')], url: '/ucenter/tms/waybill/statistics/customerStat.shtml', where: searchOptions });
                    return false;
                }

                var type = searchOptions.hasPlace === true ? 'monthHasPlace' : 'month';     
                table.reload("dataReload", {cols: [getColumns(type)], url: '/ucenter/tms/waybill/statistics/customerStat.shtml', where: searchOptions });
                return false;
            });

            var getColumns = function (type) {
                var getTimeColumns = function(length, title){
                    var columns = [],
                        i = 1;
                    for (i; i < length; i++) {
                        columns.push({
                            field: i,
                            title: i + title,
                            width: 68,
                            align: 'center'
                        });
                    }              
                    return columns;
                }   

                var makeColumns = function(hasPlace, timeColumns) {
                    var columns = [
                        { field: 'id', title: '序号', width: 80, align: 'center', templet: '#idTpl', fixed:'left' },
                        { field: 'customer', title: '客户', width: 150, align: 'center', fixed:'left'}
                    ];
                    if(hasPlace){
                        columns = columns.concat({ field: 'place', title: '装卸地点', width: 150, align: 'center', fixed:'left'});
                    }
                    columns = columns.concat(timeColumns).concat([
                        { field: 'all', title: '合计', align: 'center', width: 120, }
                    ]);
                    return columns;
                                   
                }

                var tableColumns = [];
                switch (type) {
                    case 'year':
                        tableColumns = makeColumns(false, getTimeColumns(13, '月'));

                        break;
                    case 'month':
                        tableColumns = makeColumns(false, getTimeColumns(32, '日'));

                        break;
                    case 'monthHasPlace':
                        tableColumns = makeColumns(true, getTimeColumns(32, '日'));

                        break;  
                    default:
                        break;
                }

                return tableColumns;
            };

            var options = {
                "tableOptions": {
                    cols: [getColumns('month')],
                    url: '/ucenter/tms/waybill/statistics/customerStat.shtml',
                    where: '',
                    height: 'full-79',
                    method: 'post',
                    limits: [30, 50, 100],
                    limit: 30,
                    done: function() {
                        //把一页的最后一条的数据的序号改成 ‘合计’
                        $('#table_list').siblings('.layui-table-view').find('.layui-table-body table tr:last td:first div').text('合计');                           
                    }
                }
            }

            //tmsCommonTable.init(options, table);
            initTable(options);
        }
    }

    category && initPage[category]();

});