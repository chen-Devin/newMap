/***********注册**************/
layui.use(['form', 'layer', 'laydate'], function () {
    var form = layui.form,
        layer = layui.layer,
        laydate = layui.laydate,
        $ = layui.jquery;


    //AJAX回调变量
    var $ajax = {
        isUserName: false,  //判断用户名是否唯一
        surePwd: false,   //判断密码是否一致
        isSend: false   //判断是发送短信验证码还是提交
    }
    var exixtSocialCode = {
        person: {},
        company: {}
    };
    var exixtSocialCodeData = {
        person: {},
        company: {}
    };;

    //注册账号
    var registerAccount = function () {
        var formItem = {
            userName: $('#username'),
            passWord: $('#password'),
            passWord1: $('#password1'),
            vcode: $('#vcode'),
            mobile: $('#mobile'),
            smsCode: $('#smscode'),
            inviteCode: $('#invitecode'),
            checkStatus: $('#checkstatus')
        }

        //focus时给出输入提示
        bindTipsEvent(formItem);

        //失去焦点时判断用户名是否唯一
        $(formItem.userName).blur(function () {
            isOnlyUserName($(this), $jsLang.userName.errorMsg4);

        });

        //失去焦点时判断密码是否一致
        $(formItem.passWord1).blur(function () {
            var pwd = $.trim(formItem.passWord.val());
            var pwd1 = $.trim(formItem.passWord1.val());
            if (pwd === '' || pwd1 === '') {
                return;
            }
            if (pwd !== pwd1) {
                checkResult($(this), $jsLang.passWord1.errorMsg4, 2);
                $ajax.surePwd = false;
                return;
            }
            checkResult($(this), '', 3);
            $ajax.surePwd = true;
        });

        //手机格式正确则允许点击发送短信验证码
        $(formItem.mobile).on('blur input propertychange', function () {
            if ($("#check-sms").data("sms") === "sending") {
                return;
            }
            if ($(this).val() === '' || !HCValidator.verifyValue('mobile', $(this).val()).isValidated) {
                $("#check-sms").removeClass("btn-active");
                return;
            }
            $("#check-sms").addClass("btn-active");
        });

        //发送短信验证码
        $('#register-account').on('click', '.btn-active', function () {
            $ajax.isSend = false;
            $('#smscode').removeAttr('lay-verify');
            $('#step1-btn').click();
            $('#smscode').attr('lay-verify', 'required');
            
            if ($ajax.isSend) {
                sendSMS(formItem.vcode, formItem.mobile);
            }

        });

        //回车提交
        $(document).keydown(function (e) {
            var e = e || event,
                keycode = e.which || e.keyCode;
            if (keycode == 13) {
                $('#step1-btn').click();
            }
        });

        //注册帐号啦
        form.on('submit(submit1)', function (data) {
            if (!bizUtil.validator.verifyContainer($('#register-account form').not('#smscode')) || !$ajax.isUserName || !$ajax.surePwd) {
                return false;
            }
            $ajax.isSend = true;

            if (!($('#smscode').attr('lay-verify') === 'required')) {
                return false;
            }

            if (!formItem.checkStatus.is(':checked')) {
                checkResult(formItem.checkStatus.parent(), $jsLang.checkStatus.errorMsg1, 2);
                return false;
            }

            checkResult(formItem.checkStatus.parent(), '', 3);

            HC.ajax.post({
                url: "/register/stepOne.shtml",
                data: {
                    vcode: $.trim(formItem.smsCode.val()),
                    accid: $.trim(formItem.userName.val()),
                    accpwd: $.trim(formItem.passWord1.val()),
                    mobile: $.trim(formItem.mobile.val())
                },
                beforeSend: function (XMLHttpRequest) {
                    prohibitSubmit($('#step1-btn'));
                },
                success: function (d) {
                    window.location.href = 'index.html#step2';
                    window.location.reload();
                },
                codeError: function (d) {
                    var errorCode = d.code;
                    var codeErrorHandle = {
                        ERROR_SMS_VALIDATE_CODE: function () {
                            checkResult(formItem.smsCode, d.msg, 2);
                        },
                        ERROR_IMG_VALIDATE_CODE: function () {
                            checkResult(formItem.vcode, d.msg, 2);
                            refreshValidateCode('#vcodeImg');
                        },
                        ERROR_USER_EXIST: function () {
                            checkResult(formItem.userName, d.msg, 2);
                        },
                    };
                    if (!codeErrorHandle[errorCode]) {
                        layer.alert(d.msg);
                        return;
                    }

                    codeErrorHandle[errorCode]();
                },
                alert: function (d) {
                },
                complete: function (XMLHttpRequest, textStatus) {
                    allowSubmit($('#step1-btn'));
                }

            });

            return false;
        });

        //用户名是否唯一
        function isOnlyUserName(userName, errorMsg) {
            if ($.trim(userName.val()) === '') {
                return;
            }
            HC.ajax.get({
                url: '/register/checkAccid.shtml',
                data: {
                    accid: $(userName).val() 
                },
                success: function(d) {
                    if(d !== true){
                        checkResult(userName, errorMsg, 2);
                        $ajax.isUserName = false;
                        return;
                    }

                    checkResult(userName, '', 3);
                    $ajax.isUserName = true;
                    
                },
                alert: function (d) {
                },
            });
        }

        //发送短信验证码
        function sendSMS(vcode, mobile) {
            HC.ajax.post({
                url: '/register/sendSMS.shtml',
                contentType: 'application/x-www-form-urlencoded',
                processData: false,
                data: $.param({
                    vcode: $.trim(vcode.val()),
                    mobile: $.trim(mobile.val())  
                }),
                success: function (d) {
                    $("#check-sms").data("sms", "sending").removeClass("btn-active");
                    getSms($('#check-sms'));
                },
                codeError: function (d) {
                    var errorCode = d.code;
                    var codeErrorHandle = {
                        ERROR_IMG_VALIDATE_CODE: function () {
                            checkResult(formItem.vcode, d.msg, 2);
                            refreshValidateCode('#vcodeImg');
                            $("#check-sms").addClass("btn-active");
                        }
                    };
                    codeErrorHandle[errorCode] && codeErrorHandle[errorCode]();
                },
                alert: function (d) {
                    
                },
                beforeSend: function (XMLHttpRequest) {
                    $("#check-sms").removeClass("btn-active");
                }
            });
        }

        //短信验证码倒计时
        var $cutTime = 60;
        var timer = null;
        function getSms($obj) {
            clearTimeout(timer);
            if ($cutTime == 0) {
                $obj.html('获取短信验证码');
                $("#check-sms").removeData("sms").addClass("btn-active");
                $cutTime = 60;
                return;
            } else {
                $obj.html('重新发送<i>（' + $cutTime + '）</i>');
                $cutTime--;
            }
            timer = setTimeout(function () {
                getSms($obj)
            }, 1000);
        }

        /**
        * 刷新图片验证码
        * @param target  设置图片验证码的dom元素或者jq选择器
        */
        function refreshValidateCode(target) {
            $(target).attr('src', '/valicode.shtml?' + Math.random());
        }

        $('#vcodeImg, #check-vcode').click(function () {
            refreshValidateCode('#vcodeImg');
        });


    };

    //注册第二步的一些公共方法
    var commonStep2 = function (data) {
        //城市联动
        $('#regDistrict').district(form);
        $('#linkDistrict').district(form);

        //角色联动
        getBusinessData('1', '#complete-company', data.businessWorker, data.businessScope);
        getBusinessData('0', '#complete-person', data.businessWorker, data.businessScope);

        changeBusinessScope('businessRole1', '#complete-company', data.businessScope);
        changeBusinessScope('businessRole2', '#complete-person', data.businessScope);

        //填充手机号
        $('input[name="mobile"]').val(data.linkmanMobile);

    }

    //注册第二步(企业)
    var completeInfoOfCompany = function (data) {
        var formItem = {
            usc: $('#complete-company input[name="usc"]'),
            coName: $('#complete-company input[name="coName"]'),
            coNameShort: $('#complete-company input[name="coNameShort"]'),
            province: $('#complete-company select[name="regProvince"]'),
            city: $('#complete-company select[name="regCity"]'),
            county: $('#complete-company select[name="regCounty"]'),
            street: $('#complete-company select[name="regStreet"]'),
            regAreaId: $('#complete-company input[name="regAreaId"]'),
            regAddress: $('#complete-company input[name="regAddress"]'),
            busnissTimeB: $('#complete-company input[name="busnissTimeB"]'),
            busnissTimeE: $('#complete-company input[name="busnissTimeE"]'),
            businessLicenseAffix: $('#complete-company input[name="imgUrl"]'),
            linkman: $('#complete-company input[name="trueName"]'),
            linkmanEmail: $('#complete-company input[name="email"]'),
        }

        //focus时给出输入提示
        bindTipsEvent({
            socialCode: formItem.usc,
            companyFullName: formItem.coName,
            companyShortName: formItem.coNameShort,
            address: formItem.regAddress,
            trueName: formItem.linkman,
            email: formItem.linkmanEmail
        });

        var setInfo = function (d) {
            if (d != null) {
                formItem.coName.val(d.coName);
                formItem.coNameShort.val(d.coNameShort);
                formItem.regAreaId.val(d.regAreaId || d.linkmanAreaId);
                $('#regDistrict').district(form, d.regAreaId || d.linkmanAreaId)
                formItem.regAddress.val(d.regAddress || d.linkmanAddress);
                formItem.linkman.val(d.linkman);
                formItem.linkmanEmail.val(d.companyEmail);
            } else {
                formItem.coName.val('');
                formItem.coNameShort.val('');
                formItem.regAreaId.val('');
                $('#regDistrict').district(form);
                $('#regDistrict select').val('');
                formItem.regAddress.val('');
                formItem.linkman.val('');
                formItem.linkmanEmail.val('');
                form.render('select');
            }
        }

        fillInfo(formItem, data, setInfo);

        var exixtTipsCode = {
            'type': 'company',
            'ERROR_USC_ILLEGAL': '统一社会代码不合法',
            'ERROR_USC_USED': '统一社会代码已被使用',
            'ERROR_ILLEGAL_ARGUMENT': '统一社会代码格式不正确',
            'id': data.regBodyId,
            'run': ''
        }

        //失去焦点时判断统一信用社会代码
        $(formItem.usc).blur(function () {
            if ($.trim($(this).val()).length && HCValidator.verifyValue('usc', $.trim($(this).val())).isValidated) {
                validateSocialCode($(this), function (d) {
                    setInfo(d);
                }, exixtTipsCode);
            }
        });

        //回车提交
        $(document).keydown(function (e) {
            var e = e || event,
                keycode = e.which || e.keyCode;
            if (keycode == 13) {
                if ($('#complete-company').css('display') !== 'none') {
                    $('#step2-btn').click();
                }

            }
        });

        form.on('submit(submit-company)', function (d) {
            if (!bizUtil.validator.verifyContainer($('#complete-company form'))) {
                return false;
            }
            var usc = d.field.usc;
            //验证统一社会代码
            if (!verifyUsc(exixtTipsCode, usc, formItem, setInfo)) {
                return false;
            }

            //获取城市id
            var $index2 = $('#regDistrict select').not(':disabled').length - 1,
                $indexVal2 = $('#regDistrict select').eq($index2).val();
            if ($indexVal2 === '') {
                checkResult($('input[name="regAreaId"]'), $jsLang.district.errorMsg1, 2);
                return false;
            } else {
                checkResult($('input[name="regAreaId"]'), '', 3);
            }

            //获取上传图片id
            var businessLicenseAffix = $('#imgUrl').val();
            if (businessLicenseAffix === '') {
                checkResult($('#imgUrl'), $jsLang.imgUrl.errorMsg1, 2);
                return false;
            }

            //获取业务范围id
            var businessScopeArr = getScopeValue('#complete-company');
            if (businessScopeArr.length === 0) {
                checkResult($('#complete-company input[name="businessScope"]'), $jsLang.businessScope.errorMsg1, 2);
                return false;
            } else {
                checkResult($('#complete-company input[name="businessScope"]'), '', 3);
            }

            var saveData = {
                id: data.regBodyId,
                bodyType: "1",
                usc: $.trim(d.field.usc),
                coName: $.trim(d.field.coName),
                coNameShort: $.trim(d.field.coNameShort),
                regAreaId: $indexVal2,
                regAddress: $.trim(d.field.regAddress),
                regAreaName: getRegAreaName(formItem),
                busnissTimeB: new Date($.trim(d.field.busnissTimeB)).getTime(),
                busnissTimeE: new Date($.trim(d.field.busnissTimeE)).getTime(),
                businessLicenseAffix: businessLicenseAffix,
                businessWorker: $.trim(d.field.businessWorker),
                businessScope: businessScopeArr,
                linkman: $.trim(d.field.trueName),
                linkmanMobile: $.trim(d.field.mobile),
                linkmanEmail: $.trim(d.field.email)
            }

            sendStep2Ajax(formItem, saveData, $('#step2-btn'));
            return false;
        });
    }

    //注册第二步(个人)
    var completeInfoOfPerson = function (data) {
        var formItem = {
            usc: $('#complete-person input[name="usc"]'),
            coName: $('#complete-person input[name="zhName"]'),
            province: $('#complete-person select[name="linkProvince"]'),
            city: $('#complete-person select[name="linkCity"]'),
            county: $('#complete-person select[name="linkCounty"]'),
            street: $('#complete-person select[name="linkStreet"]'),
            regAreaId: $('#complete-person input[name="linAreaId"]'),
            regAddress: $('#complete-person input[name="regAddress"]'),
            linkman: $('#complete-person input[name="trueName"]'),
            linkmanEmail: $('#complete-person input[name="email"]'),
        }

        bindTipsEvent({
            idCard: formItem.usc,
            trueName2: formItem.coName,
            address: formItem.regAddress,
            trueName: formItem.linkman,
            email: formItem.linkmanEmail
        });

        var setInfo = function (d) {
            if (d != null) {
                formItem.coName.val(d.coName);
                formItem.regAreaId.val(d.regAreaId || d.linkmanAreaId);
                $('#linkDistrict').district(form, d.regAreaId || d.linkmanAreaId)
                formItem.regAddress.val(d.regAddress || d.linkmanAddress);
                formItem.linkman.val(d.linkman);
                formItem.linkmanEmail.val(d.companyEmail);
            } else {
                formItem.coName.val('');
                formItem.regAreaId.val('');
                $('#linkDistrict').district(form);
                $('#linkDistrict select').val('');
                formItem.linkman.val('');
                formItem.linkmanEmail.val('');
                formItem.regAddress.val('');
                form.render('select');
            }
        }

        fillInfo(formItem, data, setInfo);

        var exixtTipsCode = {
            'type': 'person',
            'ERROR_IDNUMBER_ILLEGAL': '身份证号不合法',
            'ERROR_IDNUMBER_USED': '身份证号已被使用',
            'ERROR_ILLEGAL_ARGUMENT': '身份证号格式不正确',
            'id': data.regBodyId,
            'run': ''
        }

        //失去焦点时判断身份证号
        $(formItem.usc).blur(function () {
            if ($.trim($(this).val()).length && HCValidator.verifyValue('idNumber', $.trim($(this).val())).isValidated) {
                validateSocialCode($(this), function (d) {
                    setInfo(d);
                }, exixtTipsCode);
            }
        });

        //回车提交
        $(document).keydown(function (e) {
            var e = e || event,
                keycode = e.which || e.keyCode;
            if (keycode == 13) {
                if ($('#complete-person').css('display') !== 'none') {
                    $('#step3-btn').click();
                }
            }
        });

        form.on('submit(submit-person)', function (d) {
            if (!bizUtil.validator.verifyContainer($('#complete-person form'))) {
                return false;
            }
            var usc = d.field.usc;
            //验证身份证
            if (!verifyUsc(exixtTipsCode, usc, formItem, setInfo)) {
                return false;
            }

            //获取城市id
            var $index2 = $('#linkDistrict select').not(':disabled').length - 1,
                $indexVal2 = $('#linkDistrict select').eq($index2).val();

            if ($indexVal2 === '') {
                checkResult($('input[name="linAreaId"]'), $jsLang.district.errorMsg1, 2);
                return false;
            } else {
                checkResult($('input[name="linAreaId"]'), '', 3);
            }

            //获取上传图片id
            var positiveImg = $('#imgUrl1').val();
            var backeImg = $('#imgUrl2').val();
            var businessLicenseAffix = positiveImg + ',' + backeImg;

            if (positiveImg === '') {
                checkResult($('#imgUrl1'), $jsLang.imgUrl1.errorMsg1, 2);
                return false;
            }

            if (backeImg === '') {
                checkResult($('#imgUrl2'), $jsLang.imgUrl2.errorMsg1, 2);
                return false;
            }

            //获取业务范围id
            var businessScopeArr = getScopeValue('#complete-person');
            if (businessScopeArr.length === 0) {
                checkResult($('#complete-person input[name="businessScope"]'), $jsLang.businessScope.errorMsg1, 2);
                return false;
            } else {
                checkResult($('#complete-person input[name="businessScope"]'), '', 3);
            }

            var saveData = {
                id: data.regBodyId,
                bodyType: "0",
                usc: $.trim(d.field.usc),
                coName: $.trim(d.field.zhName),
                coNameShort: $.trim(d.field.zhName),
                regAreaId: $indexVal2,
                regAddress: $.trim(d.field.regAddress),
                regAreaName: getRegAreaName(formItem),
                businessLicenseAffix: businessLicenseAffix,
                businessWorker: $.trim(d.field.businessWorker),
                businessScope: businessScopeArr,
                linkman: $.trim(d.field.trueName),
                linkmanMobile: $.trim(d.field.mobile),
                linkmanEmail: $.trim(d.field.email)
            }

            sendStep2Ajax(formItem, saveData, $('#step3-btn'));
            return false;
        });
    }

    //focus时给出输入提示
    function bindTipsEvent(formItem) {
        for (var key in formItem) {
            !(function (items) {
                $(formItem[items]).focus(function () {
                    checkResult($(this), $jsLang[items.replace('2', '')].normMsg, 1);
                }).blur(function () {
                    checkResult($(this), '', 3);
                });
            })(key);
        }
    }

    //焦点事件，给出对应的提示
    function checkResult(obj, txt, type, isFocus) {
        switch (type) {
            case 1:
                obj.removeClass('error').addClass('active');
                obj.parent().find('.form-error').removeClass('check').text(txt);
                break;
            case 2:
                isFocus ? obj.focus() : '';
                obj.removeClass('active').addClass('error');
                obj.parent().find('.form-error').addClass('check').text(txt);
                break;
            case 3:
                obj.removeClass('active');
                obj.removeClass('error');
                obj.parent().find('.form-error').removeClass('check').text('');
                break;
        }
    }

    //获取业务角色
    function getBusinessData(bodyType, target, value, businessScope) {
        HC.ajax.get({
            url: '/common/bussinessRole/roles.shtml',
            data: {
                type: bodyType
            },
            success: function (data) {
                var businessRoleArr = []
                $.each(data, function (i, d) {
                    if (d.id == value) {
                        businessRoleArr.push('<option value="' + d.id + '" selected="selected">' + d.name + '</option>');
                    } else {
                        businessRoleArr.push('<option value="' + d.id + '">' + d.name + '</option>');
                    }
                });
                $(target + ' select[name="businessWorker"]').append(businessRoleArr.join(''));
                getScope(target, value, businessScope);
                form.render('select');
            }
        });
    }

    //选择业务角色，显示相对应的业务范围
    function changeBusinessScope(lFilter, target, value) {
        form.on('select(' + lFilter + ')', function (data) {
            $(target + ' div[name="scope-box"]').html('');
            getScope(target, data.value);
        });
    }

    //获取业务范围
    function getScope(target, businessWorkerId, businessScope) {
        if (businessWorkerId === '' || businessWorkerId === null || businessWorkerId === undefined) {
            $(target + ' div[name="scope-box"]').html('<span style="color:#999">请先选择业务范围</span>');
            return;
        }
        HC.ajax.get({
            url: '/common/bussinessRole/scopes.shtml',
            data: {
                roleId: businessWorkerId
            },
            success: function (data) {
                var businessScopeArr = []
                $.each(data, function (i, d) {
                    if (d.hasDefault) {
                        businessScopeArr.push('<li><input type="checkbox" name="bscope" lay-skin="primary" value="' + d.scopeId + '" title="' + d.scopeName + '" checked="checked"></li>');
                    } else {
                        businessScopeArr.push('<li><input type="checkbox" name="bscope" lay-skin="primary" value="' + d.scopeId + '" title="' + d.scopeName + '"></li>');
                    }
                });
                $(target + ' div[name="scope-box"]').append('<ul class="item-list">' + businessScopeArr.join('') + '</ul>');

                if (data.length === 0) {
                    $(target + ' div[name="scope-box"]').html('<span style="color:#999">无业务范围</span>');
                }

                //如果有值则选中
                if (businessScope && $(target).css('display') !== 'none') {
                    var businessScopeArr = businessScope;
                    $(target + ' div[name="scope-box"] input[name="bscope"]').each(function () {
                        var scopeContext = $(this);
                        $.each(businessScopeArr, function (index, val) {
                            if (val == scopeContext.val()) {
                                scopeContext.prop('checked', true);
                            }
                        });
                    });
                }

                form.render('checkbox');
            }
        });
    }

    //根据保存在js里的结果  不通过请求直接判断社会信用代码注册过没有或者格式是否正确
    function validateUSCResult(target, $val, callBack, exixtTipsCode) {
        var tipsType = exixtTipsCode.type;
        if (exixtSocialCode[tipsType][$val] && exixtSocialCode[tipsType][$val] === "run") {
            if (typeof callBack === 'function') {
                callBack(exixtSocialCodeData[tipsType][$val]);
            }
            checkResult($(target), "", 3);

            return false;
        } else if (exixtSocialCode[tipsType][$val]) {
            checkResult($(target), exixtTipsCode[exixtSocialCode[tipsType][$val]], 2);
            if (typeof callBack === 'function') {
                callBack(null);
            }
            return false;
        }

        return true;
    }

    //判断社会信用代码或者身份证注册过没有或者格式是否正确
    function validateSocialCode(target, callBack, exixtTipsCode) {
        var tipsType = exixtTipsCode.type;
        var $val = $.trim($(target).val());

        if (!validateUSCResult(target, $val, callBack, exixtTipsCode)) {
            return false;
        }

        HC.ajax.get({
            url: '/register/checkUsedUSC.shtml',
            data: {
                id: (exixtTipsCode.id || ''), 
                usc: $val
            },
            success: function (d) {
                exixtSocialCode[tipsType][$val] = "run";
                getCompanyData($val, callBack, exixtTipsCode.type);
            },
            codeError: function (d) {
                if (!exixtTipsCode[d.code]) {
                    layer.alert(d.msg);
                    callBack();
                    return;
                } 

                checkResult($(target), d.msg || exixtTipsCode[d.code], 2);
                exixtSocialCode[tipsType][$val] = d.code;
                callBack();
            },
            alert () {

            }
        });
    }

    //判断库里有没有这个社会信用代码或者身份证号对应的信息，有的话填充
    function getCompanyData($val, callBack, codeType) {
        HC.ajax.get({
            url: '/ucenter/standard/common/companyStandard/getCompanyByUsc.shtml',
            data: {
                usc: $val
            },
            success: function (d) {
                exixtSocialCodeData[codeType][$val] = d;
                callBack(d);
            },
            codeError: function (d) {
                callBack();
            }

        });
    }

    //禁止提交
    function prohibitSubmit(target) {
        $(target).addClass('prohibit-click').prop('disabled', true);
    }

    //允许提交
    function allowSubmit(target) {
        $(target).removeClass('prohibit-click').prop('disabled', false);
    }

    //退出
    function logout() {
        HC.ajax.post({
            url: '/logout.shtml',
            beforeSend: function () { },
            success: function (d) {
                top.location.href = '/';
            }
        });
        return false;
    }

    //提交第二步的信息
    function sendStep2Ajax(formItem, saveData, submitBtn) {
        HC.ajax.post({
            url: "/register/stepTwo.shtml",
            data: saveData,
            beforeSend: function (XMLHttpRequest) {
                prohibitSubmit($(submitBtn));
            },
            success: function (d) {
                window.location.href = 'index.html#step3';
                window.location.reload();

            },
            codeError: function (d) {
                var errorCode = d.code;
                var codeErrorHandle = {
                    ERROR_USER_NOT_EXIST: function () {
                        layer.alert(d.msg, function() {
                            window.location.href = 'index.html';
                        });
                    },
                    ERROR_COMPANY_EXIST: function () {
                        layer.alert(d.msg, function() {
                            window.location.href = 'index.html';
                        });
                    }
                };
                if(codeErrorHandle[errorCode]){
                    codeErrorHandle[errorCode]();
                    return;
                }

                checkResult(formItem.usc, d.msg, 2);

            },
            alert: function () {
                
            },
            complete: function (XMLHttpRequest, textStatus) {
                allowSubmit($(submitBtn));
            }
        });
    }

    //获取选中城市里的文本
    function getRegAreaName(formItem) {
        var province = $(formItem.province).find('option:selected').text();
        var city = $(formItem.city).find('option:selected').text();
        var county = $(formItem.county).find('option:selected').text();
        var street = $(formItem.street).find('option:selected').text();
        var addrArr = [province, city, county, street].join(',').replace(/,请选择/g, '');

        addrArr = (addrArr === '请选择') ? '' : addrArr;

        return addrArr;
    }

    //得到需要提交的业务范围值(数组类型)
    function getScopeValue(target) {
        var businessScopeItem = $(target + ' input[name="bscope"]:checked');
        var businessScope = [];
        businessScopeItem.each(function (i, d) {
            businessScope.push(Number($(this).val()));
        });
        return businessScope;
    }

    //设置时间
    function renderTime(target, val, option) {
        if (val) {
            laydate.render($.extend({
                elem: target,
                lang: 'cn',
                value: new Date(parseInt(val)).toLocaleString().split(' ')[0].replace(/\//g, '-')
            }, option));
        }
    }

    //regBodyStatus为被驳回(NOT_PASS)时填充信息
    function fillInfo(formItem, data, setInfoFn) {
        if (data == null || data.regBodyStatus !== 'NOT_PASS') {
            return;
        }

        var commonFill = function () {
            setInfoFn(data);
            $('.cut_btn').hide();
            $('#no-pass').show();
            formItem.usc.val(data.usc);
        }

        if (data.bodyType == '1' && formItem.businessLicenseAffix) {
            commonFill();

            renderTime('#dateB', data.busnissTimeB, {
                max: 0
            });

            renderTime('#dateE', data.busnissTimeE, {
                min: 0
            });

            if (data.businessLicenseAffix && data.businessLicenseAffix.length > 0) {
                formItem.businessLicenseAffix.val(data.businessLicenseAffix);
                $('#upload-btn').html('重新上传');
                setImg('#upload-imgs', data.businessLicenseAffix);
            }

        } else if (data.bodyType == '0') {
            commonFill();

            if (data.businessLicenseAffix && data.businessLicenseAffix.length > 0) {
                var imgArr = data.businessLicenseAffix.split(',');
                if (imgArr.length > 0) {
                    $('#imgUrl1').val(imgArr[0]);
                    $('#upload-btn1').html('重新上传正面');
                    setImg('#upload-imgs1', imgArr[0]);
                }
                if (imgArr.length > 1) {
                    $('#imgUrl2').val(imgArr[1]);
                    $('#upload-btn2').html('重新上传反面');
                    setImg('#upload-imgs2', imgArr[1]);
                }
            }

        }

    }

    var verifyValue = function (usc, formItem, exixtTipsCode) {
        if (exixtSocialCode[exixtTipsCode.type][usc] !== 'run') {
            validateUSCResult(formItem.usc, usc, '', exixtTipsCode);
            return false;
        }
        return true;
    }

    //提交时 验证统一社会代码或者身份证
    function verifyUsc(exixtTipsCode, usc, formItem, setInfoFn) {
        if (exixtSocialCode[exixtTipsCode.type][usc]) {
            if (!verifyValue(usc, formItem, exixtTipsCode)) {
                return false;
            }

        } else {
            validateSocialCode(formItem.usc, function (d) {
                setInfoFn(d);
            }, exixtTipsCode);
            if (!verifyValue(usc, formItem, exixtTipsCode)) {
                return false;
            }
        }
        return true;
    }

    function setImg(target, imgId) {
        $(target).html('<a href="/ucenter/download/' + imgId +
            '.shtml" target="_blank"><img src="/ucenter/download/' + imgId +
            '.shtml" alt="' + imgId + '" class="layui-upload-img"></a>');
    }

    //判断该是注册的哪一步
    var judgementStep = (function () {
        var reHash = location.hash.slice(1);
        $('.panel-main').hide();

        if (reHash === 'step1' || reHash === '') {
            $('#register-account').show();
            registerAccount();

        } else if (reHash === 'step2') {
            $.get({
                url: '/ucenter/centre/permi/company/.shtml',
                success: function (d) {
                    var objs = d.objects;
                    if (d.code !== 'SUCCESS') {
                        window.location.href = '/';
                    }

                    //只有为NOT_PASS和NOT_INIT才能进入第二步
                    if (objs && (objs.regBodyStatus === 'NOT_PASS' || objs.regBodyStatus === 'NOT_INIT' || objs.linkmanMobile)) {
                        commonStep2(objs);

                        //根据主体id去判断是个体还是企业还是未初始化(0个体1企业null企业)
                        var typeMap = ['person', 'company'],
                            typeIndex = (objs.bodyType == null) ? 1 : objs.bodyType;

                        $('#complete-' + typeMap[typeIndex]).show();
                        completeInfoOfPerson(objs);
                        completeInfoOfCompany(objs);
                    } else {
                        window.location.href = '/';
                    }

                },
                error: function () {
                    window.location.href = '/';
                }

            });
        } else if (reHash === 'step3') {
            $('#register-successful').show();

            //页面跳转倒计时
            var $cutTime = 10;
            goUrl($('#sec'));

            function goUrl($obj) {
                if ($cutTime == 0) {
                    logout();
                    return;
                } else {
                    $obj.html($cutTime);
                    $cutTime--;
                }
                setTimeout(function () { goUrl($obj) }, 1000);
            }
        }
    })();

});
