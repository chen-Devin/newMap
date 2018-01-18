$(function() {
    $(".return").addClass("btn-close");
    var flag = true;
    layui.use(['form', 'laydate', 'layer'], function() {
        var form = layui.form,
            layer = layui.layer,
            laydate = layui.laydate,
            $ = layui.jquery;

        laydate.render({
            elem: '#tradeDate'
        });

        //加载收支账户下拉框数据
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
        accountant('accountantOne');

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
            form.render('select');
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

        //监听提交
        form.on('submit(submit)', function(data) {
            if (!bizUtil.validator.verifyContainer($('form'))) {
                return false;
            }
            
            if (flag == false) {
                return;
            }
            $(".layui-form input,textarea").prop('disabled', true).css({
                'background': '#eee'
            });
            $("select,option,dd").addClass('layui-disabled');
            $(".btn-save").html("确认添加");

            $(".return").removeClass("btn-close");
            $(".return").addClass("btn-return");
            flag = false;
            $(".return").html("返回编辑");
            $(".btn-return").off("click")
            $(".btn-return").on("click", function() {
                $(".layui-form input,textarea").prop('disabled', false).css({
                    'background': '#fff'
                });
                $(".layui-form select").prop('disabled', false);
                $("select,option,dd").removeClass('layui-disabled');
                $(".btn-save").html("保存");
                flag = true;
                $(".return").html("取消");
                return false;
            });
            $(".btn-save").off("click");
            $(".btn-save").on("click", function() {
                $(".btn-save").blur();
                if (flag == true) {
                    return;
                }
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
                    accountName: accountArr[1].substring(0, accountArr[1].length - 1)
                }
                //调用接口
                $.ajax({
                    type: 'POST',
                    url: '/ucenter/general/finance/bankFlow/insert.shtml',
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
                                    if ($("#continue").is(":checked")) { //保存后继续新增
                                        parent.layer.close(index);
                                        $(window.parent['f1'].document).find('.btn-search').click();
                                        window.location.reload();
                                    } else {
                                        $(window.parent['f1'].document).find('.btn-search').click();
                                        parent.layer.closeAll();
                                    }
                                }
                            });
                        } else {
                            parent.layer.alert('保存信息失败，请重新填写！');
                        }
                    }
                });
                return false;
            });
            return false;
        });
        $(".btn-close").off("click");
        $(".btn-close").on("click", function() {
            if (flag == false) {
                return;
            }
            var index = parent.layer.getFrameIndex(window.name);
            parent.layer.close(index);
        })
    });
});