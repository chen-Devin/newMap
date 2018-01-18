/*
 * 公共控件
 * terry zhong
 * 2017-8-2
 * v1.0
 */

// //获取路径参数
// function getUrlParam(name){
//   var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");  
//   var r = window.location.search.substr(1).match(reg);  
//   if (r!=null) return unescape(r[2]);  
//   return null;
// }

// //登录失效
// function loginFailure(){
//   alert('你还未登录，请重新登录');
//   logout();
// }

// //退出
// function logout(){
//   $.ajax({
//     url: '/logout.shtml',
//     type: "POST",
//     dataType: 'json',
//     beforeSend: function(){},
//     success: function(d){
//       if(d.code === 'SUCCESS'){
//         top.location.href = '/';
//       }else{
//         alert(d.msg);
//         top.location.href = '/';
//       }
//     }
//   });
// }

// //日期格式化
// Date.prototype.format = function(format) {
//     /* 
//      * eg:format="yyyy-MM-dd hh:mm:ss"; 
//      */
//     var o = {
//         "M+": this.getMonth() + 1, // month  
//         "d+": this.getDate(), // day  
//         "h+": this.getHours(), // hour  
//         "m+": this.getMinutes(), // minute  
//         "s+": this.getSeconds(), // second  
//         "q+": Math.floor((this.getMonth() + 3) / 3), // quarter  
//         "S": this.getMilliseconds()
//             // millisecond  
//     };

//     if (/(y+)/.test(format)) {
//         format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
//     }

//     for (var k in o) {
//         if (new RegExp("(" + k + ")").test(format)) {
//             format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
//         }
//     }
//     return format;
// };

// //数组去重
// function deWeightArr($arr) {
//     var $newArr = [],
//         $newObj = {};
//     if ($arr.length > 0) {
//         for (var $i = 0; $i < $arr.length; $i++) {
//             if (!$newObj[$arr[$i]]) {
//                 $newArr.push($arr[$i]);
//                 $newObj[$arr[$i]] = true;
//             }
//         }
//     }
//     return $newArr;
// }

// //选中input时光标移到最后面
// $.fn.focusEnd = function() {
//     var $self = this,
//         $len = $($self).val().length;

//     var $input = $self[0];
//     if ($input.createTextRange) {
//         var $range = $input.createTextRange();
//         $range.collapse(true);
//         $range.moveEnd('character', $len);
//         $range.moveStart('character', $len);
//         $range.select();
//     } else if ($input.setSelectionRange) {
//         $input.focus();
//         $input.setSelectionRange($len, $len);
//     }
//     return $self;
// }