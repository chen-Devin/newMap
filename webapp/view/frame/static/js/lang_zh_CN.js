/*
* 语言常量
* terry zhong
* 2017-8-2
* v1.0
*/

//表单提示提示（normMsg：正常提示，errorMsg1：错误提示1，errorMsg2：错误提示2，... errorMsgN：错误提示n）
var $jsLang = new Object();
$jsLang.userName = {'normMsg':'4-20位字符，支持字母和数字，设置成功无法更改', 'errorMsg1':'请输入用户名', 'errorMsg2':'4-20位字符，支持字母和数字', 'errorMsg3':'用户名包含特殊字符', 'errorMsg4':'用户名已存在'};
$jsLang.passWord = {'normMsg':'6-20位字符，由大小写字母和数字两种以上组合', 'errorMsg1':'请输入登录密码', 'errorMsg2':'6-20位字符，由大小写字母和数字两种以上组合', 'errorMsg3':'登录密码包含特殊字符'};
$jsLang.passWord1 = {'normMsg':'请再次输入您的密码', 'errorMsg1':'请输入确认密码', 'errorMsg2':'6-20位字符，由大小写字母和数字两种以上组合', 'errorMsg3':'确认密码包含特殊字符', 'errorMsg4':'两次密码输入不一致'};
$jsLang.vcode = {'normMsg':'', 'errorMsg1':'请输入验证码', 'errorMsg2':'验证码不正确'};
$jsLang.mobile = {'normMsg':'支持1开头的11位数字', 'errorMsg1':'请输入正确的手机号', 'errorMsg2':'手机格式不正确', 'errorMsg3':'手机号已存在'};
$jsLang.smsCode = {'normMsg':'', 'errorMsg1':'请获取短信验证码', 'errorMsg2':'短信验证码为数字', 'errorMsg3':'短信验证码错误，请重新获取'};
$jsLang.inviteCode = {'normMsg':'6位数字和字母组成', 'errorMsg1':'6位数字和字母组成', 'errorMsg2':'邀请码包含特殊字符'};
$jsLang.checkStatus = {'errorMsg1':'请确认你已阅读并同意服务协议'}
$jsLang.socialCode = {'normMsg':'18位数字和大写字母组成', 'errorMsg1':'请输入统一社会信用代码', 'errorMsg2':'18位数字和大写字母组成', 'errorMsg3':'社会代码格式不正确', 'errorMsg4':'企业已被注册'};
$jsLang.companyFullName = {'normMsg':'2-50位字符，由中英文、数字、"_"、"-"、"#"组成', 'errorMsg1':'请输入公司名称', 'errorMsg2':'2-50位字符，由中英文、数字、"_"、"-"、"#"组成', 'errorMsg3':'格式错误'};
$jsLang.companyShortName = {'normMsg':'2-20位字符，由中英文、数字、"_"、"-"、"#"组成', 'errorMsg1':'请输入公司简称', 'errorMsg2':'2-20位字符，由中英文、数字、"_"、"-"、"#"组成', 'errorMsg3':'格式错误'};
$jsLang.idCard = {'normMsg':'请输入正确的身份证号码', 'errorMsg1':'请输入身份证号码', 'errorMsg2':'身份证号码格式错误', 'errorMsg3':'身份证已被注册', 'errorMsg4':'身份证通过审核不可修改'};
$jsLang.district = {'errorMsg1':'请选择城市'};
$jsLang.address = {'normMsg':'5-120位字符，由中英文、数字、"_"、"-"、"#"组成', 'errorMsg1':'请输入详细地址', 'errorMsg2':'5-120位字符，由中英文、数字、"_"、"-"组成', 'errorMsg3':'详细地址包含特殊字符'};
$jsLang.deadline = {'errorMsg1':'请选择营业期限'};
$jsLang.imgUrl = {'errorMsg1':'请上传图片'};
$jsLang.imgUrl1 = {'errorMsg1':'请上传身份证正面照片'};
$jsLang.imgUrl2 = {'errorMsg1':'请上传身份证反面照片'};
$jsLang.businessRole = {'errorMsg1':'请选择业务角色'};
$jsLang.businessScope = {'errorMsg1':'请选择业务范围'};
$jsLang.trueName = {'normMsg':'2-10位字符，由中文或英文组成', 'errorMsg1':'请输入注册人姓名', 'errorMsg2':'2-10位字符，由中英文组成'};
$jsLang.email = {'normMsg':'输入正确的邮箱', 'errorMsg1':'邮箱格式错误'};
$jsLang.login = {'errorMsg1':'请输入用户名或手机号', 'errorMsg2':'请输入登录密码', 'errorMsg3':'请输入验证码', 'errorMsg4':'用户帐号或密码错误'}

//正则表达式
var $jsReg = new Object();
$jsReg.zhName = /^[\u4E00-\u9FA5A-Za-z]+$/;  //中文姓名
$jsReg.zhCompanyName = /^[\u4E00-\u9FA50-9A-Za-z()（）\-_]+$/;    //公司名称、详细地址
$jsReg.mobile = /^(((13[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;   //手机号
$jsReg.userName = /^[A-Za-z0-9]+$/; //用户名、密码、代码
$jsReg.email = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;   //邮箱
$jsReg.idNo = /(^\d{18}$)|(^\d{17}(\d|X|x)$)/;  //身份证
$jsReg.drivingNo = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;  //驾驶证、从业资格证
$jsReg.qq = /^[1-9][0-9]{4,10}$/;   //qq
$jsReg.wechat = /^[a-zA-Z0-9]([-_a-zA-Z0-9]{5,19})+$/; //微信号
$jsReg.carNo = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4,7}[A-Z0-9挂学警港澳]{1}$/;    //车牌号
$jsReg.carNo1 = /^[A-Z]{1}[A-Z0-9]{4,7}[A-Z0-9挂学警港澳]{1}$/;    //车牌号(不校验第一个字符)
$jsReg.posNum = /^\d*\.?\d+$/;  //带浮点的数字
$jsReg.integer = /^((0)|([1-9][0-9]*))$/;  //正整数
$jsReg.plus = /^((0)|([1-9][0-9]*)|([0]\.\d{1,2}|[1-9][0-9]*\.\d{1,2}))$/;  //正数(小数点后两位)
$jsReg.tel = /^([0-9]|[-]|[+])+$/;  //固定电话
$jsReg.website = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/; //网址
$jsReg.accountingSubject =  /^\S{1,40}$/;//会计科目
$jsReg.justNum = /^[0-9]*$/ //纯数字

$jsReg.unifyCode = /^[1-9A-GY]{1}[1239]{1}[1-5]{1}[0-9]{5}[0-9A-Z]{10}$/;   //统一信用社会代码
$jsReg.color = /^[\u4E00-\u9FA5A-Za-z]+$/;  //颜色
$jsReg.yiNum   = /^\d{1,9}\.?\d{0,2}$/;  //带小于1亿的数字，可小数点后两位


