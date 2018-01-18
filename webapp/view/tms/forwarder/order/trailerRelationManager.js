// 主要功能： 关联 车牌、车队、结算对象关系；关联车牌、车架、司机之间的关系。
// 【注意】若下拉框不是配置加载的数据，请在createRelationManager之后手动调用（并传入数据源）saveWholeDataList保存数据源（车辆车牌、车队 这两个下拉框需要）
window.TrailerRelationManager = {
    // 创建一个拖车车牌关系管理器（内部会预先获取一些关联关系数据）
    createRelationManager: function (options) {
        var settings = $.extend({
            // 保存 全部 车辆、车队 数据的data名
            WHOLE_DATALIST_DATANAME: 'wholeDataList',
            // 车辆与车队之间 对应关系的Map
            CAR_COMPANY_MAP_DATANAME: 'carCompanyMap',
            DATALIST_DATANAME: 'dataList',
            // 车辆、车架、司机 关联关系Map在 data 中的key
            RELATION_MAP_DATANAME: 'relationMap',

            layuiFormModule: layui.form,

            // 拖车（车牌）下拉框
            trailerSelect: $('#carList'),
            // 车队（供应商） 下拉框
            carCompanySelect: $('#carCompanyList'),
            // 结算对象 下拉框
            trailerSettlementSelect: $('#trailerSettlementList'),
            // 车架 下拉框
            carframeSelect: $('#carframeList'),
            // 司机 下拉框
            driverNameSelect: $('#driverNameList'),
            // 司机手机
            driverMobileInput: $('#driverMobile'),
            // 备注输入框
            waybillRemarkInput: $('#waybillRemarkInput'),

            // 强制关联 复选框
            hasCascadeCheckbox: $('#hasCascadeCheckbox'),

            // 委托事件绑定：拖车车牌、车架、车队、司机名、强制关联复选框
            isBindTrailerChangeEvent: true,
            isBindCarCompanyChangeEvent: true,
            isBindCarframeChangeEvent: true,
            isBindDriverNameChangeEvent: true,
            isBindCascadeChangeEvent: true,

            // 是否校验 备注输入框必填，如果设置为 true，则会在 取消强制关联后，会在输入框中加入 必填类和 layui.form 非空校验
            isVerifyRemarkByCascade: false
        }, options);

        // 设置下拉框选中项
        var setSelectedOption = bizUtil.layui.setSelectedOption;
        // 将 下拉框的选中文本 设置到相邻的隐藏域中
        var setSiblingElementValue = HC.dom.select.setSiblingElementValue;

        var WHOLE_DATALIST_DATANAME = settings.WHOLE_DATALIST_DATANAME;
        var CAR_COMPANY_MAP_DATANAME = settings.CAR_COMPANY_MAP_DATANAME;
        var DATALIST_DATANAME = settings.DATALIST_DATANAME;
        var RELATION_MAP_DATANAME = settings.RELATION_MAP_DATANAME;

        var layuiFormModule = settings.layuiFormModule;

        var $_trailerSettlementList = $(settings.trailerSettlementSelect);
        var $_carList = $(settings.trailerSelect);
        var $_carCompanyList = $(settings.carCompanySelect);
        var $_driverMobile = $(settings.driverMobileInput);
        var $_driverNameList = $(settings.driverNameSelect);
        var $_carframeList = $(settings.carframeSelect);
        var $_hasCascadeCheckbox = $(settings.hasCascadeCheckbox);
        var $_waybillRemarkInput = $(settings.waybillRemarkInput);

        // 车牌、车队 列表之间 互相筛选
        var relateSelectOptions = function ($_currentSelect, $_targetSelect) {
            var currentSelectValue = $_currentSelect.val();

            // 筛选后的目标下拉列表数据
            var relateTargetList = [];
            var targetWholeDataList = $_targetSelect.data(WHOLE_DATALIST_DATANAME);

            // 若当前下拉框 有选中的值
            if (currentSelectValue) {
                // 通过当前下拉框 筛选 目标下拉框的选项（前端根据 车牌、车队关系 进行过滤）
                var targetIdMap = $_currentSelect.data(CAR_COMPANY_MAP_DATANAME);
        
                // 通过当前下拉框的值，获取 目标下拉框关联关系Map
                var relationMap = targetIdMap[currentSelectValue];
                // 遍历 目标下拉框数据列表
                $.each(targetWholeDataList, function (i, targetDataItem) {
                    // 若目标下拉框选项id在 对应关系Map中存在，说明此 选项与 当前下拉框的值有关系，所以将其加入到 新的目标下拉列表数据中
                    if (relationMap[targetDataItem.key]) {
                        relateTargetList.push(targetDataItem);
                    }
                });
            }
            // 若当前下拉框 没有选中值的时候，则 恢复目标下拉框 完整的选项
            else {
                relateTargetList = targetWholeDataList;
            }

            // 使用筛选过的数据列表 重新渲染 目标下拉框（TODO: 考虑在原有列表基础上 通过禁用选项 代替 筛选列表？）
            bizUtil.layui.renderSelect({
                element: $_targetSelect,
                dataList: relateTargetList,
                // 保留之前选中的值（否则需要加很复杂的判断 是否需要关联目标下拉框。不然永远无法同时选中两者）
                value: $_targetSelect.val()
            });

            // 保存 被改变的下拉框 的名称 到隐藏域中
            setSiblingElementValue($_targetSelect);
        };

        // 启用/禁用 结算对象列表
        var setSettlementUsable = function (isEnable) {
            $_trailerSettlementList.prop('disabled', !isEnable);

            bizUtil.layui.fastRenderSelect(layuiFormModule, $_trailerSettlementList);
        };
        // 刷新结算对象列表
        var refreshSettlementSelect = function (trailerId, supplierId, trailerSettlementId) {
            trailerId = trailerId || $_carList.val() || '';
            supplierId = supplierId || $_carCompanyList.val() || '';

            // 没有车牌时，清空并禁用结算对象
            if (!trailerId) {
                setSelectedOption($_trailerSettlementList, '', layuiFormModule);
                setSettlementUsable(false);
                return;
            }

            // 有车牌时，启用并刷新结算对象列表
            setSettlementUsable(true);
            bizUtil.layui.loadDataToSelect($_trailerSettlementList, {
                // 默认值
                value: trailerSettlementId || $_trailerSettlementList.val() || '',
                dataUrl: '/ucenter/settlementchannel/options.shtml?trailerId=' + trailerId + '&supplierId=' + supplierId,
                idFieldName: 'key',
                textFieldName: 'value'
            });
        };

        // 改变车牌或车队后，需要互相筛选 车牌、车队列表 并 刷新结算对象列表
        var refreshCarCompanyAndSettlement = function ($_currentSelect, $_targetSelect) {
            // 车牌、车队 互相筛选
            relateSelectOptions($_currentSelect, $_targetSelect);

            // 刷新结算对象列表
            refreshSettlementSelect($_carList.val());
        };

        // 填充 司机关联的手机号
        var relateDriverMobile = function ($_driverSelect) {
            // 需要先清空司机手机的校验提示框（手动输入时可能弹出过校验提示框）
            HCValidator.closeTips($_driverMobile);

            var dataList = $_driverSelect.data(DATALIST_DATANAME);
            var driverId = $_driverSelect.val();

            // 司机id为空时，直接清空司机手机
            if (!driverId) {
                $_driverMobile.val('');
                return;
            }

            $.each(dataList, function (i, driverData) {
                if (driverData.id == driverId) {
                    $_driverMobile.val(driverData.mobile);

                    // 结束遍历
                    return false;
                }
            });
        };
        // 更新 司机、拖车车牌、车架的名称 及 司机手机号
        var updateDriverCarStatus = function () {
            // 保存司机名称 到隐藏域中
            setSiblingElementValue($_driverNameList);
            // 填充司机手机
            relateDriverMobile($_driverNameList);

            // 保存拖车和车架名称 到隐藏域中
            setSiblingElementValue($_carList);
            setSiblingElementValue($_carframeList);
        };
        // 车牌、车架、司机之间的联动（会识别是否强制关联）。
        //      第一个参数是触发的下拉框，第2-4个参数，分别控制是否关联 车牌、车架、司机。一般需要阻止关联触发的下拉框，作用是避免空的关联关系影响选中项
        var relateTrailerCarframeDriver = function ($_targetSelect, isRelateTrailer, isRelateCarframe, isRelateDriver) {
            var relationKey = $_targetSelect.val();
            var targetRelationMap = $_targetSelect.data(RELATION_MAP_DATANAME)[relationKey] || {};

            // 关联车牌
            if (isRelateTrailer) {
                setSelectedOption($_carList, targetRelationMap.trailerId || '', layuiFormModule);
            }
            // 关联车架
            if (isRelateCarframe) {
                setSelectedOption($_carframeList, targetRelationMap.frameId || '', layuiFormModule);
            }
            // 关联司机
            if (isRelateDriver) {
                setSelectedOption($_driverNameList, targetRelationMap.driverId || '', layuiFormModule);
            }

            // 更新 司机手机 和 司机、车辆、车架 名称
            updateDriverCarStatus();
        };
        // 根据第一个参数去关联对应的 车牌、车架、司机 （即 以目标下拉框的值去更新其它下拉框的值）。并刷新车队和结算对象列表
        var relateAllByTrailer = function ($_targetSelect, isRelateTrailer, isRelateCarframe, isRelateDriver) {
            // 取消强制关联后，仅修改隐藏域的值，不做关联操作
            if (!$_hasCascadeCheckbox.prop('checked')) {
                // 保存对应下拉框的值 到隐藏域中
                setSiblingElementValue($_targetSelect);

                // 下拉框是司机的情况下，需要关联司机手机号
                if ($_targetSelect == $_driverNameList) {
                    relateDriverMobile($_driverNameList);
                }

                return;
            }

            // 强制关联选中后，下面开始 关联车牌车架司机、筛选车队列表、刷新结算对象列表 三步曲

            // 关联车牌车架司机
            relateTrailerCarframeDriver($_targetSelect, isRelateTrailer, isRelateCarframe, isRelateDriver);

            // 筛选车队列表、刷新结算对象列表
            refreshCarCompanyAndSettlement($_carList, $_carCompanyList);
        };

        // 保存下拉框完整数据源
        var saveWholeDataList = function ($_select, dataList) {
            // 如果外部提供数据，则直接保存
            if (dataList) {
                $_select.data(WHOLE_DATALIST_DATANAME, dataList);
            }
            // 如果没有提供数据，则从下拉框本身存储的数据源中获取（如果有的话）
            else {
                var getDataListDeferred = $_select.data(HC.constVariable.AJAX_DEFERRED_DATANAME);
                if (getDataListDeferred) {
                    getDataListDeferred.done(function () {
                        $_select.data(WHOLE_DATALIST_DATANAME, $_select.data(DATALIST_DATANAME));
                    });
                }
            }
        };

        // 保存一份完整的 车辆车牌、车队 数据列表（因为 .data('datalist')的数据列表，在每次重新渲染下拉框时 都会变，数据源是与下拉框的值对应的）
        saveWholeDataList($_carList);
        saveWholeDataList($_carCompanyList);

        // 加载需要的关联关系
        (function () {
            // 获取 车牌、车队的关联关系，用于前端筛选列表
            HC.ajax.get('/ucenter/tms/city/cityWaybill/searchRelation.shtml', {
                success: function (responseData, textStatus, jqXHR, responseJSON) {
                    // 存放车牌id的Map，key值是 关联的车队（供应商）id。value值是另一个Map，该车队的所有id作为其key
                    var trailerIdMap = {};
                    // 存放车队id的Map， key-value 关系类似 trailerIdMap
                    var supplierIdMap = {};

                    // 遍历关系数组
                    $.each(responseData, function (i, relationItem) {
                        var trailerId = relationItem.trailerId;
                        var supplierId = relationItem.supplierId;

                        trailerIdMap[trailerId] = trailerIdMap[trailerId] || {};
                        trailerIdMap[trailerId][supplierId] = true;

                        supplierIdMap[supplierId] = supplierIdMap[supplierId] || {};
                        supplierIdMap[supplierId][trailerId] = true;
                    });

                    $_carList.data(CAR_COMPANY_MAP_DATANAME, trailerIdMap);
                    $_carCompanyList.data(CAR_COMPANY_MAP_DATANAME, supplierIdMap);
                }
            });

            // 加载 司机、车辆、车架之间的关联关系
            HC.ajax.get('/ucenter/tms/capacity/driver/allRelation.shtml', {
                success: function (responseData, textStatus, jqXHR) {
                    // 司机、车辆、车架 关联关系Map
                    var driverRelationMap = {};
                    var carRelationMap = {};
                    var carframeRelationMap = {};

                    // 构建 关联关系Map
                    $.each(responseData, function (i, relationItem) {
                        if (relationItem.driverId) {
                            driverRelationMap[relationItem.driverId] = relationItem;
                        }
                        if (relationItem.trailerId) {
                            carRelationMap[relationItem.trailerId] = relationItem;
                        }
                        if (relationItem.frameId) {
                            carframeRelationMap[relationItem.frameId] = relationItem;
                        }
                    });

                    // 将关联关系Map 存入 对应select元素的data中
                    $_driverNameList.data(RELATION_MAP_DATANAME, driverRelationMap);
                    $_carList.data(RELATION_MAP_DATANAME, carRelationMap);
                    $_carframeList.data(RELATION_MAP_DATANAME, carframeRelationMap);
                }
            });
        })();

        // 绑定 车辆车牌 列表下拉框事件
        if (settings.isBindTrailerChangeEvent) {
            layuiFormModule.on('select(car)', function (data) {
                // 强制关联时，需要关联 车架和司机
                if ($_hasCascadeCheckbox.prop('checked')) {
                    relateTrailerCarframeDriver($_carList, false, true, true);
                }
                // 非强制关联时，仅保存自身的值 到隐藏域中，不关联 车架和司机
                else {
                    setSiblingElementValue($_carList);
                }

                // 互相筛选 车牌、车队列表 并 刷新结算对象列表
                refreshCarCompanyAndSettlement($_carList, $_carCompanyList);
            });
        }
        // 绑定 车队（供应商）列表下拉框事件
        if (settings.isBindCarCompanyChangeEvent) {
            layuiFormModule.on('select(carCompany)', function (data) {
                // 互相筛选 车牌、车队列表 并 刷新结算对象列表
                refreshCarCompanyAndSettlement($_carCompanyList, $_carList);

                // 保存车队（供应商）名称 到隐藏域中
                setSiblingElementValue($_carCompanyList);
            });
        }
        // 绑定 车架列表下拉框事件
        if (settings.isBindCarframeChangeEvent) {
            layuiFormModule.on('select(carframe)', function (data) {
                relateAllByTrailer($_carframeList, true, false, true);
            });
        }
        // 绑定 司机列表下拉框事件
        if (settings.isBindDriverNameChangeEvent) {
            layuiFormModule.on('select(driverName)', function(data) {
                relateAllByTrailer($_driverNameList, true, true, false);
            });
        }
        // 绑定 强制关联复选框事件
        if (settings.isBindCascadeChangeEvent) {
            layuiFormModule.on('checkbox(hasCascade)', function(data) {
                var hasCascade = $_hasCascadeCheckbox.prop('checked');

                // 司机手机 在强制关联时不可编辑，解除强制关联时才可编辑
                $_driverMobile.prop('readonly', hasCascade);

                // 如果重新勾选 强制关联，则需要关联所有关系并刷新车队和结算信息列表
                if (hasCascade) {
                    relateAllByTrailer($_carList, false, true, true);
                }

                // 校验 备注输入框必填
                if (settings.isVerifyRemarkByCascade) {
                    var parentFormItemSelector = '.layui-form-item';
                    var requireClassName = 'layui-form-item--require';
                    var layVerifyAttrName = 'lay-verify';
                    var layVerifyAttrValue = 'required';
                    var $_parentFormItem = $_waybillRemarkInput.parents(parentFormItemSelector);

                    // 强制关联时，删除 必填校验设置
                    if (hasCascade) {
                        $_waybillRemarkInput.removeAttr(layVerifyAttrName);
                        $_parentFormItem.removeClass(requireClassName);
                    }
                    // 取消强制关联时，添加 必填校验设置
                    else {
                        $_waybillRemarkInput.attr(layVerifyAttrName, layVerifyAttrValue);
                        $_parentFormItem.addClass(requireClassName);
                    }
                }
            });
        }

        return {
            relateSelectOptions: relateSelectOptions,
            setSettlementUsable: setSettlementUsable,
            refreshSettlementSelect: refreshSettlementSelect,
            refreshCarCompanyAndSettlement: refreshCarCompanyAndSettlement,
            relateDriverMobile: relateDriverMobile,
            updateDriverCarStatus: updateDriverCarStatus,
            relateTrailerCarframeDriver: relateTrailerCarframeDriver,
            relateAllByTrailer: relateAllByTrailer,

            saveWholeDataList: saveWholeDataList
        };
    }
};