layui.use(['layer', 'form', 'element', 'upload'], function () {
    var pageAction = $.trim(getUrlParam('do'));
    var orderId = $.trim(getUrlParam('id'));

    var isEditOrderPage = (pageAction == 'edit');
    var isOrderDetailPage = (pageAction == 'detail');
    var isAddOrderPage = (!isEditOrderPage && !isOrderDetailPage);

    // 编辑、查看订单时 参数校验
    if (!isAddOrderPage && !orderId) {
        parent.layer.alert('没有订单id参数！', {
            yes: function () {
                parent.layer.closeAll();
            }
        });

        return;
    }

    var layer = layui.layer;
    var layuiFormModule = layui.form;
    var layuiElementModule = layui.element;

    var $_myForm = $('#myForm');
    var $_mainInfoContainer = $('#mainInfoContainer');
    var $_customerTabContainer = $('#customerTabContainer');
    var $_customerSelect = $('#customerList');

    // 司机、车辆、车架 下拉框
    var $_driverNameList = $('#driverNameList');
    var $_carList = $('#carList');
    var $_carframeList = $('#carframeList');
    // 司机手机
    var $_driverMobile = $('#driverMobile');
    // 强制关联 复选框
    var $_hasCascadeCheckbox = $('#hasCascadeCheckbox');
    // 运输线路模版 下拉框
    var $_lineNameSelect = $('#lineName');
    // 车队（供应商） 下拉框
    var $_carCompanyList = $('#carCompanyList');

    // 下拉框中保存 渲染数据列表 的data名
    var DATALIST_DATANAME = 'dataList';

    var LAY_ID_ATTR_NAME = 'lay-id';
    // tab头 样式名常量样式名常量
    var TAB_HEAD_CLASSNAME = 'layui-tab-title';
    var TAB_HEAD_SELECTOR = '.' + TAB_HEAD_CLASSNAME;

    var CUSTOMERS_TAB_FILTER_NAME = 'customerListTab';
    var CUSTOMERS_INFO_DATANAME = 'customerInfo';

    var LOAD_ADDRESS_TYPE = 'loadAddress';
    var UNLOAD_ADDRESS_TYPE = 'unloadAddress';
    // 删除项的data名前缀
    var DELETE_TYPE_PREFIX_DATANAME = 'delete_type_';
    var ADDRESS_LINE_SELECTOR = '.customer-address-line';
    var CUSTOMER_PANEL_CLASSNAME = 'hc-customer-panel';
    var CUSTOMER_PANEL_SELECTOR = '.' + CUSTOMER_PANEL_CLASSNAME;
    var LOAD_ADDRESS_CONTAINER_SELECTOR = '.load-address-container';
    var UNLOAD_ADDRESS_CONTAINER_SELECTOR = '.unload-address-container';

    // 上一次选择的运输线路名
    var LAST_LINENAME_DATANAME = 'lastLineName';

    // 线路模版 所需要的基础属性
    var basePropertys = ['customerId', 'customerName', 'arkType', 'freight'];

    // ------------------- 一些工具方法 -------------------

    // 重新渲染 laydate 组件
    var rerenderDateInput = bizUtil.layui.rerenderDateInput;
    var setSelectedOption = bizUtil.layui.setSelectedOption;    // TODO: 封装一个 省略layuiFormModule参数的 setSelectedOption 方法
    var createFormDataByName = bizUtil.data.createFormDataByName;
    var setDataToContainer = bizUtil.data.setDataToContainer;
    // 处理省市县地址中的逗号
    var processAddress = bizUtil.data.processAddressAreaName;
    // 将 下拉框的选中文本 设置到相邻的隐藏域中
    var setSiblingElementValue = HC.dom.select.setSiblingElementValue;
    // 从数据对象中 获取 指定属性，生成新的数据对象
    var getPropertysFromObject = HC.util.getPropertysFromObject;
    // 判断指定属性在对象中是否都有值
    var isPropertysAllInObject = HC.util.isPropertysAllInObject;

    // 生成 创建指定的弹窗类型的工厂方法。新的弹层 默认去掉标题和右上角的关闭按钮，且支持 点击确认按钮后 自动关闭弹层。不同之处是参数顺序与 原生layer的不一样、也没有自动补齐参数功能（因为大部分情况下用不到）
    var createLayerByType = function (layerType, content, yesCallback, cancelCallback, options) {
        // 通过 this 来指定 layer所属上下文，默认为当前 window
        var targetLayer = this.layer || window.layer;

        targetLayer[layerType](content, $.extend({
            title: false,
            closeBtn: 0
        }, options), function (layerIndex) {
            // 如果 yes 回调显式返回 false，则不自动关闭询问框
            if (yesCallback && (yesCallback(layerIndex) === false)) {
                return;
            }

            targetLayer.close(layerIndex);
        }, cancelCallback);
    };

    // 二次封装 layer.confirm
    var layerConfirm = function (content, yesCallback, cancelCallback, options) {
        // 保留外部调用的this指向
        return createLayerByType.call(this, 'confirm', content, yesCallback, cancelCallback, options);
    };

    // 二次封装 layer.alert
    var layerAlert = function (content, yesCallback, options) {
        // 保留外部调用的this指向
        return createLayerByType.call(this, 'alert', content, yesCallback, null, options);
    };

    // 创建一个 绑定了容器的tab管理器（这样在使用方法的时候，就不必传容器参数了）
    var createTabManager = function (tabContainer) {
        // tab头 选中激活的样式名常量
        var ACTIVED_TAB_ITEM_SELECTOR = '.layui-this';
        // tab内容 样式名常量
        var TAB_CONTENT_CLASSNAME = 'layui-tab-item';
        var TAB_CONTENT_SELECTOR = '.' + TAB_CONTENT_CLASSNAME;
        var ACTIVED_TAB_CONTENT_SELECTOR = '.layui-show';

        var $_tabContainer = $(tabContainer);

        // 获取所有的tab头
        var getAllTabHeadItem = function () {
            return $_tabContainer.find(TAB_HEAD_SELECTOR + ' li');
        };
        // 找到 激活的tab
        var findActivedTabHeadItem = function () {
            return $_tabContainer.find(TAB_HEAD_SELECTOR + ' li' + ACTIVED_TAB_ITEM_SELECTOR);
        };
        // 根据id获取tab头
        var findTabHeadItemById = function (tabId) {
            return $_tabContainer.find(TAB_HEAD_SELECTOR + ' li[' + LAY_ID_ATTR_NAME + '=' + tabId + ']');
        };
        // 找到第一个tab头
        var findFirstTabHeadItem = function () {
            return getAllTabHeadItem().first();
        };
        // 找到最后一个tab头
        var findLastTabHeadItem = function () {
            return getAllTabHeadItem().last();
        };

        // 判断有无指定id的tab项
        var hasTabItem = function (tabId) {
            return findTabHeadItemById(tabId).length > 0;
        };
        
        // 获取 激活tab的id
        var getActivedTabItemId = function () {
            return findActivedTabHeadItem().attr(LAY_ID_ATTR_NAME);
        };
        // 获取指定tab项的id（没有传tab项时，返回当前激活tab的id）
        var getTabItemId = function (tabItem) {
            return tabItem ? $(tabItem).attr(LAY_ID_ATTR_NAME) : getActivedTabItemId();
        };

        // 更新 激活tab的信息（用于更新 初始化时的静态tab项）
        var updateActivedTabInfo = function (info) {
            var $_activedItem = findActivedTabHeadItem();

            $_activedItem.find('span').text(info.title);
            $_activedItem.attr(LAY_ID_ATTR_NAME, info.id);
        };

        // 找到激活的tab内容容器
        var findActivedTabContent = function () {
            return $_tabContainer.find(TAB_CONTENT_SELECTOR + ACTIVED_TAB_CONTENT_SELECTOR);
        };
        // 找到最后一个tab内容容器
        var findLastTabContent = function () {
            return $_tabContainer.find(TAB_CONTENT_SELECTOR).last();
        };

        return {
            // tab头 相关方法
            getAllTabHeadItem: getAllTabHeadItem,
            findActivedTabHeadItem: findActivedTabHeadItem,
            findTabHeadItemById: findTabHeadItemById,
            findFirstTabHeadItem: findFirstTabHeadItem,
            findLastTabHeadItem: findLastTabHeadItem,
            // tab头id 相关方法
            getActivedTabItemId: getActivedTabItemId,
            getTabItemId: getTabItemId,

            hasTabItem: hasTabItem,
            
            // tab内容相关方法
            findActivedTabContent: findActivedTabContent,
            findLastTabContent: findLastTabContent,

            updateActivedTabInfo: updateActivedTabInfo,
        };
    };
        
    // 加载/更新 客户的装卸地点下拉列表数据，参数是 客户信息对象
    var updateCustomerAddressSelect = function (customerInfo, callback) {
        bizUtil.init.initSelectData(customerInfo.customerContainer || customerInfo.container, {
            defaultOptions: {
                dataUrl: "/ucenter/crm/customers/customersAddress/getOptionByCustomersId.shtml?custId=" + (customerInfo.customerId || customerInfo.id),
                idFieldName: 'key',
                textFieldName: 'value',
                // TODO: 待支持缓存，将两次相同的请求优化为一次
                cache: true
            }
        }, function (renderSelectDeferredList) {
            // 所有下拉列表的数据更新之后，调用回调
            $.when.apply($, renderSelectDeferredList).done(callback);
        });
    };
    
    // 将删除项的id 添加到 $_myForm中
    var setDeleteIdToContainContainer = function (removeElement, options) {
        var deleteLineId = $(removeElement).find('[name=id]').val();
        
        // 有id说明是编辑时删除已有项
        if (deleteLineId) {
            var deleteTypeDataName = DELETE_TYPE_PREFIX_DATANAME + options._type;
            var deleteLineArray = $_myForm.data(deleteTypeDataName) || [];

            deleteLineArray.push(deleteLineId);
            $_myForm.data(deleteTypeDataName, deleteLineArray);
        }
    };
    // 将指定容器内的所有装卸地点id，都加到表单容器中
    var addDeleteAddressIdToForm = function (container) {
        $(container).find(ADDRESS_LINE_SELECTOR).each(function (i) {
            // 该方法中会判断 是否存在id
            setDeleteIdToContainContainer($(this), {
                // 把id放在 loadAddress 和 unloadAddress 中都可以
                _type: 'loadAddress'
            });
        });
    };

    // 绑定上传按钮事件
    var bindUploadEvent = function (container) {
        var $_uploadButton = $(container).find('.icon-folder');

        $_uploadButton.each(function () {
            HC.upload({
                // 触发上传的元素
                elem: $(this),
                // 多文件上传
                multiple: true,
                // 允许上传的文件类型 images（默认）、file、video、audio
                accept: 'file',
                // 最大文件大小限制（单位kb，默认不限制）
                size: 1024,
            }, {
                layuiUpload: layui.upload,
                // 指定 存放文件项的容器
                fileItemContainer: $(this).parent().prev()
            });
        });
    };

    // 绑定创建新tab的事件
    var bindNewTabEvent = (function () {
        // 绑定 tab的关闭按钮事件（2.1.2 版本的layui没有关闭tab事件，而且关闭按钮没有冒泡事件，所以要自己写 直接绑定元素事件）
        var bindTabClosedEvent = function (tabHeadItem, tabContent) {
            var $_tabHeadItem = $(tabHeadItem);

            $_tabHeadItem.find('.layui-tab-close').click(function () {
                tabContent = tabContent || $_tabHeadItem.data(CUSTOMERS_INFO_DATANAME).customerContainer;

                // 记录 所有要被删除的 带id的装卸地点
                addDeleteAddressIdToForm($(tabContent));
            });
        };

        return function (tabHeadItems, customerInfo) {
            var tabContent = customerInfo.customerContainer;

            // 绑定 tab的关闭按钮事件 和 上传按钮事件
            bindTabClosedEvent(tabHeadItems, tabContent);
            bindUploadEvent(tabContent);
        };
    })();

    // 更新 客户tab（用于第一次初始化tab数据）
    var updateCustomerTab = function (customerTabManager, customerInfo) {
        customerTabManager.updateActivedTabInfo(customerInfo);
    
        // 保存tab内容引用，方便获取数据时找到对应的容器
        customerInfo.customerContainer = customerTabManager.findActivedTabContent().find(CUSTOMER_PANEL_SELECTOR);

        var $_tabHeadItem = customerTabManager.findActivedTabHeadItem();
        // 在tab头中 存入customerInfo
        $_tabHeadItem.data(CUSTOMERS_INFO_DATANAME, customerInfo);

        bindNewTabEvent($_tabHeadItem, customerInfo);
    };
    // 创建 新的客户tab，并在 tab头上绑定数据
    var createCustomerTab = function (customerInfo, customerTabManager) {
        customerInfo.content = '<div class="' + CUSTOMER_PANEL_CLASSNAME + '"></div>';

        layuiElementModule.tabAdd(CUSTOMERS_TAB_FILTER_NAME, customerInfo);

        // 使用 装卸地点模版 替换 新增tab的内容（因为新增tab不能添加DOM元素，所以使用这种比较麻烦的方法完成）
        customerTabManager.findLastTabContent().find(CUSTOMER_PANEL_SELECTOR).replaceWith(customerInfo.customerContainer);

        var $_tabHeadItem = customerTabManager.findLastTabHeadItem();
        // 在tab头中 存入customerInfo
        $_tabHeadItem.data(CUSTOMERS_INFO_DATANAME, customerInfo);

        bindNewTabEvent($_tabHeadItem, customerInfo);
    };
    
    // 更新 上一次的线路模版名
    var setLastLineName = function (lineName) {
        $_lineNameSelect.data(LAST_LINENAME_DATANAME, lineName);
    };

    // ------------------- 一些数据处理方法 -------------------

    // 获取页面表单域数据
    var createOrderData = function () {
        var toJavaLong = HC.data.toJavaLong;

        // 订单数据
        var orderData = $.extend(
            {
                hasSubmit: false,
                hasCascade: $_hasCascadeCheckbox.prop('checked'),
                // 所有客户的装卸货信息数组
                cap: []
            },
            createFormDataByName($_mainInfoContainer)
        );

        // 构造 装卸地点数据列表
        var createAddressDataList = function (container) {
            var addressDataList = [];

            // 遍历装卸地点行，并取出数据对象
            $(container).find(ADDRESS_LINE_SELECTOR).each(function () {
                var addressData = createFormDataByName(this);
                // 删除不保存的字段
                delete addressData.addressForRead;

                addressDataList.push(addressData);
            });

            return addressDataList;
        };

        // 获取所有客户的装卸地点数据
        var getCustomersAddressData = function (container) {
            // 对应接口中的 cap 字段，保存的是 所有客户的装卸货信息数组
            var customerDataList = [];

            // 遍历 tab头就够了
            $(container).find(TAB_HEAD_SELECTOR + ' li').each(function (i) {
                // 从tab头中取出 之前保存的数据对象
                var customerInfo = $(this).data(CUSTOMERS_INFO_DATANAME);

                // 测试时 才会进这个分支
                if (!customerInfo) {
                    console.warn('没有找到客户信息，请先选择客户');
                    return;
                }

                // 找到对象的tab内容 容器
                var $_customerContainer = customerInfo.customerContainer;

                // 构造 客户数据
                customerDataList.push({
                    customerId: toJavaLong(customerInfo.id),
                    customerName: customerInfo.name,
                    // 装货地点数据列表
                    loadAddressList: createAddressDataList($_customerContainer.find(LOAD_ADDRESS_CONTAINER_SELECTOR)),
                    // 卸货地点数据列表
                    unLoadAddressList: createAddressDataList($_customerContainer.find(UNLOAD_ADDRESS_CONTAINER_SELECTOR)),
                    // 客户单号
                    customerWaybillNo: $_customerContainer.find('[name=customerWaybillNo]').val(),
                    // 装货清单附件
                    loadListAtts: bizUtil.data.getAttrDataList($_customerContainer.find('.file-line'))
                });
            });

            return customerDataList;
        };

        // 构造 所有客户的装卸地点数据
        orderData.cap = getCustomersAddressData($_customerTabContainer);

        // 编辑模式下，需要记录被删除装卸地点的id
        if (orderData.id) {
            // 设置删除项的id
            var getDeleteItemId = function (type) {
                // 将字符串数组，转换为数字数组
                return $.map($_myForm.data(DELETE_TYPE_PREFIX_DATANAME + type), function (value, key) {
                    return Number(value);
                });
            };

            // 装货和卸货地点的type不同，所以被删除的装卸地点id 需要分开取
            orderData.delIds = getDeleteItemId('loadAddress').concat(getDeleteItemId('unloadAddress'));
        }

        return orderData;
    };
    
    // 处理数据结构（将扁平的装卸地点，包装成 以客户为组的 装卸地点）
    var createCapList = function (loadAddressList, unLoadAddressList) {
        var capList = [];
        var createAddressToCustomerItem = (function () {
            var customerCapItemMap = {};

            return function (addressDataItem, addressType) {
                var customerId = addressDataItem.customerId;
                var customerAddressItem = customerCapItemMap[customerId];
                
                // 没有则创建 新的客户对象数据
                if (!customerAddressItem) {
                    customerAddressItem = {
                        customerId: customerId,
                        customerName: addressDataItem.customerName,
                        loadAddressList: [],
                        unLoadAddressList: []
                    };

                    // 加入map中（方便后面的引用）
                    customerCapItemMap[customerId] = customerAddressItem;

                    // 将新的 客户对象数据 添加到 cap数组中
                    capList.push(customerAddressItem);
                }

                // 将 装卸地点数据 放到 对应客户的装货地址列表中
                customerAddressItem[addressType].push(addressDataItem);
            };
        })();

        $.each(loadAddressList, function (i, item) {
            createAddressToCustomerItem(item, 'loadAddressList');
        });
        $.each(unLoadAddressList, function (i, item) {
            createAddressToCustomerItem(item, 'unLoadAddressList');
        });

        return capList;
    };

    // 构建 线路模版的 装卸地点数据（会过滤掉多余参数）
    var createLineTemplateCatpList = function (dataList) {
        // 线路模版 所需要的装卸地点属性
        var addressPropertys = ['customersAddressId', 'coNameShort', 'addressAreaId', "addressAreaName", 'address', 'uname', 'mobile', 'jobTime', 'remark'];
        
        // 根据指定属性 从 原始装卸地点数据列表中生成 新的装卸地点列表
        var getAddressDataList = function (addressDataList) {
            return $.map(addressDataList, function (addressData, j) {
                return getPropertysFromObject(addressPropertys, addressData);
            });
        };

        // 从订单数据中 生成 模版数据
        var catpList = $.map(dataList, function (customerData, i) {
            return {
                customerId: customerData.customerId,
                customerName: customerData.customerName,
                // 订单生成的数据是 loadAddressList 字段，而模版详情中返回的数据是 loadAddressTpList 字段
                loadAddressTpList: getAddressDataList(customerData.loadAddressList || customerData.loadAddressTpList),
                unLoadAddressTpList: getAddressDataList(customerData.unLoadAddressList || customerData.unLoadAddressTpList)
            };
        });

        return catpList;
    };
    
    // 获取 线路模版数据
    var createLineTemplateData = function (orderData) {
        var lineTemplateData = getPropertysFromObject(basePropertys, createFormDataByName($_mainInfoContainer));

        orderData = orderData || createOrderData();
        lineTemplateData.catp = createLineTemplateCatpList(orderData.cap);

        return lineTemplateData;
    };

    // ------------------- 初始化及事件绑定 -------------------
    
    // 初始化默认数据
    var initDefaultData = function () {
    };
    // 初始化组件
    var initComponent = function () {
        // 初始化页面中的日期组件
        bizUtil.layui.initDateInput($('.date-time'));
    };
    // 更新（单个）客户的装卸地址信息
    var updateAddressContainerData = function (customerData, customerContainer, afterLoadSelectDataCallback) {
        // 第一行装货地点，用于获取动态数据，和 作为复制新行的模版
        var $_firstAddressLine = customerContainer.find(LOAD_ADDRESS_CONTAINER_SELECTOR).children().first();
        // 等 装货地点下拉框数据加载完毕之后，才开始 构建装货地址列表 并填充装卸地点数据
        updateCustomerAddressSelect({
            id: customerData.customerId,
            // 仅加载第一行装货地点的下拉框数据（因为同一客户下的装卸地点列表是一样的）
            container: $_firstAddressLine
        }, function () {
            var SELECT_ADDRESS_SELECTOR = '.select-address';
            var loadAddressList = customerData.loadAddressList || customerData.loadAddressTpList || [];
            var unLoadAddressList = customerData.unLoadAddressList || customerData.unLoadAddressTpList|| [];
            
            // 构建 装货地址列表
            if (loadAddressList.length > 1) {
                // 克隆 装货地址
                $_firstAddressLine.after(HC.dom.clone($_firstAddressLine, loadAddressList.length - 1));
            }

            // 将卸货地点列表 替换为 装货地点列表（为了使用动态列表数据）
            var $_firstUnLoadAddressLine = customerContainer.find(UNLOAD_ADDRESS_CONTAINER_SELECTOR).children().first();
            $_firstUnLoadAddressLine.find(SELECT_ADDRESS_SELECTOR).html($_firstAddressLine.find(SELECT_ADDRESS_SELECTOR).html());
            // 构建 卸货地址列表
            if (unLoadAddressList.length > 1) {
                // 克隆 卸货地址
                $_firstUnLoadAddressLine.after(HC.dom.clone($_firstUnLoadAddressLine, unLoadAddressList.length - 1));
            }

            // 填充地址
            var createAddressFiller = function ($_addressLine) {
                return function (i, addressData) {
                    // 添加一个用于前端展示的字段
                    addressData.addressForRead = processAddress(addressData.addressAreaName) + addressData.address;
                    setDataToContainer(addressData, $_addressLine.eq(i));
                };
            };
            // 填充 装货地址数据
            var $_loadAddressLine = customerContainer.find(LOAD_ADDRESS_CONTAINER_SELECTOR).find(ADDRESS_LINE_SELECTOR);
            $.each(loadAddressList, createAddressFiller($_loadAddressLine));
            // 填充 卸货地址数据
            var $_unloadAddressLine = customerContainer.find(UNLOAD_ADDRESS_CONTAINER_SELECTOR).find(ADDRESS_LINE_SELECTOR);
            $.each(unLoadAddressList, createAddressFiller($_unloadAddressLine));

            // 重新渲染 装货地点下拉框（TODO: 在多客户情况下，给客户tab内容容器加上 lay-filter 属性，每次遍历仅局部更新单个客户下的select）
            layuiFormModule.render('select');
            
            // 【重要】重新渲染 容器中的 laydate 组件（否则会因 lay-key属性相同而冲突）
            rerenderDateInput(customerContainer);

            // 若需要在 加载动态下拉框之后再执行回调，则使用 afterLoadSelectDataCallback
            afterLoadSelectDataCallback && afterLoadSelectDataCallback();
        }); // end updateCustomerAddressSelect
    };
    // 填充（单个）客户的附加信息（目前是 客户单号 和 附件信息）
    var setCustomerAdditionInfo = function (customerData, $_customerContainer) {
        $_customerContainer.find('[name=customerWaybillNo]').val(customerData.customerWaybillNo);

        bizUtil.data.createFileItems(customerData.loadListAtts, $_customerContainer.find('.file-line'));
    };
    // 初始化已有订单数据
    var initOrderData = function (orderData, initOptions, callback, afterLoadSelectDataCallback) {
        if (!orderId || !orderData) {
            return;
        }

        // 填充主要信息（调整布局之后，这里包含 除装卸地点以外的信息）
        setDataToContainer(orderData, $_mainInfoContainer);
        // 【重要】重新渲染 主要信息中的 laydate 组件（这里是为了兼容字符串型时间戳的日期值）
        rerenderDateInput($_mainInfoContainer);
        // 填充数据后，需要重新渲染一次 主要信息容器内的下拉框
        layuiFormModule.render('select');

        // 重新 关联 车牌和车架的文本
        setSiblingElementValue($_carList);
        setSiblingElementValue($_carframeList);
        // 刷新结算对象列表
        initOptions.trailerRelationManager.refreshSettlementSelect(null, null, orderData.trailerSettlementId);
        // 设置 强制关联复选框
        $_hasCascadeCheckbox.prop('checked', orderData.hasCascade);
        layuiFormModule.render('checkbox', 'hasCascadeContainer');
        // 手机号 根据 强制关联状态 设置为 只读/可写
        $_driverMobile.prop('readonly', orderData.hasCascade);

        // 保存 线路模版名
        setLastLineName(orderData.lineName);

        // tab管理器（主要提供 tab相关的信息获取方法）
        var customerTabManager = createTabManager($_customerTabContainer);

        // 构建客户列表（tab头及内容）
        $.each(orderData.cap || [], function (i, customerData) {
            var customerInfo = {
                id: customerData.customerId,
                title: customerData.customerName,
                name: customerData.customerName
            };

            // 第一个客户，更新 tab的信息
            if (i === 0) {
                updateCustomerTab(customerTabManager, customerInfo);
            }
            // 多于一个客户时，添加 新的tab
            else {
                customerInfo.customerContainer = initOptions.addressGroupTemplate.clone();
                createCustomerTab(customerInfo, customerTabManager);
            }

            // customerInfo.customerContainer 引用值 在创建tab后才有
            var $_customerContainer = customerInfo.customerContainer;

            // 填充客户单号 和 附件信息
            setCustomerAdditionInfo(customerData, $_customerContainer);

            // 填充客户地址信息（若需要在 加载动态下拉框之后再执行回调，则使用 afterLoadSelectDataCallback）
            updateAddressContainerData(customerData, $_customerContainer, afterLoadSelectDataCallback);
        }); // end $.each 构建客户列表

        // 回调若跟 动态下拉框数据无关，则使用 callback
        callback && callback();
    };

    // 加载动态数据（包括下拉列表、运单详情等数据）
    var loadData = function (callback) {
        // TODO: 开启（简单）遮罩

        // 加载客户列表
        bizUtil.init.initSelectData($_myForm, {
            defaultOptions: {
                idFieldName: 'key',
                textFieldName: 'value'
            }
        }, function (hcDeferredList) {
            // TODO: when().fail
            $.when.apply($, hcDeferredList).done(callback);
        });
    };

    // 绑定页面事件
    var bindEvent = function (initData) {
        var LAY_FILTER_ATTR_NAME = 'lay-filter';

        // tab管理器（主要提供 tab相关的信息获取方法）
        var customerTabManager = createTabManager($_customerTabContainer);

        // 更新 客户下拉列表的选中项
        var updateCustomerSelect = function (value) {
            setSelectedOption($_customerSelect, value, layuiFormModule);
        };

        // 关闭校验未通过的提示框
        var closePageTips = function (index) {
            if (index) {
                layer.close(index);
            }
            else {
                // 因为操作过程中可能会出现一些弹窗，所以不能保证 校验提示框的index 与 layer.index 一致，因此不能使用 layer.close(layer.index)
                layer.closeAll();
            }
        };

        // ------------------------- 装卸地点 添加、复制、删除 事件 ----------------------------
        var operationAddressOptionsList = (function () {
            // 删除行 之后的回调事件
            var afterDeleteDoneCallback = function (removeElement, options) {
                setDeleteIdToContainContainer(removeElement, options);

                closePageTips();
            };
            // 插入新行之后，更新 装卸地点列表
            var afterInsertLineCallback = function ($_newLineContainer, $_targetLineContainer, lineData) {
                updateCustomerAddressSelect({
                    container: $_newLineContainer,
                    // 找到所对应的tab头，并从中取出 客户id
                    customerId: customerTabManager.findActivedTabHeadItem().data(CUSTOMERS_INFO_DATANAME).id
                }, function () {
                    // 复制的话，还需要 设置选中的下拉框
                    if (lineData) {
                        setSelectedOption($_newLineContainer.find('select'), lineData.customersAddressId, layuiFormModule)
                    }
                });
            };
            // 复制时，需要删除记录的id（包括 装货和卸货地点）
            var deleteId = function (container) {
                $(container).find('[name=id]').val('');
            };
            
            // 操作对象 配置信息 列表（箱型信息、装卸信息、船务信息 的 删除、添加、复制 配置）
            return [
                // 装货信息
                {
                    // 该属性供内部使用，用于标识 配置类型
                    _cnName: '装货信息',
                    _type: 'loadAddress',
                    lineClassName: 'customer-load-address-line',
                    lineDeleteTips: '每个客户最少要有一个装货地点',
                    // 复制时 清空装货信息id
                    afterCopyDoneCallback: deleteId,
                    // 记录被删除项的id
                    afterDeleteDoneCallback: afterDeleteDoneCallback,
                    afterInsertLineCallback: afterInsertLineCallback

                    // 还可以配置下面这些属性
                    // container: 'form:first',
                    // lineSelector: '.' + lineClassName （lineClassName 值为当前配置对象的 lineClassName 属性 ）
                    // contextSelector: '',
                    // belongsContainContainerSelector: '',
                    // deleteOperationSelector: '.icon-delete',
                    // addOperationSelector: '.icon-add',
                    // copyOperationSelector: '.icon-copy',
                    // isBindAddEvent: true,
                    // isBindCopyEvent: true,
                    // isBindDeleteEvent: true,
                    // beforeCreateLineCallback: ($_targetLineContainer, isCopyMode)=>{},
                    // beforeInsertLineCallback: ($_newLineContainer, $_targetLineContainer, lineData)=>{},
                    // afterAddDoneCallback: ($_newLineContainer, $_targetLineContainer)=>{},
                    // lineAnimateClassName: 'layui-anim layui-anim-upbit',
                },
                // 卸货信息
                {
                    _cnName: '卸货信息',
                    _type: 'unloadAddress',
                    lineClassName: 'customer-unload-address-line',
                    lineDeleteTips: '每个客户最少要有一个卸货地点',
                    // 复制时 清空卸货信息id
                    afterCopyDoneCallback: deleteId,
                    afterDeleteDoneCallback: afterDeleteDoneCallback,
                    afterInsertLineCallback: afterInsertLineCallback
                }
            ];
        })();
        // 一键绑定 装卸地点 的 删除、添加、复制 事件
        var createNewLine = orderCommon.shippingEvent.fastBindEvent(operationAddressOptionsList, $_myForm);
        
        // ------------------------- 修改 装卸地点详细地址 事件 ----------------------------
        orderCommon.bindEditAddressEvent($_myForm, {
            templateHTML: $('#detailLineTemplate').html(),
            layuiFormModule: layuiFormModule,
            districtOptions: {
                areaAndDetailFieldName: 'addressForRead'
            }
        });

        // ------------------------- 业务限制/校验/联动 事件 ----------------------------
        // 客户列表下拉框事件
        layuiFormModule.on('select(customerList)', function (data) {
            var customerId = data.value;
            var customerName = $(data.othis).find('.layui-this').text();

            setSiblingElementValue(data.elem);

            // 当选择空的下拉框值时，不处理
            if (!customerId) {
                return;
            }
            
            // 客户信息
            var customerInfo = {
                id: customerId,
                title: customerName,
                // 多加一个name，方便提交表单时 构造表单数据
                name: customerName
            };

            // 第一次选择客户时，需要更新第一个tab的信息 而不是创建新的tab
            if (!customerTabManager.getActivedTabItemId()) {
                // 更新 客户tab的信息
                updateCustomerTab(customerTabManager, customerInfo);

                // 更新 装卸地点下拉列表数据
                updateCustomerAddressSelect(customerInfo);

                return;
            }
            // 业务决定不支持多客户了。如果以后需要支持多客户，则去掉此else即可
            // else {
            //     // 先保存 将要删除的装卸地点id
            //     addDeleteAddressIdToForm(customerTabManager.findActivedTabContent());
            //     // 删除当前激活的tab
            //     layuiElementModule.tabDelete(CUSTOMERS_TAB_FILTER_NAME, customerTabManager.getActivedTabItemId());
            // }

            // 当没有tab项时，才创建新的tab头
            if (!customerTabManager.hasTabItem(customerId)) {
                // 保存tab内容引用，方便获取数据时找到对应的容器
                customerInfo.customerContainer = initData.addressGroupTemplate.clone();

                createCustomerTab(customerInfo, customerTabManager);

                // 【重要】重新渲染 容器中的 laydate 组件（否则会因 lay-key属性相同而冲突）
                rerenderDateInput(customerInfo.customerContainer);

                // 更新 装卸地点下拉列表数据
                updateCustomerAddressSelect(customerInfo);
            }

            layuiElementModule.tabChange(CUSTOMERS_TAB_FILTER_NAME, customerId); 
        });
        // 切换tab时，更新下拉框的显示值
        layuiElementModule.on('tab(' + CUSTOMERS_TAB_FILTER_NAME + ')', function (data) {
            // 新增、删除、点击切换tab时，都要关闭现有的 校验提示框
            closePageTips();

            // this 指向 当前Tab标题所在的原始DOM元素
            var customerId = customerTabManager.getTabItemId(this);

            // 没有找到 customerId （说明是layui的bug触发的事件） 或者 该customerId已是下拉框的选中值（因为点击已选中的tab头时 也会触发切换tab事件），则不必更新 下拉框
            if (!customerId || (customerId == $_customerSelect.val())) {
                return;
            }
            
            updateCustomerSelect(customerId);
        });

        // 选择装卸地点，自动填充 详细地址、联系人、电话、装卸备注
        layuiFormModule.on('select(customerAddress)', function(data) {
            var $_customerAddressSelect = $(data.elem);
            var $_container = $_customerAddressSelect.parents(ADDRESS_LINE_SELECTOR);
            
            var addressId = data.value;
            // 装卸地点默认数据为空
            var defaultAddressData = {
                addressAreaId: '',
                addressAreaName: '',
                address: '',
                addressForRead: '',
                uname: '',
                mobile: '',
                remark: ''
            };

            // 更改装卸地点之后，还需要保存名称 到隐藏域中
            setSiblingElementValue($_customerAddressSelect);

            // 选择空的装卸地点时，使用空数据清空 装卸地点信息
            if (!addressId) {
                bizUtil.data.setDataToContainer(defaultAddressData, $_container);
                return;
            }

            // 装卸地点id不为空时，发送请求 并根据响应数据 填充装卸地点信息
            HC.ajax.get('/ucenter/crm/customers/customersAddress/getDetail.shtml?id=' + addressId, {
                // 填充 装卸地址
                success: function (responseData, textStatus, jqXHR) {
                    var addressAreaName = processAddress(responseData.addressDetail);

                    // 将 响应数据转换为 与name对应的字段名，并由bizUtil.data.setDataToContainer方法填充value
                    bizUtil.data.setDataToContainer($.extend({}, defaultAddressData, {
                        addressAreaId: responseData.addressAreaId,
                        addressAreaName: addressAreaName,
                        // 省市县街道后面的详细地址
                        address: responseData.address,
                        // 拼接一个地址完整，用于前端展示
                        addressForRead: addressAreaName + responseData.address,
                        uname: responseData.uname,
                        mobile: responseData.mobile,
                        remark: responseData.notes
                    }), $_container);
                }
            });
        });

        // ------------------------- 线路模版 事件 ----------------------------
        // 切换模版事件
        layuiFormModule.on('select(lineName)', function (data) {
            // TODO: 解决 编辑运单时，默认值 可能不是 ''，所以切换模版 取消后会丢失 下拉框的默认值
            var lastSelectLineName = $_lineNameSelect.data(LAST_LINENAME_DATANAME) || '';

            // 选择的是空值（“请选择”这一项）时，不发送请求 也暂不改变表单内容
            if (!$_lineNameSelect.val()) {
                // 更新 上一次的线路模版名（即使是 空值也要记录）
                setLastLineName('');
                return;
            }

            // 设置线路模版数据到页面表单中
            var setLineTemplateDataToForm = function (confirmIndex) {
                var lineName = $_lineNameSelect.val();

                // 更新 上一次的线路模版名
                setLastLineName(lineName);

                HC.ajax.get('/ucenter/tms/city/cityWaybillTp/getTpDetail.shtml', {
                    data: {
                        // 线路名
                        name: lineName
                    },
                    // 设置 线路模版 的数据到运单中（基础数据 和 装卸地点数据）
                    success: function (dataObjects, textStatus, jqXHR, responseJSON) {
                        // 将 线路模版中的 客户id、客户名称、箱型信息、应收运费 填充到页面中
                        var baseLineTemplateData = getPropertysFromObject(basePropertys, dataObjects);
                        setDataToContainer(baseLineTemplateData, $_mainInfoContainer);
                        // 重新渲染 箱型信息和客户列表下拉框
                        layuiFormModule.render('select');

                        // 先记录 所有带id的装卸地点（将要被删除）
                        addDeleteAddressIdToForm($_customerTabContainer);
                        // 然后清空所有 tab
                        customerTabManager.getAllTabHeadItem().each(function (i) {
                            var layId = $(this).attr(LAY_ID_ATTR_NAME);
                            if (!layId) {
                                layId = 'firstTabInAdd';
                                // 新增时，第一个tab是没有id的，所以手动加上tab，才可以调用tabDelete删除掉
                                $(this).attr(LAY_ID_ATTR_NAME, layId);
                            }

                            layuiElementModule.tabDelete(CUSTOMERS_TAB_FILTER_NAME, layId);
                        });

                        // 再重新构建客户列表（tab头及内容）
                        var capList = createCapList(dataObjects.loadAddressTpList, dataObjects.unLoadAddressTpList);
                        $.each(createLineTemplateCatpList(capList), function (i, customerData) {
                            var customerInfo = {
                                id: customerData.customerId,
                                title: customerData.customerName,
                                name: customerData.customerName
                            };

                            // createCustomerTab 和 updateAddressContainerData 方法中 都需要用到 customerInfo.customerContainer
                            customerInfo.customerContainer = initData.addressGroupTemplate.clone();
                            // 因为是通过线路模版创建的，所以始终使用 createCustomerTab 而不用 updateCustomerTab
                            createCustomerTab(customerInfo, customerTabManager);

                            // 更新每个客户的装卸地址信息
                            updateAddressContainerData(customerData, customerInfo.customerContainer);
                        }); // end $.each 构建客户列表

                        // 最后，激活第一个 tab
                        var firstTabId = customerTabManager.findFirstTabHeadItem().attr(LAY_ID_ATTR_NAME);
                        layuiElementModule.tabChange(CUSTOMERS_TAB_FILTER_NAME, firstTabId);

                        // 有confirmIndex说明是在 弹窗回调里，所以需要关闭指定弹层
                        confirmIndex && layer.close(confirmIndex);
                    }
                });

                return false;
            };

            // 跟运输线路模版有关的数据没有改动时，不用弹出 覆盖询问框
            if (!initData.lineTemplateDataComparer.isOriginalDataChange()) {
                setLineTemplateDataToForm();

                return;
            }

            layerConfirm('切换线路模版会丢失 现有未保存的运单数据，是否确认覆盖？', setLineTemplateDataToForm, function () {
                // 取消 覆盖
                setSelectedOption($_lineNameSelect, lastSelectLineName, layuiFormModule);
            });
        });
        // 保存模版事件
        $('.tmpl-save-icon').click(function () {
            // 为了校验效率，这里没有直接使用 createLineTemplateData() 方法，而是分步获取 运输线路模版的 基础数据和装卸地点数据
            var lineTemplateData = getPropertysFromObject(basePropertys, createFormDataByName($_mainInfoContainer));
            // 校验时，应收运费允许为空
            var verifyPropertys = basePropertys.slice(0, -1);

            if (!isPropertysAllInObject(verifyPropertys, lineTemplateData)) {
                layerAlert('保存线路模版时，需要选择 客户 和 箱型');

                return;
            }

            // 对 客户列表中的所有装卸地点 进行统一校验规则
            if (!bizUtil.validator.verifyContainer($_customerTabContainer)) {
                return;
            }

            lineTemplateData.catp = createLineTemplateCatpList(createOrderData().cap);

            // 为了方便校验，需要先把所有装卸地点打平为一个数组
            var allAddressList = $.map(lineTemplateData.catp, function (customerData, i) {
                return customerData.loadAddressTpList.concat(customerData.unLoadAddressTpList);
            });
            // 校验 线路模版中 需要的装卸地点字段
            var isValidated = true;
            var needPropertys = ['customersAddressId', 'coNameShort', 'addressAreaId', 'address', 'uname', 'mobile'];
            $.each(allAddressList, function (i, addressData) {
                if (!isPropertysAllInObject(needPropertys, addressData)) {
                    layerAlert('保存线路模版时，装卸地点、联系人、电话、详细地址 不能为空');
                    isValidated = false;
    
                    return false;
                }
            });
            // 线路模版 字段校验不通过，则返回
            if (!isValidated) {
                return;
            }

            // 构建线路map
            var lineNameMap = {};
            $.each($_lineNameSelect.data(DATALIST_DATANAME), function (i, item) {
                // 线路模版名 为 key，线路模版id为值
                lineNameMap[item.value] = item.key;
            });

            // 保存模版
            var saveLineTemplate = function (postData, success, codeError) {
                HC.ajax.post('/ucenter/tms/city/cityWaybillTp/add.shtml', {
                    data: postData,
                    success: success,
                    codeError: codeError
                });
            };

            // 刷新 线路模版 下拉列表
            var refreshLineSelect = function () {
                // 原来的线路名
                var lineName = $_lineNameSelect.val();
                
                bizUtil.layui.loadDataToSelect($_lineNameSelect, {
                    // 默认值为 原来的线路名
                    value: lineName
                });
            };

            layer.prompt({
                title: '请输入要保存的模版名'
            }, function (value, promptIndex, elem) {
                // 保存线路模版名
                lineTemplateData.lineName = value;
                
                // 如果输入的线路 有对应id，则提示 是否覆盖
                if (lineNameMap[value]) {
                    layerConfirm('该线路模版已存在，是否覆盖？', function (confirmIndex) {
                        // 明确覆盖时，则添加线路模版id
                        lineTemplateData.id = lineNameMap[value];

                        saveLineTemplate(lineTemplateData, function () {
                            layer.close(confirmIndex);
                            layer.close(promptIndex);

                            layerAlert('保存线路模版成功');
                            // 刷新 线路模版
                            refreshLineSelect();
                        }, function () {
                            console.log('bizError');
                        });

                        return false;
                    });
                }
                else {
                    // 前端判断没有重复的线路模版，则删除id以 明确为新增线路模版操作
                    delete lineTemplateData.id;

                    saveLineTemplate(lineTemplateData, function () {
                        layer.close(promptIndex);
                        
                        layerAlert('新增线路模版成功');
                        // 刷新 线路模版
                        refreshLineSelect();
                    }, function () {
                        // bizError
                        // TODO: 提示是否覆盖已存在的线路模版（需要前端重新更新 线路模版列表，并加上id后，再调用一次saveLineTemplate）
                    });
                }

                console.log('输入的模版名： [%s] ，模版数据：', value, lineTemplateData);
            });
        });

        // ------------------------- 提交及取消订单 事件 ----------------------------
        // 提交订单数据
        var postOrderData = function (orderData) {
            if (!bizUtil.validator.verifyContainer($_myForm)) {
                return false;
            }

            HC.ajax.post('/ucenter/tms/city/cityWaybill/add.shtml', {
                data: orderData,
                success: function (responseData, textStatus, jqXHR) {
                    // 在父窗口弹出提示
                    layerAlert.call(window.parent, '保存成功！', function (index) {
                        // 刷新列表页内容
                        bizUtil.frame.refreshListFrame();

                        // 勾选【继续新增】，则刷新iframe
                        if ($('#continueAddCheckbox').prop('checked')) {
                            window.location.reload();
                        }
                        // 没有勾选【继续新增】，则关闭iframe
                        else {
                            bizUtil.frame.closeCurrentIframeTab(window.parent);
                        }
                    });
                }
            });
        };
        // 表单提交
        layuiFormModule.on('submit(save)', function (data) {
            // 保存订单数据
            postOrderData(createOrderData());

            // 强制失去焦点（防止后续的回车事件持续触发表单提交）
            $(this).blur();
        });
        // 表单提交/保存并提交
        layuiFormModule.on('submit(saveAndSubmit)', function (data) {
            // 校验提示文案
            var tipsTexts = [
                // '请选择司机',
                // '请输入司机手机号',
                '请选择拖车车牌'
            ];
            // 校验元素（司机、司机手机 已不校验）
            var notNullElementList = [
                // $_driverNameList,
                // $_driverMobile,
                $_carList
            ];
            var isValidated = true;

            // 校验 拖车车辆 不能为空
            $.each(notNullElementList, function (i, $_item) {
                if (!$_item.val()) {
                    isValidated = false;

                    layer.msg(tipsTexts[i]);
                    
                    // 定位焦点（对于select元素，定位到 美化后的layui下拉组件的input中）
                    if ($_item.is('select')) {
                        $_item.next().find('input').focus();
                    }
                    else {
                        $_item.focus();
                    }

                    return false;
                }
            });

            if (!isValidated) {
                return;
            }

            // 校验通过，则保存并提交
            var orderData = createOrderData();

            // 保存并提交 标记字段
            orderData.hasSubmit = true;
            // 保存订单数据
            postOrderData(orderData);

            // 强制失去焦点（防止后续的回车事件持续触发表单提交）
            $(this).blur();
        });
        // 取消运单
        $('#cancelButton').click(function (e) {
            // 【取消订单按钮】真正要执行的逻辑
            var cancelOrderHandler = function () {
                bizUtil.frame.closeCurrentIframeTab(window.parent);
            };

            // 表单数据没有改动时，不用弹出 确认取消询问框
            if (!initData.orderDataComparer.isOriginalDataChange()) {
                cancelOrderHandler();

                return;
            }

            layerConfirm('取消运单 会关闭本页面，未保存的数据将丢失，确定取消该运单？', cancelOrderHandler);
        });
        // 重置按钮事件
        $('#resetButton').click(function (e) {
            layerConfirm('重置后会清空 本页面未保存的数据，确定重置？', function () {
                // TODO: 仅清空指定字段（而且表单默认的重置功能，也不会清空 hidden型的input。需要手动清空一些带name的hidden型input）
                $_myForm[0].reset();
            });

            return false;
        });
        
        // 用于测试时，校对字段值是否正确
        $('#logFormData').click(function () {
            if (!bizUtil.validator.verifyContainer($_myForm)) {
                return false;
            }
            console.log('统一规则校验【通过】');

            var orderData = createOrderData();
            var logPropertyName = HC.data.logPropertyName;

            logPropertyName([
                "hasSubmit","jobDate","lineName","customerId","customerName","arkType","freight","sendPrice","prepaidFreight","hasCascade",
                "carId","carNo","carframeId","carframeNo","driverId","driverName","driverMobile","carCompanyId","carCompanyShortname","trailerSettlementId","waybillRemark","cap","delIds",
            ], orderData, '最外层属性');

            logPropertyName([
                "customerId","customerName","loadAddressList","unLoadAddressList","customerWaybillNo","loadListAtts"
            ], orderData.cap, 'cap 客户列表');

            console.log('【被删除的 已有装卸地点列表】', orderData.delIds);

            if (orderData.cap[0]) {
                logPropertyName([
                    "id","customersAddressId","addressAreaName","coNameShort","addressAreaId","address","uname","mobile","weight","volume","jobTime","remark"
                ], orderData.cap[0].loadAddressList, '第一个客户的 装货信息 属性');
                logPropertyName([
                    "id","customersAddressId","addressAreaName","coNameShort","addressAreaId","address","uname","mobile","weight","volume","jobTime","remark"
                ], orderData.cap[0].unLoadAddressList, '第一个客户的 卸货信息 属性');
                logPropertyName([
                    "attFileName","attFileUrl"
                ], orderData.cap[0].loadListAtts, '第一个客户的 附件信息 属性');
            }

            console.log('完整的订单数据', orderData);

            return false;
        });

        // ------------------------- 附件上传 事件 ----------------------------
        // 在 创建tab时 已经绑定了附件上传事件，所以这里不用绑定。如果这里重复绑定上传事件，则layui.upload直接罢工（连上传请求都不会发了）

        // ------------------------- 其它 事件 ----------------------------

        return createNewLine;
    };


    // 页面初始化入口
    (function () {
        // 没有数据依赖的初始化
        initDefaultData();
        initComponent();

        // 进入 查看页面，则隐藏操作按钮
        if (isOrderDetailPage) {
            $_myForm.addClass('form--detail');
        }

        // 加载完所需的下拉列表数据，再绑定操作事件
        loadData(function () {
            // 先缓存 一组装卸地点模版
            var $_addressGroupTemplate = $_customerTabContainer.find(CUSTOMER_PANEL_SELECTOR).clone();
            var initOptions = {
                addressGroupTemplate: $_addressGroupTemplate,
                // 拖车车牌关系管理器
                trailerRelationManager: TrailerRelationManager.createRelationManager({
                    isVerifyRemarkByCascade: true
                })
            };

            // 创建 数据对比器，并 添加到 目标对象 中
            var createDataComparerToObject = function (targetObject) {
                var originalOrderData = createOrderData();

                // 创建订单数据对比器（需要保存 改动前的订单数据），方便“取消”按钮时 判断是否弹出 询问框
                targetObject.orderDataComparer = new HC.DataComparer(originalOrderData, createOrderData);
                targetObject.lineTemplateDataComparer = new HC.DataComparer(createLineTemplateData(originalOrderData), createLineTemplateData);
            };

            // 如果有订单id，则进入 查看详情 或 编辑订单 功能
            if (orderId) {
                // 获取订单详情
                HC.ajax.get('/ucenter/tms/city/cityWaybill/getDetail.shtml', {
                    data: {
                        id: orderId
                    },
                    success: function (dataObjects, textStatus, jqXHR, responseJSON) {
                        // 处理数据结构
                        // dataObjects.cap = createCapList(dataObjects.loadAddressList, dataObjects.unLoadAddressList);
                        
                        initOrderData(dataObjects, initOptions, function () {
                            // 非 “查看” 页面，就可以操作页面
                            if (!isOrderDetailPage) {
                                // 绑定事件
                                bindEvent(initOptions);
                            }
                        
                        // 这个回调，是在 所有下拉框数据加载后才触发的
                        }, function () {
                            // 查看页面，不能操作
                            if (isOrderDetailPage) {
                                // 禁用表单元素
                                $_myForm.find('input, select, textarea').prop('disabled', true);
                                layuiFormModule.render();
                                // 得在 form.render 之后，layui的美化下拉框的input才能禁用成功
                                $_myForm.find('.layui-select-disabled input').prop('disabled', true);
                            }

                            // 保存 编辑运单前的 订单数据 和 运输线路模版数据
                            createDataComparerToObject(initOptions);
                        });
                    }
                });

                // 不执行后面的绑定事件，改在 initOrderData 的回调里执行
                return;
            }

            // 新增时，显示 “继续新增”复选框 和 “重置” 按钮
            $('#continueAddContainer, #resetButton').show();
            createDataComparerToObject(initOptions);

            // TODO: 将新增、编辑都要执行的代码抽象到流程中
            // 绑定事件
            bindEvent(initOptions);

            // TODO: 优化这种实现方式
            (function () {
                // 待 bindEvent 之后，改变 装卸地点下拉的文案提示（用于 未选择客户时的提醒）
                $_customerTabContainer.find('[name=customersAddressId]').each(function () {
                    var $_addressSelect = $(this);

                    $_addressSelect.find('option').last().text('请先选择客户');
                    bizUtil.layui.fastRenderSelect(layuiFormModule, $_addressSelect);
                });
            })();
        }); // end loadData
    })();  // end 页面初始化入口
}); // end layui.use