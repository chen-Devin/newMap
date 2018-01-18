// 创建 跳转到【车辆保险】页面的事件处理器
function createGotoInsuranceHandler(table, documentContext) {
    var carInsurancePage = 'car-insurance/index.html';

    // 点击【保险】，需要跳转到 【车辆保险】 菜单
    return function() {
        var checkStatus = table.checkStatus('dataReload');
        var data = checkStatus.data;

        if (data.length > 1) {
            parent.layer.alert('只能选择一条数据！');
            return;
        }

        var $_carInsuranceMenu = null;
        // 查找【车辆保险】菜单
        $('.sys-lefter dl dt a', documentContext).each(function () {
            var $_self = $(this);

            // 根据 carInsurancePage 的值来匹配
            if ($_self.attr('href').indexOf(carInsurancePage) >= 0) {
                $_carInsuranceMenu = $_self;
                
                return false;
            }
        });

        // 如果找不到【车辆保险】菜单，则说明没有权限
        if (!$_carInsuranceMenu) {
            setLayerAlert(parent.layer, '暂无 车辆保险 菜单权限，请联系管理员');

            return;
        }

        // 没有选中列表中的项，则直接跳转到 【车辆保险】 页面
        if (!data.length) {
            $_carInsuranceMenu[0].click();

            return;
        }

        // 因为 car-insurance/list.html 页面 既用 getUrlParam（里面有unescape转义），有在外面使用了一次 decodeURI ，所以这里需要使用两次 encodeURI
        var queryString = '?trailerNo=' + encodeURI(encodeURI(data[0].carNo)) + "&trailerId=" + data[0].id;
        var oldLink = $_carInsuranceMenu.attr('href');

        // 如果选中了列表中的项，则先给 车辆保险 菜单加参数。触发点击事件之后，再恢复成原来的菜单
        $_carInsuranceMenu.attr('href', oldLink + queryString);
        $_carInsuranceMenu[0].click();
        $_carInsuranceMenu.attr('href', oldLink);
    };
};