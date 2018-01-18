$(function() {
    layui.use(['form', 'laydate', 'layer'], function() {
        var form = layui.form,
            layer = layui.layer,
            laydate = layui.laydate,
            $ = layui.jquery;

        laydate.render({
            elem: '#tradeDate'
        });

        var $newId = $.trim(getUrlParam("id"));
        var $type = $.trim(getUrlParam("type"));

        //加载收支账户下拉框数据
        function incomeAccount(){
            $.get('/ucenter/general/finance/settlementChannel/searchBankNameAccountNo.shtml', function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;
                if ($code != 'SUCCESS') return false;
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        if ($objects[$i].accountName != null && $objects[$i].accountNo != null && $objects[$i].status == 1) {
                            $('select[name="accountNo"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].accountNo + '(' + $objects[$i].accountName + ')</option>');
                        }
                    }
                    form.render('select');
                }
            }, 'json');
        }
        
        form.on('select(accountantOne)', function(data) {
            $('select[name="accountantTwo"]').empty();
            $('select[name="accountantTwo"]').attr("disabled",true);
            $('select[name="accountantThree"]').empty();
            $('select[name="accountantThree"]').attr("disabled",true);
            $('select[name="accountantFour"]').empty();
            $('select[name="accountantFour"]').attr("disabled",true);
            form.render('select');
            if(data.value != ""){
                $('select[name="accountantTwo"]').attr("disabled",false);
                form.render('select');
                accountant('accountantTwo',data.value);
            }
        })
        form.on('select(accountantTwo)', function(data) {
            $('select[name="accountantThree"]').empty();
            $('select[name="accountantFour"]').empty();
            $('select[name="accountantThree"]').attr("disabled",true);
            $('select[name="accountantFour"]').attr("disabled",true);
            form.render('select');
            if(data.value != ""){
                $('select[name="accountantThree"]').attr("disabled",false);
                form.render('select');
                accountant('accountantThree',data.value);
            }
        })
        form.on('select(accountantThree)', function(data) {
            $('select[name="accountantFour"]').empty();
            $('select[name="accountantFour"]').attr("disabled",true);
            form.render('select');
            if(data.value != ""){
                $('select[name="accountantFour"]').attr("disabled",false);
               
                form.render('select');
                accountant('accountantFour',data.value);
            }
        })

         //加载会计科目下拉框数据
         function accountant($name,$id){
             if($id == undefined){
                $id = '';
             };
             $('select[name="'+ $name +'"]').empty();
             $('select[name="'+ $name +'"]').append('<option value= ></option>');
            $.get('/ucenter/general/finance/bankFlow/bankFlowSubject.shtml?parentId=' + $id, function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;
                if ($code != 'SUCCESS') return false;
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        $('select[name="'+ $name +'"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].subjectName + '</option>');
                    }
                    form.render('select');
                }
            }, 'json');
         }
         
        form.on('select(tradeTargetType)', function(data) {
            $('select[name="tradeTarget"]').empty();
            //加载往来单位下拉框数据
            $.get('/ucenter/general/finance/bankFlow/type.shtml?num=' + data.value, function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;
                if ($code != 'SUCCESS') return false;
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        if ($objects[$i].name != null) {
                            $('select[name="tradeTarget"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].name + '</option>');
                        }
                    }
                    form.render('select');
                }
            }, 'json');
        });

        //自定义验证规则
        form.verify({
            money: function(value) {
                if (value.length == 0) {
                    return '请输入收支金额';
                } else if (!$jsReg.plus.test(value)) {
                    return '收支金额只能输入正数(小数点后两位)';
                }
            }
        });

        //焦点事件
        $('#money').focus(function() {
            // layer.tips('200位字符', '#money', {
            //   tips: [3, '#78BA32']
            // });
        });
        $('#money').blur(function() {
            if ($(this).val().length == 0) {
                layer.tips('请输入收支金额', '#money', {
                    tips: [3, '#d84747']
                });
            } else if ($(this).val().length > 0) {
                if (!$jsReg.plus.test($(this).val())) {
                    layer.tips('收支金额只能输入正数(小数点后两位)', '#money', {
                        tips: [3, '#d84747']
                    });
                }
            }
        });

           //查看
        $.get('/ucenter/general/finance/bankFlow/showOne.shtml?id='+$newId, function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;

                if ($code === 'SUCCESS') {
                    var settlementChannelId = $objects.settlementChannelId;
                    var tradeTarget = $objects.tradeTarget;
                    var $status = $objects.status;
                    $.get('/ucenter/general/finance/settlementChannel/searchBankNameAccountNo.shtml', function(d) {
                        var $code = d.code,
                            $msg = d.msg,
                            $objects = d.objects;
                        if ($code != 'SUCCESS') return false;
                        if ($objects.length > 0) {
                            for (var $i = 0; $i < $objects.length; $i++) {
                                if ($objects[$i].accountName != null && $objects[$i].accountNo != null && $objects[$i].status == 1) {
                                    $('select[name="accountNo"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].accountNo + '(' + $objects[$i].accountName + ')</option>');
                                }
                            }
                            $("select[name='accountNo']").val(settlementChannelId);
                            form.render('select');
                            form.render();
                        }
                    }, 'json');
                    $("input[name='tradeDate']").val($objects.tradeDate != null ? new Date($objects.tradeDate).format('yyyy-MM-dd') : '');
                    $("input[name='money']").val($objects.received == null ? $objects.handle : $objects.received);
                    $("input[name='inOrOut']").val($objects.received == null ? $("span:contains('支出')").click() : $("span:contains('收入')").click());
                    $("select[name='tradeTargetType']").val($objects.tradeTargetType);
                    var accountantOne = $objects.subjectIds == null ? '' : $objects.subjectIds[0];
                    var accountantTwo = $objects.subjectIds == null ? '' : $objects.subjectIds[1];
                    var accountantThree = $objects.subjectIds == null ? '' : $objects.subjectIds[2];
                    var accountantFour = $objects.subjectIds == null ? '' : $objects.subjectIds[3];
                    // $('select[name="accountantOne"]').attr("disabled",true);
                    if(accountantOne){
                        $('select[name="accountantOne"]').attr("disabled",false);
                    $.get('/ucenter/general/finance/bankFlow/bankFlowSubject.shtml?parentId=', function(d) {
                        var $code = d.code,
                            $msg = d.msg,
                            $objects = d.objects;
                        if ($code != 'SUCCESS') return false;
                        if ($objects.length > 0) {
                            for (var $i = 0; $i < $objects.length; $i++) {
                                $('select[name="accountantOne"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].subjectName + '</option>');
                            }
                            $("select[name='accountantOne']").val(accountantOne);
                            $('select[name="accountantOne"]').attr("disabled",true);
                            if($status == 0 && $type == 'edit'){ $('select[name="accountantOne"]').attr("disabled",false); }
                            form.render('select');
                            form.render();
                            if(accountantTwo){
                            $('select[name="accountantTwo"]').attr("disabled",false);
                            $.get('/ucenter/general/finance/bankFlow/bankFlowSubject.shtml?parentId='+accountantOne, function(d) {
                                var $code = d.code,
                                    $msg = d.msg,
                                    $objects = d.objects;
                                if ($code != 'SUCCESS') return false;
                                if ($objects.length > 0) {
                                    for (var $i = 0; $i < $objects.length; $i++) {
                                        $('select[name="accountantTwo"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].subjectName + '</option>');
                                    }
                                    $("select[name='accountantTwo']").val(accountantTwo);
                                    $('select[name="accountantTwo"]').attr("disabled",true);
                                    if($status == 0 && $type == 'edit'){ $('select[name="accountantTwo"]').attr("disabled",false); }
                                    form.render('select');
                                    form.render();
                                    if(accountantThree){
                                        $('select[name="accountantThree"]').attr("disabled",false);
                                        $.get('/ucenter/general/finance/bankFlow/bankFlowSubject.shtml?parentId='+accountantTwo, function(d) {
                                        var $code = d.code,
                                            $msg = d.msg,
                                            $objects = d.objects;
                                        if ($code != 'SUCCESS') return false;
                                        if ($objects.length > 0) {
                                            for (var $i = 0; $i < $objects.length; $i++) {
                                                $('select[name="accountantThree"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].subjectName + '</option>');
                                            }
                                            $("select[name='accountantThree']").val(accountantThree);
                                            $('select[name="accountantThree"]').attr("disabled",true);
                                            if($status == 0 && $type == 'edit'){ $('select[name="accountantThree"]').attr("disabled",false); }
                                            form.render('select');
                                            form.render();
                                            if(accountantFour){
                                                $('select[name="accountantFour"]').attr("disabled",false);
                                                $.get('/ucenter/general/finance/bankFlow/bankFlowSubject.shtml?parentId='+accountantThree, function(d) {
                                                    var $code = d.code,
                                                        $msg = d.msg,
                                                        $objects = d.objects;
                                                    if ($code != 'SUCCESS') return false;
                                                    if ($objects.length > 0) {
                                                        for (var $i = 0; $i < $objects.length; $i++) {
                                                            $('select[name="accountantFour"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].subjectName + '</option>');
                                                        }
                                                        $("select[name='accountantFour']").val(accountantFour);
                                                        $('select[name="accountantFour"]').attr("disabled",true);
                                                        if($status == 0 && $type == 'edit'){ $('select[name="accountantFour"]').attr("disabled",false); }
                                                        form.render('select');
                                                        form.render();
                                                    }
                                                }, 'json');
                                            }
                                        }
                                    }, 'json');
                                    }
                                }
                            }, 'json');
                            }
                        }
                    }, 'json');
                }else{
                    $.get('/ucenter/general/finance/bankFlow/bankFlowSubject.shtml?parentId=', function(d) {
                        var $code = d.code,
                            $msg = d.msg,
                            $objects = d.objects;
                        if ($code != 'SUCCESS') return false;
                        if ($objects.length > 0) {
                            for (var $i = 0; $i < $objects.length; $i++) {
                                $('select[name="accountantOne"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].subjectName + '</option>');
                            }
                            form.render('select');
                        }
                    }, 'json');
                }
                    form.render('select');
                    form.render();
                    // $("select[name='accountantOne']").val($objects.subjectIds[0]);
                    if($objects.tradeTargetType){
                        $.get('/ucenter/general/finance/bankFlow/type.shtml?num=' + $objects.tradeTargetType, function(d) {
                        var $code = d.code,
                            $msg = d.msg,
                            $objects = d.objects;

                        if ($code != 'SUCCESS') return false;
                        if ($objects.length > 0) {
                            for (var $i = 0; $i < $objects.length; $i++) {
                                if ($objects[$i].name != null) {
                                    if($objects[$i].name == tradeTarget){
                                        $('select[name="tradeTarget"]').append('<option value="' + $objects[$i].id + '" selected>' + $objects[$i].name + '</option>');
                                    }else{
                                        $('select[name="tradeTarget"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].name + '</option>');
                                    }
                                }
                            }
                            form.render('select');
                            form.render();
                        }
                    }, 'json');
                    }   
                    
                    $("textarea[name='described']").val($objects.described);
                    $("textarea[name='remark']").val($objects.remark);
                    
                    $("select[name='accountNo']").val($objects.accountNo);
                    form.render();
                    //编辑
                    if($type == 'edit'){
                        $(".btn-audit").hide();
                        if($objects.status == 0){ //待审核
                            $('input[name="inOrOut"]').attr("disabled",true);
                            $('select[name="accountNo"]').attr("disabled",true);
                            $('input[name="money"]').attr("disabled",true);
                        }else if($objects.status == 1){//审核通过
                            $('input[name="inOrOut"]').attr("disabled",true);
                            $('select[name="accountNo"]').attr("disabled",true);
                            $('input[name="money"]').attr("disabled",true);
                            $('input[name="tradeDate"]').attr("disabled",true);
                            $('select[name="tradeTargetType"]').attr("disabled",true);
                            $('select[name="tradeTarget"]').attr("disabled",true);
                            $('textarea[name="described"]').attr("disabled",true);
                            form.render();
                        }
                    };
                    //查看
                    if($type == 'detail'){
                        $('input[name="inOrOut"]').attr("disabled",true);
                        $('select[name="accountNo"]').attr("disabled",true);
                        $('input[name="money"]').attr("disabled",true);
                        $('input[name="tradeDate"]').attr("disabled",true);
                        $('select[name="tradeTargetType"]').attr("disabled",true);
                        $('select[name="tradeTarget"]').attr("disabled",true);
                        $('textarea[name="described"]').attr("disabled",true);
                        $('textarea[name="remark"]').attr("disabled",true);
                        $('.button-bar').hide();
                    };
                    //审核
                    if($type == 'audit'){
                        $('input[name="inOrOut"]').attr("disabled",true);
                        $('select[name="accountNo"]').attr("disabled",true);
                        $('input[name="money"]').attr("disabled",true);
                        $('input[name="tradeDate"]').attr("disabled",true);
                        $('select[name="tradeTargetType"]').attr("disabled",true);
                        $('select[name="tradeTarget"]').attr("disabled",true);
                        $('textarea[name="described"]').attr("disabled",true);
                        $(".btn-save").hide();
                        form.render('select');
                        form.render();
                    }
                } else {
                    parent.layer.alert('数据异常');
                    return false;
                }
            }, 'json');

        //监听提交
            form.on('submit(submit)', function(data) {
                var $id = [];
                $id[0] = $.trim(data.field.accountantOne);
                $id[1] = $.trim(data.field.accountantTwo);
                $id[2] = $.trim(data.field.accountantThree);
                $id[3] = $.trim(data.field.accountantFour);

                var account = $("select[name='accountNo']").find("option:selected").text();
                var accountArr = account.split("(");
                //数据源
                var $saveData = {
                    accountNo: accountArr[0],
                    received: $.trim(data.field.inOrOut) == "收入" ? $.trim(data.field.money) : "",
                    handle: $.trim(data.field.inOrOut) == "支出" ? $.trim(data.field.money) : "",
                    tradeDate: $.trim(data.field.tradeDate),
                    described: $.trim(data.field.described),
                    remark: $.trim(data.field.remark),
                    tradeTargetType: $.trim(data.field.tradeTargetType),
                    tradeTarget: $.trim($("select[name='tradeTarget']").find("option:selected").text()),
                    settlementChannelId: $.trim(data.field.accountNo),
                    subjectIds:$id,
                    id:$newId,
                    accountName: accountArr[1].substring(0, accountArr[1].length - 1)
                }
                //调用接口
                $.ajax({
                    type: 'POST',
                    url: '/ucenter/general/finance/bankFlow/updateSuperior.shtml',
                    dataType: "json",
                    contentType: "application/json",
                    data: JSON.stringify($saveData),
                    success: function(d) {
                        var $code = d.code,
                            $msg = d.msg,
                            $objects = d.objects;
                            if ($code === 'SUCCESS') {
                                parent.layer.alert("保存成功", {
                                    closeBtn: 0,
                                    yes: function(index) {
                                            $(window.parent['f1'].document).find('.btn-search').click();
                                            parent.layer.closeAll();
                                    }
                                });
                            } else {
                                parent.layer.alert('保存信息失败，请重新填写！');
                            }
                    }
                });
                return false;
            });
        //取消
        $(".btn-back").on("click", function() {
            parent.layer.closeAll();
            return false;
        });
        //审核
        $(".btn-audit").on("click",function(){
            var $remark = $('textarea[name="remark"]').val();
            var $saveData = {
                id: $newId ,
                remark: $remark
            };
            $.ajax({
                type: 'POST',
                url: '/ucenter/general/finance/bankFlow/checkBankFlow.shtml?',
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify($saveData),
                success: function(d) {
                    var $code = d.code,
                        $msg = d.msg,
                        $objects = d.objects;

                    if ($code === 'SUCCESS') {
                        parent.layer.alert("审核成功", {
                            closeBtn: 0,
                            yes: function(index) {
                                    $(window.parent['f1'].document).find('.btn-search').click();
                                    parent.layer.closeAll();
                            }
                        });
                    } else {
                        parent.layer.alert('审核信息失败，请重新审核！');
                    }
                }
            });
            return false;
        })


    });
});