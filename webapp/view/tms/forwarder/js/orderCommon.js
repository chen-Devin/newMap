// orderCommon 对象 包含 订单相关的通用处理方法
var orderCommon = (function () {
    // --------------------------- 基础业务工具方法 ---------------------------

    // 根据容器内部 所有包含 name 属性 的表单域，创建一个 数据对象： { [name]: [value] }
    var createFormDataByName = bizUtil.data.createFormDataByName;

    // 将数据填充到容器的表单域中
    var setDataToContainer = bizUtil.data.setDataToContainer;

    // --------------------------- 高级业务工具方法封装 ---------------------------

    // 新流程管理器，包含 创建新行、根据容器创建数据、根据数据填充容器 这些方法
    var newFlowManager = (function () {
        /*
            为什么叫newFlowManager？
            因为改了流程之后，才产生了这三个方法：makeNewLineCreater、createDataFromLine、setDataToLine。
            变量太多，在没有模块化的情况下，只能借助 匿名立即执行函数 来做代码块划分。
            本意是划分代码块，但确实产生了一个新的包裹对象，而且真的不会命名了……
    
            附（复制元素时）新流程：
            1. 保存 空数据模版（3种）
            2. 根据 空数据模版 创建新元素（选择的模版与数据类型有关）
            3. 给新元素 填充数据
            4. 重新 动态渲染
            5. 插入目标位置（含动画）
    
            （老的流程，没有填充数据这一步，复制时 依靠DOM元素保留的值来展现，所以无法复制 select 元素 由用户选择的值）
        */
    
        var shippingInfoContainerSelector = '.shipping-info-container';
        var shippingBoxContainerSelector = '.shipping-box-container';
        var shippingAddressContainerSelector = '.shipping-address-container';
        var addressLineSelector = '.customer-address-line';

        // 从指定类型的容器中 构建请求数据
        var createDataFromLine = (function () {
            // 获取单个 船务信息 数据
            var createShippingData = function (shippingContainer) {
                var $_shippingContainer = $(shippingContainer);
    
                var shippingFormData = $.extend({
                    orderBoxtype: [],
                    orderAddresses: []
                    // 基本信息从 .shipping-info-container 容器中获取
                }, createFormDataByName($_shippingContainer.find(shippingInfoContainerSelector)));
    
                // 构建 箱型信息 数组列表
                $_shippingContainer.find(shippingBoxContainerSelector).children().each(function () {
                    shippingFormData.orderBoxtype.push(createFormDataByName(this));
                });
                // 构建 装卸信息 数组列表
                $_shippingContainer.find(shippingAddressContainerSelector).find(addressLineSelector).each(function () {
                    var addressData = createFormDataByName(this);

                    shippingFormData.orderAddresses.push(addressData);
                });
    
                return shippingFormData;
            };
    
            return function (lineElement, lineType) {
                switch (lineType) {
                    // 单个的 箱型信息 和 装卸信息 使用 createFormDataByName 方法即可 获取对应的表单数据
                    case 'box':
                    case 'address':
                    default: {
                        return createFormDataByName(lineElement);
                    }
                    // 船务信息 需要特殊处理，使用 createShippingData 方法
                    case 'shipping': {
                        return createShippingData(lineElement);
                    }
                }
            };
        })();
    
        // 将数据填充到 指定类型的容器中
        var setDataToLine = (function () {
            // 填充 船务信息（单个）
            var setDataToShippingContainer = function (shippingData, shippingContainer) {
                var $_shippingContainer = $(shippingContainer);
    
                // 填充 基本信息（单个）
                setDataToContainer(shippingData, $_shippingContainer.find(shippingInfoContainerSelector));
    
                // 填充 箱型信息（多个）
                var boxDataList = shippingData.orderBoxtype;
                $_shippingContainer.find(shippingBoxContainerSelector).children().each(function (i) {
                    setDataToContainer(boxDataList[i], this);
                });
                // 填充 装卸信息（多个）
                var addressesDataList = shippingData.orderAddresses;
                $_shippingContainer.find(shippingAddressContainerSelector).find(addressLineSelector).each(function (i) {
                    setDataToContainer(addressesDataList[i], this);
                });
            };
    
            return function (lineElement, lineType, data) {
                switch (lineType) {
                    // 单个的 箱型信息 和 装卸信息 使用 setDataToContainer 方法即可 填充数据
                    case 'box':
                    case 'address':
                    default: {
                        return setDataToContainer(data, lineElement);
                    }
                    // 船务信息 需要特殊处理，使用 setDataToShippingContainer 方法
                    case 'shipping': {
                        return setDataToShippingContainer(data, lineElement);
                    }
                }
            };
        })();

        // 根据 配置文件 生成 新行创建器
        var makeNewLineCreater = function (optionsList, container) {
            var $_container = $(container);
            var templateSet = {};
    
            // 遍历 操作对象 配置信息 列表，得到模版元素
            $.each(optionsList, function (i, optionsItem) {
                var $_cloneElement = $_container.find('.' + optionsItem.lineClassName).first().clone();
                // 虽然此时 用户还未输入数据，但为了防止 js初始化时加的一些数据，需要重新置空所有表单域的值
                $_cloneElement.find('[name]').val('');

                // 缓存 创建新行所需要的模版元素（jQuery对象）
                templateSet[optionsItem._type] = {
                    element: $_cloneElement
                };
            });

            // 根据 类型 创建 新行（把区域也当作“行”）。已确保新行不带有默认数据
            return function (lineType, lineData) {
                var $_newLine = templateSet[lineType].element.clone();

                // 没传数据 则 直接返回新创建的行
                if (!lineData) {
                    return $_newLine;
                }

                // 对于 非船务信息类，直接设置数据就可以返回新行
                if (lineType !== 'shipping') {
                    setDataToLine($_newLine, lineType, lineData);

                    return $_newLine;
                }

                // 船务信息 则需要先创建对应的 若干个箱型、装卸地点，再设置数据
                // 补充箱型行
                if (lineData.orderBoxtype.length > 1) {
                    var $_newLineBoxContainer = $_newLine.find('.box-line-container');
                    $_newLineBoxContainer.after(HC.dom.clone($_newLineBoxContainer, lineData.orderBoxtype.length - 1));
                }
                // 补充装卸地点行
                if (lineData.orderAddresses.length > 1) {
                    var $_newLineBoxContainer = $_newLine.find('.customer-address-line');
                    $_newLineBoxContainer.after(HC.dom.clone($_newLineBoxContainer, lineData.orderAddresses.length - 1));
                }
                // 设置数据
                setDataToLine($_newLine, lineType, lineData);
                // 最后返回新行
                return $_newLine;
            }; 
        };
    
        return {
            makeNewLineCreater: makeNewLineCreater,
            createDataFromLine: createDataFromLine,
            setDataToLine: setDataToLine
        };
    })();

    // 数据加载器，用于加载多个数据源，并在全部数据加载完毕之后 触发成功回调（支持设置并发数 和 延迟请求间隔）
    var dataLoader = (function () {
        var request = (function () {
            // 数据不完整时 的回调处理方法
            var dataNotReadyHandler = function () {
                console.warn('when 有初始化请求失败 或 响应数据状态 不全为 SUCCESS');
                
                layer.confirm('有列表数据加载失败，是否刷新页面重试？', {
                    icon: 10,
                    btn: ['刷新','取消']
                }, function () {
                    window.location.reload();
                }, function () {
                    // 在 $.when().always 中 已经将进度条关闭了。所以这里可以省略
                    // layer.close(progressLayerId);
                });
            };

            return function (requestOptions) {
                var settings = $.extend({
                    // 最主要的参数，本方法根据 fetchOptionsList 的配置去请求数据，并依次触发各个阶段的回调函数
                    fetchOptionsList: [],
                    // 所有请求成功响应 才会调用的回调函数（该回调仅执行一次）
                    allDoneCallback: $.noop,
                    // 所有请求有响应值，但某些响应状态不为 'SUCCESS'（该回调仅执行一次）
                    notAllDoneCallback: $.noop,
                    // 每个请求有响应值之后 都会调用的回调（该回调执行多次）。回调参数 比底层$.ajax的success回调 多了两个：当前回调对应的列表索引、对应的列表项对象
                    perDoneCallback: $.noop,
                    // 有请求失败（可能因为网络原因 或 服务器拒绝响应）时 调用的回调（该回调仅执行一次）
                    failCallback: $.noop,
                    // 是否显示 进度条
                    isShowProgress: true,
                    // 指定进度条容器
                    progressContent: '#progressContent',
                    // 进度条容器内 显示初始化进度元素的选择器
                    progressBarSelector: '.layui-progress-bar',
                    // 从指定的属性名中 获取 进度条的默认初始化百分比
                    percentAttrName: 'lay-percent',
                    // 并发请求限制，当超过这个限制时，会延迟发送请求
                    concurrenceLimit: 4,
                    // 延迟请求间隔（单位 毫秒）
                    delay: 100,
                    // layui 的 element 模块
                    layuiElementModule: layui.element
                }, requestOptions);

                var fetchOptionsList = settings.fetchOptionsList;
                if (!fetchOptionsList.length) {
                    console.warn('没有请求数据列表，不执行后续操作！');
                    settings.allDoneCallback();
                    
                    return false;
                }
                else if (fetchOptionsList.length === 1) {
                    console.warn('请求数据列表只有一个元素，请确认是否需要使用本方法！');
                }

                var progressLayerId = null;
                // 根据需要 显示进度条
                if (settings.isShowProgress) {
                    // 在请求数据之前，先开启 loading层（含 进度条 提醒）
                    progressLayerId = layer.open({
                        type: 1,
                        title: false,
                        content : $(settings.progressContent),
                        offset: '38.2%',
                        closeBtn: 0,
                        area: '800px',
                        shade: 0.5,
                        time: false
                    });
                }
                
                // 更新进度条
                var updateProgress = (function () {
                    // 已处理的请求个数
                    var processedRequest = 0;
                    var allRequest = fetchOptionsList.length;
                    var initPercent = parseInt($(settings.progressContent).find(settings.progressBarSelector).attr(settings.percentAttrName), 10);
        
                    return function (percentString) {
                        // 没有设置百分比字符串时，每次调用都递增。有percentString参数时，直接以percentString参数 更新进度条
                        if (!percentString) {
                            processedRequest++;
        
                            // 下个进度值
                            var nextPercent = Math.floor((processedRequest / allRequest) * 100);

                            // 当 下个进度值 小于初始进度条数值的，不更新进度条
                            if (nextPercent <= initPercent) {
                                return;
                            }

                            percentString = nextPercent + '%';
                        }
        
                        settings.layuiElementModule.progress('loadDataProgress', percentString);
                    };
                })();
                
                // ----------------------------- 下面开始数据请求 -----------------------------

                // 放置 ajax 请求的数组
                var ajaxRequestArray = [];
                var concurrenceLimit = settings.concurrenceLimit;
                // 倍数，用于 乘以延迟间隔
                var delayTimes = 0;
                // 加载 列表数据
                $.each(fetchOptionsList, function (i, fetchOptions) {
                    // 执行请求
                    var doRequest = function (deferred) {
                        var ajaxRequest = HC.ajax.get(fetchOptions.url, {
                            alert: false,
                            // 每个请求完成时，调用回调
                            success: function (dataObjects, textStatus, jqXHR, responseJSON) {
                                // 回调函数 比底层$.ajax的success回调 多了两个参数：当前回调对应的列表索引、对应的列表项对象
                                settings.perDoneCallback.call(this, i, fetchOptions, dataObjects, textStatus, jqXHR);

                                // 成功时，需要传入完整的 responseJSON 对象 以兼容后续 $.when 的处理
                                deferred && deferred.resolve(responseJSON, textStatus, jqXHR);
                            },
                            error: function (jqXHR, textStatus, errorThrown) {
                                deferred && deferred.reject(jqXHR, textStatus, errorThrown);
                            },
                            complete: function (jqXHR, textStatus) {
                                // 每个请求完成，都更新进度条
                                updateProgress();
                                
                                // 需要补充code不为success时的resolve（在这里暂不使用 deferred.reject ，由 后续的 $.when 统一控制）
                                if (deferred && (deferred.state() === 'pending')) {
                                    deferred.resolve(jqXHR.responseJSON, textStatus, jqXHR);
                                }
                            }
                        });

                        return ajaxRequest;
                    };

                    // 在并发限制内的请求，直接执行（TODO: 改为遍历ajaxRequestArray数组中deferred对象的state为pending的数量，来和 concurrenceLimit 做比较。这样就可以更好地利用并发请求）
                    if (i < concurrenceLimit) {
                        ajaxRequestArray.push(doRequest());
                    }
                    // 大于并发限制的请求，在延迟时间后 执行
                    else {
                        ajaxRequestArray.push($.Deferred(function (deferred) {
                            setTimeout(function () {
                                doRequest(deferred);
                            }, settings.delay * ++delayTimes);
                        }));
                    }
                });
                
                // ----------------------------- 根据数据请求结果，调用外部回调（数据获取失败会 默认提示 刷新页面） -----------------------------

                // 若直接给 $.when 传ajaxRequestArray，则该延迟对象状态会变为 resolved （因为数组不是一个Deferred或Promise对象）
                //     所以需要利用 apply 将 ajaxRequestArray 转换为多个参数 传给 $.when
                return $.when.apply($, ajaxRequestArray).done(function () {
                    console.info('$.when 所有请求已完成');

                    // 将 arguments 转成普通数组
                    var deferredList = HC.util.argumentsToList(arguments);

                    // 如果调用 $.when 时只传入一个参数，则需要将 原arguments数组 作为一个新数组的元素（这样后续的数据操作才能保持一致）
                    if (ajaxRequestArray.length === 1) {
                        deferredList = [deferredList];
                    }

                    var isAllDataLoaded = true;
                    $.each(deferredList, function (i, item) {
                        var responseJSON = item[0];

                        if (!responseJSON || !responseJSON.code || (responseJSON.code !== HC.constVariable.AJAX_SUCCESS_CODE)) {
                            isAllDataLoaded = false;

                            return false;
                        }
                    });

                    // 处理某些 code 不为 SUCCESS 的情况（业务错误）
                    if (!isAllDataLoaded) {
                        dataNotReadyHandler(deferredList);

                        settings.notAllDoneCallback(deferredList);

                        // return;
                        // TODO: 确定“数据未完全加载成功时，允许页面停留？”
                        // TODO: 当数据未加载成功时，icon置灰 并提示 “数据加载失败，暂时无法操作”
                    }

                    // 数据全部加载完，调用外部回调，参数为： $.when 的done回调参数 转成数组型后将数组元素的第一个元素的objects返回（即 每个请求的正确响应数据，与HC.ajax.METHOD方法的success回调参数一致）
                    settings.allDoneCallback($.map(deferredList, function (deferredData, i) {
                        // 统一返回数组，避免 $.map 方法“自作聪明”将原本的 数组型数据 展开（这样会破坏响应数据 结构和顺序）
                        return [deferredData[0].objects];
                    }));
                })
                // 有 ajax 请求错误（通常是网络问题）时 会触发 fail 回调
                .fail(function () {
                    // 将 arguments 转成普通数组
                    var paramList = HC.util.argumentsToList(arguments);

                    // 调用内部的默认回调
                    dataNotReadyHandler.apply(this, paramList);
                    // 通知外部回调
                    settings.failCallback.apply(this, paramList);
                })
                // 所有 ajax 请求结束（可能不全部成功）后，需要关闭 进度条
                .always(function () {
                    // 没有开启进度条的 无需关闭
                    if (!progressLayerId) {
                        return;
                    }

                    // 稍微延迟一下，等进度条的 100% 动画完成
                    setTimeout(function() {
                        layer.close(progressLayerId);
                    }, 300);
                
                }); // end return $.when

            }; // end request-> return

        })();  // end request

        return {
            request: request
        };
    })(); // end dataLoader


    // --------------------------- 通用事件封装 ---------------------------

    // 船务信息（订单业务） 相关事件
    var shippingEvent = (function () {
        // 默认容器
        var defaultContainer = 'form:first';

        // 合并默认参数（内部方法）
        var _combineDefaultOptions = function (options) {
            return $.extend({
                _cnName: '没有指定配置对象名称',
                _isLog: false,
                container: defaultContainer,
                lineSelector: '.' + options.lineClassName,
                contextSelector: '',
                
                // 所属的包含容器选择器（通常是同级节点的直接父容器）
                belongsContainContainerSelector: '',

                // 默认的 操作元素选择器
                deleteOperationSelector: '.icon-delete',
                addOperationSelector: '.icon-add',
                copyOperationSelector: '.icon-copy',

                // 控制 是否绑定事件（主要是给 fastBindEvent 用）
                isBindDeleteEvent: true,
                isBindAddEvent: true,
                isBindCopyEvent: true,

                // 回调事件
                beforeCreateLineCallback: $.noop, // 参数 $_targetLineContainer, isCopyMode
                beforeInsertLineCallback: $.noop, // 参数 $_newLineContainer, $_targetLineContainer, lineData
                beforeDeleteCallback: $.noop, // 参数 removeElement, settings, $_belongsContainContainer
                afterDeleteDoneCallback: $.noop, // 参数 removeElement, settings, $_belongsContainContainer
                afterAddDoneCallback: $.noop, // 参数 $_newLineContainer, $_targetLineContainer
                afterCopyDoneCallback: $.noop, // 参数 $_newLineContainer, $_targetLineContainer, lineData
                // insert 事件跟 add 事件的区别是，add仅在“添加”模式下触发，而 insert事件会在 “添加”和“复制”模式下都触发。还有，两者的触发时机也不同
                afterInsertLineCallback: $.noop, // 参数 $_newLineContainer, $_targetLineContainer, lineData

                // 默认的 创建新行动画效果
                lineAnimateClassName: 'layui-anim layui-anim-upbit',

                // layui 的 form 模块
                layuiFormModule: layui.form
            }, options);
        };

        // 内部的log工具
        var _log = function (logType, settings) {
            if (settings && !settings._isLog) {
                return;
            }

            // 原参数列表，除前两个参数外 才是真正的打印参数
            var logParamList = HC.util.argumentsToList(arguments).slice(2);

            console[logType || 'log'].apply(console, logParamList);
        };
        // 创建 log工具对象
        var _createShippingLog = function (options) {
            var createLogByType = function (logType, options) {
                return function () {
                    _log.apply(null, [logType, options].concat(HC.util.argumentsToList(arguments)));
                };
            };

            return {
                log: createLogByType('log', options),
                info: createLogByType('info', options),
                warn: createLogByType('warn', options)
            };
        };
        
        // 重新渲染 省市县组件（包括修改 新行中 省市县组件的id及lay-filter）
        var rerenderDistrictCompoment = bizUtil.layui.rerenderDistrictCompoment;
        // 重新渲染 laydate 组件
        var rerenderDateInput = bizUtil.layui.rerenderDateInput;

        // 创建 船务附件项 容器
        var createAttachmentItem = function (fileName, serverFileName) {
            var attachmentItemHTML = [
                '<span class="so-attachment-item"', (serverFileName ? (' server_file_name="' + serverFileName + '"') : ''), '>',
                    '<i class="layui-icon icon-link-delete" title="删除 %fileName">&#xe640;</i>',
                    '<a target="_blank" class="attachment-name" ', (serverFileName ? ('href="' + HC.util.getDownloadFileUrl(serverFileName) + '"') : ''), '>',
                        // TODO: 对文件名进行过滤（去掉html标签及实体符）
                        '<i class="layui-icon icon-link-view" title="查看 %fileName">&#xe621;</i>',
                    '</a>',
                    '<span class="status-icon-group">',
                        '<i class="layui-icon layui-anim layui-anim-rotate layui-anim-loop icon-loading" title="%fileName 正在上传中...">&#xe63d;</i>',
                        '<i class="icon-warn" title="附件 %fileName 上传失败">!</i>',
                    '</span>',
                    // 单独用来存放文件名的元素
                    '<span class="file-name hide">%fileName</span>',
                '</span>'
            ].join('').replace(/%fileName/g, fileName);
            
            return $(attachmentItemHTML);
        };

        // 绑定 删除事件（通用绑定）
        var bindDeleteEvent = function (options) {
            // 合并默认参数
            var settings = _combineDefaultOptions(options);

            var targetLineSelector = settings.lineSelector;
            var eventSelector = targetLineSelector + ' ' + settings.contextSelector + settings.deleteOperationSelector;

            $(settings.container).on('click', eventSelector, function (e) {
                var $_targetLine = $(this).parents(targetLineSelector);
                // 获取所属包含元素（删除目标元素后，所属包含元素 会作为其中的一个参数传给回调函数）
                var $_belongsContainContainer = settings.belongsContainContainerSelector ? $_targetLine.parents(settings.belongsContainContainerSelector) : $_targetLine.parent();
                
                if (!$_targetLine.siblings(targetLineSelector).length) {
                    layer.msg(settings.lineDeleteTips);
        
                    return;
                }

                // （元素被删除前）触发回调，若回调返回值为false，则不执行删除操作
                if (settings.beforeDeleteCallback($_targetLine, settings, $_belongsContainContainer) === false) {
                    _log('info', settings, '删除元素操作 已被阻止。该元素为：', $_targetLine);
                    return;
                }

                // 淡出动画完成之后 再删除 元素
                HC.dom.fadeOutRemove($_targetLine, {
                    // 回调中将 .remove() 方法的返回值作为参数
                    callback: function (removeElement) {
                        settings.afterDeleteDoneCallback.call(this, removeElement, settings, $_belongsContainContainer);
                    }
                });
            });

            _log('info', settings, '已绑定 [%s](%s) 的删除事件', settings._cnName, eventSelector);
        };

        // 绑定 添加事件（通用绑定）
        var bindAddEvent = function (options, isCopyMode, createNewLine) {
            // 合并默认参数
            var settings = _combineDefaultOptions(options);
            var layuiFormModule = settings.layuiFormModule;

            var targetLineSelector = settings.lineSelector;
            var targetLineAnimateClassName = settings.lineAnimateClassName;

            // bindAddEvent方法中 打印较多，所以创建便捷的打印对象
            var shippingLog = _createShippingLog(settings);

            // 操作元素的选择器（用于确定 触发事件的元素）
            var operationElementSelector = isCopyMode ? settings.copyOperationSelector : settings.addOperationSelector;
            var eventSelector = targetLineSelector + ' ' + settings.contextSelector + operationElementSelector;
        
            $(settings.container).on('click', eventSelector, function (e) {
                // 操作的行
                var $_targetLineContainer = $(this).parents(targetLineSelector);

                // （新行被创建前）触发回调，若回调返回值为false，则不执行创建操作（当然也也不插入）
                if (settings.beforeCreateLineCallback($_targetLineContainer, isCopyMode) === false) {
                    shippingLog.log('[%s模式] 下阻止创建新行操作，操作的元素为：', (isCopyMode ? '复制' : '添加'), $_targetLineContainer);
                    return;
                }

                // 行的类型，值为 box address shipping
                var targetLineType = $_targetLineContainer.data('data_type');
                // shippingLog.log('当前操作的行 type 为：', targetLineType);

                // 如果是 复制模式，则需要获取 lineData 数据
                var lineData = isCopyMode ? newFlowManager.createDataFromLine($_targetLineContainer, targetLineType) : null;
                // 创建新行（用工具方法），在“复制模式”下有传额外数据，而在“添加模式”下没有传数据
                var $_newLineContainer = createNewLine(targetLineType, lineData);

                // （新行被添加到页面前）触发回调，若回调返回值为false，则不执行插入操作
                if (settings.beforeInsertLineCallback($_newLineContainer, $_targetLineContainer, lineData) === false) {
                    shippingLog.log('[%s模式] 下阻止插入新行操作，创建的元素为：', (isCopyMode ? '复制' : '添加'), $_newLineContainer, '\n数据：', lineData);
                    return;
                }
                // 为新行添加动画类，并将新行 添加到 当前行后面
                $_newLineContainer.addClass(targetLineAnimateClassName)
                                .insertAfter($_targetLineContainer);
                // 动画效果结束后，删除动画类（否则 layui的下拉框会给后面的元素盖住，且 删除该行时 调用 fadeOut 没效果）
                setTimeout(function() {
                    $_newLineContainer.removeClass(targetLineAnimateClassName);
                }, 500);
                // （新行被添加到页面后）触发回调
                settings.afterInsertLineCallback($_newLineContainer, $_targetLineContainer, lineData);


                // 下面的初始化需要在 新行已插入DOM后 才执行，否则 省市县组件 会有问题！！！

                
                // 重新渲染 新行中的 省市县组件
                rerenderDistrictCompoment(layuiFormModule, $_newLineContainer, shippingLog);
        
                // 初始化 新行中的 select 元素（注意：为避免select元素的事件冲突，需将这个 select初始化 放在 省市县组件初始化 的后面！）
                $_newLineContainer.find('select').each(function () {
                    var $_dropDownList = $(this);

                    // 忽略 省市县组件内的 select 渲染
                    if ($_dropDownList.parents('.compoment-district').length) {
                        return;
                    }

                    // 重新渲染 layui 组件
                    bizUtil.layui.fastRenderSelect(layuiFormModule, $_dropDownList);
                });

                // 重新渲染 新行中的 laydate 组件
                rerenderDateInput($_newLineContainer);

                // 触发 添加完成 和 复制完成 事件
                if (isCopyMode) {
                    settings.afterCopyDoneCallback($_newLineContainer, $_targetLineContainer, lineData);
                }
                else {
                    settings.afterAddDoneCallback($_newLineContainer, $_targetLineContainer);
                }
            });

            shippingLog.info('已绑定 [%s](%s) 的' + (isCopyMode ? '复制' : '添加') + '事件', settings._cnName, eventSelector);
        };

        // 绑定 复制事件（通用绑定）
        var bindCopyEvent = function (options, createNewLine) {
            _log('log', options, '正在调用 [绑定添加事件] ，并指定为 [复制模式]');

            // 调用 添加事件，并指定为 复制模式
            bindAddEvent(options, true, createNewLine);
        };

        // 调用该方法 可直接绑定 删除、添加、复制 事件
        var fastBindEvent = function (operationTargetOptionsList, container) {
            // 在内部创建 createNewLine 方法（它的作用是 根据类型 创建新行）
            var createNewLine = newFlowManager.makeNewLineCreater(operationTargetOptionsList, container || defaultContainer);
            
            // 遍历 操作对象 配置信息 列表，并依次绑定 删除、添加、复制 事件
            $.each(operationTargetOptionsList, function (i, optionsItem) {
                // 合并默认值之后的配置对象
                var operationTargetOptions = $.extend({
                    container: container
                }, _combineDefaultOptions(optionsItem));

                // fastBindEvent方法中 打印较多，所以创建便捷的打印对象
                var shippingLog = _createShippingLog(operationTargetOptions);
    
                // 绑定删除事件
                if (operationTargetOptions.isBindDeleteEvent) {
                    bindDeleteEvent(operationTargetOptions);
                }
                else {
                    shippingLog.log('没有绑定 [删除事件] 的配置对象：', optionsItem);
                }
    
                // 绑定添加事件
                if (operationTargetOptions.isBindAddEvent) {
                    bindAddEvent(operationTargetOptions, false, createNewLine);
                }
                else {
                    shippingLog.log('没有绑定 [添加事件] 的配置对象：', optionsItem);
                }
    
                // 绑定复制事件
                if (operationTargetOptions.isBindCopyEvent) {
                    bindCopyEvent(operationTargetOptions, createNewLine);
                }
                else {
                    shippingLog.log('没有绑定 [复制事件] 的配置对象：', optionsItem);
                }
            });

            _log('info', null, '【通用绑定】已绑定 删除、添加、复制 事件');

            return createNewLine;
        };

        // 绑定 上传附件的事件（独立事件，与operationTargetOptionsList无关）
        var bindUploadAttachmentEvent = function (layuiUploadOptions, extendOptions) {
            var $_uploadElement = $(layuiUploadOptions.elem);
            var $_uploadContainer = $_uploadElement.parent();

            HC.upload($.extend({
                // 触发上传的元素
                elem: $_uploadElement,
                // 允许上传的文件类型 images（默认）、file、video、audio
                accept: 'file',
                // 最大文件大小限制（单位kb，默认不限制）
                // size: 1024,
            }, layuiUploadOptions), $.extend({
                // 指定 存放文件项的容器
                fileItemContainer: $_uploadContainer,
                // 传入文件项模版
                createFileItem: createAttachmentItem,
                // 先清空 之前生成的文件项
                onBeforeCreateFileItem: function (index, fileInfo, fileData, uploadObject) {
                    $_uploadElement.siblings('.so-attachment-item').remove();
                },
                // 尽量不要使用 before 这个坑事件
                // before: function (uploadObject) {_log('log', null, '坑货 before 事件！！')},
                // 重置样式类，避免样式干扰
                downLinkSelector: '.attachment-name',
                loadingStatusClassName: 'attachment-item--loading',
                failStatusClassName: 'attachment-item--fail'
            }, extendOptions));
        };

        return {
            // 工具方法
            createAttachmentItem: createAttachmentItem,
            // 绑定事件
            bindDeleteEvent: bindDeleteEvent,
            bindAddEvent: bindAddEvent,
            bindCopyEvent: bindCopyEvent,
            // 一键绑定 ^_^
            fastBindEvent: fastBindEvent,
            // 绑定上传附件事件
            bindUploadAttachmentEvent: bindUploadAttachmentEvent
        };
    })();

    // 绑定编辑地址事件
    var bindEditAddressEvent = function (container, options) {
        var createFormDataByName = bizUtil.data.createFormDataByName;
        var setSelectedOption = bizUtil.layui.setSelectedOption;

        var settings = $.extend(true, {
            // 自定义模版中 最外层容器，需要有 %lineId 占位符
            templateHTML: '请传入地址编辑弹层内容模版',
            // 展示用的地址行（容器）选择器（限定编辑按钮的容器，减少事件冲突概率）
            addressDetailLineSelector: '.address-detail-line',
            // （通常为只读）地址输入框的选择器
            addressDetailInputSelector: '[readonly]',
            // 编辑按钮选择器
            editorIconSelector: '.icon-edit',
            layuiFormModule: layui && layui.form,
            // 传给地区操作管理器的参数
            districtOptions: {
                areaIdFieldName: 'addressAreaId',
                areaNameFieldName: 'addressAreaName'
            },
            // 无地址详情时，添加的样式类名（用于辅助外部自定义样式，但该类不保证实时正确地体现输入框值状态。因为有外部更改输入框的可能性，但每次鼠标悬浮就会获得正确结果）
            _noAddressDetailValueClassName: 'address-detail-line--null'
        }, options);

        // 绑定 编辑按钮 点击事件
        $(container).on('click', settings.addressDetailLineSelector + ' ' + settings.editorIconSelector, function () {
            // 构造新的id给弹出层内的元素
            var timestamp = Number(new Date());
            var lineId = 'addressEditLine_' + timestamp;
            var tipsHtml = settings.templateHTML.replace('%lineId', lineId);

            // 弹出提示层
            var layerIndex = layer.tips(tipsHtml, this, {
                tips: [3, '#E6E6E6'],
                time: 0,
                area: '660px'
            });
            var closeLayer = function () {
                layer.close(layerIndex);
            };

            // 弹出层内的地址容器
            var $_addressEditLine = $('#' + lineId);
            var $_addressDetailLine = $(this).parent();
            var addressData = createFormDataByName($_addressDetailLine);

            setDataToContainer(addressData, $_addressEditLine);
            $_addressEditLine.district(settings.layuiFormModule, addressData[settings.districtOptions.areaIdFieldName]);

            // 确定按钮事件
            $_addressEditLine.find('.edit-line-ok').click(function () {
                var districtManager = bizUtil.district.createDistrictManager($_addressEditLine, settings.districtOptions);

                // 非空校验
                if (!districtManager.verifyAddressArea() || !districtManager.verifyAddressDetail()) {
                    return;
                }

                // 将新的地址数据填充到原来的地址行中
                setDataToContainer(districtManager.getAddressData(), $_addressDetailLine);

                closeLayer();
            });
            // 取消按钮事件
            $_addressEditLine.find('.edit-line-cancel').click(closeLayer);
        });

        // 绑定 鼠标悬浮事件，用于隐藏 空地址的编辑按钮
        $(container).on('mouseenter', settings.addressDetailLineSelector, function () {
            var $_addressDetailLine = $(this);

            // 地址输入框没有值时，添加标记类，并隐藏 编辑按钮
            if (!$_addressDetailLine.find(settings.addressDetailInputSelector).val()) {
                $_addressDetailLine.addClass(settings._noAddressDetailValueClassName);

                $_addressDetailLine.find(settings.editorIconSelector).hide();
            }
            else {
                $_addressDetailLine.removeClass(settings._noAddressDetailValueClassName);

                $_addressDetailLine.find(settings.editorIconSelector).show();
            }
        });
    };

    return {
        // 下面几个都是复合对象，各自拥有若干方法
        dataLoader: dataLoader,
        newFlowManager: newFlowManager,
        shippingEvent: shippingEvent,
        // 单一方法：绑定编辑地址事件
        bindEditAddressEvent: bindEditAddressEvent
    };
})();