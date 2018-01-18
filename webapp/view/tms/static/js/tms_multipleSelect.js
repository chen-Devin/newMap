layui.selMeltiple = function() {
    $('.layui-form select[multiple="multiple"]').each(function(k, v) {
        var dlHtml = ['<style>.layui-this {border-bottom:#72d48e 1px dotted;} .layui-this:last-child {border-bottom:0;}</style>'],
            selVal = [],
            selTxt = [];
        $(this).find('option').each(function(m, n) {
            var val = $(this).attr('value');
            if (m != 0 || val) {
                var txt = $(this).text();
                var isSelected = $(this).is(':selected');
                var ddHtml = [
                    '<dd lay-value="' + val + '" class="' + (isSelected ? "layui-this" : "") + '">',
                    '<i style="display:inline-block; width:15px; height:15px; vertical-align:-0.2rem; line-height:15px; overflow:hidden; border:#ccc 1px solid; border-radius:2px; margin-right:5px;">',
                    (isSelected ? '✓' : ''),
                    '</i>',
                    txt,
                    '</dd>',
                ].join('');
                dlHtml.push(ddHtml);
                isSelected && (selVal.push(val), selTxt.push(txt));
            }
        });
        $(this).siblings("div.layui-form-select").find("dl").html(dlHtml.join(''));
        var selVal1 = selTxt1 = '';
        (selVal.length > 0) && (selVal1 = selVal.join(','));
        (selTxt.length > 0) && (selTxt1 = selTxt.join('; '));
        $(this).before('<input type="hidden" class="sel-val" name="' + $(this).attr("name") + '" value="' + selVal1 + '">');
        $(this).removeAttr("name");
        $(this).siblings("div.layui-form-select").find(".layui-select-title input").val(selTxt1).attr("lay-verify", $(this).attr("lay-verify"));
        $(this).siblings("div.layui-form-select").find("dl dd").each(function() {
            $(this).on('click', function() {
                selVal = [];
                selTxt = [];
                selVal1 = selTxt1 = '';
                $(this).hasClass("layui-this") ? $(this).removeClass("layui-this").find("i").text("") : $(this).addClass("layui-this").find("i").html("✓");
                $(this).parent().find("dd.layui-this").each(function() {
                    selVal.push($(this).attr("lay-value"));
                    selTxt.push($(this).text().substring(1));
                });
                (selVal.length > 0) && (selVal1 = selVal.join(','));
                (selTxt.length > 0) && (selTxt1 = selTxt.join('; '));
                $(this).parent().parent().siblings("input.sel-val").val(selVal1 || '');
                $(this).parent().siblings(".layui-select-title").find("input.layui-input").val(selTxt1 || '');
            });
        });
    });
};