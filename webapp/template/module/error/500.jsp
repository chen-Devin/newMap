<%@ page language="java" import="java.util.*" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isErrorPage="true"%>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<title>系统异常</title>
	<script language="javascript">
function showDetail(){
	var elm = document.getElementById('detail_system_error_msg');
	if(elm.style.display == '') {elm.style.display = 'none';}
	else {elm.style.display = '';}
}
	</script>
</head>
<body>
	<div style="margin:0;padding:65px 0 0 0;height:235px;width:500px;background:#fff;font-family:'Microsoft YaHei';text-align:center;color:#FF6B2C;">
		<img src="/common/images/noRight.png" width="100" height="100">
		<span style="display:block;font-size:20px;padding:10px 0;">对不起,发生系统内部错误,不能处理你的请求！请确认您的操作是否有误！</span>
		<p><a href="#" onclick="showDetail();">点击这里查看具体错误消息</a>,报告以下错误消息给系统管理员,可以更加快速的解决问题</p>
		<div id="detail_system_error_msg" style="display:none">
			<pre><%exception.printStackTrace(new java.io.PrintWriter(out));%></pre>
		</div>
	</div>
</body>
</html>
