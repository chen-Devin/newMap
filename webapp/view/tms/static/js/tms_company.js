/*
 * 组织架构联动控件（公司、部门）
 * terry zhong
 * 2017-8-2
 * v1.0
 * $('#district').district();
 * $val：当前最后一级的值
 */

//公司部门联动（$form表单，$val=[公司值，部门值]，$objs=[公司选择框name，部门选择框name]）
$.fn.companyDepartment = function($form, $vals, $objs) {
    var $self = this,
        $company = $self.find('select[name="' + $objs[0] + '"]'),
        $department = $self.find('select[name="' + $objs[1] + '"]'),
        $companyVal = typeof $vals[0] != 'undefined' ? $vals[0] : '',
        $departmentVal = typeof $vals[1] != 'undefined' ? $vals[1] : '',
        $parentId = '';

    //初始化公司
    getData($form, $company, $parentId, $companyVal, 1);

    //初始化部门
    if ($departmentVal != '') {
        $parentId = $companyVal;
        getData($form, $department, $parentId, $departmentVal, 2);
    }

    //点击公司联动部门
    $form.on('select(' + $objs[0] + ')', function(data) {
        //清空部门下拉框
        $department[0].options.length = 1;
        $form.render('select');
        $parentId = $(this).attr('lay-value');
        if ($parentId.length > 0) {
            getData($form, $department, $parentId, '', 2);
        }
    })

    //接口获取数据
    function getData($f, $obj, $pid, $val, $type) {
        $.get('/ucenter/centre/core/organization.shtml', { parentId: $pid }, function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects,
                $html = '';

            if ($code != 'SUCCESS') return false;

            if ($objects.length > 0) {
                for (var i = 0; i < $objects.length; i++) {
                    if ($objects[i].type == $type) {
                        parseInt($val) === parseInt($objects[i].id) ? $html = ' selected="selected"' : $html = '';
                        if ($objects[i].status < 3) {
                            $obj.append('<option value="' + $objects[i].id + '"' + $html + '>' + $objects[i].name + '</option>');
                        }
                        $type == 1 ? getData($f, $company, $objects[i].id, $val, 1) : '';
                        $type == 2 ? getData($f, $department, $objects[i].id, $val, 2) : '';
                    }
                }

                $f.render('select');
            }
        }, 'json');
    }

}

//获取员工
function getEmployee($form, $layer, $val) {
    //获取员工之前先清空select,保留第一个
    $('select[name="mgrId"]').each(function() {
        $(this).find('option').not(':first').remove();
    });

    $.get('/ucenter/centre/permi/employee/page.shtml', { pageNum: -1 }, function(d) {
        var $code = d.code,
            $msg = d.msg,
            $objects = d.objects,
            $arrs = $objects.list;

        if ($code === 'SUCCESS') {
            if ($arrs.length > 0) {
                for (var $i = 0; $i < $arrs.length; $i++) {
                    if ($arrs[$i].status == 1) {
                        $('select[name="mgrId"]').append('<option value="' + $arrs[$i].id + '">' + $arrs[$i].name + '</option>');
                    }
                }
            }
            if ($val.toString().length > 0) {
                $('select[name="mgrId"]').val($val);
            }
            $form.on('select(mgrId)', function(data) {
                if (data.value.length > 0) {
                    $('input[name="mgrName"]').val($(this).html());
                } else {
                    $('input[name="mgrName"]').val('');
                }
            });
            $form.render('select');
        } else {
            $layer.alert('获取员工失败！');
            return false;
        }
    }, 'json');
}

//重编译树形数据json
function setTreeData($pid, $arrs) {
    if ($pid == 0) $pid = null;
    var $newArr = [];
    if ($arrs.length > 0) {
        for (var $i = 0; $i < $arrs.length; $i++) {
            if ($arrs[$i].parentId == $pid) {
                var $newObj = new Object();
                $newObj.spread = true;
                $newObj.rid = $arrs[$i].id;
                if ($arrs[$i].name) {
                    //停用
                    if ($arrs[$i].status == 3) {
                        $newObj.name = '<p class="cancel">' + $arrs[$i].name;
                        $newObj.name += $arrs[$i].manager ? '<span class="manager">（' + $arrs[$i].manager + '）</span>' : ''; //加入负责人
                        $newObj.name += ' <span class="status">停用</span></p>';
                    }
                    //启用
                    else {
                        $newObj.name = '<p>' + $arrs[$i].name;
                        $newObj.name += $arrs[$i].manager ? '<span class="manager">（' + $arrs[$i].manager + '）</span>' : ''; //加入负责人
                        $newObj.name += '</p>';
                    }
                }
                $newObj.type = $arrs[$i].type;
                $newObj.status = $arrs[$i].status;
                $newObj.parentId = $arrs[$i].parentId == null ? 0 : $arrs[$i].parentId;
                $newObj.checkboxValue = $arrs[$i].id;
                $newObj.children = $arrs[$i].children != null ? setTreeData($arrs[$i].id, $arrs[$i].children) : null;
                $newArr.push($newObj);
                $arrs[$i].children != null ? setTreeData($arrs[$i].id, $arrs[$i].children) : '';
            }
        }
    }
    return $newArr;
}