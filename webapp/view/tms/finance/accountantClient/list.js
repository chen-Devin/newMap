$(function() {
    autoHeight();
    $(window).on('resize', function() {
        autoHeight();
    });

    //组织架构右边内容高度
    function autoHeight() {
        var $winHeight = $(window.parent.document).height() - 110 - 39 - 8;
        $('.organize').height($winHeight - 63);
        $('.right-panel').height($winHeight);
    }
});

layui.use(['form', 'layer', 'tree'], function() {
    var form = layui.form,
        layer = layui.layer,
        $ = layui.jquery;
    var $objects;

    //获取菜单列表
    var setMenus = function() {
        $.get('/ucenter/general/finance/financeSubject/FSAPUserList.shtml', function(d) {
            var $code = d.code,
                $msg = d.msg;
            $objects = d.objects;
            if ($code != 'SUCCESS') return false;

            //重新编绎json
            var $allArr = setAllMenusData(0, $objects);

            //参数设置
            var $options = {
                    elem: '#menus',
                    drag: true,
                    click: function(item) {
                        $('#menus cite p').removeClass('current');
                        $('#cc' + item.rid + ' p').addClass('current');
                        sessionStorage.setItem("accountId", item.rid);
                        sessionStorage.setItem("accountName", item.newName);
                        sessionStorage.setItem("accountParentId", item.parentId);
                        sessionStorage.setItem("accountCode", item.code);
                        sessionStorage.setItem("accountHandle", item.hasHandle);
                        sessionStorage.setItem("accountReceived", item.hasReceived);
                        if (item.status == 3) {
                            setLayerAlert(parent.layer, '该用户已停用，请启动后查看', {
                                btn: ['立即启用', '取消'],
                                yes: function(index) {
                                    roleStatus(item.rid, 1);
                                    parent.layer.close(index);
                                }
                            });
                        } else {
                            $('#rightMainer').load('editAccountant.html', function() {
                                HCValidator.addVerifyToContainer($('form'));
                            });
                        }
                    },
                    nodes: $allArr
                }
                //树形菜单
            layui.tree($options);
        }, 'json');
    }

    setMenus();

    //重新编绎菜单json
    function setAllMenusData($pid, $arrs) {
        if ($pid == 0) $pid = null;
        var $newArr = [];
        if ($arrs.length > 0) {
            for (var $i = 0; $i < $arrs.length; $i++) {
                if ($arrs[$i].parentId == $pid) {
                    var $newObj = new Object();
                    $newObj.spread = true;
                    $newObj.hasHandle = $arrs[$i].hasHandle;
                    $newObj.hasReceived = $arrs[$i].hasReceived;
                    $newObj.rid = $arrs[$i].id;
                    $newObj.status = $arrs[$i].status;
                    $newObj.newName = $arrs[$i].subjectName;
                    if ($arrs[$i].subjectName) {
                        //停用
                        if ($arrs[$i].status == 3) {
                            $newObj.name = '<p class="cancel">' + $arrs[$i].subjectName + ' <span class="status">停用</span></p>';
                        }
                        //启用
                        else {
                            $newObj.name = '<p>' + $arrs[$i].subjectName + '</p>';
                        }
                    }
                    $newObj.code = $arrs[$i].subjectCode;
                    $newObj.parentId = $arrs[$i].parentId == null ? 0 : $arrs[$i].parentId;
                    $newObj.checkboxValue = $arrs[$i].id;
                    $arrs[$i].status != 3 ? $newObj.children = setAllMenusData($arrs[$i].id, $arrs) : '';
                    $newArr.push($newObj);
                }
            }
        }
        return $newArr;
    }

    var active = {
        //新增
        addCompany: function() {
            $('#rightMainer').load('addAccountant.html', function() {
                HCValidator.addVerifyToContainer($('form'));
            });
        },
        //停用
        statusCancel: function() {
            var $accountId = sessionStorage.getItem("accountId") == null ? "" : sessionStorage.getItem("accountId");
            if ($accountId.length == 0) {
                setLayerAlert(parent.layer, '请选择需停用的科目');
                return false;
            } else {
                setLayerConfirm(parent.layer, '确定停用吗？', function(index) {
                    roleStatus($accountId, 3);
                    //接口
                    parent.layer.close(index);
                });
            }
        },
        //启用
        statusStart: function() {
            var $accountId = sessionStorage.getItem("accountId") == null ? "" : sessionStorage.getItem("accountId");
            if ($accountId.length == 0) {
                setLayerAlert(parent.layer, '请选择需启用的科目');
                return false;
            } else {
                // console.log($accountId);
                setLayerConfirm(parent.layer, '确定启用吗？', function(index) {
                    roleStatus($accountId, 1);
                    //接口
                    parent.layer.close(index);
                });
            }
        },
    };

    $('.btns-bar .layui-btn').on('click', function() {
        var type = $(this).data('type');
        active[type] ? active[type].call(this) : '';
    });

    //改变状态，3停用，1启用
    function roleStatus($id, $status) {
        var $saveData = {
            id: $id,
            activateStatus: $status
        }
        $.ajax({
            type: 'GET',
            url: '/ucenter/general/finance/financeSubject/disableAndEnabledFinanceSubject.shtml',
            dataType: "json",
            contentType: "application/json",
            data: $saveData,
            success: function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;
                if ($code === 'SUCCESS') {
                    window.location.reload();
                } else {
                    setLayerAlert(parent.layer, '状态改变失败');
                }
            }
        });
    }
});