/*
* 登录控件
* terry zhong
* 2017-8-2
* v1.0
*/
$(function () {
    layui.use(['layer', 'form'], function () {
        var layer = layui.layer;
        var form = layui.form;
        login(layer, form);
    });
    
});

var login = function (layer, form) {
    var $login = {
        userName: $('#username'),
        passWord: $('#password'),
        remember: $('#remember'),
        vcode: $('#vcode'),
        vcodeBox: $('#vcode-box'),
        errorMsg: $('.error-msg'),
        input: $('.layui-input'),
        vcodeImg: $('#vcodeImg')
    }

    $login.input.on('focus', function () {
        $(this).addClass('active');
    });
    $login.input.on('blur', function () {
        $(this).removeClass('active');
    });

    $login.vcode.on('click', function () {
        $(this).select();
    });

    if ($.cookie('remember') > 0) {
        $login.userName.val($.cookie('userName'));
        $login.remember.prop('checked', true);
        form.render();
        $('.layui-form-checkbox i').css('background', '#5FB878');
    }

    /**
     * 刷新图片验证码
     * @param target  设置图片验证码的dom元素或者jq选择器
     */
    var refreshValidateCode = function (target) {
        $(target).attr('src', '/valicode.shtml?' + Math.random());
    }

    $('#vcodeImg, #checkVcode').click(function () {
        refreshValidateCode('#vcodeImg');
    });

    $('body').keydown(function (e) {
        var e = e || event,
            keycode = e.which || e.keyCode;
        if (keycode == 13) {
            return checkForm();
        }
    });

    $('.form-submit').on('click', function () {
        return checkForm();
    });

    //检查是否为空值
    var checkEmptyVal = function (focusTarget, msg, value) {
        if (value.length == 0) {
            errorResult($login.errorMsg, msg, focusTarget);
            return false;
        }
        return true;
    }

    //表单提交
    function checkForm() {
        var $userNameVal = $.trim($login.userName.val()),
            $passWordVal = $login.passWord.val(),
            $vcodeVal = $.trim($login.vcode.val()),
            $rememberVal = $.trim($login.remember.val());

        if(!checkEmptyVal($login.userName, $jsLang.login.errorMsg1, $userNameVal)){
            return false;
        }

        if(!checkEmptyVal($login.passWord, $jsLang.login.errorMsg2, $passWordVal)){
            return false;
        }

        if (!$login.vcodeBox.is(':hidden') && !checkEmptyVal($login.vcode, $jsLang.login.errorMsg3, $vcodeVal)) {
            return false;
        }

        HC.ajax.post({
            url: '/login.shtml',
            contentType: 'application/x-www-form-urlencoded',
            processData: false,
            data: $.param({
                accid: $userNameVal,
                accpwd: $passWordVal,
                vcode: $vcodeVal
            }),
            success: function (data) {
                var $regBodyStatus = data.regBodyStatus,    //注册审核状态：CLOSED关闭,AUDITING待审核,AUDITED已审核,NOT_PASS未通过
                    $type = data.type,                      //用户类型：0员工,1司机,2管理员,3平台管理员
                    $regBodyId = data.regBodyId,            //企业主体ID
                    $reset = data.reset,                    //是否重置密码：true重置,false无重置
                    $goUrl = '';

                //记住帐号
                if ($login.remember.is(':checked')) {
                    $.cookie('userName', $userNameVal, { expires: 30 });
                    $.cookie('remember', 1, { expires: 30 });
                } else {
                    $.cookie('userName', '');
                    $.cookie('remember', 0);
                }

                //审核未通过  并没有完善过信息 
                if($regBodyStatus === 'NOT_PASS' || $regBodyStatus === 'NOT_INIT'){
                    //2管理员,3平台管理员 才能完善过信息
                    if($type == 2 || $type == 3){
                        window.location.href = '/view/regist/index.html#step2';
                        return;
                    }
                    layer.alert('您没有权限填写详细信息！');
                    return;
                }

                //正在审核
                if($regBodyStatus === 'AUDITING'){
                    layer.alert('您的信息正在审核中，请耐心等候！');
                    return;
                }

                //不等于AUDITED的情况
                if($regBodyStatus !== 'AUDITED'){
                    layer.alert('登录异常，请联系管理员！');
                    return;
                }

                //审核通过的  可以进入系统了

                var callBack = function(url) {
                     // 页面跳转之前，先获取校验规则
                    HC.ajax.get('/validationJson.shtml', {
                        // TODO: 没有获取到校验规则时的错误回调
                        success: function (responseData, textStatus, jqXHR) {
                            // 保存校验规则到本地
                            HC.layuiData(HC.constVariable.HC_TABLE_NAME, {
                                key: HC.constVariable.VALIDATION_KEY_NAME,
                                value: responseData
                            });
                        },
                        complete: function () {
                            window.location.href = url;
                        }
                    });
                }
                
                //审核通过且密码需重置
                if ($reset) {
                    layer.alert('您的密码已重置，请去修改密码！', function() {
                        callBack('/view/tms/user/editPassword.html');
                    });
                    return;
                }

                //普通登录流程
                callBack('/view/index.html');
               
            },
            codeError: function (data) {
                var errorCode = data.code;
                var codeErrorHandle = {
                    ERROR_IMG_VALIDATE_CODE: function () {
                        $login.vcodeBox.slideDown();
                        refreshValidateCode('#vcodeImg');
                    }
                };
                codeErrorHandle[errorCode] && codeErrorHandle[errorCode]();
            },
            alert: function(data) {
                errorResult($login.errorMsg, data.errorMessage);
            }

        });

        return false;
    }
}

//错误
function errorResult($errObj, $txt, $obj) {
    if (typeof $obj != 'undefined') {
        $obj.focus();
        $obj.addClass('active');
    }
    $errObj.text($txt);
}