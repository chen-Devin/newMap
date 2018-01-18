// 错误代码集合
window.ERROR_CODE_MAP = {
    // 公共错误代码
    WARNING: '警告/部分异常',
    ERROR: '失败/未知异常',
    ERROR_USER_LOGOFF: '登录超时，请重新登录',
    ERROR_USER_LOCKED: '用户锁定',
    ERROR_QUICK_OPERATION: '重复操作/频繁操作异常',
    ERROR_ILLEGAL_ARGUMENT: '非法参数',
    ERROR_ILLEGAL_OPERATION: '非法操作',
    ERROR_NO_PERMISSION: '无操作权限',
    ERROR_NOT_EXIST: '信息不存在',
    ERROR_FILE_CANNOT_NULL: '文件不能为空',

    // 注册登录
    ERROR_USER_EXIST: '帐号已被使用',
    ERROR_MOBILE_EXIST: '手机号已存在',
    ERROR_USER_NOT_EXIST: '用户不存在',
    ERROR_USER_AUTH: '用户帐号或密码错误',
    ERROR_PASSWORD: '密码错误',
    ERROR_PWD_CANNOT_NULL: '密码不能为空',
    ERROR_SMS_VALIDATE_CODE: '短信验证码不正确',
    ERROR_IMG_VALIDATE_CODE: '图片验证码不正确',
    ERROR_AUTH_OVER: '尝试认证次数已用完',

    // ------------------ 业务错误代码 ------------------

    // 企业
    ERROR_COMPANY_AUDITED: '企业通过审核不可修改',
    ERROR_COMPANY_EXIST: '企业已存在/注册',
    ERROR_CUSTOMERS_EXIST: '客户已存在',
    ERROR_DEPARTMENT_EXIST: '部门已存在',
    ERROR_EMPLOYEE_EXIST: '员工已存',
    ERROR_USC_USED: '统一社会代码已被使用',

    // 拖车
    ERROR_TRAILERCARNO_EXIST: '拖车车牌已经存在',
    ERROR_TRAILER_EXIST: '拖车已存在',
    ERROR_TRAILER_NOT_EXIST: '拖车不存在',
    ERROR_TRAILER_RELEVANCE: '拖车关联了其它车架',
    ERROR_CARNO_RELEVANCE: '拖车车牌关联了其它司机',

    
    ERROR_OWNERID_NOT_NULL: '拖车、车架所有者不能为空', //2018-01-02
    ERROR_OPERATE_ROAD_NO_NOT_NULL: '拖车、车架运输营运证号不能为空',  //2018-01-02
    // 车架
    ERROR_CARFRAME_EXIST: '车架已存在',
    ERROR_CARFRAME_NOT_EXIST: '车架不存在',
    ERROR_CARFRAME_RELEVANCE: '车架关联了其它拖车',
    ERROR_INSURANCE_CAR_NOT_EXIST: '保险拖车或车架不存在',
    ERROR_BELONG: '拖车、车架归属类型不一致',
    ERROR_OWNER_SUPPLIER: '拖车、车架所有人不一致',

    // 司机
    ERROR_DRIVER_AUDITED: '司机已认证',
    ERROR_DRIVER_EXIST: '司机已存',
    ERROR_DRIVERIDCARD_EXIST: '司机身份证号已存在!',
    ERROR_DRIVER_NOT_EXIST: '司机不存在',
    ERROR_DRIVER_RELEVANCE: '司机关联了其它拖车',

    // 订单运单
    ALREADY_SEND: '运单已出车或者已经退单！',
    UPDATE_SENDHAND_EXCEPTION: '只有运单【XXXX】的状态为【申请改派】时才能进行改派处理！',
    WARNING_WAYBILL_NOTENTRUST: '运单未委托时才可以删除',
    WARNING_WAYBILL_RECEIPTLIST: '运单状态为接单时才可以删除!',
    WARNING_WAYBILL_REMOVEARK: '当前状态不允许撤柜!',
    WARNING_WAYBILL_SUBMITJOBA: '订单[]的状态是作业中，已经派单!',
    WARNING_WAYBILL_WASNOT_ORDER: '运单尚未委托,不能撤回!',
    WARNING_WAYBILL_WAS_ORDER: '拖车行已接单,不能撤回!',
    WARNING_ORDER_CANNOTSINGLE: '订单尚未委托或已撤回,不能拒单!',
    WARNING_ORDER_DELETE: '只有录入状态的订单才能删除!',
    WARNING_ORDER_ISORDER: '订单已经接单,不能拒单!',
    WARNING_ORDER_ONLYDELETE: '只有本公司用户录入的订单才可以删除!',
    WARNING_ORDER_PAIDANDELETE: '不能删除派单以后的订单!',
    WARNING_RECEIVECOST_NOTCONFIRM: '运单当前的费用状态不为已确认费用,无法审核!',
    ERROR_ORDER_CANNOTEDIT: '无法修改订单!',
    ERROR_ORDER_CANNOT_TOSEND: '运单不满足改派条件!',
    ERROR_ORDER_NOTCOMPLETE: '订单信息不完善!',
    ERROR_ORDER_ONLY_INPUTTING: '只有录入状态的订单才能委托!',
    ERROR_WAYBILL_WASNOT_ORDERORBACK: '运单尚未委托或已撤回,不能接单!',

    // 其它
    COST_ITEM_EXIST: '费用项【XXX】已经包含在运费协议中，不应再次收取',
    DIFFERENT_FEE_AREAISSAME: '提柜地点与还柜地点属于同一区域，是否要收取异提费用？',
    DIFFERENT_FEE_AREANOTSAME: '提柜地点与还柜地点不属于同一区域，是否要收取异提费用？',
    WARNING_NOT_AGREEBOXTYPE: '箱型在协议价中不存在!',
    WARNING_WAYBILL_CANPAYCOST: '当前状态不能缴约柜费!',
    WARNING_WAYBILL_PAYCOST: '当前状态不能催缴约柜费!',
    ERROR_CANNOTRETURN_WAYBILL: '当前运单状态不允许回单!',
    ERROR_CARINSURANCE_EXIST: '车辆保险已存在',
    ERROR_CARINSURANCE_NOT_EXIST: '车辆保险不存在',
    ERROR_CONTACT_CANNOT_NULL: '联系信息不能为空',
    ERROR_EXIST: '信息已存在',
    ERROR_IDNUMBER_USED: '身份证号已被使用',
    ERROR_INSURANCE_USED: '单保已被使用',
    ERROR_NOT_AGREEMENTNO: '协议号不存在!',
    ERROR_NOT_MARGINARK: '当前位置不允许孖柜!',
    ERROR_SUPPLIER_EXIST: '供应商已存在!',
    ERROR_TASK_RUNNING: '任务正在执行',
    ERROR_WAYBILL_IS_ORDEROR: '已经接单,当前状态是',
    ERROR_WAYBILL_NOT20GP: '当前运单箱型不为20尺寸或状态不为派单状态,不允许孖柜!',


    // 请不要在后面添加 CODE
    NOTHING_CODE: '什么都没有的提示，为了最后一行不用再管逗号。所以也请不要在此行后面添加 CODE'
};