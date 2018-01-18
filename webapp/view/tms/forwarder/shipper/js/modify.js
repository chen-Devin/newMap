$(function () {
    var pageAction = $.trim(getUrlParam('do'));
    var orderId = $.trim(getUrlParam('id'));
    // 订单页面的操作状态： 新增、编辑、查看
    var isEditOrder = (pageAction == 'edit');
    var isOrderDetail = (pageAction == 'detail');
    var isAddOrder = (!isEditOrder && !isOrderDetail);

    // 编辑状态 参数校验
    if (!isAddOrder && !orderId) {
        parent.layer.alert('没有订单id参数！', {
            yes: function () {
                parent.layer.closeAll();
            }
        });

        return;
    }
    // TODO 是否处理 (isAddOrder && orderId) 的异常情况？
    
    var $_myForm = $('#myForm');

    // element 模块是为了渲染 折叠面板
    layui.use(['laytpl', 'layer', 'form', 'upload', 'element'], function () {
        // 角色类型： 1 表示货主货代     2 表示拖车行
        var roleType = 1;

        // 传给 loadTemplates 方法的参数
        var options = {
            layui: layui,
            // 渲染模版时需要的数据
            renderData: {
                role: roleType
            },
            // 其它传递的数据
            role: roleType,
            orderId: orderId,
            isAddOrder: isAddOrder,
            isEditOrder: isEditOrder,
            isOrderDetail: isOrderDetail
            // orderSubmiter: 'shipper',
        };

        orderModule.loadTemplates(options, function (orderInstance) {
            // “查看”状态 已统一在 loadTemplates 方法中处理，下面只处理 “新增” 和 “编辑” 状态订单的事件

            // TODO: 优化：将 orderInstance.bindAllEvent 单独放在 船公司、目的港、提还地点、装卸地点 列表数据加载之后执行，可以提前执行时机

            // 加载动态列表
            bizUtil.init.initSelectData($_myForm, {
                defaultOptions: {
                    idFieldName: 'key',
                    textFieldName: 'value'
                }
            }, function (hcDeferredList, initAllSelectDeferred) {
                // 所有列表数据加载完之后，会进入 done 回调
                initAllSelectDeferred.done(function () {
                    // 无 orderId 说明是新增模式
                    if (!orderId) {
                        // 绑定事件
                        orderInstance.bindAllEvent();

                        // 新增时，显示 “继续新增”复选框 和 “重置” 按钮
                        $('#continueAddContainer, #resetButton').show();

                        return;
                    }

                    // 编辑订单，需要获取订单详情 并初始化订单数据和页面业务限制
                    // TODO: 待优化，将 getOrderDetail 请求与下拉框请求并发加载（改造为 $.when 语法操作）。但 initOrderData 需要在下拉框数据加载之后才执行
                    orderInstance.getOrderDetail({
                        data: {
                            orderId: orderId
                        },
                        success: function (dataObjects, textStatus, jqXHR, responseJSON) {
                            // 非 “查看” 页面，且订单状态为 “录入” 才可以编辑页面
                            var isEnableEdit = (!isOrderDetail && (dataObjects.status == 100));

                            orderInstance.initOrderData(dataObjects);
                            orderInstance.initPageStatus(dataObjects, isEnableEdit);

                            if (isEnableEdit) {
                                orderInstance.bindAllEvent();
                            }
                            // 不可编辑的页面，设置为只读状态
                            else {
                                orderInstance.setReadonlyPage();
                            }
                        }
                    });
                    
                });

            }); // end initSelectData callback

        });
    });
});