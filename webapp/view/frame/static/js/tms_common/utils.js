/**
 * tms  common  下的 表格
*/
var tmsCommonTable = {
    /**
     * elem      容器
     * response  格式化返回的数据  countName = 》 数据总数的字段名称，默认：count
     * request   用于对分页请求的参数：pageName =》 页码的参数名称，默认：page
     *                               limitName =》 每页数据量的参数名，默认：limit
     * id        设定容器唯一ID，可以作为选中行的参数
     * page      分页
     * limits    每页条数的选择项，
     * limit     每页显示的条数
     * height    高度
     * even      隔行变色
     * loading   加载条
     * done      数据渲染完的回调
     * **/
    defaultOptions: {
        elem: '#table_list',
        response: {
            statusCode: 'SUCCESS',
            countName: 'objects.total',
            dataName: 'objects.list'
        },
        request: {
            pageName: 'pageNum',
            limitName: 'pageSize'
        },
        id: 'dataReload',
        page: true,
        limits: [15, 30, 50, 100],
        limit: 15,
        height: 'full-80', 
        even: true,
        loading: true,
        done: function (res, curr, count) { }
    },

    selectMap: {
        name: {
            0: 'code',
            1: 'name'
        }, 
        exact: {
            0: false,
            1: true
        }

    },

    beforeRender: function (options) {
        //render参数
        var settings = $.extend(true, {}, this.defaultOptions, options.tableOptions);
        if(this.isArray(options.tableOptions.limits)){
            settings.limits = options.tableOptions.limits;
        }
        
        if(settings.page === false){
            if(settings.height === 'full-80'){
                settings.height = 'full-20';
            }           
            delete settings.request;
            delete settings.limit;
            delete settings.limits;
        }
        this.renderOptions = settings;

        //搜索参数
        var seachOptions = options.seachOptions;
        if(seachOptions){
            if(!this.isArray(seachOptions.type)){
                seachOptions.type = this.selectMap.name;
            }
            this.seachOptions = seachOptions;
        } 
    },

    render: function (layuiTable) {
        this.table = layuiTable.render(this.renderOptions);
    },

    reload: function (options) {
        this.table.reload(options)
    },

    isEmptyObject: function(obj) {
        if(JSON.stringify(obj) === "{}"){
            return true;
        }
        return false;   
    },

     //搜索
    conditionalSearch: function (options) {
        if (options && options.rely) {
            var _param = {};

            if(typeof options.getParameter === "function"){
                options.getParameter(function(selectData){
                    _param = selectData;
                });
            }

            options.rely.on('submit(search)', function (data) {        

                $(".layui-table-tips").hide();  //可能有tips没有关闭

                $.each(options.condition, function (i, d) {
                    _param[d] = $.trim(data.field[d]);
                });

                if(typeof options.getParameter === "function"){
                    if(tmsCommonTable.isEmptyObject(_param)){
                        return;
                    }
                    tmsCommonTable.reload($.extend(true, this.renderOptions, {"where": _param}));
                }else{
                    var newParam = tmsCommonTable.combineParams(_param);
                    newParam && tmsCommonTable.reload(newParam);
                }               
            });
        }
    },

    //可选参数合并到默认参数
    combineParams: function (formData) {
        var newParam = this.makeWhereParam(formData);
        if(!newParam){
            return false;
        }

        return $.extend(true,  this.renderOptions, {"where": newParam});     
    },

    isArray: function (arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    },

    //整理搜索条件使其符合格式
    makeWhereParam: function (formData) {
        if(!formData){
            return;
        }
        
        // 处理 formData 的select 属性： exact type(code/name)
        var whereParam = {};
        
        if (formData.hasOwnProperty("exact")) {
            whereParam.exact = this.selectMap.exact[formData.exact];
        }
        if (formData.hasOwnProperty("type")) {
            //如果默认传入的where带有type类型的参数，则可能重复。 所以删除掉
            var renderWhere = this.renderOptions.where,
                key,
                type = this.seachOptions.type;
            for(key in type){
                if(renderWhere.hasOwnProperty(type[key])){
                    delete renderWhere[type[key]];
                }
            }

            whereParam[type[formData.type]] = formData.name;
            return whereParam;
        }else{
            return $.extend(formData, whereParam);
        }
        
    },

    /*
     * 搜索  options.seachOptions
     * 
     * condition        field值
     * getParameter     自己选择怎么组装 where
     * type             type的选项
    */
    init: function (options, layuiTable) {
        this.beforeRender(options);
        this.render(layuiTable);
        this.conditionalSearch(options.seachOptions);
    }

}