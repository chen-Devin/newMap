/*
* 主入口控件
* terry zhong
* 2017-7-25
* v1.0
*/

// 主入口方法
layui.use(['layer', 'element', 'util'], function () {

  // 操作对象
  var device = layui.device()
      , element = layui.element
      , layer = layui.layer
      , util = layui.util
      , $ = layui.jquery
      , cardIdx = 0
      , cardLayId = 0;

  //阻止IE7以下访问
  if (device.ie && device.ie < 8) {
      layer.alert('如果您使用ie浏览器，请使用ie8+');
  }

  // 根据导航栏text获取lay-id
  function getTitleId(card, title) {
      var id = -1;
      $(document).find(".layui-tab[lay-filter=" + card + "] ul li").each(function () {
          if (title === $(this).find('span').html()) {
              id = $(this).attr('lay-id');
          }
      });
      return id;
  }

  // 添加TAB选项卡
  window.addTab = function (elem, tit, url) {
      var card = 'card';                                              // 选项卡对象
      var title = tit ? tit : elem.children('a').html();              // 导航栏text
      var src = url ? url : elem.children('a').attr('href-url');      // 导航栏跳转URL
      var id = new Date().getTime();                                  // ID
      var flag = getTitleId(card, title);                             // 是否有该选项卡存在
      // 大于0就是有该选项卡了
      if (flag > 0) {
          id = flag;
      } else {
          if (src) {
              // iframe 的src 需要判断 是否在集成框架环境内，如果是统一集成框架，则src需要做进一步处理 以正确解析子页的相对路径
              var iframeTargetSrc = src;

              if (typeof INTEGRATION_FRAME_VERSION !== 'undefined') {

                // 通过 html 拿到所属的 document，进而得到 location 对象（该对象与所在的 window的location对象 是同一引用），这样就能得到 elem所在页面的url
                var belongPageUrl = $(elem).parents('html').parent()[0].location.href;
                iframeTargetSrc = belongPageUrl.replace(/(.*\/)(.*?\.html).*/, '$1') + src;
                
                console.log('在统一集成框架内打开iframe，原地址为 [%s] ，已替换为新地址 [%s]', src, iframeTargetSrc);
              }
            
              //新增
              element.tabAdd(card, {
                  title: '<span>' + title + '</span>'
                  , content: '<iframe name="f' + id + '" src="' + iframeTargetSrc + '" frameborder="0"></iframe>'
                  , id: id
              });
              // 关闭弹窗
              layer.closeAll();
          }
      }
      // 切换相应的ID tab
      element.tabChange(card, id);
      // 提示信息
      // layer.msg(title);

      // 给删除按钮绑定事件，修正 在多行tab头中删除最后一个tab后，tab内容区变空白的bug（layui的bug！！）
      var $_tabTitle = $('.layui-tab').find('.layui-tab-title');
      $_tabTitle.find('li[lay-id=' + id + '] .layui-tab-close').click(function () {
            // 如果 layui-this 是添加在span上，说明触发了 layui 的bug。需要修正
            if ($_tabTitle.find('.layui-this').is('span')) {
                // 修正为：切换到最后一个 tab项上
                var $_lastTabItem = $_tabTitle.find('li').last();

                element.tabChange(card, $_lastTabItem.attr('lay-id'));
                console.warn('修复 layui tab白屏的bug');
            }
      });
  };

  // 删除选项卡
  window.delTab = function (layId) {
      // 删除
      element.tabDelete('card', layId);
  };

  // 删除所有选项卡
  window.delAllTab = function () {
      // 选项卡对象
      layui.each($('.layui-tab .layui-tab-title > li'), function (k, v) {
          var layId = $(v).attr('lay-id');
          if (layId > 1) {
              // 删除
              element.tabDelete('card', layId);
          }
      });
  };

  // 获取当前选中选项卡lay-id
  window.getThisTabID = function () {
      // 当前选中的选项卡id
      return $(document).find('.layui-tab > .layui-tab-title .layui-this').attr('lay-id');
  };

  // 自适应
  $(window).on('resize', function () {
    winSize();
  });

  //左右框架自适应
  function winSize(){
    var winWidth = $(window).width(),
        winHeight = $(window).height(),
        minHeight = 400,
        sysLeft = $('.sys-lefter'),
        sysRight = $('.sys-righter'),
        layTabContent = $('.layui-tab-content')
    //左边
    sysLeft.height(winHeight - 110);
    if(sysLeft.height() <= minHeight){
      sysLeft.height(minHeight);
    };
    $('.sub-nav').height(sysLeft.height() - sysLeft.find('h1').height() - sysLeft.find('.panel-info').height() - 11);

    //右边
    sysRight.height(winHeight - 110);
    layTabContent.height(sysRight.height() - 39);
  }

  // 初始化
  function init() {
    //加载公共菜单模块
    if($('#public-frame').length > 0){
      $('#public-frame').load('/view/tms/publicFrame.html');
    }

    winSize();

    if(window.location.href.indexOf('.html') == -1){
      window.location.href = 'index.html';
    }
  }

  init();
});