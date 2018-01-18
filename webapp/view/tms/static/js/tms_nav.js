/*
 * 菜单栏控件
 * terry zhong
 * 2017-7-28
 * v1.0
 */
$(function() {
    //初始化菜单
    var oNav = new navInit();
    oNav.init();
    oNav.hideLeftNav();
    oNav.hideInfo();
    oNav.winSize();
});

var navInit = function() {
    var oNavInit = new Object(),
        mainNav = $('.panel-menu'),
        subNav = $('.sub-nav'),
        defaultUrl = '/view/tms/dashboard/index.html',
        winWidth = $(window).width(),
        winHeight = $(window).height(),
        sysUrl = window.location.href,
        sysLeft = $('.sys-lefter'),
        sysRight = $('.sys-righter');
    //读取菜单信息
    oNavInit.init = function() {
        $.ajax({
            url: '/ucenter/centre/permi/functions/menus.shtml',
            type: "GET",
            dataType: 'json',
            beforeSend: function() {},
            success: function(d) {
                var code = d.code,
                    msg = d.msg,
                    data = d.objects;

                if (code === 'SUCCESS') {
                    if (data.length > 0) {
                        var k = 0; //启用和有权限的主菜单个数
                        for (var i = 0; i < data.length; i++) {
                            //1、添加主菜单
                            mainNav.append('<li><a>' + data[i].name + '</a></li>');
                            subNav.append('<dl></dl>');
                            var subNavDl = subNav.find('dl').eq(k);

                            //第一主菜单中添加控制台
                            if (k == 0) {
                                subNavDl.append('<dt><a href="' + defaultUrl + '"><span class="icon-home"></span>控制台</a></dt>');
                            }

                            //2、添加二级菜单
                            var subData = data[i].children;
                            if (subData.length > 0) {
                                var n = 0; //启用和有权限的三级菜单个数
                                for (var j = 0; j < subData.length; j++) {
                                    var levelData = subData[j].children;
                                    var url = '',
                                        list = '',
                                        ico = '';
                                    if (subData[j].url) {
                                        url = ' href="' + subData[j].url + '"';
                                    }
                                    if (levelData.length > 0) {
                                        list = '<i class="icon-down"></i>';
                                        ico = 'icon-list';
                                    } else {
                                        ico = 'icon-arrow';
                                    }
                                    var menuLink = $('<a' + url + '><span class="' + ico + '"></span>' + subData[j].name + list + '</a>');
                                    menuLink.data('menuId', subData[j].id);
                                    $('<dt></dt>').append(menuLink).appendTo(subNavDl);

                                    //3、添加三级菜单
                                    if (levelData.length > 0) {
                                        subNavDl.append('<subnav></subnav>');
                                        var levelNavDl = subNavDl.find('subnav').eq(n);
                                        for (var m = 0; m < levelData.length; m++) {
                                            var lurl = '';
                                            if (levelData[m].url) {
                                                lurl = ' href="' + levelData[m].url + '" url-id="u' + levelData[m].id + '"';
                                            }
                                            levelNavDl.append('<dd><a' + lurl + '>' + levelData[m].name + '</a></dd>');
                                        }
                                    }
                                    n++;
                                }
                            }
                            k++;
                        }
                    }
                }

                // 用于菜单地址映射
                var menuUrlMap = {
                    // 将“/view/index.html”菜单 当作“/view/tms/dashboard/index.html”菜单（高亮才会起作用）
                    '/view/index.html': '/view/tms/dashboard/index.html'
                };

                oNavInit.currentNav(menuUrlMap[location.pathname]);
                oNavInit.activeMainNav();
                oNavInit.activeSubNav();
            },
            complete: function() {},
            error: function() {}
        });
    }

    //主菜单点击事件
    oNavInit.activeMainNav = function() {
        var index = 0;
        mainNav.find('li a').on('click', function() {
            mainNav.find('li a').removeClass('active');
            $(this).addClass('active');
            index = $(this).parent().index();
            subNav.find('dl').hide();
            var oSubNav = subNav.find('dl').eq(index); //当前二级菜单容器
            oSubNav.show();
            oNavInit.activeSubNav();
        });
    }

    //二级菜单点击事件
    oNavInit.activeSubNav = function() {
        var index = 0;
        subNav.find('dl').each(function() {
            if (!$(this).is(':hidden')) {
                index = $(this).index();
                var oSubNav = subNav.find('dl').eq(index); //当前二级菜单容器
                oSubNav.find('dt').each(function() {
                    $(this).on('click', function() {
                        if ($(this).next('subnav').length > 0) {
                            oSubNav.find('subnav').hide();
                            $(this).next('subnav').css({ 'display': 'block' });
                            oSubNav.find('dt a').removeClass('active');
                            $(this).find('a').addClass('active');
                            oSubNav.find('dt a i').removeClass('icon-up').addClass('icon-down');
                            $(this).find('a i').removeClass('icon-down').addClass('icon-up');
                        }
                    });
                })
            }
        });
    }

    //当前页菜单样式
    oNavInit.currentNav = function(targetUrl) {
        var mNavItem, sNavItem, lNavItem; //一级，二级，三级菜单
        mNavItem = mainNav.find('li');
        sNavItem = subNav.find('dl dt');
        lNavItem = subNav.find('dl dd');
        //二级
        sNavItem.each(function() {
            var tUrl = $(this).find('a').attr('href');
            var index = 0;
            if (typeof(tUrl) != "undefined") {
                if (tUrl != "" && tUrl != "javascript:;") {
                    if ((targetUrl || sysUrl).indexOf(tUrl) >= 0) {
                        $(this).find('a').addClass('active');
                        index = $(this).parent().index();
                        subNav.find('dl').hide();
                        subNav.find('dl').eq(index).show();
                        mNavItem.find('a').removeClass('active');
                        mNavItem.eq(index).find('a').addClass('active');
                    }
                }
            }
        });

        //三级
        lNavItem.each(function() {
            var tUrl = $(this).find('a').attr('href');
            var index = 0;
            if (tUrl != "javascript:;") {
                if (sysUrl.indexOf(tUrl) > 0) {
                    $(this).find('a').addClass('active');
                    index = $(this).parent().parent().index();
                    subNav.find('dl').hide();
                    subNav.find('dl').eq(index).show();
                    $(this).parent().css({ 'display': 'block' });
                    $(this).parent().prev().find('a').addClass('active');
                    $(this).parent().prev().find('a i').removeClass('icon-down').addClass('icon-up');
                    mNavItem.find('a').removeClass('active');
                    mNavItem.eq(index).find('a').addClass('active');
                }
            }
        });
    }

    //隐藏左边菜单栏，最小屏幕分辨率1366x768
    oNavInit.hideLeftNav = function() {
        var isLeftHide = false;
        var hideBtn = $('#hide-btn');
        var time = 200;
        hideBtn.on('click', function() {
            if (isLeftHide) {
                hideBtn.animate({ 'left': '166px' }, time).attr('title', '缩进').removeClass('show').addClass('hide');
                sysLeft.animate({ 'left': "0px" }, time);
                sysRight.animate({ 'margin-left': '200px', 'min-width': '1146px' }, time);
                isLeftHide = false;
            } else {
                hideBtn.animate({ 'left': '-5px' }, time).attr('title', '展开').removeClass('hide').addClass('show');
                sysLeft.animate({ 'left': "-200px" }, time);
                sysRight.animate({ 'margin-left': '0', 'min-width': '1346px' }, time);
                isLeftHide = true;
            }
        });
    }

    //隐藏左侧统计信息
    oNavInit.hideInfo = function() {
        var panelInfo = $('.panel-info');
        panelInfo.find('h2 i').on('click', function() {
            if (panelInfo.find('ul').is(':hidden')) {
                panelInfo.find('ul').show();
                $(this).removeClass('icon-down').addClass('icon-up');
            } else {
                panelInfo.find('ul').hide();
                $(this).removeClass('icon-up').addClass('icon-down');
            }
            subNav.height(sysLeft.height() - sysLeft.find('h1').height() - sysLeft.find('.panel-info').height() - 11);
        });
    }

    //宽高自适应
    oNavInit.winSize = function() {
        //左边
        sysLeft.height(winHeight - 110);
        subNav.height(sysLeft.height() - sysLeft.find('h1').height() - sysLeft.find('.panel-info').height() - 11);

        //右边
        //sysRight.height(winHeight - 120);
    }

    return oNavInit;
}