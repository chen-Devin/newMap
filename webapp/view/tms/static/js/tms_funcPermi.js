/*
 * 功能权限（页面按钮操作）
 * terry zhong
 * 2017-12-16
 * v1.0
 */

;
$.fn.funcPremi = function() {
    // 权限功能未完全开发完毕时，不启用 按钮权限限制（仅开发时开启）
    return;

    var _self = this;
    //功能权限按钮
    var controlButtons = $(_self).find('button');
    controlButtons.hide();
    //获取当前菜单id
    var currentId = window.parent.$('.sub-nav').find('dl').not(':hidden').find('dt a.active').data('menuId') || 0;
    //页面按钮data-type
    var buttonDataTypeMap = {
        //常用
        'statusStart': 1, //启用
        'statusCancel': 2, //停用
        'imporTing': 3, //导入
        'deriveBrief': 4, //导出
        'copyData': 5, //复制
        'approve': 6, //审核通过
        'approveNot': 7, //审核不通过
        'uploadAttachment': 8, //上传附件
        'addCompany': 30, //新增公司
        'addDepartment': 30, //新增部门
        'addData': 30, //新增
        'delData': 40, //删除
        'editData': 50, //编辑
        'detailData': 60, //详情

        //员工和角色
        'resetPwd': 301, //员工重置密码
        'setRolePermi': 302, //员工设置角色权限
        'setMenuPermi': 303, //员工设置菜单权限
        'setMoneyPermi': 304, //设置角色费用权限
        'setRoleUser': 305, //设置角色成员

        //订单
        'receiving': 501, //接单
        'reject': 502, //拒单
        'addArk': 503, //加柜
        'arkCancle': 504, //申请撤柜
        'repealArk': 505, //确认撤柜
        'submitJob': 506, //提交作业
        'submitData': 506, //提交
        'dragCarRushPayCost': 507, //催缴约柜费
        'printEIR': 509, //打印EIR
        'printWaybill': 510, //打印运单
        'dispatchCar': 511, //派车
        'marginArk': 512, //孖柜
        'dispatchDispose': 513, //改派处理
        'dispatchChange': 513, //改派
        'updateBrokenNo': 514, //录报关单号
        'adjustFee': 516, //调整费用
        'receipt': 517, //回单
        'receiptCancel': 518, //取消回单
        'arkFee': 521, //缴约柜费
        'affirmFee': 522, //确认费用
        'dissent': 523, //费用异议
        'waybillCashout': 524, //运单请款
        'billCashout': 525, //账单请款
        'submitArk': 526, //报柜
        'customerLinkman': 61, //报关行
        'handingSite': 61, //装卸地址
        'bankNo': 61, //银行账号
        'insuranceData': 401, //保险
        'contractData': 402, //续保

        //财务
        'actData': 1, //激活
        'frozenData': 2, //冻结
        'auditData': 6, //审核
        'cancellationData': 2, //财务作废
        'examineData': 61, //查看明细
        'checkData': 61, //查看明细
        'submitbill': 615, //提交账单
        'createBill': 602, //手动生成账单
        'chargeoffData': 603, //核销
        'reversechargeoffData': 604, //反核销
        'derive': 605, //导出
        'deriveBrief': 605, //导出账单
        'deriveDetail': 606, //导出明细账单
        'checkbill': 609, //核对账单
        'checkdetail': 612, //核对详情
        'setMoneyPermi': 613, //催款
        'applyData': 616, //申请
    };

    //通过接口获取功能权限
    $.get('/ucenter/centre/permi/functions/operates.shtml', { parentId: currentId }, function(d) {
        var code = d.code,
            msg = d.msg,
            objects = d.objects;

        if (code !== 'SUCCESS') return false;

        var hasPermiTypeMap = {};
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                hasPermiTypeMap[objects[i].type] = objects[i];
            }
            //隐藏按钮
            controlButtons.each(function(k, v) {
                var buttonDataType = $(this).attr('data-type');
                var permiObject = hasPermiTypeMap[buttonDataTypeMap[buttonDataType]];
                if (permiObject) {
                    $(this).show();
                    if (permiObject.permission < 1) {
                        $(this).remove();
                        // $(this).prop('disabled', true).css({
                        //     'background': '#ccc',
                        //     'cursor': 'default'
                        // });
                    }
                } else {
                    $(this).remove();
                }
            });
        } else {
            $(_self).remove();
        }

    }, 'JSON');
}

$(function() {
    //全局功能权限
    if ($('.btns-bar').length > 0) {
        $('.btns-bar').funcPremi();
    }
});

//打印菜单按钮权限列表
// $.get('/ucenter/centre/permi/functions/menus.shtml', {}, function(data) {
//     for (var i = 0; i < data.objects.length; i++) {
//         var children = data.objects[i].children;
//         if (children.length > 0) {
//             for (var j = 0; j < children.length; j++) {
//                 console.log('菜单id：' + children[j].id + ' ---- 菜单名称：' + children[j].name + '==========================================');
//                 console.log(getPermi(children[j].id));
//             }
//         }
//     }
// }, 'JSON');

// function getPermi(pid) {
//     $.ajaxSetup({
//         async: false
//     });
//     var objs = [];
//     $.get('/ucenter/centre/permi/functions/operates.shtml', { parentId: pid }, function(subData) {
//         var permis = subData.objects;
//         for (var m = 0; m < permis.length; m++) {
//             objs.push(JSON.stringify(permis[m]));
//         }
//     }, 'JSON');
//     return objs.join('\n');
// }