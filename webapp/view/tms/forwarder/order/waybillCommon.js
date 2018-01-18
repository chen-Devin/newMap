// 运单模块
var waybillModule = (function () {
    var createOrderInstance = function (layui, initOptions) {
        // 依赖的 layui 模块
        var layer = layui.layer;
        var layuiFormModule = layui.form;

        // 常量
        var BOX_LINE_SELECTOR = '.box-line-container';
        var ADDRESS_LINE_SELECTOR = '.customer-address-line';
        // 删除项的data名前缀
        var DELETE_TYPE_PREFIX_DATANAME = 'delete_type_';

        // 缓存变量
        var $_myForm = $('#myForm');
        var $_addressContainer = $('#addressContainer');
        var $_brokerDataContainer = $('#brokerDataContainer');

        // ------------------- 一些工具方法 -------------------

        // 将 下拉框的选中文本 设置到相邻的隐藏域中
        var setSiblingElementValue = HC.dom.select.setSiblingElementValue;
        // 重新渲染 laydate 组件
        var rerenderDateInput = bizUtil.layui.rerenderDateInput;
        var fastRenderSelect = bizUtil.layui.fastRenderSelect;
        // 这个方法会自动监听select事件（基于layui.form的事件）
        var relateDropDownToElement = bizUtil.layui.relateDropDownToElement;
        var createFormDataByName = bizUtil.data.createFormDataByName;
        var setDataToContainer = bizUtil.data.setDataToContainer;
        // 处理省市县地址中的逗号
        var processAddress = bizUtil.data.processAddressAreaName;

        // 关闭校验未通过的提示框（删除容器时，需要将容器内的警告提示框删除）
        var closeTipsInContainer = function (container) {
            // 带 name的元素都可能有 tips（HCValidator.closeTips方法内部会容错）
            $(container).find('[name]').each(function () {
                HCValidator.closeTips($(this));
            });
        };

        // ------------------- 一些数据处理方法 -------------------

        // 处理 部分字段文本
        var preProcessDataText = function (waybillData) {
            // 运单状态文本
            waybillData.statusText = setWaybillStatusTxt(waybillData.status);

            // 转换 报关方式 文本
            waybillData.brokenStyleText = setBrokenStyle(waybillData.brokenStyle);
            // 转换 急单类型 文本
            waybillData.singleTypeText = setSingleType(waybillData.singleType);
            // 转换 货物类型 文本
            waybillData.goodsTypeText = waybillData.goodsType == 1 ? '普货' : '危品';
            // 转换 摆柜要求 文本
            waybillData.putarkPositionText = setPutarkPosition(waybillData.putarkPosition);

            // 报关行（完整）地址
            waybillData.brokenAddressText = processAddress(waybillData.brokenAreaAddress) + waybillData.brokenAddress;

            // 将字段转为 保存数据时用的字段名
            waybillData.waybillId = waybillData.id;
            waybillData.bkNo = waybillData.soNumber;
        };

        // 获取页面表单域数据
        var createWaybillData = function () {
            // 运单数据
            var waybillData = $.extend(
                // 主要信息
                createFormDataByName($('#mainInfoContainer')),
                {
                    // 装卸地点列表
                    waybillAddress: [],
                    // 运单备注
                    remark: $('#remarkTextarea').val()
                }
            );

            // 编辑模式下，需要记录被删除项的id
            if (waybillData.id) {
                // 获取删除项id数组（存储编辑时 被删除的装卸地点id）
                waybillData.deleteAddressId = $_myForm.data(DELETE_TYPE_PREFIX_DATANAME + 'address') || [];
            }

            // 当装卸地点可以编辑时，则构建装卸地点数据列表
            if (!$_addressContainer.hasClass('customer-address--readonly')) {
                var waybillAddressDataList = waybillData.waybillAddress;
                $_addressContainer.find(ADDRESS_LINE_SELECTOR).each(function (i) {
                    waybillAddressDataList.push(createFormDataByName($(this)));
                });
            }

            return waybillData;
        };

        // ------------------- 业务限制 工具方法 -------------------
        var bizLimitUtil = (function () {
            var PUT_WAY_UNLIMITED = '0';

            // 是否为 出口 方式（出口清关、出口转关）
            var isExportWay = function (value) {
                return (value == 1) || (value == 2);
            };

            // TODO: 内部实现直接从 order.js 中拷贝的，待抽象到业务公共模块中
            return {
                // 箱型 关联 摆柜要求（尺寸为20的箱型，可以选择 任意摆柜要求，而对于非20尺寸的箱型，摆柜要求只能固定为“不限”）
                boxSizeRelatePutRequire: function (boxSizeSelect) {
                    var $_boxSizeSelect = $(boxSizeSelect);
                    // 箱型尺寸，根据 箱型 isoCode 前面的数字来确定（isoCode箱型 = 尺寸+单位）
                    var boxSize = parseInt($_boxSizeSelect.val(), 10);

                    var $_putRequireSelect = $_boxSizeSelect.parents(BOX_LINE_SELECTOR).find('select[name=putarkPosition]');
                    var $_putRequireContainer = $_putRequireSelect.parent();
    
                    // 箱型有选择，且不等于20尺寸时，才限制摆柜要求
                    if (boxSize && (boxSize != '20')) {
                        $_putRequireSelect.val(PUT_WAY_UNLIMITED);
                        $_putRequireSelect.prop('disabled', true);
                        // 重新渲染
                        fastRenderSelect(layuiFormModule, $_putRequireSelect);
    
                        // 在父容器上绑定 悬浮事件
                        $_putRequireContainer.on('mouseenter.putRequireDisable', function () {
                            HC.tips.info('对于非20尺寸的箱型，摆柜要求只能选择“不限”', this);
                        });
                    }
                    else {
                        $_putRequireSelect.prop('disabled', false);
                        // 重新渲染
                        fastRenderSelect(layuiFormModule, $_putRequireSelect);
                        $_putRequireContainer.off('mouseenter.putRequireDisable');
                    }
                },
                // 根据 报关方式 显示 提柜/还柜地点 和 提空/还空地点
                brokenStyleRelateAddressLabel: function (brokenStyle) {
                    var $_wharfLabel = $('#wharfLabel');
                    var $_stackLabel = $('#stackLabel');

                    // 报关方式为出口时，文案显示为 “还柜地点” 、 “提空地点”
                    if (isExportWay(brokenStyle)) {
                        $_wharfLabel.text('还柜地点');
                        $_stackLabel.text('提空地点');
                    }
                    // 报关方式为进口时，文案显示为 “提柜地点” 、 “还空地点”
                    else {
                        $_wharfLabel.text('提柜地点');
                        $_stackLabel.text('还空地点');
                    }
                }
            };
        })();


        // ------------------- 初始化及事件绑定 -------------------

        // 获取运单详情数据
        var getWaybillDetail = function (ajaxOptions) {
            return HC.ajax.get($.extend({
                url: '/ucenter/tms/waybill/waybill/searchWaybillDetail.shtml'
            }, ajaxOptions));
        };

        // 初始化组件
        var initComponent = function () {
            // 初始化页面中的日期组件
            bizUtil.layui.initDateInput($('.date-time'));
        };

        // 初始化已有运单数据
        var initWaybillData = function (waybillData, isWaybillDetail) {
            if (!waybillData) {
                return;
            }

            var $_mainInfoContainer = $('#mainInfoContainer');

            // 先处理运单数据
            preProcessDataText(waybillData);
            // 主要信息（含 船务信息）
            setDataToContainer(waybillData, $_mainInfoContainer);
            // 报关资料
            setDataToContainer(waybillData, $_brokerDataContainer);
            // 运单备注
            $('#remarkTextarea').val(waybillData.remark);

            // 重置 复选框的值
            $.each(['hasChauffeur', 'hasRequireWeighing'], function (i, checkboxName) {
                $_mainInfoContainer.find('[name=' + checkboxName + ']').prop('checked', waybillData[checkboxName]);
            });

            // 处理装卸地点列表
            (function () {
                var addressDataList = waybillData.wbaList;
                // 创建多个装卸地点行
                if (addressDataList.length > 1) {
                    var $_firstAddressLine = $_addressContainer.find(ADDRESS_LINE_SELECTOR).first();
                    $_firstAddressLine.after(HC.dom.clone($_firstAddressLine, addressDataList.length - 1));
                }

                // 填充装卸地点数据
                $_addressContainer.find(ADDRESS_LINE_SELECTOR).each(function (i) {
                    var addressDataItem = addressDataList[i];
                    // 补充 完整地址数据
                    addressDataItem.fullAddress = processAddress(addressDataItem.waybillAddressAreaName) + addressDataItem.waybillAddressDetail;

                    setDataToContainer(addressDataItem, $(this));
                });
            })();

            // 全部layui表单组件重新渲染
            layuiFormModule.render();
            // 自定义组件的重新渲染
            initComponent();

            // 初始化页面状态
            (function () {
                // 非“查看”运单详情时，需要初始化 箱型与摆柜要求限制
                if (!isWaybillDetail) {
                    bizLimitUtil.boxSizeRelatePutRequire('#boxTypeList');
                }

                // 如果委托项为【运输，代送资料】，则需要显示 报关行联系信息（页面中为 报关资料送至）
                if (waybillData.entrustService == '5') {
                    $_brokerDataContainer.removeClass('hide');
                }
            })();
        };

        // 禁用表单元素（在查看页面调用）
        var disableForm = function (container) {
            // 禁用表单元素
            $(container || $_myForm).find('input, select, textarea').prop('disabled', true);
            layuiFormModule.render();
            // 得在 form.render 之后，layui的美化下拉框的input才能禁用成功
            $(container || $_myForm).find('.layui-select-disabled input').prop('disabled', true);
        };

        // 绑定页面事件
        var bindWaybillEvent = function () {
            // ------------------------- 修改 装卸地点详细地址 事件 ----------------------------
            orderCommon.bindEditAddressEvent($_addressContainer, {
                templateHTML: $('#detailLineTemplate').html(),
                layuiFormModule: layuiFormModule,
                districtOptions: {
                    areaIdFieldName: 'waybillAddressAreaid',
                    areaNameFieldName: 'waybillAddressAreaName',
                    addressDetailFieldName: 'waybillAddressDetail'
                }
            });

            // ------------------------- 提交及取消运单 事件 ----------------------------
            (function () {
                // 表单提交
                layuiFormModule.on('submit(save)', function (data) {
                    if (!bizUtil.validator.verifyContainer($_myForm)) {
                        return;
                    }

                    var waybillData = createWaybillData();

                    // 提交运单数据
                    HC.ajax.post('/ucenter/tms/waybill/waybill/updateWaybill.shtml', {
                        data: JSON.stringify(waybillData),
                        success: function (responseData, textStatus, jqXHR) {
                            // 弹窗的关闭回调
                            var closeHandler = function (index) {
                                // 关闭弹窗本身
                                window.parent.layer.close(index);
                                // 刷新列表页内容
                                bizUtil.frame.refreshListFrame();
                                // 关闭本tab页面
                                bizUtil.frame.closeCurrentIframeTab(window.parent);
                            };
    
                            window.parent.layer.alert('保存成功！', {
                                // 点击“确定”与右上角“X”按钮 是同一处理方式
                                yes: closeHandler,
                                cancel : closeHandler
                            });
                        }
                    });

                    // 强制失去焦点（防止后续的回车事件持续触发表单提交）
                    $(this).blur();
                });
                // 取消按钮
                $('#cancelButton').click(function (e) {
                    bizUtil.frame.closeCurrentIframeTab(window.parent);
                });

                // 用于测试时，校对字段值是否正确
                $('#testFormData').click(function () {
                    if (!bizUtil.validator.verifyContainer($_myForm)) {
                        return false;
                    }
                    console.log('统一规则校验【通过】');
    
                    var waybillData = createWaybillData();
    
                    var logPropertyName = HC.data.logPropertyName;
    
                    logPropertyName([
                        "waybillId", "bkNo", "mentionPlaceCode", "mentionPlace", "cutoffTime", "cutheavyTime", "cuttingTime", "releaseTime",
                        "carrierId", "carrier", "shipName", "shipTime", "purposePortCode", "purposePortShortname", "shippingCompCode", "shippingCompShortname",
                        "arkType", "freight", "putarkPosition", "goodsWeight", "doarkDate", "remark", "waybillAddress", "deleteAddressId", "carryEmptyAddress", "carryEmptyCode", "freightPrice", "freightGain"
                    ], waybillData, '最外层属性');

                    logPropertyName([
                        "id", "customersAddressId", "waybillAddress", "waybillAddressAreaid", "waybillAddressAreaName", "waybillAddressDetail", "linkman", "mobile", "remark"
                    ], waybillData.waybillAddress, '装卸地点属性');

                    console.log('【被删除的 已有装卸地点列表】', waybillData.deleteAddressId);
                    console.log('完整的运单数据', waybillData);
                });
            })();
    
            // ------------------------- 业务限制/校验/联动 事件 ----------------------------
            (function () {
                // 船公司 显示简称
                layuiFormModule.on('select(shipping)', function(data) {
                    var $_shippingCompanySelect = $(data.elem);

                    // 将 text 关联到隐藏域中（保存 船公司code）
                    setSiblingElementValue($_shippingCompanySelect);
                    // 显示 船公司简称
                    $_shippingCompanySelect.parent().next().find('input').val(data.value);
                });

                // 箱型 决定 摆柜要求
                layuiFormModule.on('select(boxType)', function(data) {
                    bizLimitUtil.boxSizeRelatePutRequire(data.elem);
                });

                // 装卸地点 详情填充
                var customersAddressDetailUrl = '/ucenter/crm/customers/customersAddress/getDetail.shtml?id=';
                layuiFormModule.on('select(customerAddress)', function(data) {
                    var $_customerAddressSelect = $(data.elem);

                    // 更改装卸地点之后，还需要保存名称 到隐藏域中
                    setSiblingElementValue($_customerAddressSelect);

                    // 选择空值时，不执行下面的联动操作
                    if (!data.value) {
                        return;
                    }

                    // 请求数据 填充关联信息
                    HC.ajax.get(customersAddressDetailUrl + data.value, {
                        // 填充 装卸地址
                        success: function (responseData, textStatus, jqXHR) {
                            var $_container = $_customerAddressSelect.parents(ADDRESS_LINE_SELECTOR);
                            var addressAreaName = processAddress(responseData.addressDetail);

                            // 将 响应数据转换为 与name对应的字段名，并由bizUtil.data.setDataToContainer方法填充value
                            setDataToContainer({
                                waybillAddressAreaid: responseData.addressAreaId,
                                waybillAddressAreaName: addressAreaName,
                                // 省市县街道后面的详细地址
                                waybillAddressDetail: responseData.address,
                                // 拼接一个地址完整，用于前端展示
                                fullAddress: addressAreaName + responseData.address,
                                linkman: responseData.uname,
                                mobile: responseData.mobile,
                                remark: responseData.notes
                            }, $_container);
                        }
                    });
                });
            })();

            // ------------------------- 下拉框填充隐藏域 ----------------------------
            (function () {
                // 自动根据下拉框的选择事件，填充： 供应商名称 目的港简称 提/还柜地点名称 提/还空地点名称 （注意，部分本身有监听layui事件的，不能使用这种方法监听，否则原来的事件会失效）
                var relateDropDownList = ['supplier', 'portList', 'wharfList', 'stackList'];

                // 关联 下拉框动作，并将下拉框的value填充到指定元素
                relateDropDownToElement(relateDropDownList, layuiFormModule);
            })();
        };

        // 绑定 装卸地点的 添加、复制、删除 事件
        var bindAddressCDEvent = function () {
            // 将删除项的id（数字型） 添加到 $_myForm中
            var setDeleteIdToContainContainer = function (removeElement, deleteType) {
                var deleteLineId = $(removeElement).find('[name=id]').val();

                // 有id说明是编辑时删除已有项
                if (deleteLineId) {
                    var deleteTypeDataName = DELETE_TYPE_PREFIX_DATANAME + deleteType;
                    var deleteLineArray = $_myForm.data(deleteTypeDataName) || [];

                    deleteLineArray.push(Number(deleteLineId));
                    $_myForm.data(deleteTypeDataName, deleteLineArray);
                }
            };

            // 操作对象 配置信息 列表（箱型信息、装卸信息、船务信息 的 删除、添加、复制 配置）
            var operationTargetOptionsList = [
                // 装卸信息
                {
                    _cnName: '装卸信息',
                    _type: 'address',
                    lineClassName: 'customer-address-line',
                    lineDeleteTips: '运单中最少要有一个装卸地点',
                    // 删除元素前，需要先关闭 校验未通过的提示框
                    beforeDeleteCallback: function (removeElement, settings, $_belongsContainContainer) {
                        // TODO: 将 添加、删除、复制时 关闭tips 的动作内置到 shippingEvent 中（可分别配置）
                        closeTipsInContainer($_belongsContainContainer);
                    },
                    // 复制时 清空装卸信息id
                    afterCopyDoneCallback: function ($_newShippingLineContainer, $_targetLineContainer, data) {
                        // TODO: 将 清空id 的动作内置到 shippingEvent 中（可配置）
                        $_newShippingLineContainer.find('[name=id]').val('');
                    },
                    afterDeleteDoneCallback: function (removeElement, options) {
                        // TODO: 将 记录删除id 的动作内置到 shippingEvent 中（可配置）
                        setDeleteIdToContainContainer(removeElement, options._type);
                    }
                }
            ];

            // 一键绑定 装卸地点 的 删除、添加、复制 事件
            return orderCommon.shippingEvent.fastBindEvent(operationTargetOptionsList, $_addressContainer);
        };

        return {
            bizLimitUtil: bizLimitUtil,
            getWaybillDetail: getWaybillDetail,
            initComponent: initComponent,
            initWaybillData: initWaybillData,
            disableForm: disableForm,
            bindWaybillEvent: bindWaybillEvent,
            bindAddressCDEvent: bindAddressCDEvent
        };
    };

    // 加载模版内容（并添加到DOM中）。依赖layui.laytpl模块
    var loadTemplates = function (options, callback) {
        // layui由外部提供
        var layui = options.layui;
        var $_buttonContainer = $('#buttonContainer');

        // 动态加载 运单模版内容，并在加载后 将模版内容添加到表单中
        $('#formTemplates').load('../order/waybillTemplate.html', function () {
            // 渲染模版时 传入的数据
            var renderData = options.renderData;

            var templateHTML = layui.laytpl($('#waybillTemplate').html()).render(renderData);

            // 插入模版到DOM中
            $_buttonContainer.before(templateHTML);

            // 显示按钮区
            $_buttonContainer.removeClass('hide');

            // 执行回调
            callback && callback(createOrderInstance(layui, options));
    
            // 这里是保险写法，setTimeout并非必须
            setTimeout(function () {
                // 删除用于存放模版的元素
                $(this).remove();
            }, 0);
        });
    };


    return {
        loadTemplates: loadTemplates
    };
})();