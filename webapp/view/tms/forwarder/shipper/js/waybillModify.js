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
        var roleType = 1;

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

            // 获取运单详情（写在这里是为了并发请求数据）后的 deferred
            var waybillDataReadyDeferred = $.Deferred(function (addressListDeferred) {
                waybillInstance.getWaybillDetail({
                    data: {
                        id: waybillId
                    },
                    success: function (dataObjects, textStatus, jqXHR, responseJSON) {
                        addressListDeferred.resolve(dataObjects, textStatus, jqXHR, responseJSON);
                    }
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
                    waybillDataReadyDeferred.done(function (dataObjects, textStatus, jqXHR, responseJSON) {
                        waybillInstance.initWaybillData(dataObjects, isWaybillDetail);

                        // 编辑时，绑定事件
                        if (isEditWaybill) {
                            // 下拉框数据加载之后 再绑定 装卸地点的操作事件（因为 添加、复制 操作 依赖某些下拉框的值）
                            waybillInstance.bindAddressCDEvent();
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