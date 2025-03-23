define("app/ui/history_back",["module","require","exports","core/component"],function(module, require, exports) {
function historyBack(){this.defaultAttrs({backSelector:".back"}),this.back=function(a){a.preventDefault(),window.history.back()},this.after("initialize",function(){this.on(this.select("backSelector"),"click",this.back)})}var defineComponent=require("core/component");module.exports=defineComponent(historyBack)
});
define("app/pages/directory/directory",["module","require","exports","app/boot/app","app/ui/history_back"],function(module, require, exports) {
var bootApp=require("app/boot/app"),HistoryBack=require("app/ui/history_back");module.exports=function(b){bootApp(b),HistoryBack.attachTo(".header")}
});