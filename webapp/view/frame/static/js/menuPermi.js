/*
 * 菜单权限控件
 * terry zhong
 * 2017-8-2
 * v1.0
 * $('#menuBox').treeMenu();
 * $rmvIds在页面表单提交时必须添加进去；
 */

//var $rmvIds = [];
//封装树形菜单，目前只显示两级
$.fn.treeMenu = function($url) {
    var $self = this,
        $menuBox = $('#menuPermi'),
        $btnsBox = $('#btnsPermi'),
        $allArrs = getMenus('', 0, 2);

    // 树形参数设置
    var $options = {
        elem: '#menus',
        check: 'checkbox', //勾选类型
        drag: true, //点击每一项时是否生成提示信息
        checkboxName: 'mids', //复选框的name属性值
        click: function(item) {
            var $valArr = item.checkboxValue.split('//'),
                $tid = $valArr[0],
                $parentId = $valArr[2] != 'null' ? $valArr[2] : 0,
                $btnsCon = $btnsBox.find('#subBtns'),
                $isCheck = $menuBox.find('#menus input[id="' + item.id + '"]').prop('checked');

            //一级菜单并选中的
            if ($parentId == 0 && $isCheck) {
                $btnsCon.find('dl').hide();
                var $tBox = $btnsCon.find('dl[id="n' + $tid + '"]');
                if ($tBox.is(':hidden')) {
                    $tBox.show();
                }
            }
        },
        onchange: function() { //checkbox回调
            var $valArr = $(this).val().split('//'),
                $tid = $valArr[0],
                $tname = $valArr[1],
                $parentId = $valArr[2] != 'null' ? $valArr[2] : 0,
                $btnsCon = $btnsBox.find('#subBtns'),
                $isCheck = $(this).prop('checked');

            var $arrs = getPermiIds();

            if ($parentId == 0) {
                checkFirstMenu([$tid, $tname], $btnsCon, $isCheck, $arrs, true);
            } else {
                checkSecondMenu([$tid, $tname], $btnsCon, $parentId, $isCheck);
            }
        },
        nodes: $allArrs
    }

    //显示已勾选的第一个一级菜单
    var showFirstMenu = function() {
        var showPval = $menuBox.find('#menus>li>input[name="mids"]:checked').eq(0).attr('rid');
        if (showPval) {
            var showPid = showPval.substr(1);
            if (showPid) $('#n' + showPid).show();
        }
    }

    //点击一级菜单画表，生成三级按钮菜单，curIdName：当前菜单id和name，pBox：父容器，isCheck：是否选中，arrs：员工已有菜单权限ids，isTickCheckBox：是否点击复选框勾选（是：勾选，否：初始化）
    function checkFirstMenu(curIdName, pBox, isCheck, arrs, isTickCheckBox) {
        arrs = arrs || null;
        var subArr = [];
        if (curIdName.length == 0) return false;
        pBox.find('dl').hide();

        if (isCheck) {
            if ($('#n' + curIdName[0]).length == 0) {
                //一级菜单，没有就生成
                pBox.append('<dl id="n' + curIdName[0] + '"><dt>' + curIdName[1] + '</dt><box></box></dl>');
            } else {
                $('#n' + curIdName[0]).show();
            }

            //获取当前一级菜单下的所有菜单数据
            $.get('/ucenter/centre/permi/functions/search.shtml', { parentId: curIdName[0] }, function(d) {
                var pArr = d.objects;
                if (d.code != 'SUCCESS') return false;
                //循环，二级菜单
                if (pArr.length > 0) {
                    //$('#n' + curIdName[0] + ' box dd').hide();
                    for (var i = 0; i < pArr.length; i++) {
                        if ($('#s' + pArr[i].id).length == 0) {
                            //二级菜单标题
                            $('#n' + curIdName[0] + ' box').append('<dd id="s' + pArr[i].id + '"><h4>' + pArr[i].name + '</h4></dd>');
                            //循环，三级菜单
                            subArr = getOneMenu(pArr[i].id, 1);
                            if (subArr.length > 0) {
                                for (var j = 0; j < subArr.length; j++) {
                                    $('#s' + pArr[i].id).append('<input type="checkbox" id="t' + subArr[j].id + '" name="btnId" lay-filter="btnId" value="' + subArr[j].id + '" title="' + subArr[j].name + '">');
                                    if (isTickCheckBox) {
                                        $('#t' + subArr[j].id).prop('checked', true);
                                    } else {
                                        if (arrs != null) {
                                            arrs[subArr[j].id] ? $('#t' + subArr[j].id).prop('checked', true) : '';
                                        }
                                    }
                                }
                            }
                        } else {
                            $('#s' + pArr[i].id).show();
                            $('#s' + pArr[i].id).find('input[name="btnId"]').prop('checked', true);
                        }
                    }
                    layui.use('form', function() {
                        var form = layui.form;
                        form.render('checkbox');
                    });
                }
            }, 'json');
        } else {
            if ($('#n' + curIdName[0]).length > 0) {
                $('#n' + curIdName[0]).hide();
                //$('#n' + curIdName[0]).find('dd').hide();
                $('#n' + curIdName[0]).find('input[name="btnId"]').prop('checked', false);
                //关闭当前，永远显示已勾选的第一个一级菜单
                showFirstMenu();
            }
        }
    }

    //点击二级菜单画表，生成三级按钮菜单，curIdName：当前菜单id和name，pBox：父容器，pid：父id，isCheck：是否选中
    function checkSecondMenu(curIdName, pBox, pid, isCheck) {
        var subArr = [];
        //获取一级菜单信息
        var pArr = getParentMenu(pid);
        if (curIdName.length == 0) return false;
        if (pArr.length == 0) return false;
        pBox.find('dl').hide();

        if (isCheck) {
            if ($('#n' + pArr[0].id).length == 0) {
                pBox.append('<dl id="n' + pArr[0].id + '"><dt>' + pArr[0].name + '</dt><box></box></dl>');
            } else {
                $('#n' + pArr[0].id).show();
            }
            if ($('#s' + curIdName[0]).length == 0) {
                $('#n' + pArr[0].id + ' box').prepend('<dd id="s' + curIdName[0] + '"><h4>' + curIdName[1] + '</h4></dd>');
                subArr = getOneMenu(curIdName[0], 1);
                if (subArr.length > 0) {
                    for (var j = 0; j < subArr.length; j++) {
                        $('#s' + curIdName[0]).append('<input type="checkbox" id="t' + subArr[j].id + '" name="btnId" lay-filter="btnId" value="' + subArr[j].id + '" title="' + subArr[j].name + '" checked>');
                    }
                }
            } else {
                $('#s' + curIdName[0]).show();
                $('#s' + curIdName[0]).find('input[name="btnId"]').prop('checked', true);
            }
        } else {
            if ($('#s' + curIdName[0]).length > 0) {
                //$('#s' + curIdName[0]).hide();
                $('#s' + curIdName[0]).find('input[name="btnId"]').prop('checked', false);
            }
            $('#n' + pArr[0].id).show();
            if ($('#n' + pArr[0].id).find('input[name="btnId"]:checked').length == 0) {
                $('#n' + pArr[0].id).hide();
                //关闭当前，永远显示已勾选的第一个一级菜单
                showFirstMenu();
            }
        }
        layui.use('form', function() {
            var form = layui.form;
            form.render('checkbox');
        });
    }

    //树形菜单渲染
    layui.use('tree', function() {
        layui.tree($options);
        setPermiIds();
    });

    //获取已选权限后展开及赋值，type：2二级，3三级
    function setPermiIds() {
        var getArrs = getMenuVal(), //员工权限值id
            newArrs = new Object(),
            btnsCon = $btnsBox.find('#subBtns'),
            navArr = []; //一级菜单

        //把员工权限值赋值到左边菜单中，勾选
        if (getArrs.length > 0) {
            for (var i = 0; i < getArrs.length; i++) {
                var menuIdCheckbox1 = $menuBox.find('#menus>li>input[rid="m' + getArrs[i] + '"]'), //一级菜单
                    menuIdCheckboxLen1 = menuIdCheckbox1.length,
                    menuIdCheckboxVal1 = menuIdCheckbox1.val();

                var menuIdCheckbox2 = $menuBox.find('#menus>li>ul>li>input[rid="m' + getArrs[i] + '"]'), //二级菜单
                    menuIdCheckboxLen2 = menuIdCheckbox2.length,
                    menuIdCheckboxVal2 = menuIdCheckbox2.val();

                if (menuIdCheckboxLen1 > 0) {
                    //勾选左边一级菜单
                    menuIdCheckbox1.prop('checked', true);
                    var oid = menuIdCheckboxVal1.split('//')[0],
                        oname = menuIdCheckboxVal1.split('//')[1];
                    navArr.push({ id: parseInt(oid), name: oname });
                }

                if (menuIdCheckboxLen2 > 0) {
                    //勾选左边二级菜单
                    menuIdCheckbox2.prop('checked', true);
                }
                newArrs[getArrs[i]] = getArrs[i];
            }
        }
        //重新构建生成员工功能权限画表
        if (navArr.length > 0) {
            for (var j = 0; j < navArr.length; j++) {
                var oid = navArr[j].id,
                    oname = navArr[j].name;
                checkFirstMenu([oid, oname], btnsCon, true, newArrs, false);
                btnsCon.find('dl').hide();
            }
        }
    }

    function getPermiIds() {
        var getArrs = getMenuVal(), //员工权限值id
            newArrs = [];

        if (getArrs.length > 0) {
            for (var i = 0; i < getArrs.length; i++) {
                newArrs[getArrs[i]] = getArrs[i];
            }
        }
        return newArrs;
    }

    //获取菜单并编绎
    function getMenus($pid, $n, $m) {
        var $menuArrs = [];
        $.ajax({
            type: 'GET',
            url: '/ucenter/centre/permi/functions/search.shtml',
            data: { parentId: $pid },
            dataType: "json",
            async: false, //同步请求
            beforeSend: function(XMLHttpRequest) {
                layer.load();
            },
            success: function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;

                if ($code != 'SUCCESS') return false;

                if ($objects.length > 0) {
                    $n++;
                    for (var $i = 0; $i < $objects.length; $i++) {
                        var $navObj = new Object();
                        $navObj.spread = false;
                        $navObj.rid = $objects[$i].id;
                        $navObj.name = $objects[$i].name;
                        $navObj.parentId = $objects[$i].parentId;
                        $navObj.checkboxValue = $objects[$i].id + '//' + $objects[$i].name + '//' + $objects[$i].parentId;
                        $n < $m ? $navObj.children = getMenus($objects[$i].id, $n, $m) : '';
                        $menuArrs.push($navObj);
                    }
                }
                return false;
            },
            complete: function() {
                layer.closeAll('loading');
            }
        });
        return $menuArrs;
    }

    //获取单级菜单，t：类型（1：json数组，2：id数组）
    function getOneMenu($pid, t) {
        var $menuArrs = [];
        $.ajax({
            type: 'GET',
            url: '/ucenter/centre/permi/functions/search.shtml',
            data: { parentId: $pid },
            dataType: "json",
            async: false, //同步请求
            success: function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;

                if ($code != 'SUCCESS') return false;

                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        if (t == 1) {
                            var $navObj = new Object();
                            $navObj.id = $objects[$i].id;
                            $navObj.name = $objects[$i].name;
                            $navObj.parentId = $objects[$i].parentId;
                            $menuArrs.push($navObj);
                        } else if (t == 2) {
                            $menuArrs.push($objects[$i].id);
                        }
                    }
                }
            }
        });
        return $menuArrs;
    }

    //获取父级菜单
    function getParentMenu($pid) {
        var $menuArrs = [];
        $.ajax({
            type: 'GET',
            url: '/ucenter/centre/permi/functions/search.shtml',
            dataType: "json",
            async: false, //同步请求
            success: function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;

                if ($code != 'SUCCESS') return false;

                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        if (parseInt($pid) == parseInt($objects[$i].id)) {
                            var $navObj = new Object();
                            $navObj.id = $objects[$i].id;
                            $navObj.name = $objects[$i].name;
                            $navObj.parentId = $objects[$i].parentId;
                            $menuArrs.push($navObj);
                        }
                    }
                }
            }
        });
        return $menuArrs;
    }

    //获取已选菜单权限
    function getMenuVal() {
        var $menuArrs = [];
        $.ajax({
            type: 'GET',
            url: $url,
            dataType: "json",
            async: false, //同步请求
            success: function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;

                if ($code != 'SUCCESS') return false;
                $menuArrs = $objects.functionIds;
            }
        });
        return $menuArrs;
    }

    //获取指定ID的数据
    function getThisMenu($id) {
        var $menuArrs = [];
        if ($id) {
            $.ajax({
                type: 'GET',
                url: '/ucenter/centre/permi/functions/' + $id + '.shtml',
                dataType: "json",
                async: false, //同步请求
                success: function(d) {
                    var $code = d.code,
                        $msg = d.msg,
                        $objects = d.objects;

                    if ($code != 'SUCCESS') return false;
                    $menuArrs = $objects;
                }
            });
        }
        return $menuArrs;
    }

    //拆分数据
    function getIdArr($arrs) {
        var $newArrs = [];
        if ($arrs.length > 0) {
            for (var $i = 0; $i < $arrs.length; $i++) {
                var $pid = getThisMenu($arrs[$i]).parentId;
                $pid ? $newArrs.push($pid) : '';
            }
            $newArrs = deWeightArr($newArrs);
        }
        return $newArrs;
    }

    //关闭按钮
    $('#vclose').on('click', function() {
        layui.use('layer', function() {
            parent.layer.closeAll();
        });
    });

    //全选
    $('input[name="checkAll"]').on('click', function() {
        //当前显示的按钮容器
        var curShowDl = $('#subBtns dl').not(':hidden'),
            curShowDd = curShowDl.find('dd').not(':hidden');

        if ($(this).prop('checked')) {
            curShowDd.find('input[name="btnId"]').prop('checked', true);
        } else {
            curShowDd.find('input[name="btnId"]').prop('checked', false);
        }
        layui.use('form', function() {
            var form = layui.form;
            form.render('checkbox');
        });
    });

    //全选
    function isCheckAll() {
        var curShowObj = $('#subBtns dl').not(':hidden');
        if (curShowObj.length == 0) {
            $('input[name="checkAll"]').prop('checked', false).prop('disabled', true);
        } else {
            $('input[name="checkAll"]').prop('disabled', false);
            var notCheckedLen = curShowObj.find('input[name="btnId"]').length,
                checkedLen = curShowObj.find('input[name="btnId"]:checked').length;
            if (notCheckedLen == checkedLen) {
                $('input[name="checkAll"]').prop('checked', true);
            } else {
                $('input[name="checkAll"]').prop('checked', false);
            }
        }
    }

    //全部按钮权限未选中状态时二级、一级菜单不勾选
    layui.use('form', function() {
        var form = layui.form;
        form.on('checkbox(btnId)', function(data) {
            var checkBtnId = function(p, t) {
                var parentId = p.attr('id').substr(1),
                    allBtnIdsLen = p.find('input[name="btnId"]:checked').length,
                    menuCheckbox = $('#menus input[rid="m' + parentId + '"]');
                if (allBtnIdsLen == 0) {
                    menuCheckbox.prop('checked', false);
                    if (t) {
                        p.hide();
                        showFirstMenu();
                    }
                } else {
                    menuCheckbox.prop('checked', true);
                }
            }

            //一级 =======================
            checkBtnId($(this).parent().parent().parent(), true);
            //二级 =======================
            checkBtnId($(this).parent());
        });
    });
}