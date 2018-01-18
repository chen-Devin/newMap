/**
 * @version 1.0
 * @file 统一校验器 的测试文件，如果测试用例没有通过，则会在浏览器控制台打印失败的断言。
 *      该文件目前仅测试 HCValidator.verifyBySpecificRule 和 HCValidator.verifyByNormalRule 方法（后续考虑测试 HCValidator.verifyValue 方法）
 */
(function (validationMap) {
    var verifyBySpecificRule = HCValidator.verifyBySpecificRule;
    var verifyByNormalRule = HCValidator.verifyByNormalRule;

    // 断言规则
    var assertRule = function (ruleName, value, expectResult) {
        var validationRule = validationMap[ruleName];
        if (!validationRule) {
            console.log('规则名[%s]找不到对应映射，已跳过', ruleName);

            return;
        }

        var ruleType = validationRule.type;
        var verifyResult;
        var verifyTypeText = '';

        // 校验【特定规则】
        if (ruleType === 1) {
            // 统一转成boolean值，防止有些操作返回 类true值 但不适用后面的assert时的判断
            verifyResult = !!verifyBySpecificRule(ruleName, value);
            verifyTypeText = '【特定规则】';
        }
        // 校验【通用规则】
        else {
            verifyResult = !!verifyByNormalRule(ruleName, value);
            verifyTypeText = '【通用规则】';
        }

        console.assert((verifyResult === expectResult), {
            // 通过空格，控制对象展开时的字段顺序
            '   断言信息': validationRule.msg,
            '  应用规则': ruleName,
            ' 校验的值': value,
            '校验类型': verifyTypeText
        });
    };

    // --------------- 测试用例 ---------------

    // 校验规则 测试案例 数组
    var validationRuleAssertCase = [
        // 数组元素的顺序为 [ruleName, value, expectResult]

        // 为空校验
        ['nul', '', true],
        ['nul', 'ffs', false],
        // 非空校验
        ['notBlank', 'ffs', true],
        ['notBlank', '', false],
        // 待补充【特定规则】校验案例： min max range size digits past future

        // 帐号长度须大于5位
        ['account', 'hello', true],
        ['account', 'longNameLongName', true],
        ['account', 'haha', false],
        // 简称长度须小于20位
        ['shortName', '我是简称名字', true],
        ['shortName', '我是简称名字，但名字很长因为麻麻说名字长才不会跟人重复', false], // length:27
        // 公司名称长度须在2~50之间
        ['companySize', '这个名字长度就合适', true],
        ['companySize', '短', false],
        ['companySize', 'a long name.. The name doesn\'t repeat someone else.', false], // length:51
        // 密码长度须在6~20之间
        ['pwdSize', 'my password', true],
        ['pwdSize', 'longNameLongNameLongName', false],
        ['pwdSize', '短密码', false],
        // 部门名称长度须在2~50位之间
        ['departmentSize', '研发部', true],
        ['departmentSize', '啥', false],
        ['departmentSize', 'a long department name.. The name doesn\'t repeat someone else.', false], // length:62
        // 职位名称长度须在0~20位之间
        ['positionSize', '', true],
        ['positionSize', '首席架构师', true],
        ['positionSize', '不就是一个title嘛非整得这么长 看过不了校验了吧', false],

        // 车牌号
        ['carNo', '桂E10001', true],
        ['carNo', '中G3001', false],
        ['carNo', '京P250', false],
        ['carNo', '有这种车牌吗', false],
        // 输入的数字非小于1亿2位小数
        ['billionDecimals2', '59964554.23', true],
        ['billionDecimals2', '90000000.99', true],
        ['billionDecimals2', '23674.233', false],
        ['billionDecimals2', 'a200.88', false],
        // 公司名称由中英文、数字、_、-、及半角全角输入法下的（）
        ['companyRegex', '航程科技（中国）有限公司', true],
        ['companyRegex', '微软(航程)实验室-SIMPLE', true],
        ['companyRegex', 'GAMFT Technology Co. Ltd', false],
        ['companyRegex', '我有没有特殊字符？', false],
        // 2位小数
        ['decimals2', '12.86', true],
        ['decimals2', '100.', true],
        ['decimals2', '12.901', false],
        ['decimals2', '12N.93', false],
        // 输入的数字非小数
        ['decimals', '5698.465', true],
        ['decimals', '666', true],
        ['decimals', '89X8', false],
        // 邮箱地址
        ['email', 'grass@hcwanli.com', true],
        ['email', 'www.qq.com', false],
        ['email', 'sdfsdgsdf', false],
        ['email', 'sd@sdfsdf.', false],
        ['email', 'sd@sdfsdf_', false],
        ['email', 'sds.dfsdf@', false],
        // 身份证号（待补充正确格式的身份证号）
        ['idNumber', '123456789012345678', true],
        ['idNumber', '123456789', false],
        ['idNumber', '448454127981351DD', false],
        // 输入的数字非整数
        ['integers', '-100', true],
        ['integers', '100', true],
        ['integers', '0', true],
        ['integers', '100.123', false],
        ['integers', '-100.123', false],
        // IP
        ['ip', '127.0.0.1', true],
        ['ip', '220.220.200', false],
        ['ip', '220.360.200.2', false],
        ['ip', '220.220.200.2011', false],
        ['ip', 'A20.220.200.201', false],
        // 手机号码
        ['mobile', '13800138000', true],
        ['mobile', '17012345678', true],
        ['mobile', '13800', false],
        ['mobile', '10086', false],
        // 输入的数字非正小数
        ['positiveDecimals', '100.5', true],
        ['positiveDecimals', '1000', true],
        ['positiveDecimals', '-500', false],
        // 输入的数字非正整数
        ['positiveIntegers', '666', true],
        ['positiveIntegers', '-956', false],
        ['positiveIntegers', 'sdvd', false],
        // 邮政编码（6位）
        ['post', '515000', true],
        ['post', 'A536000', false],
        ['post', '10086', false],
        // 密码由大写字母、小写字母和数字两种以上组合
        ['pwdRegex', 'HelloWorld', true],
        ['pwdRegex', 'hao123', true],
        ['pwdRegex', 'helloworld', false],
        ['pwdRegex', '123456', false],
        // QQ号
        ['qq', '10000', true],
        ['qq', '123456789', true],
        ['qq', '1234', false],
        ['qq', '123DEF', false],
        // 电话号码
        ['tele', '(0755)88669999', true],
        ['tele', '（0755）88669999', true],
        ['tele', '812345', false],
        ['tele', 'abcdef', false],
        // URL
        ['url', 'http://apple.ms.com/path?q=1#top', true],
        ['url', 'some space  ', false],
        ['url', 'http//a.b.c', false],
        ['url', 'http//www.hc.com/path/（haha', false],
        ['url', 'http//www.aaa.com/haha/sd?s=中$a=b', false],
        // 统一社会代码
        ['usc', 'A12345678901234567', true],
        ['usc', 'Z12345678901234567', false],
        ['usc', 'A12345678901234567890', false],
        ['usc', 'A1234567890', false],
        ['usc', 'abdfg', false],
        // 微信号
        ['wechat', 'x_l_st', true],
        ['wechat', '123', false],
        ['wechat', '123456789012345678901', false],
        // 部门名称由中文、英文、数字组成
        ['departmentRegex', '只有中文', true],
        ['departmentRegex', '中文English123', true],
        ['departmentRegex', '123456', true],
        ['departmentRegex', 'sdfsdf', true],
        ['departmentRegex', 'sdfd_sfsd', false],
        // 用户姓名由中文或者英文组合
        ['userName', '中文五个字', true],
        ['userName', 'EnglishName', true],
        ['userName', '中E文', true],
        ['userName', '123456', false],
        ['userName', '空格 空格', false],
        // 验证码格式
        ['smsVerificationCode', '1234', true],
        ['smsVerificationCode', '12345', false],
        ['smsVerificationCode', '123', false],
        // 驾驶证格式
        ['diNumber', '123456789012345678', true],
        ['diNumber', '12345678901234567X', true],
        ['diNumber', '123456789012345', true],
        ['diNumber', '12345678901234567G', false],
        ['diNumber', '123456', false],
        ['diNumber', '12345678901234567890', false],
        // 协议号，30 位，文字，不支持全角符号
        ['protocolNumber', '一二三四五六七八九十一二三四五六七八九十一二三四五六七八中文', true],
        ['protocolNumber', '中文', true],
        ['protocolNumber', '123_456', true],
        ['protocolNumber', 'ab23cdef中文', true],
        ['protocolNumber', 'abc?def', false],
        ['protocolNumber', 'abc.def', false],
        ['protocolNumber', 'abcd ef', false],
        // 固话格式有误(固定电话需要加区号 xxxx-xxxxxxxx)
        ['fixCellphone', '0755-88886666', true],
        ['fixCellphone', '13800138000', true],
        ['fixCellphone', '17012345678', true],
        ['fixCellphone', '123456', false],
        ['fixCellphone', '0755-6666', false],
        // 简称由中文、英文、数字构成，或者组合成
        ['abbreviation', '中文', true],
        ['abbreviation', 'Englishname', true],
        ['abbreviation', '10086', true],
        ['abbreviation', 'sdf sdf', false],
        ['abbreviation', 'df_sdf', false],

        // 容积值整数位长度不能大于 3 位并且小数位长度不能大于 2 位
        ['volumePrecision', '123.56', true],
        ['volumePrecision', '1234.5', false],
        ['volumePrecision', '123.456123', false],
        ['volumePrecision', '1234.5678', false]
    ];
    // “潜”规则：允许 有些值为空时 不校验（目前有40种）
    [
        // type 为 1 的规则
        /* 'nul', */'min', 'max', 'range', 'size', 'digits', 'past', 'future',
        // type 为 2 3 4 5 的规则
        'account', 'shortName', 'companySize', 'pwdSize', 'departmentSize', 'positionSize',
        // type 为 6 的规则
        'carNo', 'billionDecimals2', 'companyRegex', 'decimals2', 'decimals', 'email', 'idNumber', 'integers', 'ip', 'mobile', 'positiveDecimals', 'positiveIntegers', 'post', 'pwdRegex', 'qq', 'tele', 'url', 'usc', 'wechat',
        'departmentRegex', 'userName', 'smsVerificationCode', 'diNumber', 'protocolNumber', 'fixCellphone', 'abbreviation',
        // type 为 7 的规则
        'volumePrecision'
    ].forEach(function (ruleName, i) {
        // 添加到 测试案例 数组中
        validationRuleAssertCase.push([ruleName, '', true]);
    });

    // 统一调用测试案例
    validationRuleAssertCase.forEach(function (assertCase) {
        assertRule.apply(assertRule, assertCase);
    });

    // 传入validationMap对象（从localStorage中获取）
})(layui.data(HC.constVariable.HC_TABLE_NAME)[HC.constVariable.VALIDATION_KEY_NAME].constraints);