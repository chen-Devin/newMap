$(function(){
    layui.use(['form', 'layer', 'table', 'tms_tab'], function() {
        var form = layui.form,
            layer = layui.layer,
            table = layui.table,
            tmsTab = layui.tms_tab,
            $ = layui.jquery;

        setTableData();

        //监听提交
        form.on('submit(search)', function(data) {
            var $accountName = $.trim(data.field.accountName),
                $accountNo = $.trim(data.field.accountNo);
            $channelType = $.trim(data.field.channelType);
            $status = $.trim(data.field.status);
            setTableData($accountName, $accountNo, $channelType, $status);
            return false;
        });

        //方法级渲染
        function setTableData($accountName, $accountNo, $channelType, $status) {
            typeof $accountName != 'undefined' ? $accountName = $accountName : $accountName = '';
            typeof $accountNo != 'undefined' ? $accountNo = $accountNo : $accountNo = '';
            typeof $channelType != 'undefined' ? $channelType = $channelType : $channelType = '';
            typeof $status != 'undefined' ? $status = $status : $status = '';
            var $pageSize = 15;

            table.render({
                elem: '#tableList',
                url: '/ucenter/general/finance/settlementChannel/page.shtml?accountName=' + $accountName + '&accountNo=' + $accountNo +
                    '&channelType=' + $channelType + '&status=' + $status,
                response: {
                    statusCode: 'SUCCESS',
                    countName: 'objects.total', //数据总数的字段名称，默认：count
                    dataName: 'objects.list'
                },
                request: {
                    pageName: 'pageNum', //页码的参数名称，默认：page
                    limitName: 'pageSize' //每页数据量的参数名，默认：limit
                },
                cols: [
                    [{
                        checkbox: true,
                        fixed: true
                    }, {
                        field: 'channelType',
                        title: '渠道',
                        align: 'center',
                        width: 80,
                        templet: '#channelTypeTpl'
                    }, {
                        field: 'bankName',
                        title: '开户银行',
                        align: 'center',
                        width: 130
                    }, {
                        field: 'bankBranchName',
                        title: '支行',
                        align: 'center',
                        width: 200
                    }, {
                        field: 'accountName',
                        title: '账户名称',
                        align: 'center',
                        width: 290
                    }, {
                        field: 'accountNo',
                        title: '账户',
                        align: 'center',
                        width: 190
                    }, {
                        field: 'balanceInit',
                        title: '初始余额',
                        align: 'center',
                        width: 110
                    }, {
                        field: 'balance',
                        title: '当前余额',
                        align: 'center',
                        width: 110,
                        templet: '#balanceTpl'
                    }, {
                        field: 'remarks',
                        title: '备注',
                        align: 'center',
                        width: 250
                    }, {
                        field: 'status',
                        title: '状态',
                        align: 'center',
                        width: 80,
                        templet: "#statusTpl"
                    }, {
                        field: 'creator',
                        title: '创建人',
                        align: 'center',
                        width: 110
                    }, {
                        field: 'createDate',
                        title: '创建日期',
                        align: 'center',
                        width: 190,
                        templet: "#createDateTpl"
                    }]
                ],
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
            addData: function() {
                parent.layer.open({
                    type: 2,
                    title: '新增银行账号',
                    shadeClose: true,
                    shade: 0.8,
                    area: ['900px', '600px'],
                    content: 'addBank.html?do=add'
                });
            },
            //查看
            detailData: function() { //获取选中数据
                var checkStatus = table.checkStatus('dataReload'),
                    data = checkStatus.data;
                if (data.length == 0) {
                    parent.layer.alert('你还未选中数据！');
                } else if (data.length > 1) {
                    parent.layer.alert('只能选择一条数据！');
                } else {
                    parent.layer.open({
                        type: 2,
                        title: '查看银行账号',
                        shadeClose: true,
                        shade: 0.8,
                        area: ['900px', '500px'],
                        content: 'addBank.html?do=detail&accountNo=' + data[0].accountNo + '&id=' + data[0].id
                    });
                }
            },
            //激活
            actData: function() {
                var checkStatus = table.checkStatus('dataReload'),
                    data = checkStatus.data;
                if (data.length == 0) {
                    parent.layer.alert('请选择需激活的数据！');
                } else {
                    var idArr = [];
                    $(data).each(function(i, value) {
                        idArr.push(value.id);
                    });
                    var $saveData = {
                        ids: idArr,
                        status: 1
                    }

                    $.ajax({
                        url: '/ucenter/general/finance/settlementChannel/status.shtml',
                        data: JSON.stringify($saveData),
                        type: 'PUT',
                        dataType: 'json',
                        contentType: 'application/json',
                        beforeSend: function() {},
                        success: function(d) {
                            var $code = d.code;
                            $msg = d.msg;
                            $objects = d.objects;

                            if ($code === 'SUCCESS') {
                                parent.layer.alert('启用成功');
                                $(".btn-search").click();
                            } else if ($code === 'ERROR_USER_LOGOFF') {
                                loginFailure();
                            } else {
                                parent.layer.alert('数据异常');
                                return;
                            }
                        }
                    });
                }
            },
            //冻结
            frozenData: function() {
                var checkStatus = table.checkStatus('dataReload'),
                    data = checkStatus.data;
                if (data.length == 0) {
                    parent.layer.alert('请选择需冻结的数据！');
                } else {
                    parent.layer.confirm('您确定需要冻结选中的账户吗？', function(index) {
                        var idArr = [];
                        $(data).each(function(i, value) {
                            idArr.push(value.id);
                        });
                        var $saveData = {
                            ids: idArr,
                            status: 3
                        }

                        $.ajax({
                            url: '/ucenter/general/finance/settlementChannel/status.shtml',
                            data: JSON.stringify($saveData),
                            type: 'PUT',
                            dataType: 'json',
                            contentType: 'application/json',
                            beforeSend: function() {},
                            success: function(d) {
                                var $code = d.code;
                                $msg = d.msg;
                                $objects = d.objects;

                                if ($code === 'SUCCESS') {
                                    parent.layer.alert('冻结成功');
                                    $(".btn-search").click();
                                } else if ($code === 'ERROR_USER_LOGOFF') {
                                    loginFailure();
                                } else {
                                    parent.layer.alert('数据异常');
                                    return;
                                }
                            }
                        });
                    });
                }
            }
        };

        $('.btns-bar .layui-btn').on('click', function() {
            var type = $(this).data('type');
            active[type] ? active[type].call(this) : '';
        });

        $(document).on("click", ".layui-table-link", function() {
            var id = $(this).attr("data-id");
            parent.layer.open({
                type: 2,
                title: '银行收支记录',
                shadeClose: true,
                shade: 0.8,
                area: ['80%', '70%'],
                content: 'bankIncomeRecord.html?id=' + id //iframe的url
            });
        });
    });
})
  