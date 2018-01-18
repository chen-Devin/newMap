/*
 * 城市联动控件，layui
 * terry zhong
 * 2017-8-2
 * v1.0
 * $('#district').district();
 * $val：当前最后一级的值
 */

$.fn.district = function($form, $val) {
    var $self = this,
        $province = $self.find('select').eq(0), //省
        $city = $self.find('select').eq(1), //市
        $county = $self.find('select').eq(2), //县
        $street = $self.find('select').eq(3), //街
        $provinceVal = '',
        $cityVal = '',
        $countyVal = '',
        $streetVal = '',
        $provinceLay = $province.attr('lay-filter'),
        $cityLay = $city.attr('lay-filter'),
        $countyLay = $county.attr('lay-filter'),
        $streetLay = $street.attr('lay-filter'),
        $parentId = '', //父id
        $isChange = false;
    $valLen = 0;

    //初始化
    if (typeof $val != 'undefined') {
        var $valTop, $val1, $val2, $val3, $val4, $valStr, $valArr;
        if ($val == null) return false;
        $val = $val.toString();
        //截取前两个字符判断区域
        var $valTop = $val.substr(0, 2);
        //北京市11，天津市12，上海市31，重庆市50，如北京市：110000,110102,110102003（11市，110102区，110102003街道）
        if ($valTop == '11' || $valTop == '12' || $valTop == '31' || $valTop == '50') {
            $val1 = $valTop + '0000';
            $val2 = $val.substr(0, 6);
            $val3 = $val;
            $valStr = $val1 + ',' + $val2 + ',' + $val3;
        }
        //台湾省71：710000,710700,710705（71省，7107市，710705区）
        else if ($valTop == '71') {
            $val1 = $valTop + '0000';
            $val2 = $val.substr(0, 4) + '00';
            $val3 = $val;
            $valStr = $val1 + ',' + $val2 + ',' + $val3;
        }
        //香港81、澳门82，如香港：810000,810112（81省，810112区）
        else if ($valTop == '81' || $valTop == '82') {
            $val1 = $valTop + '0000';
            $val2 = $val;
            $valStr = $val1 + ',' + $val2;
        }
        //其他：如广东省：440000,441400,441427,441427112（44省，4414市，441427区，441427112街道）
        else {
            $val1 = $valTop + '0000';
            $val2 = $val.substr(0, 4) + '00';
            $val3 = $val.substr(0, 6);
            $val4 = $val;
            $valStr = $val1 + ',' + $val2 + ',' + $val3 + ',' + $val4;
        }

        $valArr = $valStr.split(',');
        $valArr[0].length > 0 ? $provinceVal = $valArr[0] : $provinceVal = '';
        typeof $valArr[1] != 'undefined' ? $cityVal = $valArr[1] : $cityVal = '';
        typeof $valArr[2] != 'undefined' ? $countyVal = $valArr[2] : $countyVal = '';
        typeof $valArr[3] != 'undefined' ? $streetVal = $valArr[3] : $streetVal = '';
    }

    //省
    if ($provinceVal != '') {
        $provinceVal = $provinceVal;
    }
    getDistrictData($form, $province, $provinceVal, $parentId);

    //市
    if ($cityVal != '') {
        $parentId = $provinceVal;
        $city.parent().show();
        getDistrictData($form, $city, $cityVal, $parentId);
    } else {
        $city.parent().hide();
    }

    //县
    if ($countyVal != '') {
        $parentId = $cityVal;
        $county.parent().show();
        getDistrictData($form, $county, $countyVal, $parentId);
    } else {
        $county.parent().hide();
    }

    //街
    if ($streetVal != '') {
        $parentId = $countyVal;
        $street.parent().show();
        getDistrictData($form, $street, $streetVal, $parentId);
    } else {
        $street.parent().hide();
    }

    $form.on('select(' + $provinceLay + ')', function(data) {
        //清空后面下拉框
        $city[0].options.length = 1;
        $county[0].options.length = 1;
        $street[0].options.length = 1;
        $parentId = $(this).attr('lay-value');
        $isChange = true;
        if ($parentId.length > 0) {
            getDistrictData($form, $city, '', $parentId);
        } else {
            $self.find('select').parent().slice(1, 4).hide();
        }
    })

    $form.on('select(' + $cityLay + ')', function(data) {
        $county[0].options.length = 1;
        $street[0].options.length = 1;
        $parentId = $(this).attr('lay-value');
        $isChange = true;
        if ($parentId.length > 0) {
            getDistrictData($form, $county, '', $parentId);
        } else {
            $self.find('select').parent().slice(2, 4).hide();
        }
    })

    $form.on('select(' + $countyLay + ')', function(data) {
        $street[0].options.length = 1;
        $parentId = $(this).attr('lay-value');
        $isChange = true;
        if ($parentId.length > 0) {
            getDistrictData($form, $street, '', $parentId);
        } else {
            $self.find('select').parent().slice(3, 4).hide();
        }
    })

    //获取城市数据：$obj:下级元素，$val：当前元素ID值，$pid：当前元素父ID
    function getDistrictData($f, $obj, $val, $pid) {
        $.get('/common/district/search.shtml', { key: '', parentId: $pid, pageNum: -1 }, function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects,
                $data = $objects.list,
                $html = '',
                $index = $obj.parent().index();

            if ($code == 'SUCCESS' && $objects != null && $data.length > 0) {
                if ($isChange) {
                    $self.find('select').parent().slice($index, 4).hide();
                    $obj.parent().show();
                }

                for (var i = 0; i < $data.length; i++) {
                    parseInt($val) === parseInt($data[i].id) ? $html = ' selected="selected"' : $html = '';
                    $obj.append('<option value="' + $data[i].id + '"' + $html + '>' + $data[i].name + '</option>');
                }

                $f.render('select');
            }
        }, 'json');
    }
}