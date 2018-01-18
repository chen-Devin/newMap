/**
 * @version 1.2
 * @file 统一校验器，默认会根据 校验规则数据（后端提供的接口，在用户登录后存入localStorage中）对表单中的元素进行 失焦自动校验
 *      主要方法：
 *          verifyElement 根据指定规则 校验元素的值
 *          verifyList 通过配置列表，为指定元素添加指定规则的失焦自动校验事件
 *          verify 根据参数类型，自动调用 verifyElement 或 verifyList 方法
 *          verifyContainer 校验指定容器
 *          bindBlurVerifyEvent 为元素添加 失焦自动校验事件
 *          verifyValue 根据规则名校验指定值（无tips提示）。支持 规则名中以 “|” 为分隔符的多个校验规则
 *      外部依赖：
 *          jQuery、HC.js、layer、localStorage中的validationData数据
 */
var HCValidator = (function () {
    // 从localStorage中获取 校验规则
    var validationData = layui.data(HC.constVariable.HC_TABLE_NAME)[HC.constVariable.VALIDATION_KEY_NAME];
    // 规则映射集
    var validationMap = validationData.constraints;
    // 规则默认值
    var validationDefaultValue = validationData.defaultValue;
    // var DEFAULT_FIELD_VALUE = validationDefaultValue.field;
    var DEFAULT_MIN_VALUE = validationDefaultValue.min;
    var DEFAULT_MAX_VALUE = validationDefaultValue.max;
    var DEFAULT_INTEGER_LENGTH = validationDefaultValue.integer;
    var DEFAULT_FRACTION_LENGTH = validationDefaultValue.fraction;

    var VERIFY_ATTR_NAME = 'hc-verify';
    var VERIFY_PREFIX_ATTR_NAME = 'hc-verify_';
    var VERIFY_ATTR_NAME_FIELD = VERIFY_PREFIX_ATTR_NAME + 'field';
    var VERIFY_ATTR_NAME_VALUE = VERIFY_PREFIX_ATTR_NAME + 'value';
    var VERIFY_ATTR_NAME_MIN = VERIFY_PREFIX_ATTR_NAME + 'min';
    var VERIFY_ATTR_NAME_MAX = VERIFY_PREFIX_ATTR_NAME + 'max';
    var VERIFY_ATTR_NAME_INTEGER = VERIFY_PREFIX_ATTR_NAME + 'integer';
    var VERIFY_ATTR_NAME_FRACTION = VERIFY_PREFIX_ATTR_NAME + 'fraction';
    var VERIFY_TIPS_INDEX_DATANAME = 'tipsIndex';
    var RULE_NAME_SEPARATOR = '|';

    // 外部依赖方法
    var verifyTips = HC.tips.info;
    
    // ----------------------- DOM相关的方法 -----------------------
    // 显示提示框
    var showTips = function ($_element, text, time) {
        // 最后一个参数 设置tips默认不自动关闭
        var tipsId = verifyTips(text, $_element, time || 0);

        $_element.data(VERIFY_TIPS_INDEX_DATANAME, tipsId);
    };
    // 关闭提示框
    var closeTips = function ($_element) {
        var tipsIndex = $_element.data(VERIFY_TIPS_INDEX_DATANAME);

        // 关闭元素上吸附的tips
        if (tipsIndex) {
            layer.close(tipsIndex);
            $_element.removeData(VERIFY_TIPS_INDEX_DATANAME);
        }
    };
    // 根据校验结果对象，显示 或 隐藏 校验提示（提示层会吸附在传入的元素附近）
    var toggleTipsWithVerifyResult = function ($_formField, verifyResult) {
        // 返回 true 表示 没有显示提示层
        if (!verifyResult) {
            return true;
        }

        // 校验不通过，则显示tips层
        if (!verifyResult.isValidated) {
            showTips($_formField, verifyResult.text);
        }
        // 校验通过，则关闭之前可能已存在的tips层
        else {
            closeTips($_formField);
        }

        return verifyResult.isValidated;
    };
    // 从元素中获取规则名（取 hc-verify 的属性值）
    var getRuleNameFromElement = function (element) {
        return ($(element).attr(VERIFY_ATTR_NAME) || '').replace(/\s/g, '');
    };

    // ----------------------- 私有工具方法 -----------------------
    // 获取值的方法：若值为undefined，则返回参数提供的默认值
    var getFallbackValue = function (value, defaultValue) {
        return ((value !== undefined) ? value : defaultValue);
    };
    // 校验整数位 及 小数位（使用正则校验）
    var verifyDigits = function (value, validationRule) {
        var integerLength = getFallbackValue(validationRule.integer, DEFAULT_INTEGER_LENGTH);
        var fractionLength = getFallbackValue(validationRule.fraction, DEFAULT_FRACTION_LENGTH);
        // 位数长度 直接使用正则判断
        var digitsReg = new RegExp('^\\d{0,' + integerLength + '}\\.?\\d{0,' + fractionLength + '}$');

        return digitsReg.test(String(value));
    };
    // 创建日期（尽可能地根据参数 创建一个有效的 Date 对象）
    var createDate = function (source) {
        // 对于形如 "1511702875256" 的时间戳字符串，必须先转成数字 才能正确使用 Date 构造器 创建一个有效的日期对象
        if ($.isNumeric(source)) {
            return new Date(Number(source));
        }
        else {
            return new Date(source);
        }
    };
    // 从DOM元素中获取 传给统一校验器的 参数对象
    var getVerifyConfigFromElement = function (element) {
        var $_element = $(element);
        var value = $_element.attr(VERIFY_ATTR_NAME_VALUE);
        var min = $_element.attr(VERIFY_ATTR_NAME_MIN);
        var max = $_element.attr(VERIFY_ATTR_NAME_MAX);
        var integer = $_element.attr(VERIFY_ATTR_NAME_INTEGER);
        var fraction = $_element.attr(VERIFY_ATTR_NAME_FRACTION);

        return {
            ruleName: getRuleNameFromElement($_element),
            field: $_element.attr(VERIFY_ATTR_NAME_FIELD),
            // 用于比较的值，最好转成数字型
            value: value ? Number(value) : undefined,
            min: min ? Number(min) : undefined,
            max: max ? Number(max) : undefined,
            integer: integer ? Number(integer) : undefined,
            fraction: fraction ? Number(fraction) : undefined
        };
    };

    // ----------------------- 对外接口方法 -----------------------
    // 根据 【特定规则】 对 字符串进行校验，返回 true/false
    var verifyBySpecificRule = function (validationName, validationRule, value) {
        var isValidated = true;

        // 除了 非空校验规则，其它规则 没有值时不做校验
        if ((validationName !== "notNul") && (validationName !== "notBlank") && (!value)) {
            return isValidated;
        }

        var minValue = getFallbackValue(validationRule.min, DEFAULT_MIN_VALUE);
        var maxValue = getFallbackValue(validationRule.max, DEFAULT_MAX_VALUE);

        switch (validationName) {
            // 为空校验
            case "nul": {
                isValidated = (!value || !value.length);

                break;
            }
            // 非空校验
            case "notNul":
            case "notBlank": {
                isValidated = !!(value && value.length);

                break;
            }
            // 最小值校验
            case "min": {
                // 保存 value 的值，供外部使用（这里支持 在DOM元素中设置 hc-verify_min 属性）
                validationRule.value = getFallbackValue(validationRule.value, minValue);
                // 后端校验规则中，min是取value的值
                isValidated = (Number(value) >= validationRule.value);

                break;
            }
            // 最大值校验
            case "max": {
                // 保存 value 的值，供外部使用（这里支持 在DOM元素中设置 hc-verify_max 属性）
                validationRule.value = getFallbackValue(validationRule.value, maxValue);
                // 后端校验规则中，max是取value的值
                isValidated = (Number(value) <= validationRule.value);

                break;
            }
            // 值区间校验
            case "range": {
                isValidated = ((Number(value) >= minValue) && (Number(value) <= maxValue));

                break;
            }
            // 字符长度校验
            case "size": {
                isValidated = ((value.length >= minValue) && (value.length <= maxValue));

                break;
            }
            // 整数及小数 位数长度校验
            case "digits": {
                isValidated = verifyDigits(value, validationRule);

                break;
            }
            // 应小于当前时间
            case "past": {
                isValidated = (createDate(value) < new Date());

                break;
            }
            // 应大于当前时间
            case "future": {
                isValidated = (createDate(value) > new Date());

                break;
            }
            default: {
                // 其它类型不校验
                break;
            }
        }

        return isValidated;
    };
    // 根据 【通用规则】 对 字符串进行校验，返回 true/false
    var verifyByNormalRule = function (validationRule, value) {
        var ruleType = validationRule.type;
        var isValidated = true;

        // 没有值时不做校验（非空校验 依靠 特定规则 去校验）
        if (!value) {
            return isValidated;
        }

        var minValue = getFallbackValue(validationRule.min, DEFAULT_MIN_VALUE);
        var maxValue = getFallbackValue(validationRule.max, DEFAULT_MAX_VALUE);

        switch (ruleType) {
            // case 1 为 特定规则，不在这里校验
            // case 1: {}

            // 校验 最小字符长度
            case 2: {
                isValidated = (value.length >= minValue);

                break;
            }
            // 校验 最大字符长度
            case 3: {
                isValidated = (value.length <= maxValue);

                break;
            }
            // 值区间校验
            case 4: {
                isValidated = ((value >= minValue) && (value <= maxValue));

                break;
            }
            // 校验 字符长度区间
            case 5: {
                isValidated = ((value.length >= minValue) && (value.length <= maxValue));

                break;
            }
            // 使用正则 校验
            case 6: {
                isValidated = new RegExp(validationRule.regex).test(value);

                break;
            }
            // 正数与小数的位数校验（与digits使用同一正则校验）
            case 7: {
                isValidated = verifyDigits(value, validationRule);

                break;
            }
            default: {
                // 其它类型不校验
                break;
            }
        }

        return isValidated;
    };

    // 高级接口，支持 ruleName 中以 “|” 为分隔符的多个校验规则（断路原则，某一校验不通过 则中断）
    var verifyByRule = function (ruleName, verifyValue, verifyConfig, customRuleMap) {
        // 校验结果对象
        var verifyResult = {
            isValidated: true,
            text: ''
        };

        if (!ruleName) {
            return verifyResult;
        }

        // 支持 自定义 规则集
        var validationRuleMap = customRuleMap || validationMap;
        
        // 支持多种校验规则（以 “|” 分开）
        $.each(ruleName.split(RULE_NAME_SEPARATOR), function (i, singleRuleName) {
            var validationRule = validationRuleMap[singleRuleName];

            // 忽略 没有配置的校验规则
            if (!validationRule) {
                return;
            }

            // 先进行 特定规则 校验
            if (validationRule.type === 1) {
                // 扩展规则，相当于用自定义属性 增强了 特定规则
                var extendValidationRule = $.extend({}, validationDefaultValue, validationRule, verifyConfig);

                if (!verifyBySpecificRule(singleRuleName, extendValidationRule, verifyValue)) {
                    // 使用 extendValidationRule.msg 代替 validationRule.msg 可以让外部有自定义 msg 的能力
                    var tipsText = extendValidationRule.msg
                                    // 替换提示文本中的占位符（注意： 这里的 {value} 值，由 verifyBySpecificRule 调用之后 写入 extendValidationRule 中）
                                    .replace('{value}', extendValidationRule.value)
                                    .replace('{field}', extendValidationRule.field)
                                    .replace('{min}', extendValidationRule.min)
                                    .replace('{max}', extendValidationRule.max)
                                    .replace('{integer}', extendValidationRule.integer)
                                    .replace('{fraction}', extendValidationRule.fraction);

                    verifyResult.isValidated = false;
                    verifyResult.text = tipsText;
                    
                    // 终止遍历
                    return false;
                }
            }
            // 再进行 通用规则 校验
            if (!verifyByNormalRule(validationRule, verifyValue)) {
                verifyResult.isValidated = false;
                // 替换提示文本中 带默认值的占位符（如果外部有配置占位符的值，则使用该值，否则使用默认值）
                // 如 “<%部门名称%>由中文、英文、数字组合” 会被替换为 “部门名称由中文、英文、数字组合”。当在 html 中配置了 hc-verify_field 属性时，则以该值为准，最后结果如 “简称由中文、英文、数字组合”
                verifyResult.text = validationRule.msg.replace(/<%(.*?)%>/g, (verifyConfig && verifyConfig.field) || '$1');
                
                // 终止遍历
                return false;
            }

        }); // end each rule name

        return verifyResult;
    };

    // ----------------------- 校验框架的主要对外接口 -----------------------
    // 根据指定规则 校验元素的值
    var verifyElement = function (element, ruleName, verifyConfig, customRuleMap) {
        var $_element = $(element);
        var verifyValue = $_element.val();
        verifyConfig = verifyConfig || getVerifyConfigFromElement($_element);
        
        // 没有传 ruleName 时，自动从校验配置中获取（校验配置会提供 从元素中获取的 ruleName）
        ruleName = ruleName || verifyConfig.ruleName;
        
        // 没有配置规则名，则跳过
        if (!ruleName) {
            return true;
        }
        
        var verifyResult = verifyByRule(ruleName, verifyValue, verifyConfig, customRuleMap);

        // 根据校验结果 显示/隐藏 tips层
        return toggleTipsWithVerifyResult($_element, verifyResult);
    };
    // 校验指定容器，若有元素不符合校验规则，则返回结果包含 校验不通过的元素、校验不通过的提示文本、false值的isValidated属性。全部校验通过则返回 isValidated 为 true 的对象
    var verifyContainer = function (container, customRuleMap) {
        // 返回的校验结果对象
        var returnVerifyResult = {
            isValidated: true,
            element: null,
            text: ''
        };

        $(container).find('[name]').each(function (i) {
            var $_formField = $(this);
            var ruleName = getRuleNameFromElement($_formField);

            // 没有配置规则名，则跳过
            if (!ruleName) {
                return;
            }

            var verifyConfig = getVerifyConfigFromElement($_formField);
            var verifyResult = verifyByRule(ruleName, $_formField.val(), verifyConfig, customRuleMap);

            if (!verifyResult.isValidated) {
                // 将 verifyResult 的值 合并到 returnVerifyResult 上
                $.extend(returnVerifyResult, {
                    element: $_formField
                }, verifyResult);

                // 终止遍历
                return false;
            }
        });

        return returnVerifyResult;
    };

    // 通过配置文件，为指定元素添加指定规则的失焦自动校验事件
    var verifyList = function (configList, container, customRuleMap) {
        var $_container = $(container);

        $.each(configList, function (i, verifyOptions) {
            var $_fieldElement = $(verifyOptions.element, $_container);
            // 找不到元素，则跳过
            if (!$_fieldElement.length) {
                console.warn('找不到 需要添加失焦校验事件 的元素，第 [%s] 条配置已被跳过', (i + 1));

                return;
            }

            // 依次从 verifyOptions.ruleName 、 hc-verify属性值 中获取规则名
            var ruleName = verifyOptions.ruleName || getRuleNameFromElement($_fieldElement);
            // 没有规则名，也跳过
            if (!ruleName) {
                console.warn('该对象需要校验，但没有找到规则名，第 [%s] 条配置已被跳过', (i + 1), $_fieldElement);

                return;
            }

            // 为元素添加 失焦自动校验事件
            bindBlurVerifyEvent($_fieldElement, ruleName, customRuleMap);
        });
    };

    // ----------------------- 事件相关的方法 -----------------------
    // 为元素添加 失焦自动校验事件
    var bindBlurVerifyEvent = function (element, ruleName, customRuleMap) {
        var $_element = $(element);
        var verifyConfig = getVerifyConfigFromElement($_element);
        
        console.info('正在为表单域元素添加校验事件', $_element);
        $_element.blur(function () {
            verifyElement(element, ruleName, verifyConfig, customRuleMap);
        });
    };
    // 为容器添加 校验事件（对容器中带有name的元素 添加校验事件）
    var addVerifyToContainer = function (container) {
        $(container).on('blur', '[name]', function () {
            verifyElement(this);
        });
    };
    // 自动对表单中 带有 name 属性的元素进行 失焦校验
    var autoVerify = function () {
        addVerifyToContainer($('form'));
    };
    // 页面初始化之后，自动添加校验事件
    autoVerify();


    return {
        /**
         * @method verifyElement 根据指定规则 校验元素的值。校验不通过则显示 tips层，校验通过则关闭 tips层。另：该方法有简化的别名： verify
         * @param {DOM} element 需要校验的元素，可以为 jQuery选择器、jQuery对象、DOM对象
         * @param {string=} ruleName 可选，校验的规则名，如 'account' 。支持组合规则，如 'companySize|companyRegex'。没有传，自动使用元素的 hc-verify 属性值
         * @param {Object=} verifyConfig 可选，用于配置【特定规则】中的 field min max integer fraction 字段值（msg值也能改，但不建议随便改）。
         *                          默认会从校验元素的 hc-verify_* 属性中获取该配置。
         *                          另：【特定规则】为 [min]或[max] 类型时 额外支持 [value] 配置（[value]的值 会被自动识别为 [min]或[max]）。
         * @param {Object=} customRuleMap 可选，自定义的规则集
         * @return {boolean} true表示校验通过，没有显示 tips 层； false 表示校验不通过，已显示 tips 层
         * @example
         *     ```
         *         HCValidator.verifyElement($('input[name=account]'), 'account');
         *         // 下面这种情况，ruleName 默认从元素的 hc-verify 属性中获取
         *         HCValidator.verifyElement($('input[name=account]'));
         *     ```
         */
        verifyElement: verifyElement,
        /**
         * @method verifyList 通过配置列表，为指定元素添加指定规则的失焦自动校验事件
         * @param {Array} configList 配置列表。列表中的元素有 element 和 ruleName 属性。用于指定元素 和 指定校验规则名
         * @param {DOM=} container 可选，限定添加事件的父容器（当配置文件中的element为选择器时，不在此父元素内的表单元素 将不添加事件）
         * @param {Object=} customRuleMap 可选，自定义的规则集
         * @example
         *     ```
         *         HCValidator.verifyList([
         *             {
         *                 element: '[name=account]',
         *                 ruleName: 'account'
         *             }
         *         ], $('form'));
         *     ```
         */
        verifyList: verifyList,
        // 根据参数类型（是否为数组），自动调用 verifyElement 或 verifyList
        verify: function () {
            // 第一个参数是原生数组对象，则将其当作配置 来为指定元素添加 失焦自动校验事件
            if ($.isArray(arguments[0])) {
                verifyList.apply(this, arguments);
            }
            // 否则，将其作为 verifyElement 方法的别名调用
            else {
                verifyElement.apply(this, arguments);
            }
        },
        /**
         * @method verifyContainer 校验指定容器（校验不通过时，不会显示tips），若有元素不符合校验规则，则返回 false。全部校验通过才返回 true
         * @param {DOM} container 需要校验的容器
         * @param {Object=} customRuleMap 可选，自定义的规则集
         * @return {Object} 返回对象的属性有 isValidated{boolean} element{DOM} text{string}。
         *                     isValidated 表示校验结果，容器中 带有的name属性的元素 全部校验通过时isValidated才为true，否则isValidated为false。
         *                     当isValidated为false时，element 和 text 才有值，分别表示 校验不通过的元素 和 校验不通过的提示文本
         * TODO: 提供参数控制是否调用 showTips
         * @example
         *     ```
         *         var verifyResult = HCValidator.verifyContainer($('form'));
         *         if (!verifyResult.isValidated) {
         *             console.log('该元素校验不通过，校验提示文本:[%s]', verifyResult.text, verifyResult.element);
         *             // 进行提示
         *             HCValidator.showTips(verifyResult.element, verifyResult.text);
         *         }
         *     ```
         */
        verifyContainer: verifyContainer,

        // 参数： (element, text, time)
        showTips: showTips,
        // 参数： (element)
        closeTips: closeTips,
        // 参数： (element, verifyResult)
        toggleTipsWithVerifyResult: toggleTipsWithVerifyResult,

        // 为元素添加 失焦自动校验事件
        bindBlurVerifyEvent: bindBlurVerifyEvent,

        // 参数： (container)
        // 返回值：无
        addVerifyToContainer: addVerifyToContainer,

        // 参数： (ruleName, verifyValue, verifyConfig, customRuleMap)
        // 返回值：校验结果对象（该对象包含 isValidated 和 text 属性）
        // 额外说明：该方法支持 ruleName 中以 “|” 为分隔符的多个校验规则
        verifyValue: verifyByRule,

        // verifyValues: (ruleName, valueArray) => verifyByRule(ruleName, valueArray.join('')),
        
        verifyByNormalRule: function (ruleName, verifyValue) {
            var validationRule = validationMap[ruleName];
            
            // 没有规则名或对应的规则，则直接返回true（相当于没有校验）
            if (!ruleName || !validationRule) {
                return true;
            }

            return verifyByNormalRule(validationRule, verifyValue);
        },
        verifyBySpecificRule: function (ruleName, verifyValue) {
            var validationRule = validationMap[ruleName];

            if (!ruleName || !validationRule) {
                return true;
            }

            return verifyBySpecificRule(ruleName, validationRule, verifyValue);
        }

        // TODO: verifyByNormalRule 和 verifyBySpecificRule 方法 添加 validationRule 参数以 支持自定义校验规则
    };
})();