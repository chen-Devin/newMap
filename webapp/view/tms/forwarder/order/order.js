// 订单模块
var orderModule = (function () {
    // 创建 订单处理器 实例（以后调用方法就不必都传入 layui）
    var createOrderInstance = function (layui, initOptions) {
        // 依赖的 layui 模块
        var layer = layui.layer;
        var layuiFormModule = layui.form;
        var layuiUploadModule = layui.upload;
        
        // 常量
        var BOX_LINE_SELECTOR = '.box-line-container';
        var ADDRESS_LINE_SELECTOR = '.customer-address-line';
        // 删除项的data名前缀
        var DELETE_TYPE_PREFIX_DATANAME = 'delete_type_';
        // 文件项的data名
        var FILE_ID_DATANAME = 'fileId';
        // 装卸地址 原始下拉框
        var ADDRESS_DROPDOWN_SELECTOR = '.address-select';

        // 缓存变量
        var $_myForm = $('#myForm');
        var $_brokerDataContainer = $('#brokerDataContainer');
        var $_brokerInfoContainer = $('#brokerInfoContainer');
        var $_dangerousGoodsContainer = $('#dangerousGoodsContainer');

        // ------------------- 一些工具方法 -------------------
    
        // 将 下拉框的选中文本 设置到相邻的隐藏域中
        var setSiblingElementValue = HC.dom.select.setSiblingElementValue;
        // var getPropertysFromObject = HC.util.getPropertysFromObject;
        // var isPropertysAllInObject = HC.util.isPropertysAllInObject;
        var toJavaLong = HC.data.toJavaLong;
        // 重新渲染 laydate 组件
        var rerenderDateInput = bizUtil.layui.rerenderDateInput;
        var fastRenderSelect = bizUtil.layui.fastRenderSelect;
        var relateDropDownToElement = bizUtil.layui.relateDropDownToElement;
        // var setSelectedOption = bizUtil.layui.setSelectedOption;
        var createFormDataByName = bizUtil.data.createFormDataByName;
        var setDataToContainer = bizUtil.data.setDataToContainer;
        // 处理省市县地址中的逗号
        var processAddress = bizUtil.data.processAddressAreaName;
        
        var newFlowManager = orderCommon.newFlowManager;
        var shippingEvent = orderCommon.shippingEvent;

        // 关闭校验未通过的提示框（删除容器时，需要将容器内的警告提示框删除）
        var closeTipsInContainer = function (container) {
            // 带 name的元素都可能有 tips（HCValidator.closeTips方法内部会容错）
            $(container).find('[name]').each(function () {
                HCValidator.closeTips($(this));
            });
        };
    
        // ------------------- 一些数据处理方法 -------------------
        
        // 获取页面表单域数据
        var createOrderData = function () {
            // 订单数据
            var orderData = $.extend(
                {
                    // 复选框的值
                    hasChauffeur: false,
                    hasRequireWeighing: false,
                    hasCash: false,
                    hasEntrust: false
                },
                {
                    // 船务信息
                    orderShipping: [],
                    // 订单附件列表
                    orderAtt: [],
                    // 订单备注
                    remark: $('#remarkTextarea').val()
                },
                // 主要信息
                createFormDataByName($('#mainInfoContainer')),
                // 报关资料
                createFormDataByName($_brokerDataContainer, {
                    provinceSelector: 'select[name=deliveryProvince]',
                    citySelector: 'select[name=deliveryCity]',
                    countrySelector: 'select[name=deliveryCountry]',
                    streetSelector: 'select[name=deliveryStreet]'
                }),
                // 报关信息
                createFormDataByName($_brokerInfoContainer)
            );
    
            // 去掉 upload组件添加的 file 名
            delete orderData.file;
    
            // 构建 船务信息列表数据
            $_myForm.find('.shipping-line-container').each(function () {
                var shippingData = newFlowManager.createDataFromLine(this, 'shipping');

                // 去掉 upload组件添加的 file 名
                delete shippingData.file;

                // 删除 装卸地址组件中 不保存的字段
                $.each(shippingData.orderAddresses || [], function (i, orderAddress) {
                    delete orderAddress.fullAddress;
                });

                orderData.orderShipping.push(shippingData);
            });
    
            // 构建 附件列表数据
            var createAttachmentList = function (container, options) {
                var settings = $.extend({
                    fileLineSelector: '.file-line',
                    fileItemSelector: '.file-item',
                    fileNameelector: '.file-name',
                    serverFileNameAttrName: 'server_file_name',
                    // 用于从文件行容器中 获取 附件类型的 data名
                    attachmentTypeDataName: 'attachment_type',
                    // 附件的类型，默认值为 3（表示 船务S/O。这个值如果在html中设置，得放在<form>标签上）
                    attachmentType: 3,
                    // 用于从文件行容器中 获取 附件所属小类的 data名
                    attachmentNameDataName: 'attachment_name',
                    // 文件名分隔符
                    fileNameSeparator: HC.constVariable.FILE_NAME_SEPARATOR,
                }, options);
                
                var $_container = $(container);
                var fileNameelector = settings.fileNameelector;
                var serverFileNameAttrName = settings.serverFileNameAttrName;
                var attachmentType = $_container.data(settings.attachmentTypeDataName) || settings.attachmentType;
                var attachmentNameDataName = settings.attachmentNameDataName;
                var fileNameSeparator = settings.fileNameSeparator;
    
                // 附件列表
                var attachmentList = [];
    
                // 遍历 文件行容器
                $_container.find(settings.fileLineSelector).each(function (fileLineIndex) {
                    var $_fileLineContainer = $(this);
                    var fileNameList = [];
                    var fileUrlList = [];
    
                    // 遍历行内的 文件项
                    $_fileLineContainer.find(settings.fileItemSelector).each(function () {
                        var $_fileItem = $(this);
    
                        // 添加 文件显示名 和 文件服务器地址名
                        fileNameList.push($_fileItem.find(fileNameelector).text());
                        fileUrlList.push($_fileItem.attr(serverFileNameAttrName));
                    });

                    var attachmentId = toJavaLong($_fileLineContainer.data(FILE_ID_DATANAME));
                    var attachmentName = $_fileLineContainer.data(attachmentNameDataName);

                    // 没有附件记录id，说明不是编辑操作。在新增操作下，fileNameList没有元素则说明 无实际上传文件（或上传的文件最终在界面上都删除了），这时忽略此附件信息
                    if (!attachmentId && !fileNameList.length) {
                        return;
                    }

                    // 构建文件数据对象
                    attachmentList.push({
                        // 文件项id
                        id: attachmentId,
                        attType: attachmentType,
                        // 附件所属小类 值需为 字符串
                        attName: attachmentName || String(fileLineIndex),
                        attFileName: fileNameList.join(fileNameSeparator),
                        attFileUrl: fileUrlList.join(';')
                    });
                });
    
                return attachmentList;
            };
    
            // 生成 船务信息 的附件列表数据
            var shippingAttachmentList = createAttachmentList($_myForm, {
                fileLineSelector: '.shipping-line-container',
                fileItemSelector: '.so-attachment-item'
            });
            // 将 船务信息、报关信息、危品申报 的附件列表数据 添加到 订单数据 中
            orderData.orderAtt = shippingAttachmentList.concat(createAttachmentList($_brokerInfoContainer), createAttachmentList($_dangerousGoodsContainer));

            // 几个复选框（携带司机本、需要过磅、现金结算）的值 可以为 boolean 类型，所以这里直接用 .prop() 方法的返回值（ boolean 类型）赋值
            orderData.hasChauffeur = $('#withDriverBookCheckbox').prop('checked');
            orderData.hasRequireWeighing = $('#requireWeighingCheckbox').prop('checked');
            orderData.hasCash = $('#cashCheckbox').prop('checked');
    
            // 编辑模式下，需要记录被删除项的id
            if (orderData.id) {
                // 获取删除项id数组（存储编辑时 被删除的 船务信息id、箱型信息id、装卸地点id）
                orderData.boxTypeDelList = $_myForm.data(DELETE_TYPE_PREFIX_DATANAME + 'box') || [];
                orderData.addressDelList = $_myForm.data(DELETE_TYPE_PREFIX_DATANAME + 'address') || [];
                orderData.shipDelList = $_myForm.data(DELETE_TYPE_PREFIX_DATANAME + 'shipping') || [];
            }
    
            return orderData;
        };
        
        
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
        
        // 设置 省市县组件 的地区id
        var setDistrict = function (container, layuiFormModule, areaId) {
            var DISTRICT_COMPOMENT_CLASSNAME = 'compoment-district';
            var $_container = $(container);
            var $_district = null;

            if ($_container.hasClass(DISTRICT_COMPOMENT_CLASSNAME)) {
                $_district = $_container;
            }
            // 若容器没有 省市县组件的类名标识，则查找 带有省市县组件类名的 子元素
            else {
                $_district = $_container.find('.' + DISTRICT_COMPOMENT_CLASSNAME);
            }
            
            // 执行渲染
            $('#' + $_district.attr('id')).district(layuiFormModule, areaId);
        };

        // 更新 装卸地点 或 报关行 下拉列表
        var updataAddressOrBrokenSelect = function (container, options) {
            return bizUtil.layui.loadDataToSelect(container, $.extend({
                dataUrl: '/ucenter/tms/order/order/getAddressOrBroken.shtml?selectType=' + options.selectType + '&addType=tch&customerId=' + options.customerId,
                idFieldName: 'key',
                textFieldName: 'value'
            }, options));
        };
        
        // ------------------- 业务限制 工具方法 -------------------
        var bizLimitUtil = (function () {
            var EXPORT_TRANSFER_VALUE = '2';
            var IMPORT_TRANSFER_VALUE = '4';
            var GOODS_TYPE_DANGEROUS = '2';
            var PUT_WAY_UNLIMITED = '0';

            var $_withDriverBookCheckbox = $('#withDriverBookCheckbox');
            var $_withDriverBookCheckboxContainer = $_withDriverBookCheckbox.parent();
            
            // 是否为 转关 方式（出口转关、进口转关）
            var isTransferWay = function (value) {
                return (value == EXPORT_TRANSFER_VALUE) || (value == IMPORT_TRANSFER_VALUE);
            };
            // 是否为 出口 方式（出口清关、出口转关）
            var isExportWay = function (value) {
                return (value == 1) || (value == 2);
            };

            // 提供 转关方式、货物类型、运费协议号、委托服务、箱型 的业务关联限制方法
            return {
                // 转关方式 决定 是否必须勾选携带司机本
                transferWayRelateDriverBook: function (transferWayValue) {
                    // 如果报关方式是转关，则必须勾选携带司机本
                    var isMustChecked = isTransferWay(transferWayValue);
                    
                    if (isMustChecked) {
                        $_withDriverBookCheckbox.prop('checked', isMustChecked);
                        
                        // 在父容器上绑定 悬浮事件
                        $_withDriverBookCheckboxContainer.on('mouseenter.checkboxDisable', function () {
                            HC.tips.info('报关方式是转关，必须携带司机本', this);
                        });
                    }
                    else {
                        // 移除 悬浮事件
                        $_withDriverBookCheckboxContainer.off('mouseenter.checkboxDisable');
                    }

                    // 复选框的可选状态 取决于是否必须勾选携带司机本
                    $_withDriverBookCheckbox.prop('disabled', isMustChecked);

                    layuiFormModule.render('checkbox', 'driverBookContainer');
                },
                // 货物类型 决定 危品信息区的显示/隐藏
                goodsTypeRelateDangerousGoodsContainer: function (goodsType) {
                    if (goodsType == GOODS_TYPE_DANGEROUS) {
                        $_dangerousGoodsContainer.removeClass('hide');
                    }
                    else {
                        $_dangerousGoodsContainer.addClass('hide');
                    }
                },
                // 运费协议号 决定 是否可录入 运费协议价格
                freightAgreementNoRelatePrice: function (freightAgreementNo) {
                    // 设置 运费协议价格 是否可录入（如果有 运价协议号 则不可录入）
                    $('#freightAgreePrice').prop('readonly', !!freightAgreementNo);
                },
                // 根据委托服务 显示/隐藏 报关信息、报关行联系信息
                entrustServiceRelateBrokerContainer: function (entrustServiceType) {
                    // 如果委托项为【运输，报关】，则需要显示 报关信息
                    if (entrustServiceType == '3') {
                        $_brokerInfoContainer.removeClass('hide');
                    }
                    else {
                        $_brokerInfoContainer.addClass('hide');
                    }
    
                    // 如果委托项为【运输，代送资料】，则需要显示 报关行联系信息（页面中为 报关资料送至）
                    if (entrustServiceType == '5') {
                        $_brokerDataContainer.removeClass('hide');
                    }
                    else {
                        $_brokerDataContainer.addClass('hide');
                    }
                },
                // 箱型 关联 摆柜要求（尺寸为20的箱型，可以选择 任意摆柜要求，而对于非20尺寸的箱型，摆柜要求只能固定为“不限”）
                boxSizeRelatePutRequire: function (boxSizeSelect) {
                    var $_boxSizeSelect = $(boxSizeSelect);
                    // 箱型尺寸，根据 箱型 isoCode 前面的数字来确定（isoCode箱型 = 尺寸+单位）
                    var boxSize = parseInt($_boxSizeSelect.val(), 10);
                    
                    var $_putRequireSelect = $_boxSizeSelect.parents(BOX_LINE_SELECTOR).find('select[name=putRequire]');
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
                    var $_wharfLabel = $('.text-label-wharf');
                    var $_stackLabel = $('.text-label-stack');

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
    
        // 初始化组件
        var initComponent = function () {
            // 初始化页面中的日期组件
            bizUtil.layui.initDateInput($('.date-time'));
    
            // 初始化 送达地址 （省市县组件）
            $('#deliveryAddress').each(function () {
                var districtValue = $(this).attr('district_value') || undefined;
    
                $(this).district(layuiFormModule, districtValue, (initOptions.isOrderDetail ? 'disabled' : undefined));
            });
            // 注意，不能像下面一样使用 类选择器（事件会串）
            // $('.compoment-district').district(layuiFormModule);
        };

        // 获取订单详情数据
        var getOrderDetail = function (ajaxOptions) {
            return HC.ajax.get($.extend({
                url: '/ucenter/tms/order/order/getDetail.shtml'
            }, ajaxOptions));
        };

        // 初始化已有订单数据
        var initOrderData = function (orderData) {
            if (!orderData) {
                return;
            }

            // 创建船务信息的方法
            var createShippingLine = (function () {
                // “借用”一下 orderCommon.newFlowManager.makeNewLineCreater 的方法，主要是为了 填充数据
                var createNewLine = orderCommon.newFlowManager.makeNewLineCreater([
                    {
                        _type: 'shipping',
                        lineClassName: 'shipping-line-container'
                    }
                ], $_myForm);

                return function (shippingData) {
                    // 初始化数据时，补充 完整地址
                    $.each(shippingData.orderAddresses || [], function (i, item) {
                        item.fullAddress = processAddress(item.orderAddress) + item.orderAddressDetail;
                    });

                    return createNewLine('shipping', shippingData);
                };
            })();
            
            var $_mainInfoContainer = $('#mainInfoContainer');
    
            // 主要信息
            bizUtil.data.setDataToContainer(orderData, $_mainInfoContainer);
            // 报关资料
            bizUtil.data.setDataToContainer(orderData, $_brokerDataContainer);
            // 报关信息
            bizUtil.data.setDataToContainer(orderData, $_brokerInfoContainer);
            // 订单备注
            $('#remarkTextarea').val(orderData.remark);
    
            // 重置 复选框的值
            $.each(['hasChauffeur', 'hasRequireWeighing', 'hasCash'], function (i, checkboxName) {
                $_mainInfoContainer.find('[name=' + checkboxName + ']').prop('checked', orderData[checkboxName]);
            });
    
            // 船务信息
            var $_shippingContainer = $('#shippingContainer');
            // 清空原始船务信息内容
            $_shippingContainer.empty();
            // 重新创建船务信息
            $.each(orderData.orderShipping, function (i, shippingData) {
                var $_newShippingLine = createShippingLine(shippingData);
    
                // 插入到DOM中
                $_shippingContainer.append($_newShippingLine);
                
                // 需要等新行 插入到DOM中，才能重新渲染
                rerenderDateInput($_newShippingLine);
    
                // 重新绑定附件上传事件
                bindUploadAttachmentEvent($_newShippingLine);
    
                // 更新船公司简称
                $_newShippingLine.find('.shipping-comp-code').val(shippingData.shippingCompShortname);
            });
    
            // 填充附件
            var $_shippingLine = $_shippingContainer.children();
            var fileNameSeparator = HC.constVariable.FILE_NAME_SEPARATOR;
            var fileLineContainerMap = {
                // 报关信息
                1: $_brokerInfoContainer,
                // 危品申报
                2: $_dangerousGoodsContainer
            };
            $.each(orderData.orderAtt, function (i, attachmentItem) {
                var attType = attachmentItem.attType;
                var attachmentName = attachmentItem.attName;
                var fileName = attachmentItem.attFileName;
                var serverFileName = attachmentItem.attFileUrl;
                
                // 处理 船务信息 附件
                if (attType === 3) {
                    var $_targetShippingLine = $_shippingLine.eq(Number(attachmentName));
                    
                    // 有文件名时，才将 附件显示在DOM中
                    if (fileName) {
                        var $_attachmentItem = shippingEvent.createAttachmentItem(fileName, serverFileName);
                        
                        // 添加到指定的船务信息容器中
                        $_targetShippingLine.find('.so-attachment-container').append($_attachmentItem);
                    }
    
                    // 保存附件id（后端用于更新文件记录内容）
                    $_targetShippingLine.data(FILE_ID_DATANAME, attachmentItem.id);
                }
                // 处理 报关信息 和 危品申报 的附件
                else {
                    // 从 报关信息 或 危品申报 的容器中 获取 指定的文件行容器
                    var $_targetfileLine = fileLineContainerMap[attType].find('.file-line').filter(function () {
                        return $(this).data('attachment_name') == attachmentName;
                    });
    
                    var fileNames = fileName.split(fileNameSeparator);
                    var serverFileNames = serverFileName.split(';');
    
                    // 将 文件 添加到 指定的文件行
                    $.each(fileNames, function (i, singleFileName) {
                        var $_fileItem = HC.dom.createFileItem(singleFileName, serverFileNames[i]);

                        // 保存预览数据（文件容器监听的事件中 会用到）
                        $_fileItem.data('previewInfo', {
                            fileInfo: {
                                name: singleFileName
                            }
                        });

                        $_targetfileLine.append($_fileItem);
                    });
                    
                    // 保存文件项id（后端用于更新文件记录内容）
                    $_targetfileLine.data(FILE_ID_DATANAME, attachmentItem.id);
                }
            });
    
            // 全部layui表单组件重新渲染
            layuiFormModule.render();
            // 自定义组件的重新渲染
            initComponent();
        };

        // 编辑订单时，初始化页面状态（主要是 禁用状态、对应的显示/隐藏元素），需在 船务信息渲染完成后调用
        var initPageStatus = function (orderData, isShowWarnTips) {
            bizLimitUtil.goodsTypeRelateDangerousGoodsContainer(orderData.goodsType);
            bizLimitUtil.freightAgreementNoRelatePrice(orderData.freightAgreementNo);
            bizLimitUtil.entrustServiceRelateBrokerContainer(orderData.entrustService);

            // 是否初始化 转关方式与司机本限制、箱型与摆柜要求限制 的提示信息
            if (isShowWarnTips) {
                bizLimitUtil.transferWayRelateDriverBook(orderData.brokenStyle);
                // 遍历所有的箱型，并关联 摆柜要求
                $_myForm.find('[name=shippingBoxtype]').each(function () {
                    bizLimitUtil.boxSizeRelatePutRequire(this);
                });
            }

            // 拖车行进入页面，需要初始化报关方式 与 提柜/还柜地点 、 提空/还空地点 的文案关系
            if (initOptions.role == 2) {
                bizLimitUtil.brokenStyleRelateAddressLabel(orderData.brokenStyle);
            }
        };

        // 禁用表单元素（在查看页面调用）
        var disableForm = function () {
            // 禁用表单元素
            $_myForm.find('input, select, textarea').prop('disabled', true);
            layuiFormModule.render();
            // 得在 form.render 之后，layui的美化下拉框的input才能禁用成功
            $_myForm.find('.layui-select-disabled input').prop('disabled', true);
        };


        // 再次封装 绑定上传附件事件
        var bindUploadAttachmentEvent = function (container) {
            shippingEvent.bindUploadAttachmentEvent({
                elem: $(container).find('.so-attachment-container .icon-link')
            }, {
                // 额外传入 layui.upload
                layuiUpload: layuiUploadModule
            });
        };

        // 绑定图片预览功能和图片查看器功能（报关信息和危品申报附件）
        var bindImgGalleryEvent = function () {
            var $_imgContainer = $('#brokerInfoContainer, #dangerousGoodsContainer');
            HC.uploadUtil.bindPreviewImgEvent($_imgContainer);
            HC.uploadUtil.bindImgGalleryEvent($_imgContainer);
        };
    
        // 绑定页面事件
        var bindOrderEvent = function () {
            // ------------------------- 拖车行 切换客户 事件 -------------------------
            layuiFormModule.on('select(shipper)', function(data) {
                // 保存客户名称 到隐藏域中
                setSiblingElementValue(data.elem);

                // 选择空值时，不执行下面的联动操作
                if (!data.value) {
                    return;
                }

                var customerId = data.value;

                // 根据客户id，刷新 报关行下拉列表的选项
                updataAddressOrBrokenSelect($('#brokerList'), {
                    selectType: 'broker',
                    customerId: customerId
                });
                // 清空 之前的报关行数据
                setDataToContainer({
                    brokenAddress: '',
                    brokenLinkman: '',
                    brokenMobile: '',
                    // 额外加入 brokenName 字段，顺便清空 报关行的名称
                    brokenName: ''
                }, $_brokerDataContainer);
                // 再重新渲染 省市县组件
                setDistrict($_brokerDataContainer, layuiFormModule, '');

                // 清空装卸地点，并重新刷新 装卸地点下拉列表的选项
                $('.customer-address-container').each(function () {
                    var $_addressLineContainer = $(this).find(ADDRESS_LINE_SELECTOR);
                    
                    // 清空装卸地点前 先记录被删除的装卸地点id
                    $_addressLineContainer.each(function () {
                        setDeleteIdToContainContainer(this, 'address');
                    });

                    var $_firstAddressLineContainer = $_addressLineContainer.first();
                    // 每个船务信息下仅保留一个装卸地点容器，其余删除
                    HC.dom.fadeOutRemove($_firstAddressLineContainer.siblings(ADDRESS_LINE_SELECTOR));

                    // 根据客户id，刷新 装卸地点下拉列表的选项
                    updataAddressOrBrokenSelect($_firstAddressLineContainer.find(ADDRESS_DROPDOWN_SELECTOR), {
                        selectType: 'address',
                        customerId: customerId
                    });
                    // 清空 装卸地点数据
                    setDataToContainer({
                        orderAddressAreaid: '',
                        orderAddress: '',
                        orderAddressDetail: '',
                        fullAddress: '',
                        linkman: '',
                        mobile: '',
                        remark: '',
                        // 额外加入 orderPlace 字段，用来清空 装卸地点名称
                        orderPlace: ''
                    }, $_firstAddressLineContainer);
                    // 再重新渲染 省市县组件
                    setDistrict($_firstAddressLineContainer, layuiFormModule, '');
                });
            });

            // ------------------------- 修改 装卸地点详细地址 事件 ----------------------------
            orderCommon.bindEditAddressEvent($_myForm, {
                templateHTML: $('#detailLineTemplate').html(),
                layuiFormModule: layuiFormModule,
                districtOptions: {
                    areaIdFieldName: 'orderAddressAreaid',
                    areaNameFieldName: 'orderAddress',
                    addressDetailFieldName: 'orderAddressDetail'
                }
            });

            // ------------------------- 上传、下载 事件 ----------------------------
            // 船务信息 SO 附件的 文件上传下载
            (function () {
                // 绑定附件上传功能
                bindUploadAttachmentEvent($_myForm);
    
                // 绑定 删除附件 功能（仅在界面上删除）
                $_myForm.on('click', '.so-item-container .icon-link-delete', function () {
                    HC.dom.fadeOutRemove($(this).parent());
                });
            })();
            // 报关信息 和 危品申报的 文件上传下载
            (function () {
                var $_fileAreaContainer = $_brokerInfoContainer.add($_dangerousGoodsContainer);
                var fileUploadSelector = '.file-control-upload';
        
                // 删除文件（仅在界面上删除）
                $_fileAreaContainer.on('click', '.file-item .icon-delete', function () {
                    HC.dom.fadeOutRemove($(this).parents('.file-item'));
                })
                // 阻止 “上传”元素 点击后的浏览器默认事件
                .on('click', fileUploadSelector, function () {
                    return false;
                })
                // 阻止 “上传中”和“上传失败”的元素 点击后的浏览器默认事件
                .on('click', '.file-item--loading .file-name, .file-item--fail .file-name', function () {
                    return false;
                });
        
                // 初始化 所有的 “上传” 元素
                $_fileAreaContainer.find(fileUploadSelector).each(function (i, uploadElement) {
                    var $_targetFileLine = $(uploadElement).parent().prev();
        
                    HC.upload({
                        // 触发上传的元素
                        elem: uploadElement,
                        // 多文件上传
                        multiple: true,
                        // 允许上传的文件类型 images（默认）、file、video、audio
                        accept: 'file',
                        // 最大文件大小限制（单位kb，默认不限制）
                        // size: 1024,
                    }, {
                        layuiUpload: layuiUploadModule,
                        // 指定 存放文件项的容器
                        fileItemContainer: $_targetFileLine
                    });
                });
            })();
    
            // ------------------------- 提交及取消订单 事件 ----------------------------
            (function () {
                // 提交订单数据
                var postOrderData = function (orderData) {
                    if (!bizUtil.validator.verifyContainer($_myForm)) {
                        return;
                    }
    
                    // TODO: 对于 上传中 或 上传失败 的文件 进行提示
                    HC.ajax.post('/ucenter/tms/order/order/add.shtml', {
                        data: JSON.stringify(orderData),
                        success: function (responseData, textStatus, jqXHR) {
                            // 弹窗的关闭回调
                            var closeHandler = function (index) {
                                // 关闭弹窗本身
                                window.parent.layer.close(index);
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
                            };
    
                            window.parent.layer.alert('保存成功！', {
                                // 点击“确定”与右上角“X”按钮 是同一处理方式
                                yes: closeHandler,
                                cancel : closeHandler
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
                // 表单提交/保存并委托
                layuiFormModule.on('submit(saveAndEntrust)', function (data) {
                    var orderData = createOrderData();
    
                    // 保存并委托 标记字段
                    orderData.hasEntrust = true;
                    
                    // 保存订单数据
                    postOrderData(orderData);
    
                    $(this).blur();
                });
                // 取消订单
                $('#cancelButton').click(function (e) {
                    bizUtil.frame.closeCurrentIframeTab(window.parent);
                });
    
                // 用于测试时，校对字段值是否正确
                $('#testFormData').click(function () {
                    if (!bizUtil.validator.verifyContainer($_myForm)) {
                        return false;
                    }
                    console.log('统一规则校验【通过】');
    
                    var orderData = createOrderData();
    
                    var logPropertyName = HC.data.logPropertyName;
    
                    logPropertyName([
                        "id","orderNo","makingTime","orderTemplateId","orderTemplate","carrierId","carrier","shipperId","shipper","entrustService","brokenStyle","hasChauffeur","singleType","goodsType","hasRequireWeighing","freightAgreementNo","hasCash",
                        "freightAgreePrice","brokenAgreePrice","preparePay","customersBrokerId","brokenName","brokenAreaId","brokenAreaAddress","brokenAddress","brokenLinkman","brokenMobile","brokenTel","brokenFax","declarationStyle","declarationDate","declarationElements",
                        "remark","orderShipping","orderAtt","hasEntrust","shipDelList","addressDelList","boxTypeDelList"
                    ], orderData, '最外层属性');
                    logPropertyName([
                        'id','bkNo','shipName','shipTime','purposePortCode','purposePortShortname','shippingCompCode','shippingCompShortname','mentionPlaceCode','mentionPlace','cutoffTime','cutheavyTime','cuttingTime','releaseTime','orderBoxtype',"orderAddresses"
                    ], orderData.orderShipping, '船务属性');
                    logPropertyName([
                        'id','shippingBoxtype','shippingBoxamount','putRequire','arkWeight','doarkTime','carryEmptyAddress','carryEmptyCode','freightPrice','freightGain'
                    ], orderData.orderShipping[0].orderBoxtype, '箱型属性');
                    logPropertyName([
                        "id","customersAddressId","orderPlace","orderAddressAreaid","orderAddress","orderAddressDetail","linkman","mobile","remark"
                    ], orderData.orderShipping[0].orderAddresses, '装卸地点属性');
                    logPropertyName([
                        "id","attFileName","attType","attName","attFileUrl"
                    ], orderData.orderAtt, '附件属性');
    
                    console.log('完整的订单数据', orderData);
    
                    return false;
                });
            })();
    
            // ------------------------- 业务限制/校验/联动 事件 ----------------------------
            (function () {
                // 转关方式 与 司机本 联动
                layuiFormModule.on('select(brokenWay)', function(data) {
                    bizLimitUtil.transferWayRelateDriverBook(data.value);

                    // 拖车行需要绑定 报关方式 与 提/还 柜/空 地点 的文案关系
                    if (initOptions.role == 2) {
                        bizLimitUtil.brokenStyleRelateAddressLabel(data.value);
                    }
                });

                // 货物类型：如果选择【危品】，则显示危品信息区；如果选择【普货】，需要隐藏危品信息区
                layuiFormModule.on('select(goodsType)', function(data) {
                    bizLimitUtil.goodsTypeRelateDangerousGoodsContainer(data.value);
                });
    
                // 运价协议号 与 运费协议价格 联动
                var $_freightAgreementNo = $('#freightAgreementNo');
                var $_freightAgreePrice = $('#freightAgreePrice');
                // keypress 事件 不能很准确地得到 this.value 的值，可能影响到空值的判断，所以改用 keyup 事件
                $_freightAgreementNo.keyup(function (e) {
                    // 输入 运价协议号 之后，不能再输入 运费协议价格
                    if (this.value) {
                        // 清空已有值
                        $_freightAgreePrice.val('')
                            // 设置只读
                            .prop('readonly', true);
                        // 添加提示
                        $_freightAgreePrice.on('mouseenter.freightAgreeReadonly', function () {
                            HC.tips.info('已有运价协议号，不需要再填写 运费协议价格', this);
                        });
                    }
                    else {
                        // 恢复可写
                        $_freightAgreePrice.prop('readonly', false);
                        // 移除事件
                        $_freightAgreePrice.off('mouseenter.freightAgreeReadonly');
                    }
                });
                
                // 委托服务的下拉框，对应不同录入区
                layuiFormModule.on('select(entrustService)', function(data) {
                    bizLimitUtil.entrustServiceRelateBrokerContainer(data.value);
                });
    
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
    
                // 装卸地点/报关行信息 详情填充
                var customersAddressDetailUrl = '/ucenter/crm/customers/customersAddress/getDetail.shtml?id=';
                var customersBrokerDetailUrl = '/ucenter/crm/customers/customersBroker/getDetail.shtml?id=';
                layuiFormModule.on('select(customerAddress)', function(data) {
                    var $_customerAddressSelect = $(data.elem);
    
                    // 更改装卸地点之后，还需要保存名称 到隐藏域中
                    $_customerAddressSelect.siblings('input[type=hidden]').val($_customerAddressSelect.find(':checked').text());

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
                                orderAddressAreaid: responseData.addressAreaId,
                                orderAddress: addressAreaName,
                                // 省市县街道后面的详细地址
                                orderAddressDetail: responseData.address,
                                // 拼接一个地址完整，用于前端展示
                                fullAddress: addressAreaName + responseData.address,
                                linkman: responseData.uname,
                                mobile: responseData.mobile,
                                remark: responseData.notes
                            }, $_container);
                        }
                    });
                });
                layuiFormModule.on('select(brokerList)', function(data) {
                    var $_brokerSelect = $(data.elem);
    
                    // 更改报关行之后，还需要保存名称 到隐藏域中
                    $_brokerSelect.siblings('input[type=hidden]').val($_brokerSelect.find(':checked').text());

                    // 选择空值时，不执行下面的联动操作
                    if (!data.value) {
                        return;
                    }
    
                    // 请求数据 填充关联信息
                    HC.ajax.get(customersBrokerDetailUrl + data.value, {
                        // 填充 报关行信息
                        success: function (responseData, textStatus, jqXHR) {
                            setDataToContainer({
                                brokenAddress: responseData.address,
                                brokenLinkman: responseData.uname,
                                brokenMobile: responseData.tel
                                // 下面两个字段 接口中没值
                                // brokenTel
                                // brokenFax
                            }, $_brokerDataContainer);
    
                            // 重新渲染 省市县组件
                            setDistrict($_brokerDataContainer, layuiFormModule, responseData.areaId);
                        }
                    });
                });
            })();
    
            // ------------------------- 下拉框填充隐藏域 ----------------------------
            (function () {
                // 自动根据下拉框的选择事件，填充： 订单模版名称 供应商名称 目的港简称 提/还柜地点名称 提/还空地点名称 （注意，部分本身有监听layui事件的，不能使用这种方法监听，否则原来的事件会失效）
                var relateDropDownList = ['orderTemplate', 'supplier', 'portList', 'wharfList', 'stackList'];

                // 关联 下拉框动作，并将下拉框的value填充到指定元素
                relateDropDownToElement(relateDropDownList, layuiFormModule);
            })();
    
            
            // ------------------------- 其它 事件 ----------------------------
            // window.onbeforeunload = function () {
            //     // Firefox 4、 Chrome 51、Opera 38 和Safari 9.1 版本以上，将使用浏览器默认提示文本，不显示下列自定义内容
            //     // 详见 https://developer.mozilla.org/zh-CN/docs/Web/API/Window/onbeforeunload
            //     return '有改动未保存，是否离开本页面？';
            // };
        };

        // 绑定 船务信息的 添加、复制、删除 事件
        var bindShippingCDEvent = function () {
            // 更新 船务信息新行的所有装卸地点列表
            var updateShippingCopyLineAddressSelect = function ($_newLineContainer, $_targetLineContainer, lineData) {
                var $_templateSelect = $_targetLineContainer.find(ADDRESS_DROPDOWN_SELECTOR).first();
                var selectTemplateHTML = $_templateSelect.html();
                var $_newSelect = $_newLineContainer.find(ADDRESS_DROPDOWN_SELECTOR);

                var orderAddressesData = (lineData && lineData.orderAddresses);
                $_newSelect.each(function (i) {
                    // 更新 装卸地点列表选项
                    $(this).html(selectTemplateHTML);

                    if (orderAddressesData) {
                        // 如果是复制模式，需要重新设置 对应的值
                        $(this).val(orderAddressesData[i].customersAddressId || '');
                    }
                });
            };

            // 复制时，需要删除记录的id（船务信息中 包含 船务id、箱型id、装卸地点id）
            var deleteId = function (container) {
                $(container).find('[name=id]').val('');
            };

            // 操作对象 配置信息 列表（箱型信息、装卸信息、船务信息 的 删除、添加、复制 配置）
            var operationTargetOptionsList = [
                // 箱型信息
                {
                    // 该属性供内部使用，用于标识 配置类型
                    _cnName: '箱型信息',
                    _type: 'box',
                    lineClassName: 'box-line-container',
                    lineDeleteTips: '一组船务信息中最少要有一个箱型记录',
                    // 箱型信息 不需要绑定 复制事件
                    isBindCopyEvent: false,
                    // 设置做柜时间（与上一行相同）
                    afterAddDoneCallback: function ($_newLineContainer, $_targetLineContainer) {
                        var doarkTimeInputSelector = '[name=doarkTime]';
    
                        $_newLineContainer.find(doarkTimeInputSelector).val($_targetLineContainer.find(doarkTimeInputSelector).val());
                    },
                    // 删除元素前，需要先关闭 校验未通过的提示框（TODO: 添加、复制 也有此问题，待解决）
                    beforeDeleteCallback: function (removeElement, settings, $_belongsContainContainer) {
                        // 因为在 afterDeleteDoneCallback 中调用时，元素已被移除DOM， .data() 方法获取不到保存的值，所以需要在 beforeDeleteCallback 中执行 closeTipsInContainer
                        // 使用 $_belongsContainContainer 而不是 removeElement 是因为 有可能删除行之后，后面的行位置改变 会导致 Tips提示位置错误。所以把整个容器内的Tips都关闭
                        closeTipsInContainer($_belongsContainContainer);
                    },
                    // 复制时 清空箱型id
                    afterCopyDoneCallback: deleteId,
                    // 记录被删除项的id
                    afterDeleteDoneCallback: function (removeElement, options) {
                        setDeleteIdToContainContainer(removeElement, options._type);
                    }
    
                    // 还可以配置下面这些属性
                    // container: 'form:first',
                    // lineSelector: '.' + lineClassName （lineClassName 值为当前配置对象的 lineClassName 属性 ）
                    // contextSelector: '',
                    // belongsContainContainerSelector: '',
                    // deleteOperationSelector: '.icon-delete',
                    // addOperationSelector: '.icon-add',
                    // copyOperationSelector: '.icon-copy',
                    // isBindDeleteEvent: true,
                    // isBindAddEvent: true,
                    // beforeCreateLineCallback: ($_targetLineContainer, isCopyMode)=>{},
                    // beforeInsertLineCallback: ($_newLineContainer, $_targetLineContainer, lineData)=>{},
                    // afterInsertLineCallback: ($_newLineContainer, $_targetLineContainer, lineData)=>{},
                    // lineAnimateClassName: 'layui-anim layui-anim-upbit',
                },
                // 装卸信息
                {
                    _cnName: '装卸信息',
                    _type: 'address',
                    lineClassName: 'customer-address-line',
                    lineDeleteTips: '一组船务信息中最少要有一个装卸地点',
                    beforeInsertLineCallback: function ($_newLineContainer, $_targetLineContainer, lineData) {
                        var $_templateSelect = $_targetLineContainer.find(ADDRESS_DROPDOWN_SELECTOR);
                        var $_newSelect = $_newLineContainer.find(ADDRESS_DROPDOWN_SELECTOR);

                        // 从“操作行”中 将 装卸地址 下拉框选项复制到 新行中
                        $_newSelect.html($_templateSelect.html());
                        // 因为新行创建的时候，已经赋值过一次了，所以 在复制模式下，需要给新创建的下拉框 重新赋值
                        if (lineData) {
                            $_newSelect.val($_templateSelect.val());
                        }
                    },
                    // 删除元素前，需要先关闭 校验未通过的提示框
                    beforeDeleteCallback: function (removeElement, settings, $_belongsContainContainer) {
                        closeTipsInContainer($_belongsContainContainer);
                    },
                    // 复制时 清空装卸信息id
                    afterCopyDoneCallback: deleteId,
                    afterDeleteDoneCallback: function (removeElement, options) {
                        setDeleteIdToContainContainer(removeElement, options._type);
                    }
                },
                // 船务信息
                {
                    _cnName: '船务信息',
                    _type: 'shipping',
                    lineClassName: 'shipping-line-container',
                    contextSelector: '.shipping-icon-container > ',
                    copyOperationSelector: '.icon-copy-container .icon-copy',
                    lineDeleteTips: '订单中最少要有一组船务信息',
                    // 有文件在上传过程中，不允许复制
                    beforeCreateLineCallback: function ($_targetLineContainer, isCopyMode) {
                        if (!isCopyMode) {
                            return;
                        }
    
                        if ($_targetLineContainer.find('.attachment-item--loading').length) {
                            layer.msg('请等待 附件上传完成后 再执行 复制操作')
    
                            return false;
                        }
                    },
                    // 插入 复制的船务信息新行 之前，更新 装卸地点列表 并 设置对应装卸地点的值（根据原复制源数据）
                    beforeInsertLineCallback: function ($_newLineContainer, $_targetLineContainer, lineData) {
                        // 非货主货代界面，不需要更新 装卸地点
                        if (initOptions.role == 1) {
                            console.log('非货主货代界面，不需要更新 装卸地点');

                            return;
                        }

                        updateShippingCopyLineAddressSelect($_newLineContainer, $_targetLineContainer, lineData);
                    },
                    // 因为船务信息会通过“添加”、“复制”操作 动态创建，而layui.upload组件不支持on事件，所以需要动态绑定 上传附件事件
                    afterInsertLineCallback: function ($_newShippingLineContainer, $_targetLineContainer, data) {
                        bindUploadAttachmentEvent($_newShippingLineContainer);
                    },
                    // 复制 船务信息时，需要 将附件信息也复制过来
                    afterCopyDoneCallback: function ($_newShippingLineContainer, $_targetLineContainer, data) {
                        $_newShippingLineContainer.find('.so-attachment-container').append($_targetLineContainer.find('.so-attachment-item').clone());

                        // 复制时，需要删除内部的所有id（将新行中name为id的输入框置空）
                        deleteId($_newShippingLineContainer);
                    },
                    // 删除元素前，需要先关闭 校验未通过的提示框
                    beforeDeleteCallback: function (removeElement, settings, $_belongsContainContainer) {
                        closeTipsInContainer($_belongsContainContainer);
                    },
                    afterDeleteDoneCallback: function (removeElement, options, $_belongsContainContainer) {
                        // 先设置被删除的船务信息id
                        setDeleteIdToContainContainer(removeElement, options._type);
    
                        // 再设置 本船务信息下面 剩余未删除的箱型信息id和装卸地址id
                        $(removeElement).find(BOX_LINE_SELECTOR).each(function (i) {
                            setDeleteIdToContainContainer(this, 'box');
                        });
                        $(removeElement).find(ADDRESS_LINE_SELECTOR).each(function (i) {
                            setDeleteIdToContainContainer(this, 'address');
                        });
                    }
                }
            ];
            // 一键绑定 船务信息、箱型信息、装卸地点 的 删除、添加、复制 事件
            return shippingEvent.fastBindEvent(operationTargetOptionsList, $_myForm);
        };

        // 绑定普通订单操作事件 和 船务信息操作事件
        var bindAllEvent = function () {
            // 绑定普通订单事件
            bindOrderEvent();

            // 下拉框数据加载之后 再绑定 船务的操作事件（因为 添加、复制 操作 依赖某些下拉框的值）
            bindShippingCDEvent();
        };

        // 设置页面只读，且绑定图片查看器事件
        var setReadonlyPage = function () {
            // 隐藏操作按钮
            $_myForm.addClass('form--detail');

            // 禁用静态表单元素
            disableForm();

            // 绑定图片查看器功能
            bindImgGalleryEvent();
        };

        return {
            bizLimitUtil: bizLimitUtil,
            getOrderDetail: getOrderDetail,
            initComponent: initComponent,
            initOrderData: initOrderData,
            initPageStatus: initPageStatus,
            updataAddressOrBrokenSelect: updataAddressOrBrokenSelect,
            disableForm: disableForm,
            bindImgGalleryEvent: bindImgGalleryEvent,
            bindOrderEvent: bindOrderEvent,
            bindShippingCDEvent: bindShippingCDEvent,
            bindAllEvent: bindAllEvent,
            setReadonlyPage: setReadonlyPage
        };
    };

    // 加载模版内容（并添加到DOM中）。依赖layui.laytpl模块
    var loadTemplates = function (options, callback) {
        // layui由外部提供
        var layui = options.layui;
        var $_buttonContainer = $('#buttonContainer');

        // 根据模版id 获取模版内容，支持渲染数据，会自动调用 layui.laytpl 进行渲染
        var getTemplateHTML = function (templateId, renderData) {
            var templateHTML = $(templateId).html();

            // 有传入 渲染数据，则使用 layui.laytpl 进行渲染。没有渲染数据，则直接返回模版内容
            return renderData ? layui.laytpl(templateHTML).render(renderData) : templateHTML;
        };

        // 添加模版到DOM中（直接使用html字符串）
        var addTemplateHTML = (function () {
            return function (templateHTML) {
                // $_myForm.append(templateHTML);
                $_buttonContainer.before(templateHTML);
            };
        })();
        // 添加模版到DOM中（使用 模版id，支持渲染数据）
        var addTemplateById = function (templateId, renderData) {
            addTemplateHTML(getTemplateHTML(templateId, renderData));
        };

        // 动态加载 表单元素模版集合，并在加载后 将模版内容添加到表单中
        $('#formTemplates').load('../order/orderTemplate.html', function () {
            // 渲染模版时 传入的数据
            var renderData = options.renderData;

            // 主要信息
            addTemplateById('#mainInfoTemplate', renderData);
            
            // 船务信息 容器
            addTemplateHTML(getTemplateHTML('#shippingContainerTemplate', {
                shippingMainInfo: $('#shippingMainInfoTemplate').html(),
                boxContainer: getTemplateHTML('#boxContainerTemplate', renderData),
                addressContainer: getTemplateHTML('#addressContainerTemplate', renderData)
            }));
            
            // 报关行联系信息
            addTemplateById('#brokerDataContainerTemplate', renderData);
            // 报关信息 附件容器
            addTemplateById('#brokerInfoContainerTemplate');
            // 危品申报 附件容器
            addTemplateById('#dangerousGoodsContainerTemplate');
            // 修改装卸地点的面板
            addTemplateById('#detailLineContainerTemplate');
            // 订单备注
            addTemplateById('#remarkContainerTemplate');

            // 显示按钮区
            $_buttonContainer.removeClass('hide');
            // 先初始化所有表单元素（因为是动态插入到DOM中的）
            layui.form.render();

            var orderInstance = createOrderInstance(layui, options);
            // 初始化组件
            orderInstance.initComponent(layui);
            // 查看页面，设置为只读状态
            if (options.isOrderDetail) {
                orderInstance.setReadonlyPage();
            }

            // 执行回调
            callback && callback(orderInstance);
    
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