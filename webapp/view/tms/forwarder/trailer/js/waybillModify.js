$(function () {
    var pageAction = $.trim(getUrlParam('do'));
    var waybillId = $.trim(getUrlParam('id'));
    // 订单页面的操作状态： 编辑、查看
    var isEditWaybill = (pageAction == 'edit');
    // 除了edit，其它action页面都当作查看页面
    var isWaybillDetail = !isEditWaybill;

    // 编辑状态 参数校验
    if (!waybillId) {
        parent.layer.alert('没有运单id参数！', {
            yes: function () {
                parent.layer.closeAll();
            }
        });

        return;
    }
    
    var $_myForm = $('#myForm');
    // 进入 查看页面，则隐藏操作按钮
    if (isWaybillDetail) {
        $_myForm.addClass('form--detail');
    }

    // element 模块是为了渲染 折叠面板
    layui.use(['laytpl', 'layer', 'form', 'element'], function () {
        // 角色类型： 1 表示货主货代     2 表示拖车行
        var roleType = 2;

        // 传给 loadTemplates 方法的参数
        var options = {
            layui: layui,
            // 渲染模版时需要的数据
            renderData: {
                role: roleType,
                isShipper: (roleType == 1)
            },
            // 其它传递的数据
            role: roleType,
            waybillId: waybillId,
            isEditWaybill: isEditWaybill,
            isWaybillDetail: isWaybillDetail
            // waybillSubmiter: 'shipper',
        };

        waybillModule.loadTemplates(options, function (waybillInstance) {
            layui.form.render();

            // 初始化组件、绑定事件
            waybillInstance.initComponent();
            // 非 “查看” 页面，就可以操作页面
            if (!isWaybillDetail) {
                // 绑定事件
                waybillInstance.bindWaybillEvent();
            }
            // 查看页面，不能操作
            else {
                // 先禁用静态表单元素（需要动态获取数据的select会被重新激活，所以在数据获取后需要重新禁用）
                waybillInstance.disableForm();
            }

            // 失败回调
            var createFailHandler = function (targetDeferred) {
                return function () {
                    targetDeferred.reject('数据加载失败，请稍后重试');
                };
            };

            // 获取 装卸地点列表后的 deferred
            var addressListReadyDeferred = $.Deferred(function (addressListDeferred) {
                // 获取运单详情（写在这里是为了并发请求数据）
                waybillInstance.getWaybillDetail({
                    data: {
                        id: waybillId
                    },
                    success: function (dataObjects, textStatus, jqXHR, responseJSON) {
                        // 如果订单不是拖车行自己下的（由货主货代下过来的），就不可以编辑装卸地址
                        if (!dataObjects.editAddressFlag) {
                            var $_addressContainer = $('#addressContainer');
                            // 禁用 表单元素
                            $_addressContainer.find('[name]').prop('disabled', true);
                            // 添加只读样式类
                            $_addressContainer.addClass('customer-address--readonly');
                            // 鼠标在装卸地点悬浮时 弹出提示信息
                            $_addressContainer.on('mouseenter', '.shipper-address-input', function () {
                                HC.tips.info('你不能编辑由客户录入的装卸地点', this);
                            });

                            // 不加载装卸地点列表，直接 resolve
                            addressListDeferred.resolve(dataObjects, textStatus, jqXHR, responseJSON);

                            return;
                        }

                        // （拖车行运单需要）通过客户id获取装卸地点列表
                        var loadAddressListDeferred = bizUtil.layui.loadDataToSelect($('#customerAddressList'), {
                            dataUrl: '/ucenter/tms/order/order/getAddressOrBroken.shtml?selectType=address&addType=tch&customerId=' + dataObjects.customerId,
                            idFieldName: 'key',
                            textFieldName: 'value'
                        });

                        // 等装卸地点列表加载后 再转为解决状态
                        loadAddressListDeferred.done(function () {
                            addressListDeferred.resolve(dataObjects, textStatus, jqXHR, responseJSON);
                        })
                        .fail(createFailHandler(addressListDeferred));
                    },
                    codeError: createFailHandler(addressListDeferred),
                    error: createFailHandler(addressListDeferred)
                });
            });

            // 加载动态列表 TODO: 查看页面时，将下拉框优化为输入框
            bizUtil.init.initSelectData($_myForm, {
                defaultOptions: {
                    idFieldName: 'key',
                    textFieldName: 'value'
                }
            }, function (hcDeferredList, initAllSelectDeferred) {
                initAllSelectDeferred.done(function (dataObjects, textStatus, jqXHR) {
                    // 所有列表动态数据加载完之后，等运单详情也获取到，就初始化页面
                    addressListReadyDeferred.done(function (dataObjects, textStatus, jqXHR, responseJSON) {
                        waybillInstance.initWaybillData(dataObjects, isWaybillDetail);

                        // 根据 报关方式（进出口） 改变 提柜/还柜地点 和 提空/还空地点 文案
                        waybillInstance.bizLimitUtil.brokenStyleRelateAddressLabel(dataObjects.brokenStyle);

                        // 编辑时，绑定事件
                        if (isEditWaybill) {
                            // 下拉框数据加载之后 再绑定 装卸地点的操作事件（因为 添加、复制 操作 依赖某些下拉框的值）
                            waybillInstance.bindAddressCDEvent();

                            // 编辑时，如果运单状态为“已打EIR单”且尚未“等待派车”，则只能修改 做柜时间、装卸信息、运单备注
                            if ((dataObjects.status >= 320) && (dataObjects.status < 330)) {
                                // 禁用 主要信息中的表单元素
                                waybillInstance.disableForm($('#mainInfoContainer'));
                                // 恢复 做柜时间、运费限价、运费涨幅 为可编辑
                                $('#doarkDateInput, #freightPriceInput, #freightGainInput').prop('disabled', false);
                                // 恢复 提空/还空地点 为可编辑
                                var $_stackList = $('#stackList');
                                $_stackList.prop('disabled', false);
                                bizUtil.layui.fastRenderSelect(layui.form, $_stackList);
                            }
                            // “等待派车”及以后，不允许编辑
                            else if (dataObjects.status >= 330) {
                                waybillInstance.disableForm();
                                // 编辑按钮图标等也要隐藏
                                $_myForm.addClass('form--detail');
                            }
                        }
                        // 查看页面 在每次动态数据加载完 都需要再禁用一次select（待优化）
                        else {
                            waybillInstance.disableForm();
                        }
                    })
                    .fail(function () {
                        setLayerAlert(window.parent.layer, '数据加载失败，请稍后重试');
                    });

                    // 查看时，还需再禁用一次 加载动态数据的select
                    if (isWaybillDetail) {
                        waybillInstance.disableForm();
                    }
                });
            });
        });
    });
});