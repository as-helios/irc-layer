/*

Original qwebirc by Chris Porter

Forked for Atropa by alexander_as_helios

*/

//// custom logger
//let console_logger = console.log;
//const logger = (...args) => {
//	let output = sessionStorage.getItem('IRC_OUTPUT_CONSOLE');
//	let result = '';
//	if (output == '1') {
//		result = console_logger(...args);
//	}
//		return result;
//};
//console.log = logger;

// qwebirc stuff
var QWEBIRC_BUILD="atropa";
var qwebirc = {ui: {}, irc: {}, util: {}, connected: false};
qwebirc.BUILD = QWEBIRC_BUILD;
qwebirc.FILE_SUFFIX = "-" + QWEBIRC_BUILD;
qwebirc.VERSION = "0.92"
var ui = null;
var Native=function(l){l=l||{};var a=l.name;var j=l.legacy;var b=l.protect;var c=l.implement;var i=l.generics;var g=l.initialize;var h=l.afterImplement||function(){};var d=g||j;i=i!==false;d.constructor=Native;d.$family={name:"native"};if(j&&g){d.prototype=j.prototype;}d.prototype.constructor=d;if(a){var f=a.toLowerCase();d.prototype.$family={name:f};Native.typize(d,f);}var k=function(o,m,p,n){if(!b||n||!o.prototype[m]){o.prototype[m]=p;}if(i){Native.genericize(o,m,b);}h.call(o,m,p);return o;};d.alias=function(o,m,q){if(typeof o=="string"){var p=this.prototype[o];if((o=p)){return k(this,m,o,q);}}for(var n in o){this.alias(n,o[n],m);}return this;};d.implement=function(n,m,q){if(typeof n=="string"){return k(this,n,m,q);}for(var o in n){k(this,o,n[o],m);}return this;};if(c){d.implement(c);}return d;};Native.genericize=function(b,c,a){if((!a||!b[c])&&typeof b.prototype[c]=="function"){b[c]=function(){var d=Array.prototype.slice.call(arguments);return b.prototype[c].apply(d.shift(),d);};}};Native.implement=function(d,c){for(var b=0,a=d.length;b<a;b++){d[b].implement(c);}};Native.typize=function(a,b){if(!a.type){a.type=function(c){return($type(c)===b);};}};(function(){var a={Array:Array,Date:Date,Function:Function,Number:Number,RegExp:RegExp,String:String};for(var j in a){new Native({name:j,initialize:a[j],protect:true});}var d={"boolean":Boolean,"native":Native,object:Object};for(var c in d){Native.typize(d[c],c);}var h={Array:["concat","indexOf","join","lastIndexOf","pop","push","reverse","shift","slice","sort","splice","toString","unshift","valueOf"],String:["charAt","charCodeAt","concat","indexOf","lastIndexOf","match","replace","search","slice","split","substr","substring","toLowerCase","toUpperCase","valueOf"]};for(var f in h){for(var b=h[f].length;b--;){Native.genericize(a[f],h[f][b],true);}}})();var Hash=new Native({name:"Hash",initialize:function(a){if($type(a)=="hash"){a=$unlink(a.getClean());}for(var b in a){this[b]=a[b];}return this;}});Hash.implement({forEach:function(b,c){for(var a in this){if(this.hasOwnProperty(a)){b.call(c,this[a],a,this);}}},getClean:function(){var b={};for(var a in this){if(this.hasOwnProperty(a)){b[a]=this[a];}}return b;},getLength:function(){var b=0;for(var a in this){if(this.hasOwnProperty(a)){b++;}}return b;}});Hash.alias("forEach","each");Array.implement({forEach:function(c,d){for(var b=0,a=this.length;b<a;b++){c.call(d,this[b],b,this);}}});Array.alias("forEach","each");function $A(b){if(b.item){var a=b.length,c=new Array(a);while(a--){c[a]=b[a];}return c;}return Array.prototype.slice.call(b);}function $arguments(a){return function(){return arguments[a];};}function $chk(a){return !!(a||a===0);}function $clear(a){clearTimeout(a);clearInterval(a);return null;}function $defined(a){return(a!=undefined);}function $each(c,b,d){var a=$type(c);((a=="arguments"||a=="collection"||a=="array")?Array:Hash).each(c,b,d);}function $empty(){}function $extend(c,a){for(var b in (a||{})){c[b]=a[b];}return c;}function $H(a){return new Hash(a);}function $lambda(a){return($type(a)=="function")?a:function(){return a;};}function $merge(){var a=Array.slice(arguments);a.unshift({});return $mixin.apply(null,a);}function $mixin(f){for(var d=1,a=arguments.length;d<a;d++){var b=arguments[d];if($type(b)!="object"){continue;}for(var c in b){var h=b[c],g=f[c];f[c]=(g&&$type(h)=="object"&&$type(g)=="object")?$mixin(g,h):$unlink(h);}}return f;}function $pick(){for(var b=0,a=arguments.length;b<a;b++){if(arguments[b]!=undefined){return arguments[b];}}return null;}function $random(b,a){return Math.floor(Math.random()*(a-b+1)+b);}function $splat(b){var a=$type(b);return(a)?((a!="array"&&a!="arguments")?[b]:b):[];}var $time=Date.now||function(){return +new Date;};function $try(){for(var b=0,a=arguments.length;b<a;b++){try{return arguments[b]();}catch(c){}}return null;}function $type(a){if(a==undefined){return false;}if(a.$family){return(a.$family.name=="number"&&!isFinite(a))?false:a.$family.name;}if(a.nodeName){switch(a.nodeType){case 1:return"element";case 3:return(/\S/).test(a.nodeValue)?"textnode":"whitespace";}}else{if(typeof a.length=="number"){if(a.callee){return"arguments";}else{if(a.item){return"collection";}}}}return typeof a;}function $unlink(c){var b;switch($type(c)){case"object":b={};for(var f in c){b[f]=$unlink(c[f]);}break;case"hash":b=new Hash(c);break;case"array":b=[];for(var d=0,a=c.length;d<a;d++){b[d]=$unlink(c[d]);}break;default:return c;}return b;}Array.implement({every:function(c,d){for(var b=0,a=this.length;b<a;b++){if(!c.call(d,this[b],b,this)){return false;}}return true;},filter:function(d,f){var c=[];for(var b=0,a=this.length;b<a;b++){if(d.call(f,this[b],b,this)){c.push(this[b]);}}return c;},clean:function(){return this.filter($defined);},indexOf:function(c,d){var a=this.length;for(var b=(d<0)?Math.max(0,a+d):d||0;b<a;b++){if(this[b]===c){return b;}}return -1;},map:function(d,f){var c=[];for(var b=0,a=this.length;b<a;b++){c[b]=d.call(f,this[b],b,this);}return c;},some:function(c,d){for(var b=0,a=this.length;b<a;b++){if(c.call(d,this[b],b,this)){return true;}}return false;},associate:function(c){var d={},b=Math.min(this.length,c.length);for(var a=0;a<b;a++){d[c[a]]=this[a];}return d;},link:function(c){var a={};for(var f=0,b=this.length;f<b;f++){for(var d in c){if(c[d](this[f])){a[d]=this[f];delete c[d];break;}}}return a;},contains:function(a,b){return this.indexOf(a,b)!=-1;},extend:function(c){for(var b=0,a=c.length;b<a;b++){this.push(c[b]);}return this;},getLast:function(){return(this.length)?this[this.length-1]:null;},getRandom:function(){return(this.length)?this[$random(0,this.length-1)]:null;},include:function(a){if(!this.contains(a)){this.push(a);}return this;},combine:function(c){for(var b=0,a=c.length;b<a;b++){this.include(c[b]);}return this;},erase:function(b){for(var a=this.length;a--;a){if(this[a]===b){this.splice(a,1);}}return this;},empty:function(){this.length=0;return this;},flatten:function(){var d=[];for(var b=0,a=this.length;b<a;b++){var c=$type(this[b]);if(!c){continue;}d=d.concat((c=="array"||c=="collection"||c=="arguments")?Array.flatten(this[b]):this[b]);}return d;},hexToRgb:function(b){if(this.length!=3){return null;}var a=this.map(function(c){if(c.length==1){c+=c;}return c.toInt(16);});return(b)?a:"rgb("+a+")";},rgbToHex:function(d){if(this.length<3){return null;}if(this.length==4&&this[3]==0&&!d){return"transparent";}var b=[];for(var a=0;a<3;a++){var c=(this[a]-0).toString(16);b.push((c.length==1)?"0"+c:c);}return(d)?b:"#"+b.join("");}});String.implement({test:function(a,b){return((typeof a=="string")?new RegExp(a,b):a).test(this);},contains:function(a,b){return(b)?(b+this+b).indexOf(b+a+b)>-1:this.indexOf(a)>-1;},trim:function(){return this.replace(/^\s+|\s+$/g,"");},clean:function(){return this.replace(/\s+/g," ").trim();},camelCase:function(){return this.replace(/-\D/g,function(a){return a.charAt(1).toUpperCase();});},hyphenate:function(){return this.replace(/[A-Z]/g,function(a){return("-"+a.charAt(0).toLowerCase());});},capitalize:function(){return this.replace(/\b[a-z]/g,function(a){return a.toUpperCase();});},escapeRegExp:function(){return this.replace(/([-.*+?^${}()|[\]\/\\])/g,"\\$1");},toInt:function(a){return parseInt(this,a||10);},toFloat:function(){return parseFloat(this);},hexToRgb:function(b){var a=this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);return(a)?a.slice(1).hexToRgb(b):null;},rgbToHex:function(b){var a=this.match(/\d{1,3}/g);return(a)?a.rgbToHex(b):null;},stripScripts:function(b){var a="";var c=this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi,function(){a+=arguments[1]+"\n";return"";});if(b===true){$exec(a);}else{if($type(b)=="function"){b(a,c);}}return c;},substitute:function(a,b){return this.replace(b||(/\\?\{([^{}]+)\}/g),function(d,c){if(d.charAt(0)=="\\"){return d.slice(1);}return(a[c]!=undefined)?a[c]:"";});}});try{delete Function.prototype.bind;}catch(e){}Function.implement({extend:function(a){for(var b in a){this[b]=a[b];}return this;},create:function(b){var a=this;b=b||{};return function(d){var c=b.arguments;c=(c!=undefined)?$splat(c):Array.slice(arguments,(b.event)?1:0);if(b.event){c=[d||window.event].extend(c);}var f=function(){return a.apply(b.bind||null,c);};if(b.delay){return setTimeout(f,b.delay);}if(b.periodical){return setInterval(f,b.periodical);}if(b.attempt){return $try(f);}return f();};},run:function(a,b){return this.apply(b,$splat(a));},pass:function(a,b){return this.create({bind:b,arguments:a});},bind:function(b,a){return this.create({bind:b,arguments:a});},bindWithEvent:function(b,a){return this.create({bind:b,arguments:a,event:true});},attempt:function(a,b){return this.create({bind:b,arguments:a,attempt:true})();},delay:function(b,c,a){return this.create({bind:c,arguments:a,delay:b})();},periodical:function(c,b,a){return this.create({bind:b,arguments:a,periodical:c})();}});Number.implement({limit:function(b,a){return Math.min(a,Math.max(b,this));},round:function(a){a=Math.pow(10,a||0);return Math.round(this*a)/a;},times:function(b,c){for(var a=0;a<this;a++){b.call(c,a,this);}},toFloat:function(){return parseFloat(this);},toInt:function(a){return parseInt(this,a||10);}});Number.alias("times","each");(function(b){var a={};b.each(function(c){if(!Number[c]){a[c]=function(){return Math[c].apply(null,[this].concat($A(arguments)));};}});Number.implement(a);})(["abs","acos","asin","atan","atan2","ceil","cos","exp","floor","log","max","min","pow","sin","sqrt","tan"]);Hash.implement({has:Object.prototype.hasOwnProperty,keyOf:function(b){for(var a in this){if(this.hasOwnProperty(a)&&this[a]===b){return a;}}return null;},hasValue:function(a){return(Hash.keyOf(this,a)!==null);},extend:function(a){Hash.each(a||{},function(c,b){Hash.set(this,b,c);},this);return this;},combine:function(a){Hash.each(a||{},function(c,b){Hash.include(this,b,c);},this);return this;},erase:function(a){if(this.hasOwnProperty(a)){delete this[a];}return this;},get:function(a){return(this.hasOwnProperty(a))?this[a]:null;},set:function(a,b){if(!this[a]||this.hasOwnProperty(a)){this[a]=b;}return this;},empty:function(){Hash.each(this,function(b,a){delete this[a];},this);return this;},include:function(a,b){if(this[a]==undefined){this[a]=b;}return this;},map:function(b,c){var a=new Hash;Hash.each(this,function(f,d){a.set(d,b.call(c,f,d,this));},this);return a;},filter:function(b,c){var a=new Hash;Hash.each(this,function(f,d){if(b.call(c,f,d,this)){a.set(d,f);}},this);return a;},every:function(b,c){for(var a in this){if(this.hasOwnProperty(a)&&!b.call(c,this[a],a)){return false;}}return true;},some:function(b,c){for(var a in this){if(this.hasOwnProperty(a)&&b.call(c,this[a],a)){return true;}}return false;},getKeys:function(){var a=[];Hash.each(this,function(c,b){a.push(b);});return a;},getValues:function(){var a=[];Hash.each(this,function(b){a.push(b);});return a;},toQueryString:function(a){var b=[];Hash.each(this,function(g,f){if(a){f=a+"["+f+"]";}var d;switch($type(g)){case"object":d=Hash.toQueryString(g,f);break;case"array":var c={};g.each(function(j,h){c[h]=j;});d=Hash.toQueryString(c,f);break;default:d=f+"="+encodeURIComponent(g);}if(g!=undefined){b.push(d);}});return b.join("&");}});Hash.alias({keyOf:"indexOf",hasValue:"contains"});function Class(b){if(b instanceof Function){b={initialize:b};}var a=function(){Object.reset(this);if(a._prototyping){return this;}this._current=$empty;var c=(this.initialize)?this.initialize.apply(this,arguments):this;delete this._current;delete this.caller;return c;}.extend(this);a.implement(b);a.constructor=Class;a.prototype.constructor=a;return a;}Function.prototype.protect=function(){this._protected=true;return this;};Object.reset=function(a,c){if(c==null){for(var f in a){Object.reset(a,f);}return a;}delete a[c];switch($type(a[c])){case"object":var d=function(){};d.prototype=a[c];var b=new d;a[c]=Object.reset(b);break;case"array":a[c]=$unlink(a[c]);break;}return a;};new Native({name:"Class",initialize:Class}).extend({instantiate:function(b){b._prototyping=true;var a=new b;delete b._prototyping;return a;},wrap:function(a,b,c){if(c._origin){c=c._origin;}return function(){if(c._protected&&this._current==null){throw new Error('The method "'+b+'" cannot be called.');}var f=this.caller,g=this._current;this.caller=g;this._current=arguments.callee;var d=c.apply(this,arguments);this._current=g;this.caller=f;return d;}.extend({_owner:a,_origin:c,_name:b});}});Class.implement({implement:function(a,d){if($type(a)=="object"){for(var f in a){this.implement(f,a[f]);}return this;}var g=Class.Mutators[a];if(g){d=g.call(this,d);if(d==null){return this;}}var c=this.prototype;switch($type(d)){case"function":if(d._hidden){return this;}c[a]=Class.wrap(this,a,d);break;case"object":var b=c[a];if($type(b)=="object"){$mixin(b,d);}else{c[a]=$unlink(d);}break;case"array":c[a]=$unlink(d);break;default:c[a]=d;}return this;}});Class.Mutators={Extends:function(a){this.parent=a;this.prototype=Class.instantiate(a);this.implement("parent",function(){var b=this.caller._name,c=this.caller._owner.parent.prototype[b];if(!c){throw new Error('The method "'+b+'" has no parent.');}return c.apply(this,arguments);}.protect());},Implements:function(a){$splat(a).each(function(b){if(b instanceof Function){b=Class.instantiate(b);}this.implement(b);},this);}};var Chain=new Class({$chain:[],chain:function(){this.$chain.extend(Array.flatten(arguments));return this;},callChain:function(){return(this.$chain.length)?this.$chain.shift().apply(this,arguments):false;},clearChain:function(){this.$chain.empty();return this;}});var Events=new Class({$events:{},addEvent:function(c,b,a){c=Events.removeOn(c);if(b!=$empty){this.$events[c]=this.$events[c]||[];this.$events[c].include(b);if(a){b.internal=true;}}return this;},addEvents:function(a){for(var b in a){this.addEvent(b,a[b]);}return this;},fireEvent:function(c,b,a){c=Events.removeOn(c);if(!this.$events||!this.$events[c]){return this;}this.$events[c].each(function(d){d.create({bind:this,delay:a,"arguments":b})();},this);return this;},removeEvent:function(b,a){b=Events.removeOn(b);if(!this.$events[b]){return this;}if(!a.internal){this.$events[b].erase(a);}return this;},removeEvents:function(c){var d;if($type(c)=="object"){for(d in c){this.removeEvent(d,c[d]);}return this;}if(c){c=Events.removeOn(c);}for(d in this.$events){if(c&&c!=d){continue;}var b=this.$events[d];for(var a=b.length;a--;a){this.removeEvent(d,b[a]);}}return this;}});Events.removeOn=function(a){return a.replace(/^on([A-Z])/,function(b,c){return c.toLowerCase();});};var Options=new Class({setOptions:function(){this.options=$merge.run([this.options].extend(arguments));if(!this.addEvent){return this;}for(var a in this.options){if($type(this.options[a])!="function"||!(/^on[A-Z]/).test(a)){continue;}this.addEvent(a,this.options[a]);delete this.options[a];}return this;}});var Browser=$merge({Engine:{name:"unknown",version:0},Platform:{name:(window.orientation!=undefined)?"ipod":(navigator.platform.match(/mac|win|linux/i)||["other"])[0].toLowerCase()},Features:{xpath:!!(document.evaluate),air:!!(window.runtime),query:!!(document.querySelector)},Plugins:{},Engines:{presto:function(){return(!window.opera)?false:((arguments.callee.caller)?960:((document.getElementsByClassName)?950:925));},trident:function(){return(!window.ActiveXObject)?false:((window.XMLHttpRequest)?((document.querySelectorAll)?6:5):4);},webkit:function(){return(navigator.taintEnabled)?false:((Browser.Features.xpath)?((Browser.Features.query)?525:420):419);},gecko:function(){return(!document.getBoxObjectFor&&window.mozInnerScreenX==null)?false:((document.getElementsByClassName)?19:18);}}},Browser||{});Browser.Platform[Browser.Platform.name]=true;Browser.detect=function(){for(var b in this.Engines){var a=this.Engines[b]();if(a){this.Engine={name:b,version:a};this.Engine[b]=this.Engine[b+a]=true;break;}}return{name:b,version:a};};Browser.detect();Browser.Request=function(){return $try(function(){return new XMLHttpRequest();},function(){return new ActiveXObject("MSXML2.XMLHTTP");},function(){return new ActiveXObject("Microsoft.XMLHTTP");});};Browser.Features.xhr=!!(Browser.Request());Browser.Plugins.Flash=(function(){var a=($try(function(){return navigator.plugins["Shockwave Flash"].description;},function(){return new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version");})||"0 r0").match(/\d+/g);return{version:parseInt(a[0]||0+"."+a[1],10)||0,build:parseInt(a[2],10)||0};})();function $exec(b){if(!b){return b;}if(window.execScript){window.execScript(b);}else{var a=document.createElement("script");a.setAttribute("type","text/javascript");a[(Browser.Engine.webkit&&Browser.Engine.version<420)?"innerText":"text"]=b;document.head.appendChild(a);document.head.removeChild(a);}return b;}Native.UID=1;var $uid=(Browser.Engine.trident)?function(a){return(a.uid||(a.uid=[Native.UID++]))[0];}:function(a){return a.uid||(a.uid=Native.UID++);};var Window=new Native({name:"Window",legacy:(Browser.Engine.trident)?null:window.Window,initialize:function(a){$uid(a);if(!a.Element){a.Element=$empty;if(Browser.Engine.webkit){a.document.createElement("iframe");}a.Element.prototype=(Browser.Engine.webkit)?window["[[DOMElement.prototype]]"]:{};}a.document.window=a;return $extend(a,Window.Prototype);},afterImplement:function(b,a){window[b]=Window.Prototype[b]=a;}});Window.Prototype={$family:{name:"window"}};new Window(window);var Document=new Native({name:"Document",legacy:(Browser.Engine.trident)?null:window.Document,initialize:function(a){$uid(a);a.head=a.getElementsByTagName("head")[0];a.html=a.getElementsByTagName("html")[0];if(Browser.Engine.trident&&Browser.Engine.version<=4){$try(function(){a.execCommand("BackgroundImageCache",false,true);});}if(Browser.Engine.trident){a.window.attachEvent("onunload",function(){a.window.detachEvent("onunload",arguments.callee);a.head=a.html=a.window=null;});}return $extend(a,Document.Prototype);},afterImplement:function(b,a){document[b]=Document.Prototype[b]=a;}});Document.Prototype={$family:{name:"document"}};new Document(document);var Element=new Native({name:"Element",legacy:window.Element,initialize:function(a,b){var c=Element.Constructors.get(a);if(c){return c(b);}if(typeof a=="string"){return document.newElement(a,b);}return document.id(a).set(b);},afterImplement:function(a,b){Element.Prototype[a]=b;if(Array[a]){return;}Elements.implement(a,function(){var c=[],h=true;for(var f=0,d=this.length;f<d;f++){var g=this[f][a].apply(this[f],arguments);c.push(g);if(h){h=($type(g)=="element");}}return(h)?new Elements(c):c;});}});Element.Prototype={$family:{name:"element"}};Element.Constructors=new Hash;var IFrame=new Native({name:"IFrame",generics:false,initialize:function(){var g=Array.link(arguments,{properties:Object.type,iframe:$defined});var d=g.properties||{};var c=document.id(g.iframe);var f=d.onload||$empty;delete d.onload;d.id=d.name=$pick(d.id,d.name,c?(c.id||c.name):"IFrame_"+$time());c=new Element(c||"iframe",d);var b=function(){var h=$try(function(){return c.contentWindow.location.host;});if(!h||h==window.location.host){var i=new Window(c.contentWindow);new Document(c.contentWindow.document);$extend(i.Element.prototype,Element.Prototype);}f.call(c.contentWindow,c.contentWindow.document);};var a=$try(function(){return c.contentWindow;});((a&&a.document.body)||window.frames[d.id])?b():c.addListener("load",b);return c;}});var Elements=new Native({initialize:function(g,b){b=$extend({ddup:true,cash:true},b);g=g||[];if(b.ddup||b.cash){var h={},f=[];for(var c=0,a=g.length;c<a;c++){var d=document.id(g[c],!b.cash);if(b.ddup){if(h[d.uid]){continue;}h[d.uid]=true;}if(d){f.push(d);}}g=f;}return(b.cash)?$extend(g,this):g;}});Elements.implement({filter:function(a,b){if(!a){return this;}return new Elements(Array.filter(this,(typeof a=="string")?function(c){return c.match(a);}:a,b));}});(function(){var d;try{var a=document.createElement("<input name=x>");d=(a.name=="x");}catch(b){}var c=function(f){return(""+f).replace(/&/g,"&amp;").replace(/"/g,"&quot;");};Document.implement({newElement:function(f,g){if(g&&g.checked!=null){g.defaultChecked=g.checked;}if(d&&g){f="<"+f;if(g.name){f+=' name="'+c(g.name)+'"';}if(g.type){f+=' type="'+c(g.type)+'"';}f+=">";delete g.name;delete g.type;}return this.id(this.createElement(f)).set(g);},newTextNode:function(f){return this.createTextNode(f);},getDocument:function(){return this;},getWindow:function(){return this.window;},id:(function(){var f={string:function(i,h,g){i=g.getElementById(i);return(i)?f.element(i,h):null;},element:function(g,j){$uid(g);if(!j&&!g.$family&&!(/^object|embed$/i).test(g.tagName)){var h=Element.Prototype;for(var i in h){g[i]=h[i];}}return g;},object:function(h,i,g){if(h.toElement){return f.element(h.toElement(g),i);}return null;}};f.textnode=f.whitespace=f.window=f.document=$arguments(0);return function(h,j,i){if(h&&h.$family&&h.uid){return h;}var g=$type(h);return(f[g])?f[g](h,j,i||document):null;};})()});})();if(window.$==null){Window.implement({$:function(a,b){return document.id(a,b,this.document);}});}Window.implement({$$:function(a){if(arguments.length==1&&typeof a=="string"){return this.document.getElements(a);}var g=[];var c=Array.flatten(arguments);for(var d=0,b=c.length;d<b;d++){var f=c[d];switch($type(f)){case"element":g.push(f);break;case"string":g.extend(this.document.getElements(f,true));}}return new Elements(g);},getDocument:function(){return this.document;},getWindow:function(){return this;}});Native.implement([Element,Document],{getElement:function(a,b){return document.id(this.getElements(a,true)[0]||null,b);},getElements:function(a,d){a=a.split(",");var c=[];var b=(a.length>1);a.each(function(f){var g=this.getElementsByTagName(f.trim());(b)?c.extend(g):c=g;},this);return new Elements(c,{ddup:b,cash:!d});}});(function(){var i={},g={};var j={input:"checked",option:"selected",textarea:(Browser.Engine.webkit&&Browser.Engine.version<420)?"innerHTML":"value"};var c=function(m){return(g[m]||(g[m]={}));};var h=function(o,m){if(!o){return;}var n=o.uid;if(m!==true){m=false;}if(Browser.Engine.trident){if(o.clearAttributes){var r=m&&o.cloneNode(false);o.clearAttributes();if(r){o.mergeAttributes(r);}}else{if(o.removeEvents){o.removeEvents();}}if((/object/i).test(o.tagName)){for(var q in o){if(typeof o[q]=="function"){o[q]=$empty;}}Element.dispose(o);}}if(!n){return;}i[n]=g[n]=null;};var d=function(){Hash.each(i,h);if(Browser.Engine.trident){$A(document.getElementsByTagName("object")).each(h);}if(window.CollectGarbage){CollectGarbage();}i=g=null;};var k=function(o,m,t,n,q,s){var p=o[t||m];var r=[];while(p){if(p.nodeType==1&&(!n||Element.match(p,n))){if(!q){return document.id(p,s);}r.push(p);}p=p[m];}return(q)?new Elements(r,{ddup:false,cash:!s}):null;};var f={html:"innerHTML","class":"className","for":"htmlFor",defaultValue:"defaultValue",text:(Browser.Engine.trident||(Browser.Engine.webkit&&Browser.Engine.version<420))?"innerText":"textContent"};var b=["compact","nowrap","ismap","declare","noshade","checked","disabled","readonly","multiple","selected","noresize","defer"];var l=["value","type","defaultValue","accessKey","cellPadding","cellSpacing","colSpan","frameBorder","maxLength","readOnly","rowSpan","tabIndex","useMap"];b=b.associate(b);Hash.extend(f,b);Hash.extend(f,l.associate(l.map(String.toLowerCase)));var a={before:function(n,m){if(m.parentNode){m.parentNode.insertBefore(n,m);}},after:function(n,m){if(!m.parentNode){return;}var o=m.nextSibling;(o)?m.parentNode.insertBefore(n,o):m.parentNode.appendChild(n);},bottom:function(n,m){m.appendChild(n);},top:function(n,m){var o=m.firstChild;(o)?m.insertBefore(n,o):m.appendChild(n);}};a.inside=a.bottom;Hash.each(a,function(m,n){n=n.capitalize();Element.implement("inject"+n,function(o){m(this,document.id(o,true));return this;});Element.implement("grab"+n,function(o){m(document.id(o,true),this);return this;});});Element.implement({set:function(q,n){switch($type(q)){case"object":for(var o in q){this.set(o,q[o]);}break;case"string":var m=Element.Properties.get(q);(m&&m.set)?m.set.apply(this,Array.slice(arguments,1)):this.setProperty(q,n);}return this;},get:function(n){var m=Element.Properties.get(n);return(m&&m.get)?m.get.apply(this,Array.slice(arguments,1)):this.getProperty(n);},erase:function(n){var m=Element.Properties.get(n);(m&&m.erase)?m.erase.apply(this):this.removeProperty(n);return this;},setProperty:function(n,o){var m=f[n];if(o==undefined){return this.removeProperty(n);}if(m&&b[n]){o=!!o;}(m)?this[m]=o:this.setAttribute(n,""+o);return this;},setProperties:function(m){for(var n in m){this.setProperty(n,m[n]);}return this;},getProperty:function(n){var m=f[n];var o=(m)?this[m]:this.getAttribute(n,2);return(b[n])?!!o:(m)?o:o||null;},getProperties:function(){var m=$A(arguments);return m.map(this.getProperty,this).associate(m);},removeProperty:function(n){var m=f[n];(m)?this[m]=(m&&b[n])?false:"":this.removeAttribute(n);return this;},removeProperties:function(){Array.each(arguments,this.removeProperty,this);return this;},hasClass:function(m){return this.className.contains(m," ");},addClass:function(m){if(!this.hasClass(m)){this.className=(this.className+" "+m).clean();}return this;},removeClass:function(m){this.className=this.className.replace(new RegExp("(^|\\s)"+m+"(?:\\s|$)"),"$1");return this;},toggleClass:function(m){return this.hasClass(m)?this.removeClass(m):this.addClass(m);},adopt:function(){Array.flatten(arguments).each(function(m){m=document.id(m,true);if(m){this.appendChild(m);}},this);return this;},appendText:function(n,m){return this.grab(this.getDocument().newTextNode(n),m);},grab:function(n,m){a[m||"bottom"](document.id(n,true),this);return this;},inject:function(n,m){a[m||"bottom"](this,document.id(n,true));return this;},replaces:function(m){m=document.id(m,true);m.parentNode.replaceChild(this,m);return this;},wraps:function(n,m){n=document.id(n,true);return this.replaces(n).grab(n,m);},getPrevious:function(m,n){return k(this,"previousSibling",null,m,false,n);},getAllPrevious:function(m,n){return k(this,"previousSibling",null,m,true,n);},getNext:function(m,n){return k(this,"nextSibling",null,m,false,n);},getAllNext:function(m,n){return k(this,"nextSibling",null,m,true,n);},getFirst:function(m,n){return k(this,"nextSibling","firstChild",m,false,n);},getLast:function(m,n){return k(this,"previousSibling","lastChild",m,false,n);},getParent:function(m,n){return k(this,"parentNode",null,m,false,n);},getParents:function(m,n){return k(this,"parentNode",null,m,true,n);},getSiblings:function(m,n){return this.getParent().getChildren(m,n).erase(this);},getChildren:function(m,n){return k(this,"nextSibling","firstChild",m,true,n);},getWindow:function(){return this.ownerDocument.window;},getDocument:function(){return this.ownerDocument;},getElementById:function(p,o){var n=this.ownerDocument.getElementById(p);if(!n){return null;}for(var m=n.parentNode;m!=this;m=m.parentNode){if(!m){return null;}}return document.id(n,o);},getSelected:function(){return new Elements($A(this.options).filter(function(m){return m.selected;}));},getComputedStyle:function(n){if(this.currentStyle){return this.currentStyle[n.camelCase()];}var m=this.getDocument().defaultView.getComputedStyle(this,null);return(m)?m.getPropertyValue([n.hyphenate()]):null;},toQueryString:function(){var m=[];this.getElements("input, select, textarea",true).each(function(n){if(!n.name||n.disabled||n.type=="submit"||n.type=="reset"||n.type=="file"){return;}var o=(n.tagName.toLowerCase()=="select")?Element.getSelected(n).map(function(p){return p.value;}):((n.type=="radio"||n.type=="checkbox")&&!n.checked)?null:n.value;$splat(o).each(function(p){if(typeof p!="undefined"){m.push(n.name+"="+encodeURIComponent(p));}});});return m.join("&");},clone:function(p,m){p=p!==false;var s=this.cloneNode(p);var o=function(w,v){if(!m){w.removeAttribute("id");}if(Browser.Engine.trident){w.clearAttributes();w.mergeAttributes(v);w.removeAttribute("uid");if(w.options){var x=w.options,t=v.options;for(var u=x.length;u--;){x[u].selected=t[u].selected;}}}var y=j[v.tagName.toLowerCase()];if(y&&v[y]){w[y]=v[y];}};if(p){var q=s.getElementsByTagName("*"),r=this.getElementsByTagName("*");for(var n=q.length;n--;){o(q[n],r[n]);}}o(s,this);return document.id(s);},destroy:function(){Element.empty(this);Element.dispose(this);h(this,true);return null;},empty:function(){$A(this.childNodes).each(function(m){Element.destroy(m);});return this;},dispose:function(){return(this.parentNode)?this.parentNode.removeChild(this):this;},hasChild:function(m){m=document.id(m,true);if(!m){return false;}if(Browser.Engine.webkit&&Browser.Engine.version<420){return $A(this.getElementsByTagName(m.tagName)).contains(m);}return(this.contains)?(this!=m&&this.contains(m)):!!(this.compareDocumentPosition(m)&16);},match:function(m){return(!m||(m==this)||(Element.get(this,"tag")==m));}});Native.implement([Element,Window,Document],{addListener:function(p,o){if(p=="unload"){var m=o,n=this;o=function(){n.removeListener("unload",o);m();};}else{i[this.uid]=this;}if(this.addEventListener){this.addEventListener(p,o,false);}else{this.attachEvent("on"+p,o);}return this;},removeListener:function(n,m){if(this.removeEventListener){this.removeEventListener(n,m,false);}else{this.detachEvent("on"+n,m);}return this;},retrieve:function(n,m){var p=c(this.uid),o=p[n];if(m!=undefined&&o==undefined){o=p[n]=m;}return $pick(o);},store:function(n,m){var o=c(this.uid);o[n]=m;return this;},eliminate:function(m){var n=c(this.uid);delete n[m];return this;}});window.addListener("unload",d);})();Element.Properties=new Hash;Element.Properties.style={set:function(a){this.style.cssText=a;},get:function(){return this.style.cssText;},erase:function(){this.style.cssText="";}};Element.Properties.tag={get:function(){return this.tagName.toLowerCase();}};Element.Properties.html=(function(){var c=document.createElement("div");var a={table:[1,"<table>","</table>"],select:[1,"<select>","</select>"],tbody:[2,"<table><tbody>","</tbody></table>"],tr:[3,"<table><tbody><tr>","</tr></tbody></table>"]};a.thead=a.tfoot=a.tbody;var b={set:function(){var f=Array.flatten(arguments).join("");var g=Browser.Engine.trident&&a[this.get("tag")];if(g){var h=c;h.innerHTML=g[1]+f+g[2];for(var d=g[0];d--;){h=h.firstChild;}this.empty().adopt(h.childNodes);}else{this.innerHTML=f;}}};b.erase=b.set;return b;})();if(Browser.Engine.webkit&&Browser.Engine.version<420){Element.Properties.text={get:function(){if(this.innerText){return this.innerText;}var a=this.ownerDocument.newElement("div",{html:this.innerHTML}).inject(this.ownerDocument.body);var b=a.innerText;a.destroy();return b;}};}(function(){Element.implement({scrollTo:function(i,j){if(b(this)){this.getWindow().scrollTo(i,j);}else{this.scrollLeft=i;this.scrollTop=j;}return this;},getSize:function(){if(b(this)){return this.getWindow().getSize();}return{x:this.offsetWidth,y:this.offsetHeight};},getScrollSize:function(){if(b(this)){return this.getWindow().getScrollSize();}return{x:this.scrollWidth,y:this.scrollHeight};},getScroll:function(){if(b(this)){return this.getWindow().getScroll();}return{x:this.scrollLeft,y:this.scrollTop};},getScrolls:function(){var j=this,i={x:0,y:0};while(j&&!b(j)){i.x+=j.scrollLeft;i.y+=j.scrollTop;j=j.parentNode;}return i;},getOffsetParent:function(){var i=this;if(b(i)){return null;}if(!Browser.Engine.trident){return i.offsetParent;}while((i=i.parentNode)&&!b(i)){if(d(i,"position")!="static"){return i;}}return null;},getOffsets:function(){if(this.getBoundingClientRect){var k=this.getBoundingClientRect(),n=document.id(this.getDocument().documentElement),q=n.getScroll(),l=this.getScrolls(),j=this.getScroll(),i=(d(this,"position")=="fixed");return{x:k.left.toInt()+l.x-j.x+((i)?0:q.x)-n.clientLeft,y:k.top.toInt()+l.y-j.y+((i)?0:q.y)-n.clientTop};}var m=this,o={x:0,y:0};if(b(this)){return o;}while(m&&!b(m)){o.x+=m.offsetLeft;o.y+=m.offsetTop;if(Browser.Engine.gecko){if(!g(m)){o.x+=c(m);o.y+=h(m);}var p=m.parentNode;if(p&&d(p,"overflow")!="visible"){o.x+=c(p);o.y+=h(p);}}else{if(m!=this&&Browser.Engine.webkit){o.x+=c(m);o.y+=h(m);}}m=m.offsetParent;}if(Browser.Engine.gecko&&!g(this)){o.x-=c(this);o.y-=h(this);}return o;},getPosition:function(l){if(b(this)){return{x:0,y:0};}var m=this.getOffsets(),j=this.getScrolls();var i={x:m.x-j.x,y:m.y-j.y};var k=(l&&(l=document.id(l)))?l.getPosition():{x:0,y:0};return{x:i.x-k.x,y:i.y-k.y};},getCoordinates:function(k){if(b(this)){return this.getWindow().getCoordinates();}var i=this.getPosition(k),j=this.getSize();var l={left:i.x,top:i.y,width:j.x,height:j.y};l.right=l.left+l.width;l.bottom=l.top+l.height;return l;},computePosition:function(i){return{left:i.x-f(this,"margin-left"),top:i.y-f(this,"margin-top")};},setPosition:function(i){return this.setStyles(this.computePosition(i));}});Native.implement([Document,Window],{getSize:function(){if(Browser.Engine.presto||Browser.Engine.webkit){var j=this.getWindow();return{x:j.innerWidth,y:j.innerHeight};}var i=a(this);return{x:i.clientWidth,y:i.clientHeight};},getScroll:function(){var j=this.getWindow(),i=a(this);return{x:j.pageXOffset||i.scrollLeft,y:j.pageYOffset||i.scrollTop};},getScrollSize:function(){var j=a(this),i=this.getSize();return{x:Math.max(j.scrollWidth,i.x),y:Math.max(j.scrollHeight,i.y)};},getPosition:function(){return{x:0,y:0};},getCoordinates:function(){var i=this.getSize();return{top:0,left:0,bottom:i.y,right:i.x,height:i.y,width:i.x};}});var d=Element.getComputedStyle;function f(i,j){return d(i,j).toInt()||0;}function g(i){return d(i,"-moz-box-sizing")=="border-box";}function h(i){return f(i,"border-top-width");}function c(i){return f(i,"border-left-width");}function b(i){return(/^(?:body|html)$/i).test(i.tagName);}function a(i){var j=i.getDocument();return(!j.compatMode||j.compatMode=="CSS1Compat")?j.html:j.body;}})();Element.alias("setPosition","position");Native.implement([Window,Document,Element],{getHeight:function(){return this.getSize().y;},getWidth:function(){return this.getSize().x;},getScrollTop:function(){return this.getScroll().y;},getScrollLeft:function(){return this.getScroll().x;},getScrollHeight:function(){return this.getScrollSize().y;},getScrollWidth:function(){return this.getScrollSize().x;},getTop:function(){return this.getPosition().y;},getLeft:function(){return this.getPosition().x;}});var Event=new Native({name:"Event",initialize:function(a,g){g=g||window;var l=g.document;a=a||g.event;if(a.$extended){return a;}this.$extended=true;var k=a.type;var h=a.target||a.srcElement;while(h&&h.nodeType==3){h=h.parentNode;}if(k.test(/key/)){var b=a.which||a.keyCode;var n=Event.Keys.keyOf(b);if(k=="keydown"){var d=b-111;if(d>0&&d<13){n="f"+d;}}n=n||String.fromCharCode(b).toLowerCase();}else{if(k.match(/(click|mouse|menu)/i)){l=(!l.compatMode||l.compatMode=="CSS1Compat")?l.html:l.body;var j={x:a.pageX||a.clientX+l.scrollLeft,y:a.pageY||a.clientY+l.scrollTop};var c={x:(a.pageX)?a.pageX-g.pageXOffset:a.clientX,y:(a.pageY)?a.pageY-g.pageYOffset:a.clientY};if(k.match(/DOMMouseScroll|mousewheel/)){var i=(a.wheelDelta)?a.wheelDelta/120:-(a.detail||0)/3;}var f=(a.which==3)||(a.button==2);var m=null;if(k.match(/over|out/)){switch(k){case"mouseover":m=a.relatedTarget||a.fromElement;break;case"mouseout":m=a.relatedTarget||a.toElement;}if(!(function(){while(m&&m.nodeType==3){m=m.parentNode;}return true;}).create({attempt:Browser.Engine.gecko})()){m=false;}}}}return $extend(this,{event:a,type:k,page:j,client:c,rightClick:f,wheel:i,relatedTarget:m,target:h,code:b,key:n,shift:a.shiftKey,control:a.ctrlKey,alt:a.altKey,meta:a.metaKey});}});Event.Keys=new Hash({enter:13,up:38,down:40,left:37,right:39,esc:27,space:32,backspace:8,tab:9,"delete":46});Event.implement({stop:function(){return this.stopPropagation().preventDefault();},stopPropagation:function(){if(this.event.stopPropagation){this.event.stopPropagation();}else{this.event.cancelBubble=true;}return this;},preventDefault:function(){if(this.event.preventDefault){this.event.preventDefault();}else{this.event.returnValue=false;}return this;}});Element.Properties.events={set:function(a){this.addEvents(a);}};Native.implement([Element,Window,Document],{addEvent:function(f,h){var i=this.retrieve("events",{});i[f]=i[f]||{keys:[],values:[]};if(i[f].keys.contains(h)){return this;}i[f].keys.push(h);var g=f,a=Element.Events.get(f),c=h,j=this;if(a){if(a.onAdd){a.onAdd.call(this,h);}if(a.condition){c=function(k){if(a.condition.call(this,k)){return h.call(this,k);}return true;};}g=a.base||g;}var d=function(){return h.call(j);};var b=Element.NativeEvents[g];if(b){if(b==2){d=function(k){k=new Event(k,j.getWindow());if(c.call(j,k)===false){k.stop();}};}this.addListener(g,d);}i[f].values.push(d);return this;},removeEvent:function(c,b){var a=this.retrieve("events");if(!a||!a[c]){return this;}var g=a[c].keys.indexOf(b);if(g==-1){return this;}a[c].keys.splice(g,1);var f=a[c].values.splice(g,1)[0];var d=Element.Events.get(c);if(d){if(d.onRemove){d.onRemove.call(this,b);}c=d.base||c;}return(Element.NativeEvents[c])?this.removeListener(c,f):this;},addEvents:function(a){for(var b in a){this.addEvent(b,a[b]);}return this;},removeEvents:function(a){var c;if($type(a)=="object"){for(c in a){this.removeEvent(c,a[c]);}return this;}var b=this.retrieve("events");if(!b){return this;}if(!a){for(c in b){this.removeEvents(c);}this.eliminate("events");}else{if(b[a]){while(b[a].keys[0]){this.removeEvent(a,b[a].keys[0]);}b[a]=null;}}return this;},fireEvent:function(d,b,a){var c=this.retrieve("events");if(!c||!c[d]){return this;}c[d].keys.each(function(f){f.create({bind:this,delay:a,"arguments":b})();},this);return this;},cloneEvents:function(d,a){d=document.id(d);var c=d.retrieve("events");if(!c){return this;}if(!a){for(var b in c){this.cloneEvents(d,b);}}else{if(c[a]){c[a].keys.each(function(f){this.addEvent(a,f);},this);}}return this;}});try{if(typeof HTMLElement!="undefined"){HTMLElement.prototype.fireEvent=Element.prototype.fireEvent;}}catch(e){}Element.NativeEvents={click:2,dblclick:2,mouseup:2,mousedown:2,contextmenu:2,mousewheel:2,DOMMouseScroll:2,mouseover:2,mouseout:2,mousemove:2,selectstart:2,selectend:2,keydown:2,keypress:2,keyup:2,focus:2,blur:2,change:2,reset:2,select:2,submit:2,load:1,unload:1,beforeunload:2,resize:1,move:1,DOMContentLoaded:1,readystatechange:1,error:1,abort:1,scroll:1};(function(){var a=function(b){var c=b.relatedTarget;if(c==undefined){return true;}if(c===false){return false;}return($type(this)!="document"&&c!=this&&c.prefix!="xul"&&!this.hasChild(c));};Element.Events=new Hash({mouseenter:{base:"mouseover",condition:a},mouseleave:{base:"mouseout",condition:a},mousewheel:{base:(Browser.Engine.gecko)?"DOMMouseScroll":"mousewheel"}});})();Element.Properties.styles={set:function(a){this.setStyles(a);}};Element.Properties.opacity={set:function(a,b){if(!b){if(a==0){if(this.style.visibility!="hidden"){this.style.visibility="hidden";}}else{if(this.style.visibility!="visible"){this.style.visibility="visible";}}}if(!this.currentStyle||!this.currentStyle.hasLayout){this.style.zoom=1;}if(Browser.Engine.trident){this.style.filter=(a==1)?"":"alpha(opacity="+a*100+")";}this.style.opacity=a;this.store("opacity",a);},get:function(){return this.retrieve("opacity",1);}};Element.implement({setOpacity:function(a){return this.set("opacity",a,true);},getOpacity:function(){return this.get("opacity");},setStyle:function(b,a){switch(b){case"opacity":return this.set("opacity",parseFloat(a));case"float":b=(Browser.Engine.trident)?"styleFloat":"cssFloat";}b=b.camelCase();if($type(a)!="string"){var c=(Element.Styles.get(b)||"@").split(" ");a=$splat(a).map(function(f,d){if(!c[d]){return"";}return($type(f)=="number")?c[d].replace("@",Math.round(f)):f;}).join(" ");}else{if(a==String(Number(a))){a=Math.round(a);}}this.style[b]=a;return this;},getStyle:function(h){switch(h){case"opacity":return this.get("opacity");case"float":h=(Browser.Engine.trident)?"styleFloat":"cssFloat";}h=h.camelCase();var a=this.style[h];if(!$chk(a)){a=[];for(var g in Element.ShortStyles){if(h!=g){continue;}for(var f in Element.ShortStyles[g]){a.push(this.getStyle(f));}return a.join(" ");}a=this.getComputedStyle(h);}if(a){a=String(a);var c=a.match(/rgba?\([\d\s,]+\)/);if(c){a=a.replace(c[0],c[0].rgbToHex());}}if(Browser.Engine.presto||(Browser.Engine.trident&&!$chk(parseInt(a,10)))){if(h.test(/^(height|width)$/)){var b=(h=="width")?["left","right"]:["top","bottom"],d=0;b.each(function(i){d+=this.getStyle("border-"+i+"-width").toInt()+this.getStyle("padding-"+i).toInt();},this);return this["offset"+h.capitalize()]-d+"px";}if((Browser.Engine.presto)&&String(a).test("px")){return a;}if(h.test(/(border(.+)Width|margin|padding)/)){return"0px";}}return a;},setStyles:function(b){for(var a in b){this.setStyle(a,b[a]);}return this;},getStyles:function(){var a={};Array.flatten(arguments).each(function(b){a[b]=this.getStyle(b);},this);return a;}});Element.Styles=new Hash({left:"@px",top:"@px",bottom:"@px",right:"@px",width:"@px",height:"@px",maxWidth:"@px",maxHeight:"@px",minWidth:"@px",minHeight:"@px",backgroundColor:"rgb(@, @, @)",backgroundPosition:"@px @px",color:"rgb(@, @, @)",fontSize:"@px",letterSpacing:"@px",lineHeight:"@px",clip:"rect(@px @px @px @px)",margin:"@px @px @px @px",padding:"@px @px @px @px",border:"@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)",borderWidth:"@px @px @px @px",borderStyle:"@ @ @ @",borderColor:"rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)",zIndex:"@",zoom:"@",fontWeight:"@",textIndent:"@px",opacity:"@"});Element.ShortStyles={margin:{},padding:{},border:{},borderWidth:{},borderStyle:{},borderColor:{}};["Top","Right","Bottom","Left"].each(function(h){var g=Element.ShortStyles;var b=Element.Styles;["margin","padding"].each(function(i){var j=i+h;g[i][j]=b[j]="@px";});var f="border"+h;g.border[f]=b[f]="@px @ rgb(@, @, @)";var d=f+"Width",a=f+"Style",c=f+"Color";g[f]={};g.borderWidth[d]=g[f][d]=b[d]="@px";g.borderStyle[a]=g[f][a]=b[a]="@";g.borderColor[c]=g[f][c]=b[c]="rgb(@, @, @)";});var Fx=new Class({Implements:[Chain,Events,Options],options:{fps:50,unit:false,duration:500,link:"ignore"},initialize:function(a){this.subject=this.subject||this;this.setOptions(a);this.options.duration=Fx.Durations[this.options.duration]||this.options.duration.toInt();var b=this.options.wait;if(b===false){this.options.link="cancel";}},getTransition:function(){return function(a){return -(Math.cos(Math.PI*a)-1)/2;};},step:function(){var a=$time();if(a<this.time+this.options.duration){var b=this.transition((a-this.time)/this.options.duration);this.set(this.compute(this.from,this.to,b));}else{this.set(this.compute(this.from,this.to,1));this.complete();}},set:function(a){return a;},compute:function(c,b,a){return Fx.compute(c,b,a);},check:function(){if(!this.timer){return true;}switch(this.options.link){case"cancel":this.cancel();return true;case"chain":this.chain(this.caller.bind(this,arguments));return false;}return false;},start:function(b,a){if(!this.check(b,a)){return this;}this.from=b;this.to=a;this.time=0;this.transition=this.getTransition();this.startTimer();this.onStart();return this;},complete:function(){if(this.stopTimer()){this.onComplete();}return this;},cancel:function(){if(this.stopTimer()){this.onCancel();}return this;},onStart:function(){this.fireEvent("start",this.subject);},onComplete:function(){this.fireEvent("complete",this.subject);if(!this.callChain()){this.fireEvent("chainComplete",this.subject);}},onCancel:function(){this.fireEvent("cancel",this.subject).clearChain();},pause:function(){this.stopTimer();return this;},resume:function(){this.startTimer();return this;},stopTimer:function(){if(!this.timer){return false;}this.time=$time()-this.time;this.timer=$clear(this.timer);return true;},startTimer:function(){if(this.timer){return false;}this.time=$time()-this.time;this.timer=this.step.periodical(Math.round(1000/this.options.fps),this);return true;}});Fx.compute=function(c,b,a){return(b-c)*a+c;};Fx.Durations={"short":250,normal:500,"long":1000};Fx.CSS=new Class({Extends:Fx,prepare:function(d,f,b){b=$splat(b);var c=b[1];if(!$chk(c)){b[1]=b[0];b[0]=d.getStyle(f);}var a=b.map(this.parse);return{from:a[0],to:a[1]};},parse:function(a){a=$lambda(a)();a=(typeof a=="string")?a.split(" "):$splat(a);return a.map(function(c){c=String(c);var b=false;Fx.CSS.Parsers.each(function(g,f){if(b){return;}var d=g.parse(c);if($chk(d)){b={value:d,parser:g};}});b=b||{value:c,parser:Fx.CSS.Parsers.String};return b;});},compute:function(d,c,b){var a=[];(Math.min(d.length,c.length)).times(function(f){a.push({value:d[f].parser.compute(d[f].value,c[f].value,b),parser:d[f].parser});});a.$family={name:"fx:css:value"};return a;},serve:function(c,b){if($type(c)!="fx:css:value"){c=this.parse(c);}var a=[];c.each(function(d){a=a.concat(d.parser.serve(d.value,b));});return a;},render:function(a,d,c,b){a.setStyle(d,this.serve(c,b));},search:function(a){if(Fx.CSS.Cache[a]){return Fx.CSS.Cache[a];}var b={};Array.each(document.styleSheets,function(f,d){var c=f.href;if(c&&c.contains("://")&&!c.contains(document.domain)){return;}var g=f.rules||f.cssRules;Array.each(g,function(k,h){if(!k.style){return;}var j=(k.selectorText)?k.selectorText.replace(/^\w+/,function(i){return i.toLowerCase();}):null;if(!j||!j.test("^"+a+"$")){return;}Element.Styles.each(function(l,i){if(!k.style[i]||Element.ShortStyles[i]){return;}l=String(k.style[i]);b[i]=(l.test(/^rgb/))?l.rgbToHex():l;});});});return Fx.CSS.Cache[a]=b;}});Fx.CSS.Cache={};Fx.CSS.Parsers=new Hash({Color:{parse:function(a){if(a.match(/^#[0-9a-f]{3,6}$/i)){return a.hexToRgb(true);}return((a=a.match(/(\d+),\s*(\d+),\s*(\d+)/)))?[a[1],a[2],a[3]]:false;},compute:function(c,b,a){return c.map(function(f,d){return Math.round(Fx.compute(c[d],b[d],a));});},serve:function(a){return a.map(Number);}},Number:{parse:parseFloat,compute:Fx.compute,serve:function(b,a){return(a)?b+a:b;}},String:{parse:$lambda(false),compute:$arguments(1),serve:$arguments(0)}});Fx.Morph=new Class({Extends:Fx.CSS,initialize:function(b,a){this.element=this.subject=document.id(b);this.parent(a);},set:function(a){if(typeof a=="string"){a=this.search(a);}for(var b in a){this.render(this.element,b,a[b],this.options.unit);}return this;},compute:function(f,d,c){var a={};for(var b in f){a[b]=this.parent(f[b],d[b],c);}return a;},start:function(b){if(!this.check(b)){return this;}if(typeof b=="string"){b=this.search(b);}var f={},d={};for(var c in b){var a=this.prepare(this.element,c,b[c]);f[c]=a.from;d[c]=a.to;}return this.parent(f,d);}});Element.Properties.morph={set:function(a){var b=this.retrieve("morph");if(b){b.cancel();}return this.eliminate("morph").store("morph:options",$extend({link:"cancel"},a));},get:function(a){if(a||!this.retrieve("morph")){if(a||!this.retrieve("morph:options")){this.set("morph",a);}this.store("morph",new Fx.Morph(this,this.retrieve("morph:options")));}return this.retrieve("morph");}};Element.implement({morph:function(a){this.get("morph").start(a);return this;}});Fx.implement({getTransition:function(){var a=this.options.transition||Fx.Transitions.Sine.easeInOut;if(typeof a=="string"){var b=a.split(":");a=Fx.Transitions;a=a[b[0]]||a[b[0].capitalize()];if(b[1]){a=a["ease"+b[1].capitalize()+(b[2]?b[2].capitalize():"")];}}return a;}});Fx.Transition=function(b,a){a=$splat(a);return $extend(b,{easeIn:function(c){return b(c,a);},easeOut:function(c){return 1-b(1-c,a);},easeInOut:function(c){return(c<=0.5)?b(2*c,a)/2:(2-b(2*(1-c),a))/2;}});};Fx.Transitions=new Hash({linear:$arguments(0)});Fx.Transitions.extend=function(a){for(var b in a){Fx.Transitions[b]=new Fx.Transition(a[b]);}};Fx.Transitions.extend({Pow:function(b,a){return Math.pow(b,a[0]||6);},Expo:function(a){return Math.pow(2,8*(a-1));},Circ:function(a){return 1-Math.sin(Math.acos(a));},Sine:function(a){return 1-Math.sin((1-a)*Math.PI/2);},Back:function(b,a){a=a[0]||1.618;return Math.pow(b,2)*((a+1)*b-a);},Bounce:function(g){var f;for(var d=0,c=1;1;d+=c,c/=2){if(g>=(7-4*d)/11){f=c*c-Math.pow((11-6*d-11*g)/4,2);break;}}return f;},Elastic:function(b,a){return Math.pow(2,10*--b)*Math.cos(20*b*Math.PI*(a[0]||1)/3);}});["Quad","Cubic","Quart","Quint"].each(function(b,a){Fx.Transitions[b]=new Fx.Transition(function(c){return Math.pow(c,[a+2]);});});Fx.Tween=new Class({Extends:Fx.CSS,initialize:function(b,a){this.element=this.subject=document.id(b);this.parent(a);},set:function(b,a){if(arguments.length==1){a=b;b=this.property||this.options.property;}this.render(this.element,b,a,this.options.unit);return this;},start:function(c,f,d){if(!this.check(c,f,d)){return this;}var b=Array.flatten(arguments);this.property=this.options.property||b.shift();var a=this.prepare(this.element,this.property,b);return this.parent(a.from,a.to);}});Element.Properties.tween={set:function(a){var b=this.retrieve("tween");if(b){b.cancel();}return this.eliminate("tween").store("tween:options",$extend({link:"cancel"},a));},get:function(a){if(a||!this.retrieve("tween")){if(a||!this.retrieve("tween:options")){this.set("tween",a);}this.store("tween",new Fx.Tween(this,this.retrieve("tween:options")));}return this.retrieve("tween");}};Element.implement({tween:function(a,c,b){this.get("tween").start(arguments);return this;},fade:function(c){var f=this.get("tween"),d="opacity",a;c=$pick(c,"toggle");switch(c){case"in":f.start(d,1);break;case"out":f.start(d,0);break;case"show":f.set(d,1);break;case"hide":f.set(d,0);break;case"toggle":var b=this.retrieve("fade:flag",this.get("opacity")==1);f.start(d,(b)?0:1);this.store("fade:flag",!b);a=true;break;default:f.start(d,arguments);}if(!a){this.eliminate("fade:flag");}return this;},highlight:function(c,a){if(!a){a=this.retrieve("highlight:original",this.getStyle("background-color"));a=(a=="transparent")?"#fff":a;}var b=this.get("tween");b.start("background-color",c||"#ffff88",a).chain(function(){this.setStyle("background-color",this.retrieve("highlight:original"));b.callChain();}.bind(this));return this;}});var Request=new Class({Implements:[Chain,Events,Options],options:{url:"",data:"",headers:{"X-Requested-With":"XMLHttpRequest",Accept:"text/javascript, text/html, application/xml, text/xml, */*"},async:true,format:false,method:"post",link:"ignore",isSuccess:null,emulation:true,urlEncoded:true,encoding:"utf-8",evalScripts:false,evalResponse:false,noCache:false},initialize:function(a){this.xhr=new Browser.Request();this.setOptions(a);this.options.isSuccess=this.options.isSuccess||this.isSuccess;this.headers=new Hash(this.options.headers);},onStateChange:function(){if(this.xhr.readyState!=4||!this.running){return;}this.running=false;this.status=0;$try(function(){this.status=this.xhr.status;}.bind(this));this.xhr.onreadystatechange=$empty;if(this.options.isSuccess.call(this,this.status)){this.response={text:this.xhr.responseText,xml:this.xhr.responseXML};this.success(this.response.text,this.response.xml);}else{this.response={text:null,xml:null};this.failure();}},isSuccess:function(){return((this.status>=200)&&(this.status<300));},processScripts:function(a){if(this.options.evalResponse||(/(ecma|java)script/).test(this.getHeader("Content-type"))){return $exec(a);}return a.stripScripts(this.options.evalScripts);},success:function(b,a){this.onSuccess(this.processScripts(b),a);},onSuccess:function(){this.fireEvent("complete",arguments).fireEvent("success",arguments).callChain();},failure:function(){this.onFailure();},onFailure:function(){this.fireEvent("complete").fireEvent("failure",this.xhr);},setHeader:function(a,b){this.headers.set(a,b);return this;},getHeader:function(a){return $try(function(){return this.xhr.getResponseHeader(a);}.bind(this));},check:function(){if(!this.running){return true;}switch(this.options.link){case"cancel":this.cancel();return true;case"chain":this.chain(this.caller.bind(this,arguments));return false;}return false;},send:function(l){if(!this.check(l)){return this;}this.running=true;var j=$type(l);if(j=="string"||j=="element"){l={data:l};}var d=this.options;l=$extend({data:d.data,url:d.url,method:d.method},l);var h=l.data,b=String(l.url),a=l.method.toLowerCase();switch($type(h)){case"element":h=document.id(h).toQueryString();break;case"object":case"hash":h=Hash.toQueryString(h);}if(this.options.format){var k="format="+this.options.format;h=(h)?k+"&"+h:k;}if(this.options.emulation&&!["get","post"].contains(a)){var i="_method="+a;h=(h)?i+"&"+h:i;a="post";}if(this.options.urlEncoded&&a=="post"){var c=(this.options.encoding)?"; charset="+this.options.encoding:"";this.headers.set("Content-type","application/x-www-form-urlencoded"+c);}if(this.options.noCache){var g="noCache="+new Date().getTime();h=(h)?g+"&"+h:g;}var f=b.lastIndexOf("/");if(f>-1&&(f=b.indexOf("#"))>-1){b=b.substr(0,f);}if(h&&a=="get"){b=b+(b.contains("?")?"&":"?")+h;h=null;}this.xhr.open(a.toUpperCase(),b,this.options.async);this.xhr.onreadystatechange=this.onStateChange.bind(this);this.headers.each(function(n,m){try{this.xhr.setRequestHeader(m,n);}catch(o){this.fireEvent("exception",[m,n]);}},this);this.fireEvent("request");this.xhr.send(h);if(!this.options.async){this.onStateChange();}return this;},cancel:function(){if(!this.running){return this;}this.running=false;this.xhr.abort();this.xhr.onreadystatechange=$empty;this.xhr=new Browser.Request();this.fireEvent("cancel");return this;}});(function(){var a={};["get","post","put","delete","GET","POST","PUT","DELETE"].each(function(b){a[b]=function(){var c=Array.link(arguments,{url:String.type,data:$defined});return this.send($extend(c,{method:b}));};});Request.implement(a);})();Element.Properties.send={set:function(a){var b=this.retrieve("send");if(b){b.cancel();}return this.eliminate("send").store("send:options",$extend({data:this,link:"cancel",method:this.get("method")||"post",url:this.get("action")},a));},get:function(a){if(a||!this.retrieve("send")){if(a||!this.retrieve("send:options")){this.set("send",a);}this.store("send",new Request(this.retrieve("send:options")));}return this.retrieve("send");}};Element.implement({send:function(a){var b=this.get("send");b.send({data:this,url:a||b.options.url});return this;}});Request.HTML=new Class({Extends:Request,options:{update:false,append:false,evalScripts:true,filter:false},processHTML:function(c){var b=c.match(/<body[^>]*>([\s\S]*?)<\/body>/i);c=(b)?b[1]:c;var a=new Element("div");return $try(function(){var d="<root>"+c+"</root>",h;if(Browser.Engine.trident){h=new ActiveXObject("Microsoft.XMLDOM");h.async=false;h.loadXML(d);}else{h=new DOMParser().parseFromString(d,"text/xml");}d=h.getElementsByTagName("root")[0];if(!d){return null;}for(var g=0,f=d.childNodes.length;g<f;g++){var j=Element.clone(d.childNodes[g],true,true);if(j){a.grab(j);}}return a;})||a.set("html",c);},success:function(d){var c=this.options,b=this.response;b.html=d.stripScripts(function(f){b.javascript=f;});var a=this.processHTML(b.html);b.tree=a.childNodes;b.elements=a.getElements("*");if(c.filter){b.tree=b.elements.filter(c.filter);}if(c.update){document.id(c.update).empty().set("html",b.html);}else{if(c.append){document.id(c.append).adopt(a.getChildren());}}if(c.evalScripts){$exec(b.javascript);}this.onSuccess(b.tree,b.elements,b.html,b.javascript);}});Element.Properties.load={set:function(a){var b=this.retrieve("load");if(b){b.cancel();}return this.eliminate("load").store("load:options",$extend({data:this,link:"cancel",update:this,method:"get"},a));},get:function(a){if(a||!this.retrieve("load")){if(a||!this.retrieve("load:options")){this.set("load",a);}this.store("load",new Request.HTML(this.retrieve("load:options")));}return this.retrieve("load");}};Element.implement({load:function(){this.get("load").send(Array.link(arguments,{data:Object.type,url:String.type}));return this;}});var JSON=new Hash(this.JSON&&{stringify:JSON.stringify,parse:JSON.parse}).extend({$specialChars:{"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},$replaceChars:function(a){return JSON.$specialChars[a]||"\\u00"+Math.floor(a.charCodeAt()/16).toString(16)+(a.charCodeAt()%16).toString(16);},encode:function(b){switch($type(b)){case"string":return'"'+b.replace(/[\x00-\x1f\\"]/g,JSON.$replaceChars)+'"';case"array":return"["+String(b.map(JSON.encode).clean())+"]";case"object":case"hash":var a=[];Hash.each(b,function(f,d){var c=JSON.encode(f);if(c){a.push(JSON.encode(d)+":"+c);}});return"{"+a+"}";case"number":case"boolean":return String(b);case false:return"null";}return null;},decode:function(string,secure){if($type(string)!="string"||!string.length){return null;}if(secure&&!(/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string.replace(/\\./g,"@").replace(/"[^"\\\n\r]*"/g,""))){return null;}return eval("("+string+")");}});Request.JSON=new Class({Extends:Request,options:{secure:true},initialize:function(a){this.parent(a);this.headers.extend({Accept:"application/json","X-Request":"JSON"});},success:function(a){this.response.json=JSON.decode(a,this.options.secure);this.onSuccess(this.response.json,a);}});var Cookie=new Class({Implements:Options,options:{path:false,domain:false,duration:false,secure:false,document:document},initialize:function(b,a){this.key=b;this.setOptions(a);},write:function(b){b=encodeURIComponent(b);if(this.options.domain){b+="; domain="+this.options.domain;}if(this.options.path){b+="; path="+this.options.path;}if(this.options.duration){var a=new Date();a.setTime(a.getTime()+this.options.duration*24*60*60*1000);b+="; expires="+a.toGMTString();}if(this.options.secure){b+="; secure";}this.options.document.cookie=this.key+"="+b;return this;},read:function(){var a=this.options.document.cookie.match("(?:^|;)\\s*"+this.key.escapeRegExp()+"=([^;]*)");return(a)?decodeURIComponent(a[1]):null;},dispose:function(){new Cookie(this.key,$merge(this.options,{duration:-1})).write("");return this;}});Cookie.write=function(b,c,a){return new Cookie(b,a).write(c);};Cookie.read=function(a){return new Cookie(a).read();};Cookie.dispose=function(b,a){return new Cookie(b,a).dispose();};Element.Events.domready={onAdd:function(a){if(Browser.loaded){a.call(this);}}};(function(){var b=function(){if(Browser.loaded){return;}Browser.loaded=true;window.fireEvent("domready");document.fireEvent("domready");};window.addEvent("load",b);if(Browser.Engine.trident){var a=document.createElement("div");(function(){($try(function(){a.doScroll();return document.id(a).inject(document.body).set("html","temp").dispose();}))?b():arguments.callee.delay(50);})();}else{if(Browser.Engine.webkit&&Browser.Engine.version<525){(function(){(["loaded","complete"].contains(document.readyState))?b():arguments.callee.delay(50);})();}else{document.addEvent("DOMContentLoaded",b);}}})();Native.implement([Document,Element],{getElements:function(j,h){j=j.split(",");var c,f={};for(var d=0,b=j.length;d<b;d++){var a=j[d],g=Selectors.Utils.search(this,a,f);if(d!=0&&g.item){g=$A(g);}c=(d==0)?g:(c.item)?$A(c).concat(g):c.concat(g);}return new Elements(c,{ddup:(j.length>1),cash:!h});}});Element.implement({match:function(b){if(!b||(b==this)){return true;}var d=Selectors.Utils.parseTagAndID(b);var a=d[0],f=d[1];if(!Selectors.Filters.byID(this,f)||!Selectors.Filters.byTag(this,a)){return false;}var c=Selectors.Utils.parseSelector(b);return(c)?Selectors.Utils.filter(this,c,{}):true;}});var Selectors={Cache:{nth:{},parsed:{}}};Selectors.RegExps={id:(/#([\w-]+)/),tag:(/^(\w+|\*)/),quick:(/^(\w+|\*)$/),splitter:(/\s*([+>~\s])\s*([a-zA-Z#.*:\[])/g),combined:(/\.([\w-]+)|\[(\w+)(?:([!*^$~|]?=)(["']?)([^\4]*?)\4)?\]|:([\w-]+)(?:\(["']?(.*?)?["']?\)|$)/g)};Selectors.Utils={chk:function(b,c){if(!c){return true;}var a=$uid(b);if(!c[a]){return c[a]=true;}return false;},parseNthArgument:function(i){if(Selectors.Cache.nth[i]){return Selectors.Cache.nth[i];}var f=i.match(/^([+-]?\d*)?([a-z]+)?([+-]?\d*)?$/);if(!f){return false;}var h=parseInt(f[1],10);var d=(h||h===0)?h:1;var g=f[2]||false;var c=parseInt(f[3],10)||0;if(d!=0){c--;while(c<1){c+=d;}while(c>=d){c-=d;}}else{d=c;g="index";}switch(g){case"n":f={a:d,b:c,special:"n"};break;case"odd":f={a:2,b:0,special:"n"};break;case"even":f={a:2,b:1,special:"n"};break;case"first":f={a:0,special:"index"};break;case"last":f={special:"last-child"};break;case"only":f={special:"only-child"};break;default:f={a:(d-1),special:"index"};}return Selectors.Cache.nth[i]=f;},parseSelector:function(f){if(Selectors.Cache.parsed[f]){return Selectors.Cache.parsed[f];}var d,i={classes:[],pseudos:[],attributes:[]};while((d=Selectors.RegExps.combined.exec(f))){var j=d[1],h=d[2],g=d[3],b=d[5],c=d[6],k=d[7];if(j){i.classes.push(j);}else{if(c){var a=Selectors.Pseudo.get(c);if(a){i.pseudos.push({parser:a,argument:k});}else{i.attributes.push({name:c,operator:"=",value:k});}}else{if(h){i.attributes.push({name:h,operator:g,value:b});}}}}if(!i.classes.length){delete i.classes;}if(!i.attributes.length){delete i.attributes;}if(!i.pseudos.length){delete i.pseudos;}if(!i.classes&&!i.attributes&&!i.pseudos){i=null;}return Selectors.Cache.parsed[f]=i;},parseTagAndID:function(b){var a=b.match(Selectors.RegExps.tag);var c=b.match(Selectors.RegExps.id);return[(a)?a[1]:"*",(c)?c[1]:false];},filter:function(g,c,f){var d;if(c.classes){for(d=c.classes.length;d--;d){var h=c.classes[d];if(!Selectors.Filters.byClass(g,h)){return false;}}}if(c.attributes){for(d=c.attributes.length;d--;d){var b=c.attributes[d];if(!Selectors.Filters.byAttribute(g,b.name,b.operator,b.value)){return false;}}}if(c.pseudos){for(d=c.pseudos.length;d--;d){var a=c.pseudos[d];if(!Selectors.Filters.byPseudo(g,a.parser,a.argument,f)){return false;}}}return true;},getByTagAndID:function(b,a,d){if(d){var c=(b.getElementById)?b.getElementById(d,true):Element.getElementById(b,d,true);return(c&&Selectors.Filters.byTag(c,a))?[c]:[];}else{return b.getElementsByTagName(a);}},search:function(p,o,u){var b=[];var c=o.trim().replace(Selectors.RegExps.splitter,function(k,j,i){b.push(j);return":)"+i;}).split(":)");var q,f,B;for(var A=0,w=c.length;A<w;A++){var z=c[A];if(A==0&&Selectors.RegExps.quick.test(z)){q=p.getElementsByTagName(z);continue;}var a=b[A-1];var r=Selectors.Utils.parseTagAndID(z);var C=r[0],s=r[1];if(A==0){q=Selectors.Utils.getByTagAndID(p,C,s);}else{var d={},h=[];for(var y=0,x=q.length;y<x;y++){h=Selectors.Getters[a](h,q[y],C,s,d);}q=h;}var g=Selectors.Utils.parseSelector(z);if(g){f=[];for(var v=0,t=q.length;v<t;v++){B=q[v];if(Selectors.Utils.filter(B,g,u)){f.push(B);}}q=f;}}return q;}};Selectors.Getters={" ":function(j,h,k,a,f){var d=Selectors.Utils.getByTagAndID(h,k,a);for(var c=0,b=d.length;c<b;c++){var g=d[c];if(Selectors.Utils.chk(g,f)){j.push(g);}}return j;},">":function(j,h,k,a,g){var c=Selectors.Utils.getByTagAndID(h,k,a);for(var f=0,d=c.length;f<d;f++){var b=c[f];if(b.parentNode==h&&Selectors.Utils.chk(b,g)){j.push(b);}}return j;},"+":function(c,b,a,f,d){while((b=b.nextSibling)){if(b.nodeType==1){if(Selectors.Utils.chk(b,d)&&Selectors.Filters.byTag(b,a)&&Selectors.Filters.byID(b,f)){c.push(b);}break;}}return c;},"~":function(c,b,a,f,d){while((b=b.nextSibling)){if(b.nodeType==1){if(!Selectors.Utils.chk(b,d)){break;}if(Selectors.Filters.byTag(b,a)&&Selectors.Filters.byID(b,f)){c.push(b);}}}return c;}};Selectors.Filters={byTag:function(b,a){return(a=="*"||(b.tagName&&b.tagName.toLowerCase()==a));},byID:function(a,b){return(!b||(a.id&&a.id==b));},byClass:function(b,a){return(b.className&&b.className.contains&&b.className.contains(a," "));},byPseudo:function(a,d,c,b){return d.call(a,c,b);},byAttribute:function(c,d,b,f){var a=Element.prototype.getProperty.call(c,d);if(!a){return(b=="!=");}if(!b||f==undefined){return true;}switch(b){case"=":return(a==f);case"*=":return(a.contains(f));case"^=":return(a.substr(0,f.length)==f);case"$=":return(a.substr(a.length-f.length)==f);case"!=":return(a!=f);case"~=":return a.contains(f," ");case"|=":return a.contains(f,"-");}return false;}};Selectors.Pseudo=new Hash({checked:function(){return this.checked;},empty:function(){return !(this.innerText||this.textContent||"").length;},not:function(a){return !Element.match(this,a);},contains:function(a){return(this.innerText||this.textContent||"").contains(a);},"first-child":function(){return Selectors.Pseudo.index.call(this,0);},"last-child":function(){var a=this;while((a=a.nextSibling)){if(a.nodeType==1){return false;}}return true;},"only-child":function(){var b=this;while((b=b.previousSibling)){if(b.nodeType==1){return false;}}var a=this;while((a=a.nextSibling)){if(a.nodeType==1){return false;}}return true;},"nth-child":function(h,f){h=(h==undefined)?"n":h;var c=Selectors.Utils.parseNthArgument(h);if(c.special!="n"){return Selectors.Pseudo[c.special].call(this,c.a,f);}var g=0;f.positions=f.positions||{};var d=$uid(this);if(!f.positions[d]){var b=this;while((b=b.previousSibling)){if(b.nodeType!=1){continue;}g++;var a=f.positions[$uid(b)];if(a!=undefined){g=a+g;break;}}f.positions[d]=g;}return(f.positions[d]%c.a==c.b);},index:function(a){var b=this,c=0;while((b=b.previousSibling)){if(b.nodeType==1&&++c>a){return false;}}return(c==a);},even:function(b,a){return Selectors.Pseudo["nth-child"].call(this,"2n+1",a);},odd:function(b,a){return Selectors.Pseudo["nth-child"].call(this,"2n",a);},selected:function(){return this.selected;},enabled:function(){return(this.disabled===false);}});var Swiff=new Class({Implements:[Options],options:{id:null,height:1,width:1,container:null,properties:{},params:{quality:"high",allowScriptAccess:"always",wMode:"transparent",swLiveConnect:true},callBacks:{},vars:{}},toElement:function(){return this.object;},initialize:function(m,n){this.instance="Swiff_"+$time();this.setOptions(n);n=this.options;var b=this.id=n.id||this.instance;var a=document.id(n.container);Swiff.CallBacks[this.instance]={};var f=n.params,h=n.vars,g=n.callBacks;var i=$extend({height:n.height,width:n.width},n.properties);var l=this;for(var d in g){Swiff.CallBacks[this.instance][d]=(function(o){return function(){return o.apply(l.object,arguments);};})(g[d]);h[d]="Swiff.CallBacks."+this.instance+"."+d;}f.flashVars=Hash.toQueryString(h);if(Browser.Engine.trident){i.classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000";f.movie=m;}else{i.type="application/x-shockwave-flash";i.data=m;}var k='<object id="'+b+'"';for(var j in i){k+=" "+j+'="'+i[j]+'"';}k+=">";for(var c in f){if(f[c]){k+='<param name="'+c+'" value="'+f[c]+'" />';}}k+="</object>";this.object=((a)?a.empty():new Element("div")).set("html",k).firstChild;},replaces:function(a){a=document.id(a,true);a.parentNode.replaceChild(this.toElement(),a);return this;},inject:function(a){document.id(a,true).appendChild(this.toElement());return this;},remote:function(){return Swiff.remote.apply(Swiff,[this.toElement()].extend(arguments));}});Swiff.CallBacks={};Swiff.remote=function(obj,fn){var rs=obj.CallFunction('<invoke name="'+fn+'" returntype="javascript">'+__flash__argumentsToXML(arguments,2)+"</invoke>");return eval(rs);};





















































Array.prototype.indexFromEnd = function(d) {
	var p = this;
	if (d < 0) return p[p.length + d];
	return p[d];
}

String.prototype.splitMax = function(by, max) {
	var items = this.split(by);
	var newitems = items.slice(0, max-1);

	if (items.length >= max)
		newitems.push(items.slice(max-1).join(by));

	return newitems;
}

qwebirc.util.deviceHasKeyboard = function() {
	var determine = function() {
		if (Browser.Engine.ipod)
			return true;

		var MOBILE_UAs = ["Nintendo Wii", " PIE", "BlackBerry", "IEMobile", "Windows CE", "Nokia", "Opera Mini", "Mobile", "mobile", "Pocket", "pocket", "Android"];
		/* safari not included because iphones/ipods send that, and we checked for iphone/ipod specifically above */
		var DESKTOP_UAs = ["Chrome", "Firefox", "Camino", "Iceweasel", "K-Meleon", "Konqueror", "SeaMonkey", "Windows NT", "Windows 9"];

		var ua = navigator.userAgent;

		var contains = function(v) {
			return ua.indexOf(v) > -1;
		}

		for(var i=0;i<MOBILE_UAs.length;i++)
			if (contains(MOBILE_UAs[i]))
				return false;

		for(var i=0;i<DESKTOP_UAs.length;i++)
			if (contains(DESKTOP_UAs[i]))
				return true;

		return false;
	};
	var v = determine();

	qwebirc.util.deviceHasKeyboard = function() {
		return v;
	}

	return v;
}

qwebirc.irc.IRCConnection = new Class({
	Implements: [Events, Options],
	options: {
		initialNickname: "atropa-ircconnX",
		timeout: 45000,
		floodInterval: 200,
		floodMax: 10,
		floodReset: 5000,
		errorAlert: true,
		maxRetries: 5,
		// serverPassword: null
	},
	initialize: function(options) {
		this.setOptions(options);

		this.initialNickname = this.options.initialNickname;

		this.counter = 0;
		this.disconnected = false;

		this.websocket = null;
		this.parser = null;
	},
	send: function(data, synchronous) {
		if (this.disconnected)
			return false;

		this.parser.sendMessage(data)
		return true;
	},
	handleCommands: function(command, params, userData) {
		userData.fireEvent("recv", [['c', command].concat(params)])
	},
	connect: function() {
		var self = this;

		function connected () {
			qwebirc.connected = true;
			if (console && console.log) console.log(self.websocket);
			self.firstmessage = false;
			self.parser = new IRCParser(self.websocket)
		}

		function onmessage (msg) {
			if (!self.firstmessage) {
				self.firstmessage = true;
				self.parser.unhandled = self.handleCommands;
				self.parser.sendMessage(`NICK ${self.options.initialNickname}`);
				self.parser.sendMessage('USER oftc-webirc blah blah :OFTC WebIRC Client')
				self.fireEvent("recv", [['connected']])
			}
			self.parser.parsePacket(msg.data || msg, self)
		}

		function onclose (error) {
			self.disconnect(error);
		}

		function onerror () {
			var url = 'https://webirc.oftc.net:8443';
			if (window.location.search)
				url += window.location.search;
			self.fireEvent("recv", [['disconnect', `Failed to connect, please connect to ${url} and accept the certificate and try again`]]);
			self.fireEvent('error', 'fail')
		}

		self.websocket = io.connect('https://webirc.oftc.net:8443');
		self.websocket.on('connect', connected);
		self.websocket.on('message', onmessage);
		self.websocket.on('error', onerror);
		self.websocket.on('disconnect', onclose);
	},

	disconnect: function(error) {
		qwebirc.connected = false;
		this.disconnected = true;
		if (this.websocket) {
			this.websocket.disconnect()
			this.websocket = null;
		}
		error = error || '';
		self.fireEvent("recv", [['disconnect', error.toString()]]);
	},
});

qwebirc.irc.RFC1459toIRCLower = function(x) {
	var anIRCLowerTable = [
		/* x00-x07 */ '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07',
		/* x08-x0f */ '\x08', '\x09', '\x0a', '\x0b', '\x0c', '\x0d', '\x0e', '\x0f',
		/* x10-x17 */ '\x10', '\x11', '\x12', '\x13', '\x14', '\x15', '\x16', '\x17',
		/* x18-x1f */ '\x18', '\x19', '\x1a', '\x1b', '\x1c', '\x1d', '\x1e', '\x1f',
		/* ' '-x27 */	' ',	'!',	'"',	'#',	'$',	'%',	'&', '\x27',
		/* '('-'/' */	'(',	')',	'*',	'+',	',',	'-',	'.',	'/',
		/* '0'-'7' */	'0',	'1',	'2',	'3',	'4',	'5',	'6',	'7',
		/* '8'-'?' */	'8',	'9',	':',	';',	'<',	'=',	'>',	'?',
		/* '@'-'G' */	'@',	'a',	'b',	'c',	'd',	'e',	'f',	'g',
		/* 'H'-'O' */	'h',	'i',	'j',	'k',	'l',	'm',	'n',	'o',
		/* 'P'-'W' */	'p',	'q',	'r',	's',	't',	'u',	'v',	'w',
		/* 'X'-'_' */	'x',	'y',	'z',	'{',	'|',	'}',	'~',	'_',
		/* '`'-'g' */	'`',	'a',	'b',	'c',	'd',	'e',	'f',	'g',
		/* 'h'-'o' */	'h',	'i',	'j',	'k',	'l',	'm',	'n',	'o',
		/* 'p'-'w' */	'p',	'q',	'r',	's',	't',	'u',	'v',	'w',
		/* 'x'-x7f */	'x',	'y',	'z',	'{',	'|',	'}',	'~', '\x7f',
		/* x80-x87 */ '\x80', '\x81', '\x82', '\x83', '\x84', '\x85', '\x86', '\x87',
		/* x88-x8f */ '\x88', '\x89', '\x8a', '\x8b', '\x8c', '\x8d', '\x8e', '\x8f',
		/* x90-x97 */ '\x90', '\x91', '\x92', '\x93', '\x94', '\x95', '\x96', '\x97',
		/* x98-x9f */ '\x98', '\x99', '\x9a', '\x9b', '\x9c', '\x9d', '\x9e', '\x9f',
		/* xa0-xa7 */ '\xa0', '\xa1', '\xa2', '\xa3', '\xa4', '\xa5', '\xa6', '\xa7',
		/* xa8-xaf */ '\xa8', '\xa9', '\xaa', '\xab', '\xac', '\xad', '\xae', '\xaf',
		/* xb0-xb7 */ '\xb0', '\xb1', '\xb2', '\xb3', '\xb4', '\xb5', '\xb6', '\xb7',
		/* xb8-xbf */ '\xb8', '\xb9', '\xba', '\xbb', '\xbc', '\xbd', '\xbe', '\xbf',
		/* xc0-xc7 */ '\xe0', '\xe1', '\xe2', '\xe3', '\xe4', '\xe5', '\xe6', '\xe7',
		/* xc8-xcf */ '\xe8', '\xe9', '\xea', '\xeb', '\xec', '\xed', '\xee', '\xef',
		/* xd0-xd7 */ '\xf0', '\xf1', '\xf2', '\xf3', '\xf4', '\xf5', '\xf6', '\xd7',
		/* xd8-xdf */ '\xf8', '\xf9', '\xfa', '\xfb', '\xfc', '\xfd', '\xfe', '\xdf',
		/* xe0-xe7 */ '\xe0', '\xe1', '\xe2', '\xe3', '\xe4', '\xe5', '\xe6', '\xe7',
		/* xe8-xef */ '\xe8', '\xe9', '\xea', '\xeb', '\xec', '\xed', '\xee', '\xef',
		/* xf0-xf7 */ '\xf0', '\xf1', '\xf2', '\xf3', '\xf4', '\xf5', '\xf6', '\xf7',
		/* xf8-xff */ '\xf8', '\xf9', '\xfa', '\xfb', '\xfc', '\xfd', '\xfe', '\xff'
	];
	var p = [];
	for(var i=0;i<x.length;i++) {
		var l = x.charCodeAt(i);
		p.push(anIRCLowerTable[l]);
	}
	return p.join("");
}

qwebirc.irc.ASCIItoIRCLower = function(x) {
	return x.toLowerCase(); /* TODO: does unicode too.... */
}

String.prototype.hostToNick = function() {
	return this.split("!", 1)[0];
}

String.prototype.hostToHost = function() {
	return this.split("!", 2)[1];
}

qwebirc.irc.IRCDate = function(d) {
	var days_of_week = {0: "Sun",1: "Mon",2: "Tue",3: "Wed",4: "Thu",5: "Fri",6: "Sat"};
	var months_of_year = {0: "Jan",1: "Feb",2: "Mar",3: "Apr",4: "May",5: "Jun",6: "Jul",7: "Aug",8: "Sep",9: "Oct",10: "Nov",11: "Dec"};
	return days_of_week[d.getDay()] + " " + months_of_year[d.getMonth()] + " " + d.getDate().padStart(2, '0') + " "  + d.getHours().padStart(2, '0') + ":" + d.getMinutes().padStart(2, '0') + ":" + d.getSeconds().padStart(2, '0') + " " + d.getFullYear();
}

qwebirc.irc.Numerics = {
	"001": "RPL_WELCOME",
	"433": "ERR_NICKINUSE",
	"004": "RPL_MYINFO",
	"005": "RPL_ISUPPORT",
	"353": "RPL_NAMREPLY",
	"366": "RPL_ENDOFNAMES",
	"331": "RPL_NOTOPIC",
	"332": "RPL_TOPIC",
	"333": "RPL_TOPICWHOTIME",
	"311": "RPL_WHOISUSER",
	"312": "RPL_WHOISSERVER",
	"313": "RPL_WHOISOPERATOR",
	"317": "RPL_WHOISIDLE",
	"671": "RPL_WHOISSECURE",
	"318": "RPL_ENDOFWHOIS",
	"319": "RPL_WHOISCHANNELS",
	"330": "RPL_WHOISACCOUNT",
	"338": "RPL_WHOISACTUALLY",
	"343": "RPL_WHOISOPERNAME",
	"320": "RPL_WHOISGENERICTEXT",
	"325": "RPL_WHOISWEBIRC",
	"301": "RPL_AWAY",
	"401": "ERR_NOSUCHNICK",
	"404": "ERR_CANNOTSENDTOCHAN",
	"432": "ERR_NICKISBAD",
	"474": "ERR_NICKISBANNED",
	"482": "ERR_CHANOPPRIVSNEEDED",
	"305": "RPL_UNAWAY",
	"306": "RPL_NOWAWAY",
	"324": "RPL_CHANNELMODEIS",
	"329": "RPL_CREATIONTIME"
};

qwebirc.irc.RegisteredCTCPs = {
	"VERSION": function(x) {
		return "qwebirc v" + qwebirc.VERSION + ", copyright (C) 2008-2012 Chris Porter and the qwebirc project -- " + navigator.userAgent;
	},
	"USERINFO": function(x) { return "qwebirc"; },
	"TIME": function(x) { return qwebirc.irc.IRCDate(new Date()); },
	"PING": function(x) { return x; },
	"CLIENTINFO": function(x) { return "PING VERSION TIME USERINFO CLIENTINFO WEBSITE"; },
	"WEBSITE": function(x) { return window == window.top ? "direct" : document.referrer; }
};

qwebirc.irc.BaseIRCClient = new Class({
	Implements: [Options],
	options: {
		nickname: "awebirc"
	},
	initialize: function(options) {
		this.setOptions(options);
		this.toIRCLower = qwebirc.irc.RFC1459toIRCLower;
		this.nickname = this.options.nickname;
		this.channels = {}
		this.nextctcp = 0;
		window['IRC_CONNECTION'] = new qwebirc.irc.IRCConnection({
			initialNickname: this.nickname,
			onRecv: this.dispatch.bind(this)
		});
		this.connection = window['IRC_CONNECTION'];
		this.send = this.connection.send.bind(this.connection);
		this.connect = this.connection.connect.bind(this.connection);
		this.disconnect = this.connection.disconnect.bind(this.connection);
		this.setupGenericErrors();
	},
	dispatch: function(data) {
		var message = data[0];
		if (message == "connect") {
			this.connected();
		} else if (message == "disconnect") {
			if (data.length == 0) {
				this.disconnected("No error!");
			} else {
				this.disconnected(data[1]);
			}
			this.disconnect();
		} else if (message == "c") {
			var command = data[1].toUpperCase();
			var prefix = data[2];
			var sl = data[3];
			var n = qwebirc.irc.Numerics[command];

			var x = n;
			if (!n)
				n = command;

			var o = this["irc_" + n];
			if (o) {
				var r = o.run([prefix, sl], this);
				if (!r) {
//                    this.rawNumeric(command, prefix, sl);
					console.log("RAW", {"n": "numeric", "m": sl.slice(1).join(" ")});
			    }
			} else {
//                this.rawNumeric(command, prefix, sl);
				console.log("RAW", {"n": "numeric", "m": sl.slice(1).join(" ")});
				console.log("RAW", {"data": data});
			}
		}
	},

	supported: function(key, value) {
		if (key == "CASEMAPPING") {
			if (value == "ascii") {
				this.toIRCLower = qwebirc.irc.ASCIItoIRCLower;
			}
		}
	},
	irc_RPL_WELCOME: function(prefix, params) {
		this.nickname = params[0];
		this.exec("/UMODE +x");
		if (this.options.autojoin) this.exec("/AUTOJOIN");
		window["IRC_CONNECTED"] = "1";
		window["IRC_CONNECTED_ONCE"] = "1";
	},
	irc_ERR_NICKINUSE: function(prefix, params) {
		console.log("NICKINUSE: ", params[1], params.slice(0, -1) + '.');
		let nick = set_random_nickname();
	    let mask = window['IRC_MASK'].split('!');
	    window['IRC_MASK'] = `${nick}!${mask[1]}`;
		this.send("NICK " + nick);
		show_modal("Nickname is in use, generated a random one.");
		return true;
	},
	irc_ERR_NICKISBAD: function(prefix, params) {
		console.log("NICKISBAD: ", params[1], params.slice(0, -1) + '.');
		let nick = set_random_nickname();
	    let mask = window['IRC_MASK'].split('!');
	    window['IRC_MASK'] = `${nick}!${mask[1]}`;
		this.send("NICK " + nick);
		show_modal("Nickname is invalid, generated a random one.");
		return true;
	},
	irc_ERR_NICKISBANNED: function(prefix, params) {
        if (window['IRC_BANNED'] == null) {
            window['IRC_BANNED'] = [];
        }
        window['IRC_BANNED'].push(window['IRC_CHANNEL']);
		toggle_chat_input_ui('banned');
		return true;
	},
	irc_NICK: function(prefix, params) {
        sessionStorage.setItem("IRC_NICKNAME", params[0]);
		let nick_box = document.getElementById("chat-nick");
		let nick = nick_box.value;
		let status = '';
		if (['@', '+'].indexOf(nick_box.value[0]) > -1) {
		    status = nick_box.value[0];
		    nick = nick_box.value.slice(1);
		}
		if (nick == prefix.hostToNick()) {
		    nick_box.value = `${status}${params[0]}`;
		}
		console.log("NICK: ", prefix, prefix.hostToNick(), params[0]);
		return true;
	},
	irc_QUIT: function(prefix, params) {
		let nick_box = document.getElementById("chat-nick");
		if (nick_box.value == params[1]) {
            if (['@', '+'].indexOf(nick_box.value[0]) > -1)
                nick_box.value = nick_box.value.slice(1);
		    toggle_chat_input_ui(false);
		    window['IRC_CHANNELS_JOINED'] = [];
		}
		// console.log("QUIT: ", prefix, params.indexFromEnd(-1));
		return true;
	},
	irc_PART: function(prefix, params) {
		// console.log("PART: ", prefix, params[0], params[1]);
		return true;
	},
	irc_KICK: function(prefix, params) {
		let nick_box = document.getElementById("chat-nick");
		if (nick_box.value == params[1]) {
            if (['@', '+'].indexOf(nick_box.value[0]) > -1)
                nick_box.value = nick_box.value.slice(1);
		    toggle_chat_input_ui('kicked');
		    window['IRC_CHANNELS_JOINED'] = window['IRC_CHANNELS_JOINED'].filter(channel => channel !== params[0]);
		    console.log(window['IRC_CHANNELS_JOINED']);
		}
		// TODO: add a kick timer for the channel, don't allow rejoin until it's over
		console.log("KICK: ", prefix, params[0], params[1], params[2]);
		return true;
	},
	irc_PING: function(prefix, params) {
		this.send("PONG :" + params.indexFromEnd(-1));
		return true;
	},
	irc_JOIN: function(prefix, params) {
		console.log("JOIN: ", prefix, prefix.hostToNick(), params[0]);
		return true;
	},
	irc_TOPIC: function(prefix, params) {
		// console.log("CHANGETOPIC: ", prefix, params[0], params.indexFromEnd(-1));
		return true;
	},
	processCTCP: function(message) {
		if (message.charAt(0) != "\x01")
			return;
		if (message.charAt(message.length - 1) == "\x01") {
			message = message.substr(1, message.length - 2);
		} else {
			message = message.substr(1);
		}
		return message.splitMax(" ", 2);
	},
	irc_PRIVMSG: function(prefix, params) {
	    // TODO: track client's messages and prevent sends if duplicate, match ingest
		var user = prefix;
		var target = params[0];
		var message = params.indexFromEnd(-1);

		var ctcp = this.processCTCP(message);
		if (ctcp) {
			var type = ctcp[0].toUpperCase();

			var replyfn = qwebirc.irc.RegisteredCTCPs[type];
			if (replyfn) {
				var t = new Date().getTime() / 1000;
				if (t > this.nextctcp)
					this.send("NOTICE " + user.hostToNick() + " :\x01" + type + " " + replyfn(ctcp[1]) + "\x01");
				this.nextctcp = t + 5;
			}

			var args = ctcp[1];
			if (target == this.nickname) {
				var nick = user.hostToNick();
				var host = user.hostToHost();
				if (type == "ACTION") {
				  console.log("PRIVACTION: ", nick, {"m": args, "x": type, "h": host, "n": nick}, true);
				  return;
				}

				console.log("PRIVCTCP: ", nick, {"m": args, "x": type, "h": host, "n": nick, "-": this.nickname});
			} else {
				if (type == "ACTION") {
					console.log("CHANACTION: ", target, user, {"m": args, "c": channel});
					return;
				}
				console.log("CHANCTCP: ", target, user, {"x": type, "m": args, "c": channel,});
			}
		} else {
			if (target == this.nickname) {
				console.log("PRIVMSG: ", nick, {"m": message, "h": user.hostToHost(), "n": user.hostToNick()}, true);
			} else {
				console.log("CHANMSG: ", target, user, {"m": message});
			}
		}
		return true;
	},
	irc_NOTICE: function(prefix, params) {
		var user = prefix;
		var target = params[0];
		var message = params.indexFromEnd(-1);
		if ((user == "") || (user.indexOf("!") == -1)) {
			if (user == "") {
				console.log("SERVERNOTICE", {"m": message});
			} else {
				console.log("PRIVNOTICE", {"m": message, "n": user});
			}
		} else if (target == this.nickname) {
			var ctcp = this.processCTCP(message);
			if (ctcp) {
				var nick = user.hostToNick();
				var host = user.hostToHost();
				if (args == undefined) args = "";
				console.log(nick, "CTCPREPLY", {"m": args, "x": type, "h": host, "n": nick, "-": this.nickname});
			} else {
				var nick = user.hostToNick();
				var host = user.hostToHost();
		  		console.log("PRIVNOTICE: ", nick, {"m": message, "h": host, "n": nick});
			}
		} else {
			console.log("CHANNOTICE: ", target, user, {"m": message});
		}

		return true;
	},
	irc_INVITE: function(prefix, params) {
		// console.log("INVITE: ", user, channel);
		return true;
	},
	irc_ERROR: function(prefix, params) {
		// console.log("ERROR: ", params.indexFromEnd(-1));
		return true;
	},
	irc_MODE: function(prefix, params) {
		console.log("MODE: ", prefix, params[0], [], params.slice(1));
		if (params.slice(1).indexOf('+i') > -1)
		    window['IRC_MASK'] = prefix;
		let active_channel = document.querySelector('.chat-active-channel').innerText;
        let modes = params[1];
		let symbol = "";
		let action = {};
		let sorted_modes = [];
		for (var i = 0; i < modes.length; i++) {
		    if (!/^[a-zA-Z]+$/.test(modes[i])) {
		        if (JSON.stringify(action) != '{}') {
		            sorted_modes.push(action);
		            action = {};
		        }
		        if (Object.keys(action).indexOf(modes[i]) == -1) {
		            action[modes[i]] = [];
		        }
		        symbol = modes[i];
		    } else {
		        action[symbol].push(modes[i])
		    }
		}
		sorted_modes.push(action);

        let who = [];
        if (sorted_modes.length > 0) {
            who = params.slice(2);
        }

        if (sorted_modes.length == 1 && who.length > 1) {
            let reorganize_modes = [];
            for (var o = 0; o < sorted_modes.length; o++) {
                for (var m = 0; m < Object.keys(sorted_modes[o]).length; m++) {
                    let data = {};
                    data[Object.keys(sorted_modes[o])[m]] = sorted_modes[o][Object.keys(sorted_modes[o])[m]];
                    reorganize_modes.push(data);
                }
            }
            modes = reorganize_modes;
        } else {
            modes = sorted_modes;
        }

        for (var o = 0; o < modes.length; o++) {
            for (var m = 0; m < Object.keys(modes[o]).length; m++) {
                let operator = Object.keys(modes[o])[m];
                for (var n = 0; n < modes[o][operator].length; n++) {
                    let nick_box = document.getElementById("chat-nick");
                    if (modes[o][operator][n] == 'b') {
                        if (match_mask(who[n], window['IRC_MASK'])) {
                            console.log(params[0]);
                            if (window['IRC_BANNED'] == null) {
                                window['IRC_BANNED'] = [];
                            }
                            if (operator == '+') {
                                window['IRC_BANNED'].push(params[0]);
                                toggle_chat_input_ui('banned');
                            } else if (operator == '-') {
                                window['IRC_BANNED'] = window['IRC_BANNED'].filter(channel => channel !== params[0]);
                                toggle_chat_input_ui(true);
                            }
                        }
                    } else if (modes[o][operator][n] == 'o') {
                        if (window['IRC_CHANNEL_OPS'] == null)
                            window['IRC_CHANNEL_OPS'] = [];
                        if (operator == '+' && nick_box.value[0] != '@') {
                            window['IRC_CHANNEL_OPS'].push(params[0])
                            if (active_channel == params[0])
                                nick_box.value = `@${nick_box.value}`;
                        } else {
                            if (window['IRC_CHANNEL_OPS'].length == 0) continue
                            if (nick_box.value[0] == '@') {
                                window['IRC_CHANNEL_OPS'] = window['IRC_CHANNEL_OPS'].filter(channel => channel !== params[0]);
                                if (active_channel == params[0])
                                    nick_box.value = `${nick_box.value.slice(1)}`;
                            }
                        }
                    } else if (modes[o][operator][n] == 'v') {
                        if (window['IRC_CHANNEL_VOICES'] == null)
                            window['IRC_CHANNEL_VOICES'] = [];
                        if (operator == '+' && nick_box.value[0] != '+') {
                            window['IRC_CHANNEL_VOICES'].push(params[0])
                            if (active_channel == params[0])
                                nick_box.value = `+${nick_box.value}`;
                        } else {
                            if (window['IRC_CHANNEL_VOICES'].length == 0) continue
                            if (nick_box.value[0] == '+') {
                                window['IRC_CHANNEL_VOICES'] = window['IRC_CHANNEL_OPS'].filter(channel => channel !== params[0]);
                                if (active_channel == params[0])
                                    nick_box.value = `${nick_box.value.slice(1)}`;
                            }
                        }
                    }
                }
            }
        }
		return true;
	},
	irc_RPL_ISUPPORT: function(prefix, params) {
		return true;
	},
	irc_RPL_NAMREPLY: function(prefix, params) {
		return true;
	},
	irc_RPL_ENDOFNAMES: function(prefix, params) {
		return true;
	},
	irc_RPL_NOTOPIC: function(prefix, params) {
		// console.log("TOPIC", params[1], "");
		return true;
	},
	irc_RPL_TOPIC: function(prefix, params) {
		// console.log("TOPIC: ", params[1], params.indexFromEnd(-1));
		return true;
	},
	irc_RPL_TOPICWHOTIME: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISUSER: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISSERVER: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISOPERATOR: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISIDLE: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISCHANNELS: function(prefix, params) {
	    let channels = params[2].split(' ');
	    let channels_formatted = [];
	    for (var i = 0; i < channels.length; i++) {
	        let channel = channels[i];
	        if (['@', '+'].indexOf(channel[0]) > -1) channel = channel.slice(1);
	        channels_formatted.push(channel);
	    }
        channels_formatted.sort();
        show_modal(`<h2>${window['CONTEXT_MENU_TARGET'].children[1].title} is currently in:</h2><p>${channels_formatted.join('<br>')}</p>`);
		return true;
	},
	irc_RPL_WHOISACCOUNT: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISACTUALLY: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISOPERNAME: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISGENERICTEXT: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISWEBIRC: function(prefix, params) {
		return true;
	},
	irc_RPL_WHOISSECURE: function(prefix, params) {
		return true;
	},
	irc_RPL_ENDOFWHOIS: function(prefix, params) {
		return true;
	},
	irc_genericError: function(prefix, params) {
		console.log(params[1], params.indexFromEnd(-1));
		return true;
	},
	irc_genericQueryError: function(prefix, params) {
		console.log(params[1], params.indexFromEnd(-1));
		return true;
	},
	setupGenericErrors: function() {
		this.irc_ERR_CHANOPPRIVSNEEDED = this.irc_ERR_CANNOTSENDTOCHAN = this.irc_genericError;
		this.irc_ERR_NOSUCHNICK = this.irc_genericQueryError;
		return true;
	},
	irc_RPL_AWAY: function(prefix, params) {
		return true;
	},
	irc_RPL_NOWAWAY: function(prefix, params) {
		return true;
	},
	irc_RPL_UNAWAY: function(prefix, params) {
		return true;
	},
	irc_WALLOPS: function(prefix, params) {
		return true;
	},
	irc_RPL_CREATIONTIME: function(prefix, params) {
		return true;
	},
	irc_RPL_CHANNELMODEIS: function(prefix, params) {
		return true;
	}
});

qwebirc.irc.BaseCommandParser = new Class({
	initialize: function(parentObject) {
		this.send = parentObject.send;
		this.parentObject = parentObject;
	},
	dispatch: function(line) {
		if (line.length == 0)
			return;
		if (line.charAt(0) != "/")
			line = "/SAY " + line;
		var line = line.substr(1);
		var allargs = line.splitMax(" ", 2);
		var command = allargs[0].toUpperCase();
		var args = allargs[1];
		var aliascmd = this.aliases[command];
		if (aliascmd)
			command = aliascmd;
		for(;;) {
			var cmdopts = this["cmd_" + command];
			if (!cmdopts) {
				return;
			}
			var activewin = cmdopts[0];
			var splitargs = cmdopts[1];
			var minargs = cmdopts[2];
			var fn = cmdopts[3];
			if ((splitargs != undefined) && (args != undefined))
				args = args.splitMax(" ", splitargs);

			if ((minargs != undefined) && (
					 ((args != undefined) && (minargs > args.length)) ||
					 ((args == undefined) && (minargs > 0))
				 )) {
				console.log("Insufficient arguments for command.");
				return;
			}
			var ret = fn.run([args], this);
			if (ret == undefined)
				return;
			command = ret[0];
			args = ret[1];
		}
	},
});

qwebirc.irc.Commands = new Class({
	Extends: qwebirc.irc.BaseCommandParser,
	initialize: function(parentObject) {
		this.parent(parentObject);
		this.aliases = {
			"J": "JOIN",
			"K": "KICK",
			"MSG": "PRIVMSG",
			"Q": "QUERY",
			"BACK": "AWAY",
			"PRIVACY": "PRIVACYPOLICY",
			"HOP": "CYCLE"
		};
	},

	/* [require_active_window, splitintoXargs, minargs, function] */
	cmd_ME: [true, undefined, undefined, function(args) {
		if (args == undefined)
			args = "";
	    let chat_status = document.querySelector("div.chat-status span.chat-active-channel");
	    let channel = chat_status.innerText.trim();
		if (!this.send("PRIVMSG " + channel + " :\x01ACTION " + args + "\x01")) return;
		console.log("PRIVMSG: ", channel, "ACTION", args, {});
	}],
	cmd_CTCP: [false, 3, 2, function(args) {
		var target = args[0];
		var type = args[1].toUpperCase();
		var message = args[2];

		if (message == undefined)
			message = "";

		if (message == "") {
			if (!this.send("PRIVMSG " + target + " :\x01" + type + "\x01"))
				return;
		} else {
			if (!this.send("PRIVMSG " + target + " :\x01" + type + " " + message + "\x01"))
				return;
		}

		console.log(target, "CTCP", message, {"x": type});
	}],
	cmd_PRIVMSG: [false, 2, 2, function(args) {
	    let chat_status = document.querySelector("div.chat-status span.chat-active-channel");
	    let channel = chat_status.innerText.trim();
	    console.log(channel);
		if (this.send("PRIVMSG " + channel + " :" + args[1]))
            console.log("PRIVMSG " + channel + " :" + args[1]);
//		    return;
//			 console.log("PRIVMSG: ", channel, args[1], {});
	}],
	cmd_NOTICE: [false, 2, 2, function(args) {
		if (this.send("NOTICE " + args[0] + " :" + args[1]))
		    return;
			// console.log(args[0], "NOTICE", args[1]);
	}],
	cmd_QUERY: [false, 2, 1, function(args) {
		if (args[0].charAt(0) != '#') {
			console.log("Can't target a channel with this command.");
			return;
		}
		this.parentObject.newWindow(args[0], qwebirc.ui.WINDOW_QUERY, true);
		if ((args.length > 1) && (args[1] != ""))
			return ["SAY", args[1]];
	}],
	cmd_SAY: [true, undefined, undefined, function(args) {
		if (args == undefined)
			args = "";
		let channel = document.querySelector(".chat-active-channel").innerText;
		return ["PRIVMSG", channel + " " + args]
	}],
	cmd_LOGOUT: [false, undefined, undefined, function(args) {
		this.parentObject.ui.logout();
	}],
	cmd_QUOTE: [false, 1, 1, function(args) {
		this.send(args[0]);
	}],
	cmd_KICK: [true, 2, 1, function(args) {
		var channel = document.querySelector(".chat-active-channel").innerText;

		var message = "";
		var target = args[0];

		if (args.length == 2)
			message = args[1];

		this.send("KICK " + channel + " " + target + " :" + message);
	}],
	cmd_NICK: [true, 6, 1, function(args) {
	    let mask = window['IRC_MASK'].split('!');
	    window['IRC_MASK'] = `${args[0]}!${mask[1]}`;
	    console.log(window['IRC_MASK']);
		this.send("NICK " + args[0]);
	}],
	automode: function(direction, mode, args) {
	    let chat_status = document.querySelector("div.chat-status span.chat-active-channel");
	    let channel = chat_status.innerText.trim();

		var modes = direction;
		for(var i=0;i<args.length;i++)
			modes = modes + mode;

		this.send("MODE " + channel + " " + modes + " " + args.join(" "));
	},
	cmd_OP: [true, 6, 1, function(args) {
		this.automode("+", "o", args);
	}],
	cmd_DEOP: [true, 6, 1, function(args) {
		this.automode("-", "o", args);
	}],
	cmd_VOICE: [true, 6, 1, function(args) {
		this.automode("+", "v", args);
	}],
	cmd_DEVOICE: [true, 6, 1, function(args) {
		this.automode("-", "v", args);
	}],
	cmd_TOPIC: [true, 1, 1, function(args) {
		this.send("TOPIC " + sessionStorage.getItem("IRC_CHANNEL") + " :" + args[0]);
	}],
	cmd_AWAY: [false, 1, 0, function(args) {
		this.send("AWAY :" + (args ? args[0] : ""));
	}],
	cmd_QUIT: [false, 1, 0, function(args) {
		this.send("QUIT :" + (args ? args[0] : ""));
        window["IRC_CONNECTED"] = '0';
        toggle_chat_input_ui(false);
        sessionStorage.setItem("IRC_RECONNECT_TIMER", Date.now() + (33 * 1000));
        //sessionStorage.setItem("IRC_REJOIN_TIMER_", Date.now() + (33 * 1000));
	}],
	cmd_CYCLE: [true, 1, 0, function(args) {
		let channel = sessionStorage.getItem("IRC_CHANNEL");
		this.send("PART " + channel + " :" + (args ? args[0] : "Rejoining..."));
		this.send("JOIN " + channel);
	}],
	cmd_JOIN: [false, 2, 1, function(args) {
		var channels = args.shift();
		channels = channels.split(",");
		let joining = [];
		for (let i = 0; i < channels.length; i++) {
            if (window['IRC_CHANNELS_JOINED'].indexOf(channels[i]) == -1) {
                window['IRC_CHANNELS_JOINED'].push(channels[i]);
                joining.push(channels[i]);
            }
		}
		channels = joining.join(",").trim();
		if (channels != '') {
		    this.send("JOIN " + channels);
            toggle_chat_input_ui(true);
		}
	}],
	cmd_UMODE: [false, 1, 0, function(args) {
		this.send("MODE " + sessionStorage.getItem("IRC_NICKNAME") + (args?(" " + args[0]):""));
	}],
	cmd_AUTOJOIN: [false, undefined, undefined, function(args) {
		return ["JOIN", this.parentObject.options.autojoin];
	}],
	cmd_PART: [false, 2, 0, function(args) {
		// let active_channel = document.querySelector('.chat-active-channel').innerText;
		// this.send("PART " + active_channel + " :" + (args ? args[0] : ""));
        // toggle_chat_input_ui('parted');
        // window['IRC_CHANNELS_JOINED'] = window['IRC_CHANNELS_JOINED'].filter(channel => channel !== active_channel);
	}],
	cmd_WHOIS: [false, 1, 0, function(args) {
		this.send("WHOIS " + (args ? args[0] : ""));
	}]
});

qwebirc.irc.IRCClient = new Class({
	Extends: qwebirc.irc.BaseIRCClient,
	options: {
		nickname: "awebirc",
		autojoin: "",
		maxnicks: 10
	},
	initialize: function(options, ui) {
		this.parent(options);
		this.ui = ui;
		this.windows = {};
		this.commandparser = new qwebirc.irc.Commands(this);
		this.exec = this.commandparser.dispatch.bind(this.commandparser);
		this.statusWindow = this.ui.newClient(this);
	},
	getWindow: function(name) {
		return this.windows[this.toIRCLower(name)];
	},
	newWindow: function(name, type, select) {
		var w = this.getWindow(name);
		if (!w) {
			w = this.windows[this.toIRCLower(name)] = this.ui.newWindow(this, type, name);
		}
		if (select)
			this.ui.selectWindow(w);
		return w;
	},
	getActiveWindow: function() {
		return this.ui.getActiveIRCWindow(this);
	},
	disconnected: function(message) {
		for(var x in this.windows) {
			var w = this.windows[x];
			if (w.type == qwebirc.ui.WINDOW_CHANNEL)
				w.close();
		}
		this.tracker = undefined;

		qwebirc.connected = false;
		window["IRC_CONNECTED"] = '0';
		toggle_chat_input_ui(false);
        sessionStorage.setItem("IRC_RECONNECT_TIMER", Date.now() + (33 * 1000));

		console.log("DISCONNECT", {"m": message});
	},
	connected: function() {
		qwebirc.connected = true;
		window["IRC_CONNECTED"] = "1";
		//toggle_chat_input_ui(true);
		console.log("CONNECT");
	},
	quit: function(message) {
		this.send("QUIT :" + message, true);
		this.disconnect();
	},
	disconnect: function() {
		this.parent();
	},
});

function splitMax(str, sep, max) {
	var tmp = str.split(sep, max)
	var txt = tmp.join(sep)
	var rest = str.replace(txt, '').replace(sep, '')
	tmp.push(rest)
	return tmp
}

var IRCParser = function(socket) {
	var self = this
	var leftOver = ''

	self.socket = socket;

	self.parsePacket = function(data, userData) {
		leftOver += data
		var messages = leftOver.split(/\n/)
		for(i in messages) {
			var message = messages[i]
			var omessage = message

			if (message.substr(-1) == '\r') {
				message = message.replace('\r', '')

				var source = null
				var parts = null

				if (message[0] == ':') {
					parts = splitMax(message, ' ', 1)
					source = parts[0].substr(1)
					message = parts[1]
				}

				parts = splitMax(message, ' ', 1)

				var command = '';

				if (parts.length == 1) {
					command = parts[0]
					message = undefined
				} else {
					command = parts[0]
					message = parts[1]
				}

				var params = []

				while(message && message[0] != ':') {
					var middle = splitMax(message, ' ', 1)
					params.push(middle[0])
					if (middle.length > 1) {
					  message = middle[1]
					} else {
					  message = null
					}
				}

				if (message && message[0] == ':')
					params.push(message.substr(1))

				var rawcommand = command.toUpperCase()

				self.unhandled(rawcommand, [source, params], userData)
			} else {
				leftOver = message
				break
			}
		}
	}
}

IRCParser.prototype.write = function(data) {
	if (this.socket.write) {
		this.socket.write(data)
	} else {
		this.socket.send(data)
	}
}

IRCParser.prototype.sendMessage = function (msg) {
	this.write(msg + '\r\n');
}


qwebirc.ui.WINDOW_STATUS =   0x01;
qwebirc.ui.WINDOW_QUERY =	0x02;
qwebirc.ui.WINDOW_CHANNEL =  0x04;
qwebirc.ui.WINDOW_CUSTOM =   0x08;
// qwebirc.ui.WINDOW_CONNECT =  0x10;
qwebirc.ui.WINDOW_MESSAGES = 0x20;

qwebirc.ui.CUSTOM_CLIENT = "ATROPA";

qwebirc.ui.BaseUI = new Class({
	Implements: [Events],
	initialize: function(parentElement, windowClass, uiName, options) {
		this.options = options;

		this.windows = {};
		this.clients = {};
		this.windows[qwebirc.ui.CUSTOM_CLIENT] = {};
		this.windowArray = [];
		this.windowClass = windowClass;
	},
	newClient: function(client) {
		var w = this.newWindow(client, qwebirc.ui.WINDOW_STATUS, "Status");
		this.selectWindow(w);
		return w;
	},
	getClientId: function(client) {
		return qwebirc.ui.CUSTOM_CLIENT;
	},
	getWindowIdentifier: function(client, type, name) {
		if (type == qwebirc.ui.WINDOW_MESSAGES)
			return "-M";
		if (type == qwebirc.ui.WINDOW_STATUS)
			return "";

		if (client == qwebirc.ui.CUSTOM_CLIENT) /* HACK */
			return "_" + name;

		return "_" + client.toIRCLower(name);
	},
	newWindow: function(client, type, name) {
		var w = this.getWindow(client, type, name);
		if ($defined(w))
			return w;

		var wId = this.getWindowIdentifier(client, type, name);
		var w = this.windows[this.getClientId(client)][wId] = new this.windowClass(this, client, type, name, wId);
		this.windowArray.push(w);

		return w;
	},
	getWindow: function(client, type, name) {
		var c = this.windows[this.getClientId(client)];
		if (!$defined(c))
			return null;

		return c[this.getWindowIdentifier(client, type, name)];
	},
	getActiveWindow: function() {
		return this.active;
	},
	getActiveIRCWindow: function(client) {
		if (!this.active || this.active.type == qwebirc.ui.WINDOW_CUSTOM) {
			return this.windows[this.getClientId(client)][this.getWindowIdentifier(client, qwebirc.ui.WINDOW_STATUS)];
		} else {
			return this.active;
		}
	},
	__setActiveWindow: function(window) {
		this.active = window;
	},
	selectWindow: function(window) {
		window.select();
	},
});


qwebirc.ui.NewLoginUI = new Class({
	Extends: qwebirc.ui.BaseUI,
	loginBox: function(callbackfn) {
		this.postInitialize();
		qwebirc.ui.LoginBox(document.body, callbackfn);
	}
});


qwebirc.ui.RootUI = qwebirc.ui.NewLoginUI;

qwebirc.ui.MAXIMUM_LINES_PER_WINDOW = 1000;

qwebirc.ui.Window = new Class({
	Implements: [Events],
	initialize: function(parentObject, client, type, name, identifier) {
		this.parentObject = parentObject;
		this.type = type;
		this.name = name;
		this.active = false;
		this.client = client;
		this.identifier = identifier;
		this.subWindow = null;
		this.closed = false;
	},
	close: function() {
		this.closed = true;
		this.fireEvent("close", this);
	},
	select: function() {
		this.parentObject.__setActiveWindow(this);
	},
	deselect: function() {
		this.active = false;
	},
	historyExec: function(line) {
		this.client.exec(line);
	},

});


qwebirc.ui.LoginBox = function(parentElement, callback) {
	var form = document.createElement("form");
	form.id = "login";
	form.style = "display:none;position:absolute;top:0;left:0;";
	document.body.appendChild(form)
	var connbutton = document.createElement("button");
	connbutton.id = "connect-to-irc";
	form.append(connbutton);
	form.addEvent("submit", function(e) {
		new Event(e).stop();
		callback({
			"nickname": document.querySelector("#chat-nick").value,
			"autojoin": document.querySelector(".chat-active-channel").innerText
		});
	}.bind(this));
}


qwebirc.ui.Interface = new Class({
	Implements: [Options],
	initialize: function(element, ui, options) {
		this.setOptions(options);
		window.addEvent("domready", function() {
			var callback = function(options) {
				var IRC = new qwebirc.irc.IRCClient(options, ui_);
                console.log(options);
                console.log(ui_);
				IRC.connect();
				window.onbeforeunload = () => {
					// ask if they want to close their connection
					if (window["IRC_CONNECTED"] == '1') {
						var message = "This action will close all active IRC connections.";
						var e = e || window.event;
						if (e) e.returnValue = message;
						return message;
					}
				};
				window.addEvent("unload", function() {
                    sessionStorage.setItem("IRC_RECONNECT_TIMER", Date.now() + (33 * 1000));
					IRC.quit("Page closed");
				});
			};
			// default nick
			if (sessionStorage.getItem("IRC_NICKNAME") == undefined) {
				sessionStorage.setItem("IRC_NICKNAME", generate_nickname());
			}
			// default channels
			if (window['IRC_CHANNELS_JOINED'] == null) {
				window['IRC_CHANNELS_JOINED'] = [];
			}
			var ui_ = new ui(document.querySelector(element), null, null);
			var details = ui_.loginBox(callback);
		}.bind(this));
	},
});


qwebirc.ui.QUI = new Class({
	Extends: qwebirc.ui.RootUI,
	initialize: function(parentElement, theme, options) {
		this.parent(parentElement, qwebirc.ui.Window, "qui", options);
	},
	postInitialize: function() {
        if (parseInt(sessionStorage.getItem("IRC_RECONNECT_TIMER")) > 0) {
            button_count_down('start', (sessionStorage.getItem("IRC_RECONNECT_TIMER") - Date.now()) / 1000);
        }
		var nick_box = document.getElementById("chat-nick");
		var input_box = document.getElementById("chat-input-message");
		this.input_box = input_box;
		this.input_box.maxLength = 470;
		let nick = sessionStorage.getItem("IRC_NICKNAME") || '';
		if (['@', '+'].indexOf(nick[0]) > -1) {
		    nick = nick.slice(1);
		}
		nick_box.value = nick;
		var sendInput = function() {
		    let form = document.getElementById('chat-input');
		    let button = form.querySelector('button');
		    if (button.innerText.indexOf('⏎') == -1) {
		        return false;
		    } else if (window["IRC_CONNECTED"] == '1') {
				this.getActiveWindow().historyExec(input_box.value);
			} else {
				// format autojoin channels
                let channels = document.querySelector(".chat-active-channel").innerText;
                if (channels.indexOf(' ') > -1) {
                    channels = channels.split(' ');
                } else if (channels.indexOf(',') > -1) {
                    channels = channels.split(',');
                }
                if (!Array.isArray(channels)) {
                    channels = [channels];
                }
                for (var i = 0; i < channels.length; i++) {
                    if (channels[i] == '#' || !channels[i]) continue
                    if (!channels[i].startsWith('#')) {
                        channels[i] = `#${channels[i]}`;
                    }
                }
                channels = channels.join(',');
                if (!channels) {
                    console.log("Invalid autojoin channels: ", channels);
                    return
                }


				var nickname = nick_box.value;
				if (!nickname) {
				  show_modal("Choose a nickname");
				  return;
				  //nick_box.value = generate_nickname()
				}
				function validate_nickname(nickname, replace = false) {
					let search = /[\s\t,\;:\.\!\(\)\[\]\{\}\'\"@+]/g;
					if (search.test(nickname)) {
                        if (replace) {
                            nickname = nickname.replace(search, '-');
                        } else {
                            return { "message": "Your nickname was invalid and has been corrected; please check your altered nickname and press Connect again." };
                        }
					}
                    let starting_character = /^[a-zA-Z0-9_]+$/;
                    if (!starting_character.test(nickname[0])) {
                        nickname = nickname.slice(1);
                        return { "nick": nickname, "message": "Your nickname was invalid and has been corrected; please check your altered nickname and press Connect again." };
                    }
                    return true;
				}
				var validated_nickname = validate_nickname(nick_box.value, true);
				if (validated_nickname.nick != null && nick_box.value != validated_nickname.nick) {
					nick_box.value = validated_nickname.nick;
				}
				if (validated_nickname.message != null) {
		    		alert(validated_nickname.message);
		    		return false;
				}
                sessionStorage.setItem("IRC_NICKNAME", nick_box.value);
                if (sessionStorage.getItem("IRC_RECONNECT_TIMER") == null) sessionStorage.setItem("IRC_RECONNECT_TIMER", 0);
//                if (sessionStorage.getItem("IRC_RECONNECT_TIMER") > current_timestamp) {
//                    show_modal(`Cooldown remaining: ${(sessionStorage.getItem("IRC_RECONNECT_TIMER") - current_timestamp) / 1000} seconds`);
//                } else
                if (window["IRC_CONNECTED_ONCE"] != '1' && sessionStorage.getItem("IRC_RECONNECT_TIMER") == '0') {
				    document.getElementById('connect-to-irc').click();
                    button_loading('start');
                } else if (extract_hash_from_url() != 'reconnect') {
                    window.location.href += "#reconnect";
                } else {
                    window.location.reload();
                }
			}
			input_box.value = "";
		}.bind(this);

		if (!qwebirc.util.deviceHasKeyboard()) {
			input_box.addClass("mobile-input");
			var input_button = new Element("input", {type: "button"});
			input_button.addClass("mobile-button");
			input_button.addEvent("click", function() {
				sendInput();
				input_box.focus();
			});
			input_button.value = ">";
			this.input.appendChild(input_button);
		} else {
			input_box.addClass("keyboard-input");
		}
		var form = document.getElementById("chat-input");
		form.addEvent("submit", function(e) {
			new Event(e).stop();
			sendInput();
		});

	},
});

window["IRC_CONNECTED"] = '0';
window["IRC_CONNECTED_ONCE"] = "0";
var ui = new qwebirc.ui.Interface("IRC", qwebirc.ui.QUI, {});













































/*


	DO NOT TOUCH


*/
!function(e) {if ("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if ("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.io=e()}}(function() {var define,module,exports;return (function e(t,n,r) {function s(o,u) {if (!n[o]) {if (!t[o]) {var a=typeof require=="function"&&require;if (!u&&a)return a(o,!0);if (i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e) {var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports) {

module.exports = _dereq_('./lib/');

},{"./lib/":2}],2:[function(_dereq_,module,exports) {

/**
 * Module dependencies.
 */

var url = _dereq_('./url');
var parser = _dereq_('socket.io-parser');
var Manager = _dereq_('./manager');
var debug = _dereq_('debug')('socket.io-client');

/**
 * Module exports.
 */

module.exports = exports = lookup;

/**
 * Managers cache.
 */

var cache = exports.managers = {};

/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @api public
 */

function lookup(uri, opts) {
	if (typeof uri == 'object') {
		opts = uri;
		uri = undefined;
	}

	opts = opts || {};

	var parsed = url(uri);
	var source = parsed.source;
	var id = parsed.id;
	var io;

	if (opts.forceNew || opts['force new connection'] || false === opts.multiplex) {
		debug('ignoring socket cache for %s', source);
		io = Manager(source, opts);
	} else {
		if (!cache[id]) {
			debug('new io instance for %s', source);
			cache[id] = Manager(source, opts);
		}
		io = cache[id];
	}

	return io.socket(parsed.path);
}

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = parser.protocol;

/**
 * `connect`.
 *
 * @param {String} uri
 * @api public
 */

exports.connect = lookup;

/**
 * Expose constructors for standalone build.
 *
 * @api public
 */

exports.Manager = _dereq_('./manager');
exports.Socket = _dereq_('./socket');

},{"./manager":3,"./socket":5,"./url":6,"debug":10,"socket.io-parser":46}],3:[function(_dereq_,module,exports) {

/**
 * Module dependencies.
 */

var url = _dereq_('./url');
var eio = _dereq_('engine.io-client');
var Socket = _dereq_('./socket');
var Emitter = _dereq_('component-emitter');
var parser = _dereq_('socket.io-parser');
var on = _dereq_('./on');
var bind = _dereq_('component-bind');
var object = _dereq_('object-component');
var debug = _dereq_('debug')('socket.io-client:manager');
var indexOf = _dereq_('indexof');
var Backoff = _dereq_('backo2');

/**
 * Module exports
 */

module.exports = Manager;

/**
 * `Manager` constructor.
 *
 * @param {String} engine instance or engine uri/opts
 * @param {Object} options
 * @api public
 */

function Manager(uri, opts) {
	if (!(this instanceof Manager)) return new Manager(uri, opts);
	if (uri && ('object' == typeof uri)) {
		opts = uri;
		uri = undefined;
	}
	opts = opts || {};

	opts.path = opts.path || '/socket.io';
	this.nsps = {};
	this.subs = [];
	this.opts = opts;
	this.reconnection(opts.reconnection !== false);
	this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
	this.reconnectionDelay(opts.reconnectionDelay || 1000);
	this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
	this.randomizationFactor(opts.randomizationFactor || 0.5);
	this.backoff = new Backoff({
		min: this.reconnectionDelay(),
		max: this.reconnectionDelayMax(),
		jitter: this.randomizationFactor()
	});
	this.timeout(null == opts.timeout ? 20000 : opts.timeout);
	this.readyState = 'closed';
	this.uri = uri;
	this.connected = [];
	this.encoding = false;
	this.packetBuffer = [];
	this.encoder = new parser.Encoder();
	this.decoder = new parser.Decoder();
	this.autoConnect = opts.autoConnect !== false;
	if (this.autoConnect) this.open();
}

/**
 * Propagate given event to sockets and emit on `this`
 *
 * @api private
 */

Manager.prototype.emitAll = function() {
	this.emit.apply(this, arguments);
	for (var nsp in this.nsps) {
		this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
	}
};

/**
 * Update `socket.id` of all sockets
 *
 * @api private
 */

Manager.prototype.updateSocketIds = function() {
	for (var nsp in this.nsps) {
		this.nsps[nsp].id = this.engine.id;
	}
};

/**
 * Mix in `Emitter`.
 */

Emitter(Manager.prototype);

/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnection = function(v) {
	if (!arguments.length) return this._reconnection;
	this._reconnection = !!v;
	return this;
};

/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionAttempts = function(v) {
	if (!arguments.length) return this._reconnectionAttempts;
	this._reconnectionAttempts = v;
	return this;
};

/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelay = function(v) {
	if (!arguments.length) return this._reconnectionDelay;
	this._reconnectionDelay = v;
	this.backoff && this.backoff.setMin(v);
	return this;
};

Manager.prototype.randomizationFactor = function(v) {
	if (!arguments.length) return this._randomizationFactor;
	this._randomizationFactor = v;
	this.backoff && this.backoff.setJitter(v);
	return this;
};

/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelayMax = function(v) {
	if (!arguments.length) return this._reconnectionDelayMax;
	this._reconnectionDelayMax = v;
	this.backoff && this.backoff.setMax(v);
	return this;
};

/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.timeout = function(v) {
	if (!arguments.length) return this._timeout;
	this._timeout = v;
	return this;
};

/**
 * Starts trying to reconnect if reconnection is enabled and we have not
 * started reconnecting yet
 *
 * @api private
 */

Manager.prototype.maybeReconnectOnOpen = function() {
	// Only try to reconnect if it's the first time we're connecting
	if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
		// keeps reconnection from firing twice for the same reconnection loop
		this.reconnect();
	}
};


/**
 * Sets the current transport `socket`.
 *
 * @param {Function} optional, callback
 * @return {Manager} self
 * @api public
 */

Manager.prototype.open =
Manager.prototype.connect = function(fn) {
	debug('readyState %s', this.readyState);
	if (~this.readyState.indexOf('open')) return this;

	debug('opening %s', this.uri);
	this.engine = eio(this.uri, this.opts);
	var socket = this.engine;
	var self = this;
	this.readyState = 'opening';
	this.skipReconnect = false;

	// emit `open`
	var openSub = on(socket, 'open', function() {
		self.onopen();
		fn && fn();
	});

	// emit `connect_error`
	var errorSub = on(socket, 'error', function(data) {
		debug('connect_error');
		self.cleanup();
		self.readyState = 'closed';
		self.emitAll('connect_error', data);
		if (fn) {
			var err = new Error('Connection error');
			err.data = data;
			fn(err);
		} else {
			// Only do this if there is no fn to handle the error
			self.maybeReconnectOnOpen();
		}
	});

	// emit `connect_timeout`
	if (false !== this._timeout) {
		var timeout = this._timeout;
		debug('connect attempt will timeout after %d', timeout);

		// set timer
		var timer = setTimeout(function() {
			debug('connect attempt timed out after %d', timeout);
			openSub.destroy();
			socket.close();
			socket.emit('error', 'timeout');
			self.emitAll('connect_timeout', timeout);
		}, timeout);

		this.subs.push({
			destroy: function() {
				clearTimeout(timer);
			}
		});
	}

	this.subs.push(openSub);
	this.subs.push(errorSub);

	return this;
};

/**
 * Called upon transport open.
 *
 * @api private
 */

Manager.prototype.onopen = function() {
	debug('open');

	// clear old subs
	this.cleanup();

	// mark as open
	this.readyState = 'open';
	this.emit('open');

	// add new subs
	var socket = this.engine;
	this.subs.push(on(socket, 'data', bind(this, 'ondata')));
	this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
	this.subs.push(on(socket, 'error', bind(this, 'onerror')));
	this.subs.push(on(socket, 'close', bind(this, 'onclose')));
};

/**
 * Called with data.
 *
 * @api private
 */

Manager.prototype.ondata = function(data) {
	this.decoder.add(data);
};

/**
 * Called when parser fully decodes a packet.
 *
 * @api private
 */

Manager.prototype.ondecoded = function(packet) {
	this.emit('packet', packet);
};

/**
 * Called upon socket error.
 *
 * @api private
 */

Manager.prototype.onerror = function(err) {
	debug('error', err);
	this.emitAll('error', err);
};

/**
 * Creates a new socket for the given `nsp`.
 *
 * @return {Socket}
 * @api public
 */

Manager.prototype.socket = function(nsp) {
	var socket = this.nsps[nsp];
	if (!socket) {
		socket = new Socket(this, nsp);
		this.nsps[nsp] = socket;
		var self = this;
		socket.on('connect', function() {
			socket.id = self.engine.id;
			if (!~indexOf(self.connected, socket)) {
				self.connected.push(socket);
			}
		});
	}
	return socket;
};

/**
 * Called upon a socket close.
 *
 * @param {Socket} socket
 */

Manager.prototype.destroy = function(socket) {
	var index = indexOf(this.connected, socket);
	if (~index) this.connected.splice(index, 1);
	if (this.connected.length) return;

	this.close();
};

/**
 * Writes a packet.
 *
 * @param {Object} packet
 * @api private
 */

Manager.prototype.packet = function(packet) {
	debug('writing packet %j', packet);
	var self = this;

	if (!self.encoding) {
		// encode, then write to engine with result
		self.encoding = true;
		this.encoder.encode(packet, function(encodedPackets) {
			for (var i = 0; i < encodedPackets.length; i++) {
				self.engine.write(encodedPackets[i]);
			}
			self.encoding = false;
			self.processPacketQueue();
		});
	} else { // add packet to the queue
		self.packetBuffer.push(packet);
	}
};

/**
 * If packet buffer is non-empty, begins encoding the
 * next packet in line.
 *
 * @api private
 */

Manager.prototype.processPacketQueue = function() {
	if (this.packetBuffer.length > 0 && !this.encoding) {
		var pack = this.packetBuffer.shift();
		this.packet(pack);
	}
};

/**
 * Clean up transport subscriptions and packet buffer.
 *
 * @api private
 */

Manager.prototype.cleanup = function() {
	var sub;
	while (sub = this.subs.shift()) sub.destroy();

	this.packetBuffer = [];
	this.encoding = false;

	this.decoder.destroy();
};

/**
 * Close the current socket.
 *
 * @api private
 */

Manager.prototype.close =
Manager.prototype.disconnect = function() {
	this.skipReconnect = true;
	this.backoff.reset();
	this.readyState = 'closed';
	this.engine && this.engine.close();
};

/**
 * Called upon engine close.
 *
 * @api private
 */

Manager.prototype.onclose = function(reason) {
	debug('close');
	this.cleanup();
	this.backoff.reset();
	this.readyState = 'closed';
	this.emit('close', reason);
	if (this._reconnection && !this.skipReconnect) {
		this.reconnect();
	}
};

/**
 * Attempt a reconnection.
 *
 * @api private
 */

Manager.prototype.reconnect = function() {
	if (this.reconnecting || this.skipReconnect) return this;

	var self = this;

	if (this.backoff.attempts >= this._reconnectionAttempts) {
		debug('reconnect failed');
		this.backoff.reset();
		this.emitAll('reconnect_failed');
		this.reconnecting = false;
	} else {
		var delay = this.backoff.duration();
		debug('will wait %dms before reconnect attempt', delay);

		this.reconnecting = true;
		var timer = setTimeout(function() {
			if (self.skipReconnect) return;

			debug('attempting reconnect');
			self.emitAll('reconnect_attempt', self.backoff.attempts);
			self.emitAll('reconnecting', self.backoff.attempts);

			// check again for the case socket closed in above events
			if (self.skipReconnect) return;

			self.open(function(err) {
				if (err) {
					debug('reconnect attempt error');
					self.reconnecting = false;
					self.reconnect();
					self.emitAll('reconnect_error', err.data);
				} else {
					debug('reconnect success');
					self.onreconnect();
				}
			});
		}, delay);

		this.subs.push({
			destroy: function() {
				clearTimeout(timer);
			}
		});
	}
};

/**
 * Called upon successful reconnect.
 *
 * @api private
 */

Manager.prototype.onreconnect = function() {
	var attempt = this.backoff.attempts;
	this.reconnecting = false;
	this.backoff.reset();
	this.updateSocketIds();
	this.emitAll('reconnect', attempt);
};

},{"./on":4,"./socket":5,"./url":6,"backo2":7,"component-bind":8,"component-emitter":9,"debug":10,"engine.io-client":11,"indexof":42,"object-component":43,"socket.io-parser":46}],4:[function(_dereq_,module,exports) {

/**
 * Module exports.
 */

module.exports = on;

/**
 * Helper for subscriptions.
 *
 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
 * @param {String} event name
 * @param {Function} callback
 * @api public
 */

function on(obj, ev, fn) {
	obj.on(ev, fn);
	return {
		destroy: function() {
			obj.removeListener(ev, fn);
		}
	};
}

},{}],5:[function(_dereq_,module,exports) {

/**
 * Module dependencies.
 */

var parser = _dereq_('socket.io-parser');
var Emitter = _dereq_('component-emitter');
var toArray = _dereq_('to-array');
var on = _dereq_('./on');
var bind = _dereq_('component-bind');
var debug = _dereq_('debug')('socket.io-client:socket');
var hasBin = _dereq_('has-binary');

/**
 * Module exports.
 */

module.exports = exports = Socket;

/**
 * Internal events (blacklisted).
 * These events can't be emitted by the user.
 *
 * @api private
 */

var events = {
	connect: 1,
	connect_error: 1,
	connect_timeout: 1,
	disconnect: 1,
	error: 1,
	reconnect: 1,
	reconnect_attempt: 1,
	reconnect_failed: 1,
	reconnect_error: 1,
	reconnecting: 1
};

/**
 * Shortcut to `Emitter#emit`.
 */

var emit = Emitter.prototype.emit;

/**
 * `Socket` constructor.
 *
 * @api public
 */

function Socket(io, nsp) {
	this.io = io;
	this.nsp = nsp;
	this.json = this; // compat
	this.ids = 0;
	this.acks = {};
	if (this.io.autoConnect) this.open();
	this.receiveBuffer = [];
	this.sendBuffer = [];
	this.connected = false;
	this.disconnected = true;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Subscribe to open, close and packet events
 *
 * @api private
 */

Socket.prototype.subEvents = function() {
	if (this.subs) return;

	var io = this.io;
	this.subs = [
		on(io, 'open', bind(this, 'onopen')),
		on(io, 'packet', bind(this, 'onpacket')),
		on(io, 'close', bind(this, 'onclose'))
	];
};

/**
 * "Opens" the socket.
 *
 * @api public
 */

Socket.prototype.open =
Socket.prototype.connect = function() {
	if (this.connected) return this;

	this.subEvents();
	this.io.open(); // ensure open
	if ('open' == this.io.readyState) this.onopen();
	return this;
};

/**
 * Sends a `message` event.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.send = function() {
	var args = toArray(arguments);
	args.unshift('message');
	this.emit.apply(this, args);
	return this;
};

/**
 * Override `emit`.
 * If the event is in `events`, it's emitted normally.
 *
 * @param {String} event name
 * @return {Socket} self
 * @api public
 */

Socket.prototype.emit = function(ev) {
	if (events.hasOwnProperty(ev)) {
		emit.apply(this, arguments);
		return this;
	}

	var args = toArray(arguments);
	var parserType = parser.EVENT; // default
	if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
	var packet = { type: parserType, data: args };

	// event ack callback
	if ('function' == typeof args[args.length - 1]) {
		debug('emitting packet with ack id %d', this.ids);
		this.acks[this.ids] = args.pop();
		packet.id = this.ids++;
	}

	if (this.connected) {
		this.packet(packet);
	} else {
		this.sendBuffer.push(packet);
	}

	return this;
};

/**
 * Sends a packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.packet = function(packet) {
	packet.nsp = this.nsp;
	this.io.packet(packet);
};

/**
 * Called upon engine `open`.
 *
 * @api private
 */

Socket.prototype.onopen = function() {
	debug('transport is open - connecting');

	// write connect packet if necessary
	if ('/' != this.nsp) {
		this.packet({ type: parser.CONNECT });
	}
};

/**
 * Called upon engine `close`.
 *
 * @param {String} reason
 * @api private
 */

Socket.prototype.onclose = function(reason) {
	debug('close (%s)', reason);
	this.connected = false;
	this.disconnected = true;
	delete this.id;
	this.emit('disconnect', reason);
};

/**
 * Called with socket packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onpacket = function(packet) {
	if (packet.nsp != this.nsp) return;

	switch (packet.type) {
		case parser.CONNECT:
			this.onconnect();
			break;

		case parser.EVENT:
			this.onevent(packet);
			break;

		case parser.BINARY_EVENT:
			this.onevent(packet);
			break;

		case parser.ACK:
			this.onack(packet);
			break;

		case parser.BINARY_ACK:
			this.onack(packet);
			break;

		case parser.DISCONNECT:
			this.ondisconnect();
			break;

		case parser.ERROR:
			this.emit('error', packet.data);
			break;
	}
};

/**
 * Called upon a server event.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onevent = function(packet) {
	var args = packet.data || [];
	debug('emitting event %j', args);

	if (null != packet.id) {
		debug('attaching ack callback to event');
		args.push(this.ack(packet.id));
	}

	if (this.connected) {
		emit.apply(this, args);
	} else {
		this.receiveBuffer.push(args);
	}
};

/**
 * Produces an ack callback to emit with an event.
 *
 * @api private
 */

Socket.prototype.ack = function(id) {
	var self = this;
	var sent = false;
	return function() {
		// prevent double callbacks
		if (sent) return;
		sent = true;
		var args = toArray(arguments);
		debug('sending ack %j', args);

		var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
		self.packet({
			type: type,
			id: id,
			data: args
		});
	};
};

/**
 * Called upon a server acknowlegement.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onack = function(packet) {
	debug('calling ack %s with %j', packet.id, packet.data);
	var fn = this.acks[packet.id];
	fn.apply(this, packet.data);
	delete this.acks[packet.id];
};

/**
 * Called upon server connect.
 *
 * @api private
 */

Socket.prototype.onconnect = function() {
	this.connected = true;
	this.disconnected = false;
	this.emit('connect');
	this.emitBuffered();
};

/**
 * Emit buffered events (received and emitted).
 *
 * @api private
 */

Socket.prototype.emitBuffered = function() {
	var i;
	for (i = 0; i < this.receiveBuffer.length; i++) {
		emit.apply(this, this.receiveBuffer[i]);
	}
	this.receiveBuffer = [];

	for (i = 0; i < this.sendBuffer.length; i++) {
		this.packet(this.sendBuffer[i]);
	}
	this.sendBuffer = [];
};

/**
 * Called upon server disconnect.
 *
 * @api private
 */

Socket.prototype.ondisconnect = function() {
	debug('server disconnect (%s)', this.nsp);
	this.destroy();
	this.onclose('io server disconnect');
};

/**
 * Called upon forced client/server side disconnections,
 * this method ensures the manager stops tracking us and
 * that reconnections don't get triggered for this.
 *
 * @api private.
 */

Socket.prototype.destroy = function() {
	if (this.subs) {
		// clean subscriptions to avoid reconnections
		for (var i = 0; i < this.subs.length; i++) {
			this.subs[i].destroy();
		}
		this.subs = null;
	}

	this.io.destroy(this);
};

/**
 * Disconnects the socket manually.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.close =
Socket.prototype.disconnect = function() {
	if (this.connected) {
		debug('performing disconnect (%s)', this.nsp);
		this.packet({ type: parser.DISCONNECT });
	}

	// remove socket from pool
	this.destroy();

	if (this.connected) {
		// fire events
		this.onclose('io client disconnect');
	}
	return this;
};

},{"./on":4,"component-bind":8,"component-emitter":9,"debug":10,"has-binary":38,"socket.io-parser":46,"to-array":50}],6:[function(_dereq_,module,exports) {
(function (global) {

/**
 * Module dependencies.
 */

var parseuri = _dereq_('parseuri');
var debug = _dereq_('debug')('socket.io-client:url');

/**
 * Module exports.
 */

module.exports = url;

/**
 * URL parser.
 *
 * @param {String} url
 * @param {Object} An object meant to mimic window.location.
 *				 Defaults to window.location.
 * @api public
 */

function url(uri, loc) {
	var obj = uri;

	// default to window.location
	var loc = loc || global.location;
	if (null == uri) uri = loc.protocol + '//' + loc.host;

	// relative path support
	if ('string' == typeof uri) {
		if ('/' == uri.charAt(0)) {
			if ('/' == uri.charAt(1)) {
				uri = loc.protocol + uri;
			} else {
				uri = loc.hostname + uri;
			}
		}

		if (!/^(https?|wss?):\/\//.test(uri)) {
			debug('protocol-less url %s', uri);
			if ('undefined' != typeof loc) {
				uri = loc.protocol + '//' + uri;
			} else {
				uri = 'https://' + uri;
			}
		}

		// parse
		debug('parse %s', uri);
		obj = parseuri(uri);
	}

	// make sure we treat `localhost:80` and `localhost` equally
	if (!obj.port) {
		if (/^(http|ws)$/.test(obj.protocol)) {
			obj.port = '80';
		}
		else if (/^(http|ws)s$/.test(obj.protocol)) {
			obj.port = '443';
		}
	}

	obj.path = obj.path || '/';

	// define unique id
	obj.id = obj.protocol + '://' + obj.host + ':' + obj.port;
	// define href
	obj.href = obj.protocol + '://' + obj.host + (loc && loc.port == obj.port ? '' : (':' + obj.port));

	return obj;
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"debug":10,"parseuri":44}],7:[function(_dereq_,module,exports) {

/**
 * Expose `Backoff`.
 */

module.exports = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
	opts = opts || {};
	this.ms = opts.min || 100;
	this.max = opts.max || 10000;
	this.factor = opts.factor || 2;
	this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
	this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function() {
	var ms = this.ms * Math.pow(this.factor, this.attempts++);
	if (this.jitter) {
		var rand =  Math.random();
		var deviation = Math.floor(rand * this.jitter * ms);
		ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
	}
	return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function() {
	this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min) {
	this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max) {
	this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter) {
	this.jitter = jitter;
};


},{}],8:[function(_dereq_,module,exports) {
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn) {
	if ('string' == typeof fn) fn = obj[fn];
	if ('function' != typeof fn) throw new Error('bind() requires a function');
	var args = slice.call(arguments, 2);
	return function() {
		return fn.apply(obj, args.concat(slice.call(arguments)));
	}
};

},{}],9:[function(_dereq_,module,exports) {

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
	if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
	for (var key in Emitter.prototype) {
		obj[key] = Emitter.prototype[key];
	}
	return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn) {
	this._callbacks = this._callbacks || {};
	(this._callbacks[event] = this._callbacks[event] || [])
		.push(fn);
	return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn) {
	var self = this;
	this._callbacks = this._callbacks || {};

	function on() {
		self.off(event, on);
		fn.apply(this, arguments);
	}

	on.fn = fn;
	this.on(event, on);
	return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn) {
	this._callbacks = this._callbacks || {};

	// all
	if (0 == arguments.length) {
		this._callbacks = {};
		return this;
	}

	// specific event
	var callbacks = this._callbacks[event];
	if (!callbacks) return this;

	// remove all handlers
	if (1 == arguments.length) {
		delete this._callbacks[event];
		return this;
	}

	// remove specific handler
	var cb;
	for (var i = 0; i < callbacks.length; i++) {
		cb = callbacks[i];
		if (cb === fn || cb.fn === fn) {
			callbacks.splice(i, 1);
			break;
		}
	}
	return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event) {
	this._callbacks = this._callbacks || {};
	var args = [].slice.call(arguments, 1)
		, callbacks = this._callbacks[event];

	if (callbacks) {
		callbacks = callbacks.slice(0);
		for (var i = 0, len = callbacks.length; i < len; ++i) {
			callbacks[i].apply(this, args);
		}
	}

	return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event) {
	this._callbacks = this._callbacks || {};
	return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event) {
	return !! this.listeners(event).length;
};

},{}],10:[function(_dereq_,module,exports) {

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
	if (!debug.enabled(name)) return function() {};

	return function(fmt) {
		fmt = coerce(fmt);

		var curr = new Date;
		var ms = curr - (debug[name] || curr);
		debug[name] = curr;

		fmt = name
			+ ' '
			+ fmt
			+ ' +' + debug.humanize(ms);

		// This hackery is required for IE8
		// where `console.log` doesn't have 'apply'
		window.console
			&& console.log
			&& Function.prototype.apply.call(console.log, console, arguments);
	}
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
	try {
		sessionStorage.debug = name;
	} catch(e) {}

	var split = (name || '').split(/[\s,]+/)
		, len = split.length;

	for (var i = 0; i < len; i++) {
		name = split[i].replace('*', '.*?');
		if (name[0] === '-') {
			debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
		}
		else {
			debug.names.push(new RegExp('^' + name + '$'));
		}
	}
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function() {
	debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
	var sec = 1000
		, min = 45 * 1000
		, hour = 60 * min;

	if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
	if (ms >= min) return (ms / min).toFixed(1) + 'm';
	if (ms >= sec) return (ms / sec | 0) + 's';
	return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
	for (var i = 0, len = debug.skips.length; i < len; i++) {
		if (debug.skips[i].test(name)) {
			return false;
		}
	}
	for (var i = 0, len = debug.names.length; i < len; i++) {
		if (debug.names[i].test(name)) {
			return true;
		}
	}
	return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
	if (val instanceof Error) return val.stack || val.message;
	return val;
}

// persist

try {
	if (window.sessionStorage) debug.enable(sessionStorage.debug);
} catch(e) {}

},{}],11:[function(_dereq_,module,exports) {

module.exports =  _dereq_('./lib/');

},{"./lib/":12}],12:[function(_dereq_,module,exports) {

module.exports = _dereq_('./socket');

/**
 * Exports parser
 *
 * @api public
 *
 */
module.exports.parser = _dereq_('engine.io-parser');

},{"./socket":13,"engine.io-parser":25}],13:[function(_dereq_,module,exports) {
(function (global) {
/**
 * Module dependencies.
 */

var transports = _dereq_('./transports');
var Emitter = _dereq_('component-emitter');
var debug = _dereq_('debug')('engine.io-client:socket');
var index = _dereq_('indexof');
var parser = _dereq_('engine.io-parser');
var parseuri = _dereq_('parseuri');
var parsejson = _dereq_('parsejson');
var parseqs = _dereq_('parseqs');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Noop function.
 *
 * @api private
 */

function noop() {}

/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket(uri, opts) {
	if (!(this instanceof Socket)) return new Socket(uri, opts);

	opts = opts || {};

	if (uri && 'object' == typeof uri) {
		opts = uri;
		uri = null;
	}

	if (uri) {
		uri = parseuri(uri);
		opts.host = uri.host;
		opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
		opts.port = uri.port;
		if (uri.query) opts.query = uri.query;
	}

	this.secure = null != opts.secure ? opts.secure :
		(global.location && 'https:' == location.protocol);

	if (opts.host) {
		var pieces = opts.host.split(':');
		opts.hostname = pieces.shift();
		if (pieces.length) {
			opts.port = pieces.pop();
		} else if (!opts.port) {
			// if no port is specified manually, use the protocol default
			opts.port = this.secure ? '443' : '80';
		}
	}

	this.agent = opts.agent || false;
	this.hostname = opts.hostname ||
		(global.location ? location.hostname : 'localhost');
	this.port = opts.port || (global.location && location.port ?
			 location.port :
			 (this.secure ? 443 : 80));
	this.query = opts.query || {};
	if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
	this.upgrade = false !== opts.upgrade;
	this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
	this.forceJSONP = !!opts.forceJSONP;
	this.jsonp = false !== opts.jsonp;
	this.forceBase64 = !!opts.forceBase64;
	this.enablesXDR = !!opts.enablesXDR;
	this.timestampParam = opts.timestampParam || 't';
	this.timestampRequests = opts.timestampRequests;
	this.transports = opts.transports || ['polling', 'websocket'];
	this.readyState = '';
	this.writeBuffer = [];
	this.callbackBuffer = [];
	this.policyPort = opts.policyPort || 843;
	this.rememberUpgrade = opts.rememberUpgrade || false;
	this.binaryType = null;
	this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;

	// SSL options for Node.js client
	this.pfx = opts.pfx || null;
	this.key = opts.key || null;
	this.passphrase = opts.passphrase || null;
	this.cert = opts.cert || null;
	this.ca = opts.ca || null;
	this.ciphers = opts.ciphers || null;
	this.rejectUnauthorized = opts.rejectUnauthorized || null;

	this.open();
}

Socket.priorWebsocketSuccess = false;

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = _dereq_('./transport');
Socket.transports = _dereq_('./transports');
Socket.parser = _dereq_('engine.io-parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
	debug('creating transport "%s"', name);
	var query = clone(this.query);

	// append engine.io protocol identifier
	query.EIO = parser.protocol;

	// transport name
	query.transport = name;

	// session id if we already have one
	if (this.id) query.sid = this.id;

	var transport = new transports[name]({
		agent: this.agent,
		hostname: this.hostname,
		port: this.port,
		secure: this.secure,
		path: this.path,
		query: query,
		forceJSONP: this.forceJSONP,
		jsonp: this.jsonp,
		forceBase64: this.forceBase64,
		enablesXDR: this.enablesXDR,
		timestampRequests: this.timestampRequests,
		timestampParam: this.timestampParam,
		policyPort: this.policyPort,
		socket: this,
		pfx: this.pfx,
		key: this.key,
		passphrase: this.passphrase,
		cert: this.cert,
		ca: this.ca,
		ciphers: this.ciphers,
		rejectUnauthorized: this.rejectUnauthorized
	});

	return transport;
};

function clone (obj) {
	var o = {};
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			o[i] = obj[i];
		}
	}
	return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */
Socket.prototype.open = function () {
	var transport;
	if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
		transport = 'websocket';
	} else if (0 == this.transports.length) {
		// Emit error on next tick so it can be listened to
		var self = this;
		setTimeout(function() {
			self.emit('error', 'No transports available');
		}, 0);
		return;
	} else {
		transport = this.transports[0];
	}
	this.readyState = 'opening';

	// Retry with the next transport if the transport is disabled (jsonp: false)
	var transport;
	try {
		transport = this.createTransport(transport);
	} catch (e) {
		this.transports.shift();
		this.open();
		return;
	}

	transport.open();
	this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function(transport) {
	debug('setting transport %s', transport.name);
	var self = this;

	if (this.transport) {
		debug('clearing existing transport %s', this.transport.name);
		this.transport.removeAllListeners();
	}

	// set up transport
	this.transport = transport;

	// set up transport listeners
	transport
	.on('drain', function() {
		self.onDrain();
	})
	.on('packet', function(packet) {
		self.onPacket(packet);
	})
	.on('error', function(e) {
		self.onError(e);
	})
	.on('close', function() {
		self.onClose('transport close');
	});
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
	debug('probing transport "%s"', name);
	var transport = this.createTransport(name, { probe: 1 })
		, failed = false
		, self = this;

	Socket.priorWebsocketSuccess = false;

	function onTransportOpen() {
		if (self.onlyBinaryUpgrades) {
			var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
			failed = failed || upgradeLosesBinary;
		}
		if (failed) return;

		debug('probe transport "%s" opened', name);
		transport.send([{ type: 'ping', data: 'probe' }]);
		transport.once('packet', function (msg) {
			if (failed) return;
			if ('pong' == msg.type && 'probe' == msg.data) {
				debug('probe transport "%s" pong', name);
				self.upgrading = true;
				self.emit('upgrading', transport);
				if (!transport) return;
				Socket.priorWebsocketSuccess = 'websocket' == transport.name;

				debug('pausing current transport "%s"', self.transport.name);
				self.transport.pause(function () {
					if (failed) return;
					if ('closed' == self.readyState) return;
					debug('changing transport and sending upgrade packet');

					cleanup();

					self.setTransport(transport);
					transport.send([{ type: 'upgrade' }]);
					self.emit('upgrade', transport);
					transport = null;
					self.upgrading = false;
					self.flush();
				});
			} else {
				debug('probe transport "%s" failed', name);
				var err = new Error('probe error');
				err.transport = transport.name;
				self.emit('upgradeError', err);
			}
		});
	}

	function freezeTransport() {
		if (failed) return;

		// Any callback called by transport should be ignored since now
		failed = true;

		cleanup();

		transport.close();
		transport = null;
	}

	//Handle any error that happens while probing
	function onerror(err) {
		var error = new Error('probe error: ' + err);
		error.transport = transport.name;

		freezeTransport();

		debug('probe transport "%s" failed because of error: %s', name, err);

		self.emit('upgradeError', error);
	}

	function onTransportClose() {
		onerror("transport closed");
	}

	//When the socket is closed while we're probing
	function onclose() {
		onerror("socket closed");
	}

	//When the socket is upgraded while we're probing
	function onupgrade(to) {
		if (transport && to.name != transport.name) {
			debug('"%s" works - aborting "%s"', to.name, transport.name);
			freezeTransport();
		}
	}

	//Remove all listeners on the transport and on self
	function cleanup() {
		transport.removeListener('open', onTransportOpen);
		transport.removeListener('error', onerror);
		transport.removeListener('close', onTransportClose);
		self.removeListener('close', onclose);
		self.removeListener('upgrading', onupgrade);
	}

	transport.once('open', onTransportOpen);
	transport.once('error', onerror);
	transport.once('close', onTransportClose);

	this.once('close', onclose);
	this.once('upgrading', onupgrade);

	transport.open();

};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
	debug('socket open');
	this.readyState = 'open';
	Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
	this.emit('open');
	this.flush();

	// we check for `readyState` in case an `open`
	// listener already closed the socket
	if ('open' == this.readyState && this.upgrade && this.transport.pause) {
		debug('starting upgrade probes');
		for (var i = 0, l = this.upgrades.length; i < l; i++) {
			this.probe(this.upgrades[i]);
		}
	}
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
	if ('opening' == this.readyState || 'open' == this.readyState) {
		debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

		this.emit('packet', packet);

		// Socket is live - any packet counts
		this.emit('heartbeat');

		switch (packet.type) {
			case 'open':
				this.onHandshake(parsejson(packet.data));
				break;

			case 'pong':
				this.setPing();
				break;

			case 'error':
				var err = new Error('server error');
				err.code = packet.data;
				this.emit('error', err);
				break;

			case 'message':
				this.emit('data', packet.data);
				this.emit('message', packet.data);
				break;
		}
	} else {
		debug('packet received with socket readyState "%s"', this.readyState);
	}
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
	this.emit('handshake', data);
	this.id = data.sid;
	this.transport.query.sid = data.sid;
	this.upgrades = this.filterUpgrades(data.upgrades);
	this.pingInterval = data.pingInterval;
	this.pingTimeout = data.pingTimeout;
	this.onOpen();
	// In case open handler closes socket
	if  ('closed' == this.readyState) return;
	this.setPing();

	// Prolong liveness of socket on heartbeat
	this.removeListener('heartbeat', this.onHeartbeat);
	this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
	clearTimeout(this.pingTimeoutTimer);
	var self = this;
	self.pingTimeoutTimer = setTimeout(function () {
		if ('closed' == self.readyState) return;
		self.onClose('ping timeout');
	}, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.setPing = function () {
	var self = this;
	clearTimeout(self.pingIntervalTimer);
	self.pingIntervalTimer = setTimeout(function () {
		debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
		self.ping();
		self.onHeartbeat(self.pingTimeout);
	}, self.pingInterval);
};

/**
* Sends a ping packet.
*
* @api public
*/

Socket.prototype.ping = function () {
	this.sendPacket('ping');
};

/**
 * Called on `drain` event
 *
 * @api private
 */

Socket.prototype.onDrain = function() {
	for (var i = 0; i < this.prevBufferLen; i++) {
		if (this.callbackBuffer[i]) {
			this.callbackBuffer[i]();
		}
	}

	this.writeBuffer.splice(0, this.prevBufferLen);
	this.callbackBuffer.splice(0, this.prevBufferLen);

	// setting prevBufferLen = 0 is very important
	// for example, when upgrading, upgrade packet is sent over,
	// and a nonzero prevBufferLen could cause problems on `drain`
	this.prevBufferLen = 0;

	if (this.writeBuffer.length == 0) {
		this.emit('drain');
	} else {
		this.flush();
	}
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
	if ('closed' != this.readyState && this.transport.writable &&
		!this.upgrading && this.writeBuffer.length) {
		debug('flushing %d packets in socket', this.writeBuffer.length);
		this.transport.send(this.writeBuffer);
		// keep track of current length of writeBuffer
		// splice writeBuffer and callbackBuffer on `drain`
		this.prevBufferLen = this.writeBuffer.length;
		this.emit('flush');
	}
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg, fn) {
	this.sendPacket('message', msg, fn);
	return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Function} callback function.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data, fn) {
	if ('closing' == this.readyState || 'closed' == this.readyState) {
		return;
	}

	var packet = { type: type, data: data };
	this.emit('packetCreate', packet);
	this.writeBuffer.push(packet);
	this.callbackBuffer.push(fn);
	this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
	if ('opening' == this.readyState || 'open' == this.readyState) {
		this.readyState = 'closing';

		var self = this;

		function close() {
			self.onClose('forced close');
			debug('socket closing - telling transport to close');
			self.transport.close();
		}

		function cleanupAndClose() {
			self.removeListener('upgrade', cleanupAndClose);
			self.removeListener('upgradeError', cleanupAndClose);
			close();
		}

		function waitForUpgrade() {
			// wait for upgrade to finish since we can't send packets while pausing a transport
			self.once('upgrade', cleanupAndClose);
			self.once('upgradeError', cleanupAndClose);
		}

		if (this.writeBuffer.length) {
			this.once('drain', function() {
				if (this.upgrading) {
					waitForUpgrade();
				} else {
					close();
				}
			});
		} else if (this.upgrading) {
			waitForUpgrade();
		} else {
			close();
		}
	}

	return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
	debug('socket error %j', err);
	Socket.priorWebsocketSuccess = false;
	this.emit('error', err);
	this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
	if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
		debug('socket close with reason: "%s"', reason);
		var self = this;

		// clear timers
		clearTimeout(this.pingIntervalTimer);
		clearTimeout(this.pingTimeoutTimer);

		// clean buffers in next tick, so developers can still
		// grab the buffers on `close` event
		setTimeout(function() {
			self.writeBuffer = [];
			self.callbackBuffer = [];
			self.prevBufferLen = 0;
		}, 0);

		// stop event from firing again for transport
		this.transport.removeAllListeners('close');

		// ensure transport won't stay open
		this.transport.close();

		// ignore further transport communication
		this.transport.removeAllListeners();

		// set ready state
		this.readyState = 'closed';

		// clear session id
		this.id = null;

		// emit close event
		this.emit('close', reason, desc);
	}
};

/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */

Socket.prototype.filterUpgrades = function (upgrades) {
	var filteredUpgrades = [];
	for (var i = 0, j = upgrades.length; i<j; i++) {
		if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
	}
	return filteredUpgrades;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./transport":14,"./transports":15,"component-emitter":9,"debug":22,"engine.io-parser":25,"indexof":42,"parsejson":34,"parseqs":35,"parseuri":36}],14:[function(_dereq_,module,exports) {
/**
 * Module dependencies.
 */

var parser = _dereq_('engine.io-parser');
var Emitter = _dereq_('component-emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
	this.path = opts.path;
	this.hostname = opts.hostname;
	this.port = opts.port;
	this.secure = opts.secure;
	this.query = opts.query;
	this.timestampParam = opts.timestampParam;
	this.timestampRequests = opts.timestampRequests;
	this.readyState = '';
	this.agent = opts.agent || false;
	this.socket = opts.socket;
	this.enablesXDR = opts.enablesXDR;

	// SSL options for Node.js client
	this.pfx = opts.pfx;
	this.key = opts.key;
	this.passphrase = opts.passphrase;
	this.cert = opts.cert;
	this.ca = opts.ca;
	this.ciphers = opts.ciphers;
	this.rejectUnauthorized = opts.rejectUnauthorized;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * A counter used to prevent collisions in the timestamps used
 * for cache busting.
 */

Transport.timestamps = 0;

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
	var err = new Error(msg);
	err.type = 'TransportError';
	err.description = desc;
	this.emit('error', err);
	return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
	if ('closed' == this.readyState || '' == this.readyState) {
		this.readyState = 'opening';
		this.doOpen();
	}

	return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
	if ('opening' == this.readyState || 'open' == this.readyState) {
		this.doClose();
		this.onClose();
	}

	return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function(packets) {
	if ('open' == this.readyState) {
		this.write(packets);
	} else {
		throw new Error('Transport not open');
	}
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
	this.readyState = 'open';
	this.writable = true;
	this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function(data) {
	var packet = parser.decodePacket(data, this.socket.binaryType);
	this.onPacket(packet);
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
	this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
	this.readyState = 'closed';
	this.emit('close');
};

},{"component-emitter":9,"engine.io-parser":25}],15:[function(_dereq_,module,exports) {
(function (global) {
/**
 * Module dependencies
 */

var XMLHttpRequest = _dereq_('xmlhttprequest');
var XHR = _dereq_('./polling-xhr');
var JSONP = _dereq_('./polling-jsonp');
var websocket = _dereq_('./websocket');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling(opts) {
	var xhr;
	var xd = false;
	var xs = false;
	var jsonp = false !== opts.jsonp;

	if (global.location) {
		var isSSL = 'https:' == location.protocol;
		var port = location.port;

		// some user agents have empty `location.port`
		if (!port) {
			port = isSSL ? 443 : 80;
		}

		xd = opts.hostname != location.hostname || port != opts.port;
		xs = opts.secure != isSSL;
	}

	opts.xdomain = xd;
	opts.xscheme = xs;
	xhr = new XMLHttpRequest(opts);

	if ('open' in xhr && !opts.forceJSONP) {
		return new XHR(opts);
	} else {
		if (!jsonp) throw new Error('JSONP disabled');
		return new JSONP(opts);
	}
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling-jsonp":16,"./polling-xhr":17,"./websocket":19,"xmlhttprequest":20}],16:[function(_dereq_,module,exports) {
(function (global) {

/**
 * Module requirements.
 */

var Polling = _dereq_('./polling');
var inherit = _dereq_('component-inherit');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Callbacks count.
 */

var index = 0;

/**
 * Noop.
 */

function empty () { }

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
	Polling.call(this, opts);

	this.query = this.query || {};

	// define global callbacks array if not present
	// we do this here (lazily) to avoid unneeded global pollution
	if (!callbacks) {
		// we need to consider multiple engines in the same page
		if (!global.___eio) global.___eio = [];
		callbacks = global.___eio;
	}

	// callback identifier
	this.index = callbacks.length;

	// add callback to jsonp global
	var self = this;
	callbacks.push(function (msg) {
		self.onData(msg);
	});

	// append to query string
	this.query.j = this.index;

	// prevent spurious errors from being emitted when the window is unloaded
	if (global.document && global.addEventListener) {
		global.addEventListener('beforeunload', function () {
			if (self.script) self.script.onerror = empty;
		}, false);
	}
}

/**
 * Inherits from Polling.
 */

inherit(JSONPPolling, Polling);

/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;

/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
	if (this.script) {
		this.script.parentNode.removeChild(this.script);
		this.script = null;
	}

	if (this.form) {
		this.form.parentNode.removeChild(this.form);
		this.form = null;
		this.iframe = null;
	}

	Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
	var self = this;
	var script = document.createElement('script');

	if (this.script) {
		this.script.parentNode.removeChild(this.script);
		this.script = null;
	}

	script.async = true;
	script.src = this.uri();
	script.onerror = function(e) {
		self.onError('jsonp poll error',e);
	};

	var insertAt = document.getElementsByTagName('script')[0];
	insertAt.parentNode.insertBefore(script, insertAt);
	this.script = script;

	var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);

	if (isUAgecko) {
		setTimeout(function () {
			var iframe = document.createElement('iframe');
			document.body.appendChild(iframe);
			document.body.removeChild(iframe);
		}, 100);
	}
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
	var self = this;

	if (!this.form) {
		var form = document.createElement('form');
		var area = document.createElement('textarea');
		var id = this.iframeId = 'eio_iframe_' + this.index;
		var iframe;

		form.className = 'socketio';
		form.style.position = 'absolute';
		form.style.top = '-1000px';
		form.style.left = '-1000px';
		form.target = id;
		form.method = 'POST';
		form.setAttribute('accept-charset', 'utf-8');
		area.name = 'd';
		form.appendChild(area);
		document.body.appendChild(form);

		this.form = form;
		this.area = area;
	}

	this.form.action = this.uri();

	function complete () {
		initIframe();
		fn();
	}

	function initIframe () {
		if (self.iframe) {
			try {
				self.form.removeChild(self.iframe);
			} catch (e) {
				self.onError('jsonp polling iframe removal error', e);
			}
		}

		try {
			// ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
			var html = '<iframe src="javascript:0" name="'+ self.iframeId +'">';
			iframe = document.createElement(html);
		} catch (e) {
			iframe = document.createElement('iframe');
			iframe.name = self.iframeId;
			iframe.src = 'javascript:0';
		}

		iframe.id = self.iframeId;

		self.form.appendChild(iframe);
		self.iframe = iframe;
	}

	initIframe();

	// escape \n to prevent it from being converted into \r\n by some UAs
	// double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
	data = data.replace(rEscapedNewline, '\\\n');
	this.area.value = data.replace(rNewline, '\\n');

	try {
		this.form.submit();
	} catch(e) {}

	if (this.iframe.attachEvent) {
		this.iframe.onreadystatechange = function() {
			if (self.iframe.readyState == 'complete') {
				complete();
			}
		};
	} else {
		this.iframe.onload = complete;
	}
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":18,"component-inherit":21}],17:[function(_dereq_,module,exports) {
(function (global) {
/**
 * Module requirements.
 */

var XMLHttpRequest = _dereq_('xmlhttprequest');
var Polling = _dereq_('./polling');
var Emitter = _dereq_('component-emitter');
var inherit = _dereq_('component-inherit');
var debug = _dereq_('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty() {}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR(opts) {
	Polling.call(this, opts);

	if (global.location) {
		var isSSL = 'https:' == location.protocol;
		var port = location.port;

		// some user agents have empty `location.port`
		if (!port) {
			port = isSSL ? 443 : 80;
		}

		this.xd = opts.hostname != global.location.hostname ||
			port != opts.port;
		this.xs = opts.secure != isSSL;
	}
}

/**
 * Inherits from Polling.
 */

inherit(XHR, Polling);

/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function(opts) {
	opts = opts || {};
	opts.uri = this.uri();
	opts.xd = this.xd;
	opts.xs = this.xs;
	opts.agent = this.agent || false;
	opts.supportsBinary = this.supportsBinary;
	opts.enablesXDR = this.enablesXDR;

	// SSL options for Node.js client
	opts.pfx = this.pfx;
	opts.key = this.key;
	opts.passphrase = this.passphrase;
	opts.cert = this.cert;
	opts.ca = this.ca;
	opts.ciphers = this.ciphers;
	opts.rejectUnauthorized = this.rejectUnauthorized;

	return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function(data, fn) {
	var isBinary = typeof data !== 'string' && data !== undefined;
	var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
	var self = this;
	req.on('success', fn);
	req.on('error', function(err) {
		self.onError('xhr post error', err);
	});
	this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function() {
	debug('xhr poll');
	var req = this.request();
	var self = this;
	req.on('data', function(data) {
		self.onData(data);
	});
	req.on('error', function(err) {
		self.onError('xhr poll error', err);
	});
	this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request(opts) {
	this.method = opts.method || 'GET';
	this.uri = opts.uri;
	this.xd = !!opts.xd;
	this.xs = !!opts.xs;
	this.async = false !== opts.async;
	this.data = undefined != opts.data ? opts.data : null;
	this.agent = opts.agent;
	this.isBinary = opts.isBinary;
	this.supportsBinary = opts.supportsBinary;
	this.enablesXDR = opts.enablesXDR;

	// SSL options for Node.js client
	this.pfx = opts.pfx;
	this.key = opts.key;
	this.passphrase = opts.passphrase;
	this.cert = opts.cert;
	this.ca = opts.ca;
	this.ciphers = opts.ciphers;
	this.rejectUnauthorized = opts.rejectUnauthorized;

	this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function() {
	var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

	// SSL options for Node.js client
	opts.pfx = this.pfx;
	opts.key = this.key;
	opts.passphrase = this.passphrase;
	opts.cert = this.cert;
	opts.ca = this.ca;
	opts.ciphers = this.ciphers;
	opts.rejectUnauthorized = this.rejectUnauthorized;

	var xhr = this.xhr = new XMLHttpRequest(opts);
	var self = this;

	try {
		debug('xhr open %s: %s', this.method, this.uri);
		xhr.open(this.method, this.uri, this.async);
		if (this.supportsBinary) {
			// This has to be done after open because Firefox is stupid
			// http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
			xhr.responseType = 'arraybuffer';
		}

		if ('POST' == this.method) {
			try {
				if (this.isBinary) {
					xhr.setRequestHeader('Content-type', 'application/octet-stream');
				} else {
					xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
				}
			} catch (e) {}
		}

		// ie6 check
		if ('withCredentials' in xhr) {
			xhr.withCredentials = true;
		}

		if (this.hasXDR()) {
			xhr.onload = function() {
				self.onLoad();
			};
			xhr.onerror = function() {
				self.onError(xhr.responseText);
			};
		} else {
			xhr.onreadystatechange = function() {
				if (4 != xhr.readyState) return;
				if (200 == xhr.status || 1223 == xhr.status) {
					self.onLoad();
				} else {
					// make sure the `error` event handler that's user-set
					// does not throw in the same tick and gets caught here
					setTimeout(function() {
					  self.onError(xhr.status);
					}, 0);
				}
			};
		}

		debug('xhr data %s', this.data);
		xhr.send(this.data);
	} catch (e) {
		// Need to defer since .create() is called directly fhrom the constructor
		// and thus the 'error' event can only be only bound *after* this exception
		// occurs.  Therefore, also, we cannot throw here at all.
		setTimeout(function() {
			self.onError(e);
		}, 0);
		return;
	}

	if (global.document) {
		this.index = Request.requestsCount++;
		Request.requests[this.index] = this;
	}
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function() {
	this.emit('success');
	this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function(data) {
	this.emit('data', data);
	this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function(err) {
	this.emit('error', err);
	this.cleanup(true);
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function(fromError) {
	if ('undefined' == typeof this.xhr || null === this.xhr) {
		return;
	}
	// xmlhttprequest
	if (this.hasXDR()) {
		this.xhr.onload = this.xhr.onerror = empty;
	} else {
		this.xhr.onreadystatechange = empty;
	}

	if (fromError) {
		try {
			this.xhr.abort();
		} catch(e) {}
	}

	if (global.document) {
		delete Request.requests[this.index];
	}

	this.xhr = null;
};

/**
 * Called upon load.
 *
 * @api private
 */

Request.prototype.onLoad = function() {
	var data;
	try {
		var contentType;
		try {
			contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
		} catch (e) {}
		if (contentType === 'application/octet-stream') {
			data = this.xhr.response;
		} else {
			if (!this.supportsBinary) {
				data = this.xhr.responseText;
			} else {
				data = 'ok';
			}
		}
	} catch (e) {
		this.onError(e);
	}
	if (null != data) {
		this.onData(data);
	}
};

/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */

Request.prototype.hasXDR = function() {
	return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function() {
	this.cleanup();
};

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

if (global.document) {
	Request.requestsCount = 0;
	Request.requests = {};
	if (global.attachEvent) {
		global.attachEvent('onunload', unloadHandler);
	} else if (global.addEventListener) {
		global.addEventListener('beforeunload', unloadHandler, false);
	}
}

function unloadHandler() {
	for (var i in Request.requests) {
		if (Request.requests.hasOwnProperty(i)) {
			Request.requests[i].abort();
		}
	}
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":18,"component-emitter":9,"component-inherit":21,"debug":22,"xmlhttprequest":20}],18:[function(_dereq_,module,exports) {
/**
 * Module dependencies.
 */

var Transport = _dereq_('../transport');
var parseqs = _dereq_('parseqs');
var parser = _dereq_('engine.io-parser');
var inherit = _dereq_('component-inherit');
var debug = _dereq_('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Is XHR2 supported?
 */

var hasXHR2 = (function() {
	var XMLHttpRequest = _dereq_('xmlhttprequest');
	var xhr = new XMLHttpRequest({ xdomain: false });
	return null != xhr.responseType;
})();

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling(opts) {
	var forceBase64 = (opts && opts.forceBase64);
	if (!hasXHR2 || forceBase64) {
		this.supportsBinary = false;
	}
	Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function() {
	this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function(onPause) {
	var pending = 0;
	var self = this;

	this.readyState = 'pausing';

	function pause() {
		debug('paused');
		self.readyState = 'paused';
		onPause();
	}

	if (this.polling || !this.writable) {
		var total = 0;

		if (this.polling) {
			debug('we are currently polling - waiting to pause');
			total++;
			this.once('pollComplete', function() {
				debug('pre-pause polling complete');
				--total || pause();
			});
		}

		if (!this.writable) {
			debug('we are currently writing - waiting to pause');
			total++;
			this.once('drain', function() {
				debug('pre-pause writing complete');
				--total || pause();
			});
		}
	} else {
		pause();
	}
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function() {
	debug('polling');
	this.polling = true;
	this.doPoll();
	this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function(data) {
	var self = this;
	debug('polling got data %s', data);
	var callback = function(packet, index, total) {
		// if its the first message we consider the transport open
		if ('opening' == self.readyState) {
			self.onOpen();
		}

		// if its a close packet, we close the ongoing requests
		if ('close' == packet.type) {
			self.onClose();
			return false;
		}

		// otherwise bypass onData and handle the message
		self.onPacket(packet);
	};

	// decode payload
	parser.decodePayload(data, this.socket.binaryType, callback);

	// if an event did not trigger closing
	if ('closed' != this.readyState) {
		// if we got data we're not polling
		this.polling = false;
		this.emit('pollComplete');

		if ('open' == this.readyState) {
			this.poll();
		} else {
			debug('ignoring poll - transport state "%s"', this.readyState);
		}
	}
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function() {
	var self = this;

	function close() {
		debug('writing close packet');
		self.write([{ type: 'close' }]);
	}

	if ('open' == this.readyState) {
		debug('transport open - closing');
		close();
	} else {
		// in case we're trying to close while
		// handshaking is in progress (GH-164)
		debug('transport not open - deferring close');
		this.once('open', close);
	}
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function(packets) {
	var self = this;
	this.writable = false;
	var callbackfn = function() {
		self.writable = true;
		self.emit('drain');
	};

	var self = this;
	parser.encodePayload(packets, this.supportsBinary, function(data) {
		self.doWrite(data, callbackfn);
	});
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function() {
	var query = this.query || {};
	var schema = this.secure ? 'https' : 'http';
	var port = '';

	// cache busting is forced
	if (false !== this.timestampRequests) {
		query[this.timestampParam] = +new Date + '-' + Transport.timestamps++;
	}

	if (!this.supportsBinary && !query.sid) {
		query.b64 = 1;
	}

	query = parseqs.encode(query);

	// avoid port if default for schema
	if (this.port && (('https' == schema && this.port != 443) ||
		 ('http' == schema && this.port != 80))) {
		port = ':' + this.port;
	}

	// prepend ? to query
	if (query.length) {
		query = '?' + query;
	}

	return schema + '://' + this.hostname + port + this.path + query;
};

},{"../transport":14,"component-inherit":21,"debug":22,"engine.io-parser":25,"parseqs":35,"xmlhttprequest":20}],19:[function(_dereq_,module,exports) {
/**
 * Module dependencies.
 */

var Transport = _dereq_('../transport');
var parser = _dereq_('engine.io-parser');
var parseqs = _dereq_('parseqs');
var inherit = _dereq_('component-inherit');
var debug = _dereq_('debug')('engine.io-client:websocket');

/**
 * `ws` exposes a WebSocket-compatible interface in
 * Node, or the `WebSocket` or `MozWebSocket` globals
 * in the browser.
 */

var WebSocket = _dereq_('ws');

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS(opts) {
	var forceBase64 = (opts && opts.forceBase64);
	if (forceBase64) {
		this.supportsBinary = false;
	}
	Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function() {
	if (!this.check()) {
		// let probe timeout
		return;
	}

	var self = this;
	var uri = this.uri();
	var protocols = void(0);
	var opts = { agent: this.agent };

	// SSL options for Node.js client
	opts.pfx = this.pfx;
	opts.key = this.key;
	opts.passphrase = this.passphrase;
	opts.cert = this.cert;
	opts.ca = this.ca;
	opts.ciphers = this.ciphers;
	opts.rejectUnauthorized = this.rejectUnauthorized;

	this.ws = new WebSocket(uri, protocols, opts);

	if (this.ws.binaryType === undefined) {
		this.supportsBinary = false;
	}

	this.ws.binaryType = 'arraybuffer';
	this.addEventListeners();
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function() {
	var self = this;

	this.ws.onopen = function() {
		self.onOpen();
	};
	this.ws.onclose = function() {
		self.onClose();
	};
	this.ws.onmessage = function(ev) {
		self.onData(ev.data);
	};
	this.ws.onerror = function(e) {
		self.onError('websocket error', e);
	};
};

/**
 * Override `onData` to use a timer on iOS.
 * See: https://gist.github.com/mloughran/2052006
 *
 * @api private
 */

if ('undefined' != typeof navigator
	&& /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
	WS.prototype.onData = function(data) {
		var self = this;
		setTimeout(function() {
			Transport.prototype.onData.call(self, data);
		}, 0);
	};
}

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function(packets) {
	var self = this;
	this.writable = false;
	// encodePacket efficient as it uses WS framing
	// no need for encodePayload
	for (var i = 0, l = packets.length; i < l; i++) {
		parser.encodePacket(packets[i], this.supportsBinary, function(data) {
			//Sometimes the websocket has already been closed but the browser didn't
			//have a chance of informing us about it yet, in that case send will
			//throw an error
			try {
				self.ws.send(data);
			} catch (e) {
				debug('websocket closed before onclose event');
			}
		});
	}

	function ondrain() {
		self.writable = true;
		self.emit('drain');
	}
	// fake drain
	// defer to next tick to allow Socket to clear writeBuffer
	setTimeout(ondrain, 0);
};

/**
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function() {
	Transport.prototype.onClose.call(this);
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function() {
	if (typeof this.ws !== 'undefined') {
        window["IRC_CONNECTED"] = '0';
        toggle_chat_input_ui(false);
        sessionStorage.setItem("IRC_RECONNECT_TIMER", Date.now() + (33 * 1000));
		this.ws.close();
	}
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function() {
	var query = this.query || {};
	var schema = this.secure ? 'wss' : 'ws';
	var port = '';

	// avoid port if default for schema
	if (this.port && (('wss' == schema && this.port != 443)
		|| ('ws' == schema && this.port != 80))) {
		port = ':' + this.port;
	}

	// append timestamp to URI
	if (this.timestampRequests) {
		query[this.timestampParam] = +new Date;
	}

	// communicate binary support capabilities
	if (!this.supportsBinary) {
		query.b64 = 1;
	}

	query = parseqs.encode(query);

	// prepend ? to query
	if (query.length) {
		query = '?' + query;
	}

	return schema + '://' + this.hostname + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function() {
	return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};

},{"../transport":14,"component-inherit":21,"debug":22,"engine.io-parser":25,"parseqs":35,"ws":37}],20:[function(_dereq_,module,exports) {
// browser shim for xmlhttprequest module
var hasCORS = _dereq_('has-cors');

module.exports = function(opts) {
	var xdomain = opts.xdomain;

	// scheme must be same when usign XDomainRequest
	// http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
	var xscheme = opts.xscheme;

	// XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
	// https://github.com/Automattic/engine.io-client/pull/217
	var enablesXDR = opts.enablesXDR;

	// XMLHttpRequest can be disabled on IE
	try {
		if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
			return new XMLHttpRequest();
		}
	} catch (e) { }

	// Use XDomainRequest for IE8 if enablesXDR is true
	// because loading bar keeps flashing when using jsonp-polling
	// https://github.com/yujiosaka/socke.io-ie8-loading-example
	try {
		if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
			return new XDomainRequest();
		}
	} catch (e) { }

	if (!xdomain) {
		try {
			return new ActiveXObject('Microsoft.XMLHTTP');
		} catch(e) { }
	}
}

},{"has-cors":40}],21:[function(_dereq_,module,exports) {

module.exports = function(a, b) {
	var fn = function() {};
	fn.prototype = b.prototype;
	a.prototype = new fn;
	a.prototype.constructor = a;
};
},{}],22:[function(_dereq_,module,exports) {

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = _dereq_('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
	return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
	var args = arguments;
	var useColors = this.useColors;

	args[0] = (useColors ? '%c' : '')
		+ this.namespace
		+ (useColors ? ' %c' : ' ')
		+ args[0]
		+ (useColors ? '%c ' : ' ')
		+ '+' + exports.humanize(this.diff);

	if (!useColors) return args;

	var c = 'color: ' + this.color;
	args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

	// the final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	var index = 0;
	var lastC = 0;
	args[0].replace(/%[a-z%]/g, function(match) {
		if ('%' === match) return;
		index++;
		if ('%c' === match) {
			// we only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
	return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
	// This hackery is required for IE8,
	// where the `console.log` function doesn't have 'apply'
	return 'object' == typeof console
		&& 'function' == typeof console.log
		&& Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
	try {
		if (null == namespaces) {
			sessionStorage.removeItem('debug');
		} else {
			sessionStorage.debug = namespaces;
		}
	} catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	var r;
	try {
		r = sessionStorage.debug;
	} catch(e) {}
	return r;
}

/**
 * Enable namespaces listed in `sessionStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":23}],23:[function(_dereq_,module,exports) {

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = _dereq_('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
	return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

	// define the `disabled` version
	function disabled() {
	}
	disabled.enabled = false;

	// define the `enabled` version
	function enabled() {

		var self = enabled;

		// set `diff` timestamp
		var curr = +new Date();
		var ms = curr - (prevTime || curr);
		self.diff = ms;
		self.prev = prevTime;
		self.curr = curr;
		prevTime = curr;

		// // add the `color` if not set
		// if (null == self.useColors) self.useColors = exports.useColors();
		// if (null == self.color && self.useColors) self.color = selectColor();

		var args = Array.prototype.slice.call(arguments);

		args[0] = exports.coerce(args[0]);

		if ('string' !== typeof args[0]) {
			// anything else let's inspect with %o
			args = ['%o'].concat(args);
		}

		// apply any `formatters` transformations
		var index = 0;
		args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
			// if we encounter an escaped % then don't increase the array index
			if (match === '%') return match;
			index++;
			var formatter = exports.formatters[format];
			if ('function' === typeof formatter) {
				var val = args[index];
				match = formatter.call(self, val);

				// now we need to remove `args[index]` since it's inlined in the `format`
				args.splice(index, 1);
				index--;
			}
			return match;
		});

		if ('function' === typeof exports.formatArgs) {
			args = exports.formatArgs.apply(self, args);
		}
		var logFn = enabled.log || exports.log || console.log.bind(console);
		logFn.apply(self, args);
	}
	enabled.enabled = true;

	var fn = exports.enabled(namespace) ? enabled : disabled;

	fn.namespace = namespace;

	return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
	exports.save(namespaces);

	var split = (namespaces || '').split(/[\s,]+/);
	var len = split.length;

	for (var i = 0; i < len; i++) {
		if (!split[i]) continue; // ignore empty strings
		namespaces = split[i].replace(/\*/g, '.*?');
		if (namespaces[0] === '-') {
			exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
		} else {
			exports.names.push(new RegExp('^' + namespaces + '$'));
		}
	}
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
	exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
	var i, len;
	for (i = 0, len = exports.skips.length; i < len; i++) {
		if (exports.skips[i].test(name)) {
			return false;
		}
	}
	for (i = 0, len = exports.names.length; i < len; i++) {
		if (exports.names[i].test(name)) {
			return true;
		}
	}
	return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
	if (val instanceof Error) return val.stack || val.message;
	return val;
}

},{"ms":24}],24:[function(_dereq_,module,exports) {
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
	options = options || {};
	if ('string' == typeof val) return parse(val);
	return options.long
		? long(val)
		: short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
	var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
	if (!match) return;
	var n = parseFloat(match[1]);
	var type = (match[2] || 'ms').toLowerCase();
	switch (type) {
		case 'years':
		case 'year':
		case 'y':
			return n * y;
		case 'days':
		case 'day':
		case 'd':
			return n * d;
		case 'hours':
		case 'hour':
		case 'h':
			return n * h;
		case 'minutes':
		case 'minute':
		case 'm':
			return n * m;
		case 'seconds':
		case 'second':
		case 's':
			return n * s;
		case 'ms':
			return n;
	}
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
	if (ms >= d) return Math.round(ms / d) + 'd';
	if (ms >= h) return Math.round(ms / h) + 'h';
	if (ms >= m) return Math.round(ms / m) + 'm';
	if (ms >= s) return Math.round(ms / s) + 's';
	return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
	return plural(ms, d, 'day')
		|| plural(ms, h, 'hour')
		|| plural(ms, m, 'minute')
		|| plural(ms, s, 'second')
		|| ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
	if (ms < n) return;
	if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
	return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],25:[function(_dereq_,module,exports) {
(function (global) {
/**
 * Module dependencies.
 */

var keys = _dereq_('./keys');
var hasBinary = _dereq_('has-binary');
var sliceBuffer = _dereq_('arraybuffer.slice');
var base64encoder = _dereq_('base64-arraybuffer');
var after = _dereq_('after');
var utf8 = _dereq_('utf8');

/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */

var isAndroid = navigator.userAgent.match(/Android/i);

/**
 * Check if we are running in PhantomJS.
 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
 * https://github.com/ariya/phantomjs/issues/11395
 * @type boolean
 */
var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);

/**
 * When true, avoids using Blobs to encode payloads.
 * @type boolean
 */
var dontSendBlobs = isAndroid || isPhantomJS;

/**
 * Current protocol version.
 */

exports.protocol = 3;

/**
 * Packet types.
 */

var packets = exports.packets = {
		open:	 0	// non-ws
	, close:	1	// non-ws
	, ping:	 2
	, pong:	 3
	, message:  4
	, upgrade:  5
	, noop:	 6
};

var packetslist = keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' };

/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = _dereq_('blob');

/**
 * Encodes a packet.
 *
 *	 <packet type id> [ <data> ]
 *
 * Example:
 *
 *	 5hello world
 *	 3
 *	 4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */

exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
	if ('function' == typeof supportsBinary) {
		callback = supportsBinary;
		supportsBinary = false;
	}

	if ('function' == typeof utf8encode) {
		callback = utf8encode;
		utf8encode = null;
	}

	var data = (packet.data === undefined)
		? undefined
		: packet.data.buffer || packet.data;

	if (global.ArrayBuffer && data instanceof ArrayBuffer) {
		return encodeArrayBuffer(packet, supportsBinary, callback);
	} else if (Blob && data instanceof global.Blob) {
		return encodeBlob(packet, supportsBinary, callback);
	}

	// might be an object with { base64: true, data: dataAsBase64String }
	if (data && data.base64) {
		return encodeBase64Object(packet, callback);
	}

	// Sending data as a utf-8 string
	var encoded = packets[packet.type];

	// data fragment is optional
	if (undefined !== packet.data) {
		encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
	}

	return callback('' + encoded);

};

function encodeBase64Object(packet, callback) {
	// packet data is an object { base64: true, data: dataAsBase64String }
	var message = 'b' + exports.packets[packet.type] + packet.data.data;
	return callback(message);
}

/**
 * Encode packet helpers for binary types
 */

function encodeArrayBuffer(packet, supportsBinary, callback) {
	if (!supportsBinary) {
		return exports.encodeBase64Packet(packet, callback);
	}

	var data = packet.data;
	var contentArray = new Uint8Array(data);
	var resultBuffer = new Uint8Array(1 + data.byteLength);

	resultBuffer[0] = packets[packet.type];
	for (var i = 0; i < contentArray.length; i++) {
		resultBuffer[i+1] = contentArray[i];
	}

	return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
	if (!supportsBinary) {
		return exports.encodeBase64Packet(packet, callback);
	}

	var fr = new FileReader();
	fr.onload = function() {
		packet.data = fr.result;
		exports.encodePacket(packet, supportsBinary, true, callback);
	};
	return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
	if (!supportsBinary) {
		return exports.encodeBase64Packet(packet, callback);
	}

	if (dontSendBlobs) {
		return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
	}

	var length = new Uint8Array(1);
	length[0] = packets[packet.type];
	var blob = new Blob([length.buffer, packet.data]);

	return callback(blob);
}

/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */

exports.encodeBase64Packet = function(packet, callback) {
	var message = 'b' + exports.packets[packet.type];
	if (Blob && packet.data instanceof Blob) {
		var fr = new FileReader();
		fr.onload = function() {
			var b64 = fr.result.split(',')[1];
			callback(message + b64);
		};
		return fr.readAsDataURL(packet.data);
	}

	var b64data;
	try {
		b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
	} catch (e) {
		// iPhone Safari doesn't let you apply with typed arrays
		var typed = new Uint8Array(packet.data);
		var basic = new Array(typed.length);
		for (var i = 0; i < typed.length; i++) {
			basic[i] = typed[i];
		}
		b64data = String.fromCharCode.apply(null, basic);
	}
	message += global.btoa(b64data);
	return callback(message);
};

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data, binaryType, utf8decode) {
	// String data
	if (typeof data == 'string' || data === undefined) {
		if (data.charAt(0) == 'b') {
			return exports.decodeBase64Packet(data.substr(1), binaryType);
		}

		if (utf8decode) {
			try {
				data = utf8.decode(data);
			} catch (e) {
				return err;
			}
		}
		var type = data.charAt(0);

		if (Number(type) != type || !packetslist[type]) {
			return err;
		}

		if (data.length > 1) {
			return { type: packetslist[type], data: data.substring(1) };
		} else {
			return { type: packetslist[type] };
		}
	}

	var asArray = new Uint8Array(data);
	var type = asArray[0];
	var rest = sliceBuffer(data, 1);
	if (Blob && binaryType === 'blob') {
		rest = new Blob([rest]);
	}
	return { type: packetslist[type], data: rest };
};

/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */

exports.decodeBase64Packet = function(msg, binaryType) {
	var type = packetslist[msg.charAt(0)];
	if (!global.ArrayBuffer) {
		return { type: type, data: { base64: true, data: msg.substr(1) } };
	}

	var data = base64encoder.decode(msg.substr(1));

	if (binaryType === 'blob' && Blob) {
		data = new Blob([data]);
	}

	return { type: type, data: data };
};

/**
 * Encodes multiple messages (payload).
 *
 *	 <length>:data
 *
 * Example:
 *
 *	 11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets, supportsBinary, callback) {
	if (typeof supportsBinary == 'function') {
		callback = supportsBinary;
		supportsBinary = null;
	}

	var isBinary = hasBinary(packets);

	if (supportsBinary && isBinary) {
		if (Blob && !dontSendBlobs) {
			return exports.encodePayloadAsBlob(packets, callback);
		}

		return exports.encodePayloadAsArrayBuffer(packets, callback);
	}

	if (!packets.length) {
		return callback('0:');
	}

	function setLengthHeader(message) {
		return message.length + ':' + message;
	}

	function encodeOne(packet, doneCallback) {
		exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
			doneCallback(null, setLengthHeader(message));
		});
	}

	map(packets, encodeOne, function(err, results) {
		return callback(results.join(''));
	});
};

/**
 * Async array map using after
 */

function map(ary, each, done) {
	var result = new Array(ary.length);
	var next = after(ary.length, done);

	var eachWithIndex = function(i, el, cb) {
		each(el, function(error, msg) {
			result[i] = msg;
			cb(error, result);
		});
	};

	for (var i = 0; i < ary.length; i++) {
		eachWithIndex(i, ary[i], next);
	}
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

exports.decodePayload = function (data, binaryType, callback) {
	if (typeof data != 'string') {
		return exports.decodePayloadAsBinary(data, binaryType, callback);
	}

	if (typeof binaryType === 'function') {
		callback = binaryType;
		binaryType = null;
	}

	var packet;
	if (data == '') {
		// parser error - ignoring payload
		return callback(err, 0, 1);
	}

	var length = ''
		, n, msg;

	for (var i = 0, l = data.length; i < l; i++) {
		var chr = data.charAt(i);

		if (':' != chr) {
			length += chr;
		} else {
			if ('' == length || (length != (n = Number(length)))) {
				// parser error - ignoring payload
				return callback(err, 0, 1);
			}

			msg = data.substr(i + 1, n);

			if (length != msg.length) {
				// parser error - ignoring payload
				return callback(err, 0, 1);
			}

			if (msg.length) {
				packet = exports.decodePacket(msg, binaryType, true);

				if (err.type == packet.type && err.data == packet.data) {
					// parser error in individual packet - ignoring payload
					return callback(err, 0, 1);
				}

				var ret = callback(packet, i + n, l);
				if (false === ret) return;
			}

			// advance cursor
			i += n;
			length = '';
		}
	}

	if (length != '') {
		// parser error - ignoring payload
		return callback(err, 0, 1);
	}

};

/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */

exports.encodePayloadAsArrayBuffer = function(packets, callback) {
	if (!packets.length) {
		return callback(new ArrayBuffer(0));
	}

	function encodeOne(packet, doneCallback) {
		exports.encodePacket(packet, true, true, function(data) {
			return doneCallback(null, data);
		});
	}

	map(packets, encodeOne, function(err, encodedPackets) {
		var totalLength = encodedPackets.reduce(function(acc, p) {
			var len;
			if (typeof p === 'string') {
				len = p.length;
			} else {
				len = p.byteLength;
			}
			return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
		}, 0);

		var resultArray = new Uint8Array(totalLength);

		var bufferIndex = 0;
		encodedPackets.forEach(function(p) {
			var isString = typeof p === 'string';
			var ab = p;
			if (isString) {
				var view = new Uint8Array(p.length);
				for (var i = 0; i < p.length; i++) {
					view[i] = p.charCodeAt(i);
				}
				ab = view.buffer;
			}

			if (isString) { // not true binary
				resultArray[bufferIndex++] = 0;
			} else { // true binary
				resultArray[bufferIndex++] = 1;
			}

			var lenStr = ab.byteLength.toString();
			for (var i = 0; i < lenStr.length; i++) {
				resultArray[bufferIndex++] = parseInt(lenStr[i]);
			}
			resultArray[bufferIndex++] = 255;

			var view = new Uint8Array(ab);
			for (var i = 0; i < view.length; i++) {
				resultArray[bufferIndex++] = view[i];
			}
		});

		return callback(resultArray.buffer);
	});
};

/**
 * Encode as Blob
 */

exports.encodePayloadAsBlob = function(packets, callback) {
	function encodeOne(packet, doneCallback) {
		exports.encodePacket(packet, true, true, function(encoded) {
			var binaryIdentifier = new Uint8Array(1);
			binaryIdentifier[0] = 1;
			if (typeof encoded === 'string') {
				var view = new Uint8Array(encoded.length);
				for (var i = 0; i < encoded.length; i++) {
					view[i] = encoded.charCodeAt(i);
				}
				encoded = view.buffer;
				binaryIdentifier[0] = 0;
			}

			var len = (encoded instanceof ArrayBuffer)
				? encoded.byteLength
				: encoded.size;

			var lenStr = len.toString();
			var lengthAry = new Uint8Array(lenStr.length + 1);
			for (var i = 0; i < lenStr.length; i++) {
				lengthAry[i] = parseInt(lenStr[i]);
			}
			lengthAry[lenStr.length] = 255;

			if (Blob) {
				var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
				doneCallback(null, blob);
			}
		});
	}

	map(packets, encodeOne, function(err, results) {
		return callback(new Blob(results));
	});
};

/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */

exports.decodePayloadAsBinary = function (data, binaryType, callback) {
	if (typeof binaryType === 'function') {
		callback = binaryType;
		binaryType = null;
	}

	var bufferTail = data;
	var buffers = [];

	var numberTooLong = false;
	while (bufferTail.byteLength > 0) {
		var tailArray = new Uint8Array(bufferTail);
		var isString = tailArray[0] === 0;
		var msgLength = '';

		for (var i = 1; ; i++) {
			if (tailArray[i] == 255) break;

			if (msgLength.length > 310) {
				numberTooLong = true;
				break;
			}

			msgLength += tailArray[i];
		}

		if (numberTooLong) return callback(err, 0, 1);

		bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
		msgLength = parseInt(msgLength);

		var msg = sliceBuffer(bufferTail, 0, msgLength);
		if (isString) {
			try {
				msg = String.fromCharCode.apply(null, new Uint8Array(msg));
			} catch (e) {
				// iPhone Safari doesn't let you apply to typed arrays
				var typed = new Uint8Array(msg);
				msg = '';
				for (var i = 0; i < typed.length; i++) {
					msg += String.fromCharCode(typed[i]);
				}
			}
		}

		buffers.push(msg);
		bufferTail = sliceBuffer(bufferTail, msgLength);
	}

	var total = buffers.length;
	buffers.forEach(function(buffer, i) {
		callback(exports.decodePacket(buffer, binaryType, true), i, total);
	});
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./keys":26,"after":27,"arraybuffer.slice":28,"base64-arraybuffer":29,"blob":30,"has-binary":31,"utf8":33}],26:[function(_dereq_,module,exports) {

/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */

module.exports = Object.keys || function keys (obj) {
	var arr = [];
	var has = Object.prototype.hasOwnProperty;

	for (var i in obj) {
		if (has.call(obj, i)) {
			arr.push(i);
		}
	}
	return arr;
};

},{}],27:[function(_dereq_,module,exports) {
module.exports = after

function after(count, callback, err_cb) {
		var bail = false
		err_cb = err_cb || noop
		proxy.count = count

		return (count === 0) ? callback() : proxy

		function proxy(err, result) {
				if (proxy.count <= 0) {
					  throw new Error('after called too many times')
				}
				--proxy.count

				// after first error, rest are passed to err_cb
				if (err) {
					  bail = true
					  callback(err)
					  // future error callbacks will go to error handler
					  callback = err_cb
				} else if (proxy.count === 0 && !bail) {
					  callback(null, result)
				}
		}
}

function noop() {}

},{}],28:[function(_dereq_,module,exports) {
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */

module.exports = function(arraybuffer, start, end) {
	var bytes = arraybuffer.byteLength;
	start = start || 0;
	end = end || bytes;

	if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

	if (start < 0) { start += bytes; }
	if (end < 0) { end += bytes; }
	if (end > bytes) { end = bytes; }

	if (start >= bytes || start >= end || bytes === 0) {
		return new ArrayBuffer(0);
	}

	var abv = new Uint8Array(arraybuffer);
	var result = new Uint8Array(end - start);
	for (var i = start, ii = 0; i < end; i++, ii++) {
		result[ii] = abv[i];
	}
	return result.buffer;
};

},{}],29:[function(_dereq_,module,exports) {
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(chars) {
	"use strict";

	exports.encode = function(arraybuffer) {
		var bytes = new Uint8Array(arraybuffer),
		i, len = bytes.length, base64 = "";

		for (i = 0; i < len; i+=3) {
			base64 += chars[bytes[i] >> 2];
			base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
			base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
			base64 += chars[bytes[i + 2] & 63];
		}

		if ((len % 3) === 2) {
			base64 = base64.substring(0, base64.length - 1) + "=";
		} else if (len % 3 === 1) {
			base64 = base64.substring(0, base64.length - 2) + "==";
		}

		return base64;
	};

	exports.decode =  function(base64) {
		var bufferLength = base64.length * 0.75,
		len = base64.length, i, p = 0,
		encoded1, encoded2, encoded3, encoded4;

		if (base64[base64.length - 1] === "=") {
			bufferLength--;
			if (base64[base64.length - 2] === "=") {
				bufferLength--;
			}
		}

		var arraybuffer = new ArrayBuffer(bufferLength),
		bytes = new Uint8Array(arraybuffer);

		for (i = 0; i < len; i+=4) {
			encoded1 = chars.indexOf(base64[i]);
			encoded2 = chars.indexOf(base64[i+1]);
			encoded3 = chars.indexOf(base64[i+2]);
			encoded4 = chars.indexOf(base64[i+3]);

			bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
			bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
			bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
		}

		return arraybuffer;
	};
})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

},{}],30:[function(_dereq_,module,exports) {
(function (global) {
/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = global.BlobBuilder
	|| global.WebKitBlobBuilder
	|| global.MSBlobBuilder
	|| global.MozBlobBuilder;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
	try {
		var b = new Blob(['hi']);
		return b.size == 2;
	} catch(e) {
		return false;
	}
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
	&& BlobBuilder.prototype.append
	&& BlobBuilder.prototype.getBlob;

function BlobBuilderConstructor(ary, options) {
	options = options || {};

	var bb = new BlobBuilder();
	for (var i = 0; i < ary.length; i++) {
		bb.append(ary[i]);
	}
	return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
};

module.exports = (function() {
	if (blobSupported) {
		return global.Blob;
	} else if (blobBuilderSupported) {
		return BlobBuilderConstructor;
	} else {
		return undefined;
	}
})();

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],31:[function(_dereq_,module,exports) {
(function (global) {

/*
 * Module requirements.
 */

var isArray = _dereq_('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

	function _hasBinary(obj) {
		if (!obj) return false;

		if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
				 (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
				 (global.Blob && obj instanceof Blob) ||
				 (global.File && obj instanceof File)
				) {
			return true;
		}

		if (isArray(obj)) {
			for (var i = 0; i < obj.length; i++) {
					if (_hasBinary(obj[i])) {
						return true;
					}
			}
		} else if (obj && 'object' == typeof obj) {
			if (obj.toJSON) {
				obj = obj.toJSON();
			}

			for (var key in obj) {
				if (obj.hasOwnProperty(key) && _hasBinary(obj[key])) {
					return true;
				}
			}
		}

		return false;
	}

	return _hasBinary(data);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"isarray":32}],32:[function(_dereq_,module,exports) {
module.exports = Array.isArray || function (arr) {
	return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],33:[function(_dereq_,module,exports) {
(function (global) {
/*! http://mths.be/utf8js v2.0.0 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from http://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from http://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);

		// console.log(JSON.stringify(codePoints.map(function(x) {
		// 	return 'U+' + x.toString(16).toUpperCase();
		// })));

		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			var byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.0.0',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return utf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],34:[function(_dereq_,module,exports) {
(function (global) {
/**
 * JSON parse.
 *
 * @see Based on jQuery#parseJSON (MIT) and JSON2
 * @api private
 */

var rvalidchars = /^[\],:{}\s]*$/;
var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
var rtrimLeft = /^\s+/;
var rtrimRight = /\s+$/;

module.exports = function parsejson(data) {
	if ('string' != typeof data || !data) {
		return null;
	}

	data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

	// Attempt to parse using the native JSON parser first
	if (global.JSON && JSON.parse) {
		return JSON.parse(data);
	}

	if (rvalidchars.test(data.replace(rvalidescape, '@')
			.replace(rvalidtokens, ']')
			.replace(rvalidbraces, ''))) {
		return (new Function('return ' + data))();
	}
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],35:[function(_dereq_,module,exports) {
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
	var str = '';

	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			if (str.length) str += '&';
			str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
		}
	}

	return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs) {
	var qry = {};
	var pairs = qs.split('&');
	for (var i = 0, l = pairs.length; i < l; i++) {
		var pair = pairs[i].split('=');
		qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	}
	return qry;
};

},{}],36:[function(_dereq_,module,exports) {
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:) {2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
		'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
		var src = str,
				b = str.indexOf('['),
				e = str.indexOf(']');

		if (b != -1 && e != -1) {
				str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
		}

		var m = re.exec(str || ''),
				uri = {},
				i = 14;

		while (i--) {
				uri[parts[i]] = m[i] || '';
		}

		if (b != -1 && e != -1) {
				uri.source = src;
				uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
				uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
				uri.ipv6uri = true;
		}

		return uri;
};

},{}],37:[function(_dereq_,module,exports) {

/**
 * Module dependencies.
 */

var global = (function() { return this; })();

/**
 * WebSocket constructor.
 */

var WebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Module exports.
 */

module.exports = WebSocket ? ws : null;

/**
 * WebSocket constructor.
 *
 * The third `opts` options object gets ignored in web browsers, since it's
 * non-standard, and throws a TypeError if passed to the constructor.
 * See: https://github.com/einaros/ws/issues/227
 *
 * @param {String} uri
 * @param {Array} protocols (optional)
 * @param {Object) opts (optional)
 * @api public
 */

function ws(uri, protocols, opts) {
	try {
        var instance;
        if (protocols) {
            instance = new WebSocket(uri, protocols);
        } else {
            instance = new WebSocket(uri);
        }
        return instance;
	} catch (error) {
        console.error("Error:", error.message);
        window["IRC_CONNECTED"] = '0';
        toggle_chat_input_ui(false);
        sessionStorage.setItem("IRC_RECONNECT_TIMER", Date.now() + (33 * 1000));

	}
}

if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],38:[function(_dereq_,module,exports) {
(function (global) {

/*
 * Module requirements.
 */

var isArray = _dereq_('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

	function _hasBinary(obj) {
		if (!obj) return false;

		if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
				 (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
				 (global.Blob && obj instanceof Blob) ||
				 (global.File && obj instanceof File)
				) {
			return true;
		}

		if (isArray(obj)) {
			for (var i = 0; i < obj.length; i++) {
					if (_hasBinary(obj[i])) {
						return true;
					}
			}
		} else if (obj && 'object' == typeof obj) {
			if (obj.toJSON) {
				obj = obj.toJSON();
			}

			for (var key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
					return true;
				}
			}
		}

		return false;
	}

	return _hasBinary(data);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"isarray":39}],39:[function(_dereq_,module,exports) {
module.exports=_dereq_(32)
},{}],40:[function(_dereq_,module,exports) {

/**
 * Module dependencies.
 */

var global = _dereq_('global');

/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
	module.exports = 'XMLHttpRequest' in global &&
		'withCredentials' in new global.XMLHttpRequest();
} catch (err) {
	// if XMLHttp support is disabled in IE then it will throw
	// when trying to create
	module.exports = false;
}

},{"global":41}],41:[function(_dereq_,module,exports) {

/**
 * Returns `this`. Execute this without a "context" (i.e. without it being
 * attached to an object of the left-hand side), and `this` points to the
 * "global" scope of the current JS execution.
 */

module.exports = (function () { return this; })();

},{}],42:[function(_dereq_,module,exports) {

var indexOf = [].indexOf;

module.exports = function(arr, obj) {
	if (indexOf) return arr.indexOf(obj);
	for (var i = 0; i < arr.length; ++i) {
		if (arr[i] === obj) return i;
	}
	return -1;
};
},{}],43:[function(_dereq_,module,exports) {

/**
 * HOP ref.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Return own keys in `obj`.
 *
 * @param {Object} obj
 * @return {Array}
 * @api public
 */

exports.keys = Object.keys || function(obj) {
	var keys = [];
	for (var key in obj) {
		if (has.call(obj, key)) {
			keys.push(key);
		}
	}
	return keys;
};

/**
 * Return own values in `obj`.
 *
 * @param {Object} obj
 * @return {Array}
 * @api public
 */

exports.values = function(obj) {
	var vals = [];
	for (var key in obj) {
		if (has.call(obj, key)) {
			vals.push(obj[key]);
		}
	}
	return vals;
};

/**
 * Merge `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api public
 */

exports.merge = function(a, b) {
	for (var key in b) {
		if (has.call(b, key)) {
			a[key] = b[key];
		}
	}
	return a;
};

/**
 * Return length of `obj`.
 *
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.length = function(obj) {
	return exports.keys(obj).length;
};

/**
 * Check if `obj` is empty.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api public
 */

exports.isEmpty = function(obj) {
	return 0 == exports.length(obj);
};
},{}],44:[function(_dereq_,module,exports) {
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:) {2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
		'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host'
	, 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
	var m = re.exec(str || '')
		, uri = {}
		, i = 14;

	while (i--) {
		uri[parts[i]] = m[i] || '';
	}

	return uri;
};

},{}],45:[function(_dereq_,module,exports) {
(function (global) {
/*global Blob,File*/

/**
 * Module requirements
 */

var isArray = _dereq_('isarray');
var isBuf = _dereq_('./is-buffer');

/**
 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
 * Anything with blobs or files should be fed through removeBlobs before coming
 * here.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @api public
 */

exports.deconstructPacket = function(packet) {
	var buffers = [];
	var packetData = packet.data;

	function _deconstructPacket(data) {
		if (!data) return data;

		if (isBuf(data)) {
			var placeholder = { _placeholder: true, num: buffers.length };
			buffers.push(data);
			return placeholder;
		} else if (isArray(data)) {
			var newData = new Array(data.length);
			for (var i = 0; i < data.length; i++) {
				newData[i] = _deconstructPacket(data[i]);
			}
			return newData;
		} else if ('object' == typeof data && !(data instanceof Date)) {
			var newData = {};
			for (var key in data) {
				newData[key] = _deconstructPacket(data[key]);
			}
			return newData;
		}
		return data;
	}

	var pack = packet;
	pack.data = _deconstructPacket(packetData);
	pack.attachments = buffers.length; // number of binary 'attachments'
	return {packet: pack, buffers: buffers};
};

/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @api public
 */

exports.reconstructPacket = function(packet, buffers) {
	var curPlaceHolder = 0;

	function _reconstructPacket(data) {
		if (data && data._placeholder) {
			var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
			return buf;
		} else if (isArray(data)) {
			for (var i = 0; i < data.length; i++) {
				data[i] = _reconstructPacket(data[i]);
			}
			return data;
		} else if (data && 'object' == typeof data) {
			for (var key in data) {
				data[key] = _reconstructPacket(data[key]);
			}
			return data;
		}
		return data;
	}

	packet.data = _reconstructPacket(packet.data);
	packet.attachments = undefined; // no longer useful
	return packet;
};

/**
 * Asynchronously removes Blobs or Files from data via
 * FileReader's readAsArrayBuffer method. Used before encoding
 * data as msgpack. Calls callback with the blobless data.
 *
 * @param {Object} data
 * @param {Function} callback
 * @api private
 */

exports.removeBlobs = function(data, callback) {
	function _removeBlobs(obj, curKey, containingObject) {
		if (!obj) return obj;

		// convert any blob
		if ((global.Blob && obj instanceof Blob) ||
				(global.File && obj instanceof File)) {
			pendingBlobs++;

			// async filereader
			var fileReader = new FileReader();
			fileReader.onload = function() { // this.result == arraybuffer
				if (containingObject) {
					containingObject[curKey] = this.result;
				}
				else {
					bloblessData = this.result;
				}

				// if nothing pending its callback time
				if (! --pendingBlobs) {
					callback(bloblessData);
				}
			};

			fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
		} else if (isArray(obj)) { // handle array
			for (var i = 0; i < obj.length; i++) {
				_removeBlobs(obj[i], i, obj);
			}
		} else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
			for (var key in obj) {
				_removeBlobs(obj[key], key, obj);
			}
		}
	}

	var pendingBlobs = 0;
	var bloblessData = data;
	_removeBlobs(bloblessData);
	if (!pendingBlobs) {
		callback(bloblessData);
	}
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./is-buffer":47,"isarray":48}],46:[function(_dereq_,module,exports) {

/**
 * Module dependencies.
 */

var debug = _dereq_('debug')('socket.io-parser');
var json = _dereq_('json3');
var isArray = _dereq_('isarray');
var Emitter = _dereq_('component-emitter');
var binary = _dereq_('./binary');
var isBuf = _dereq_('./is-buffer');

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = 4;

/**
 * Packet types.
 *
 * @api public
 */

exports.types = [
	'CONNECT',
	'DISCONNECT',
	'EVENT',
	'BINARY_EVENT',
	'ACK',
	'BINARY_ACK',
	'ERROR'
];

/**
 * Packet type `connect`.
 *
 * @api public
 */

exports.CONNECT = 0;

/**
 * Packet type `disconnect`.
 *
 * @api public
 */

exports.DISCONNECT = 1;

/**
 * Packet type `event`.
 *
 * @api public
 */

exports.EVENT = 2;

/**
 * Packet type `ack`.
 *
 * @api public
 */

exports.ACK = 3;

/**
 * Packet type `error`.
 *
 * @api public
 */

exports.ERROR = 4;

/**
 * Packet type 'binary event'
 *
 * @api public
 */

exports.BINARY_EVENT = 5;

/**
 * Packet type `binary ack`. For acks with binary arguments.
 *
 * @api public
 */

exports.BINARY_ACK = 6;

/**
 * Encoder constructor.
 *
 * @api public
 */

exports.Encoder = Encoder;

/**
 * Decoder constructor.
 *
 * @api public
 */

exports.Decoder = Decoder;

/**
 * A socket.io Encoder instance
 *
 * @api public
 */

function Encoder() {}

/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function(obj, callback) {
	debug('encoding packet %j', obj);

	if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
		encodeAsBinary(obj, callback);
	}
	else {
		var encoding = encodeAsString(obj);
		callback([encoding]);
	}
};

/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */

function encodeAsString(obj) {
	var str = '';
	var nsp = false;

	// first is type
	str += obj.type;

	// attachments if we have them
	if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
		str += obj.attachments;
		str += '-';
	}

	// if we have a namespace other than `/`
	// we append it followed by a comma `,`
	if (obj.nsp && '/' != obj.nsp) {
		nsp = true;
		str += obj.nsp;
	}

	// immediately followed by the id
	if (null != obj.id) {
		if (nsp) {
			str += ',';
			nsp = false;
		}
		str += obj.id;
	}

	// json data
	if (null != obj.data) {
		if (nsp) str += ',';
		str += json.stringify(obj.data);
	}

	debug('encoded %j as %s', obj, str);
	return str;
}

/**
 * Encode packet as 'buffer sequence' by removing blobs, and
 * deconstructing packet into object with placeholders and
 * a list of buffers.
 *
 * @param {Object} packet
 * @return {Buffer} encoded
 * @api private
 */

function encodeAsBinary(obj, callback) {

	function writeEncoding(bloblessData) {
		var deconstruction = binary.deconstructPacket(bloblessData);
		var pack = encodeAsString(deconstruction.packet);
		var buffers = deconstruction.buffers;

		buffers.unshift(pack); // add packet info to beginning of data list
		callback(buffers); // write all the buffers
	}

	binary.removeBlobs(obj, writeEncoding);
}

/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 * @api public
 */

function Decoder() {
	this.reconstructor = null;
}

/**
 * Mix in `Emitter` with Decoder.
 */

Emitter(Decoder.prototype);

/**
 * Decodes an ecoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function(obj) {
	var packet;
	if ('string' == typeof obj) {
		packet = decodeString(obj);
		if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
			this.reconstructor = new BinaryReconstructor(packet);

			// no attachments, labeled binary but no binary data to follow
			if (this.reconstructor.reconPack.attachments === 0) {
				this.emit('decoded', packet);
			}
		} else { // non-binary full packet
			this.emit('decoded', packet);
		}
	}
	else if (isBuf(obj) || obj.base64) { // raw binary data
		if (!this.reconstructor) {
			throw new Error('got binary data when not reconstructing a packet');
		} else {
			packet = this.reconstructor.takeBinaryData(obj);
			if (packet) { // received final buffer
				this.reconstructor = null;
				this.emit('decoded', packet);
			}
		}
	}
	else {
		throw new Error('Unknown type: ' + obj);
	}
};

/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */

function decodeString(str) {
	var p = {};
	var i = 0;

	// look up type
	p.type = Number(str.charAt(0));
	if (null == exports.types[p.type]) return error();

	// look up attachments if type binary
	if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
		var buf = '';
		while (str.charAt(++i) != '-') {
			buf += str.charAt(i);
			if (i == str.length) break;
		}
		if (buf != Number(buf) || str.charAt(i) != '-') {
			throw new Error('Illegal attachments');
		}
		p.attachments = Number(buf);
	}

	// look up namespace (if any)
	if ('/' == str.charAt(i + 1)) {
		p.nsp = '';
		while (++i) {
			var c = str.charAt(i);
			if (',' == c) break;
			p.nsp += c;
			if (i == str.length) break;
		}
	} else {
		p.nsp = '/';
	}

	// look up id
	var next = str.charAt(i + 1);
	if ('' !== next && Number(next) == next) {
		p.id = '';
		while (++i) {
			var c = str.charAt(i);
			if (null == c || Number(c) != c) {
				--i;
				break;
			}
			p.id += str.charAt(i);
			if (i == str.length) break;
		}
		p.id = Number(p.id);
	}

	// look up json data
	if (str.charAt(++i)) {
		try {
			p.data = json.parse(str.substr(i));
		} catch(e) {
			return error();
		}
	}

	debug('decoded %s as %j', str, p);
	return p;
}

/**
 * Deallocates a parser's resources
 *
 * @api public
 */

Decoder.prototype.destroy = function() {
	if (this.reconstructor) {
		this.reconstructor.finishedReconstruction();
	}
};

/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 * @api private
 */

function BinaryReconstructor(packet) {
	this.reconPack = packet;
	this.buffers = [];
}

/**
 * Method to be called when binary data received from connection
 * after a BINARY_EVENT packet.
 *
 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
 * @return {null | Object} returns null if more binary data is expected or
 *   a reconstructed packet object if all buffers have been received.
 * @api private
 */

BinaryReconstructor.prototype.takeBinaryData = function(binData) {
	this.buffers.push(binData);
	if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
		var packet = binary.reconstructPacket(this.reconPack, this.buffers);
		this.finishedReconstruction();
		return packet;
	}
	return null;
};

/**
 * Cleans up binary packet reconstruction variables.
 *
 * @api private
 */

BinaryReconstructor.prototype.finishedReconstruction = function() {
	this.reconPack = null;
	this.buffers = [];
};

function error(data) {
	return {
		type: exports.ERROR,
		data: 'parser error'
	};
}

},{"./binary":45,"./is-buffer":47,"component-emitter":9,"debug":10,"isarray":48,"json3":49}],47:[function(_dereq_,module,exports) {
(function (global) {

module.exports = isBuf;

/**
 * Returns true if obj is a buffer or an arraybuffer.
 *
 * @api private
 */

function isBuf(obj) {
	return (global.Buffer && global.Buffer.isBuffer(obj)) ||
				 (global.ArrayBuffer && obj instanceof ArrayBuffer);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],48:[function(_dereq_,module,exports) {
module.exports=_dereq_(32)
},{}],49:[function(_dereq_,module,exports) {
/*! JSON v3.2.6 | http://bestiejs.github.io/json3 | Copyright 2012-2013, Kit Cambridge | http://kit.mit-license.org */
;(function (window) {
	// Convenience aliases.
	var getClass = {}.toString, isProperty, forEach, undef;

	// Detect the `define` function exposed by asynchronous module loaders. The
	// strict `define` check is necessary for compatibility with `r.js`.
	var isLoader = typeof define === "function" && define.amd;

	// Detect native implementations.
	var nativeJSON = typeof JSON == "object" && JSON;

	// Set up the JSON 3 namespace, preferring the CommonJS `exports` object if
	// available.
	var JSON3 = typeof exports == "object" && exports && !exports.nodeType && exports;

	if (JSON3 && nativeJSON) {
		// Explicitly delegate to the native `stringify` and `parse`
		// implementations in CommonJS environments.
		JSON3.stringify = nativeJSON.stringify;
		JSON3.parse = nativeJSON.parse;
	} else {
		// Export for web browsers, JavaScript engines, and asynchronous module
		// loaders, using the global `JSON` object if available.
		JSON3 = window.JSON = nativeJSON || {};
	}

	// Test the `Date#getUTC*` methods. Based on work by @Yaffle.
	var isExtended = new Date(-3509827334573292);
	try {
		// The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
		// results for certain dates in Opera >= 10.53.
		isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
			// Safari < 2.0.2 stores the internal millisecond time value correctly,
			// but clips the values returned by the date methods to the range of
			// signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
			isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
	} catch (exception) {}

	// Internal: Determines whether the native `JSON.stringify` and `parse`
	// implementations are spec-compliant. Based on work by Ken Snyder.
	function has(name) {
		if (has[name] !== undef) {
			// Return cached feature test result.
			return has[name];
		}

		var isSupported;
		if (name == "bug-string-char-index") {
			// IE <= 7 doesn't support accessing string characters using square
			// bracket notation. IE 8 only supports this for primitives.
			isSupported = "a"[0] != "a";
		} else if (name == "json") {
			// Indicates whether both `JSON.stringify` and `JSON.parse` are
			// supported.
			isSupported = has("json-stringify") && has("json-parse");
		} else {
			var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
			// Test `JSON.stringify`.
			if (name == "json-stringify") {
				var stringify = JSON3.stringify, stringifySupported = typeof stringify == "function" && isExtended;
				if (stringifySupported) {
					// A test function object with a custom `toJSON` method.
					(value = function () {
					  return 1;
					}).toJSON = value;
					try {
					  stringifySupported =
						// Firefox 3.1b1 and b2 serialize string, number, and boolean
						// primitives as object literals.
						stringify(0) === "0" &&
						// FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
						// literals.
						stringify(new Number()) === "0" &&
						stringify(new String()) == '""' &&
						// FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
						// does not define a canonical JSON representation (this applies to
						// objects with `toJSON` properties as well, *unless* they are nested
						// within an object or array).
						stringify(getClass) === undef &&
						// IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
						// FF 3.1b3 pass this test.
						stringify(undef) === undef &&
						// Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
						// respectively, if the value is omitted entirely.
						stringify() === undef &&
						// FF 3.1b1, 2 throw an error if the given value is not a number,
						// string, array, object, Boolean, or `null` literal. This applies to
						// objects with custom `toJSON` methods as well, unless they are nested
						// inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
						// methods entirely.
						stringify(value) === "1" &&
						stringify([value]) == "[1]" &&
						// Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
						// `"[null]"`.
						stringify([undef]) == "[null]" &&
						// YUI 3.0.0b1 fails to serialize `null` literals.
						stringify(null) == "null" &&
						// FF 3.1b1, 2 halts serialization if an array contains a function:
						// `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
						// elides non-JSON values from objects and arrays, unless they
						// define custom `toJSON` methods.
						stringify([undef, getClass, null]) == "[null,null,null]" &&
						// Simple serialization test. FF 3.1b1 uses Unicode escape sequences
						// where character escape codes are expected (e.g., `\b` => `\u0008`).
						stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
						// FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
						stringify(null, value) === "1" &&
						stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
						// JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
						// serialize extended years.
						stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
						// The milliseconds are optional in ES 5, but required in 5.1.
						stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
						// Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
						// four-digit years instead of six-digit years. Credits: @Yaffle.
						stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
						// Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
						// values less than 1000. Credits: @Yaffle.
						stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
					} catch (exception) {
					  stringifySupported = false;
					}
				}
				isSupported = stringifySupported;
			}
			// Test `JSON.parse`.
			if (name == "json-parse") {
				var parse = JSON3.parse;
				if (typeof parse == "function") {
					try {
					  // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
					  // Conforming implementations should also coerce the initial argument to
					  // a string prior to parsing.
					  if (parse("0") === 0 && !parse(false)) {
						// Simple parsing test.
						value = parse(serialized);
						var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
						if (parseSupported) {
						  try {
							// Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
							parseSupported = !parse('"\t"');
						  } catch (exception) {}
						  if (parseSupported) {
							try {
							  // FF 4.0 and 4.0.1 allow leading `+` signs and leading
							  // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
							  // certain octal literals.
							  parseSupported = parse("01") !== 1;
							} catch (exception) {}
						  }
						  if (parseSupported) {
							try {
							  // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
							  // points. These environments, along with FF 3.1b1 and 2,
							  // also allow trailing commas in JSON objects and arrays.
							  parseSupported = parse("1.") !== 1;
							} catch (exception) {}
						  }
						}
					  }
					} catch (exception) {
					  parseSupported = false;
					}
				}
				isSupported = parseSupported;
			}
		}
		return has[name] = !!isSupported;
	}

	if (!has("json")) {
		// Common `[[Class]]` name aliases.
		var functionClass = "[object Function]";
		var dateClass = "[object Date]";
		var numberClass = "[object Number]";
		var stringClass = "[object String]";
		var arrayClass = "[object Array]";
		var booleanClass = "[object Boolean]";

		// Detect incomplete support for accessing string characters by index.
		var charIndexBuggy = has("bug-string-char-index");

		// Define additional utility methods if the `Date` methods are buggy.
		if (!isExtended) {
			var floor = Math.floor;
			// A mapping between the months of the year and the number of days between
			// January 1st and the first of the respective month.
			var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
			// Internal: Calculates the number of days between the Unix epoch and the
			// first day of the given month.
			var getDay = function (year, month) {
				return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
			};
		}

		// Internal: Determines if a property is a direct property of the given
		// object. Delegates to the native `Object#hasOwnProperty` method.
		if (!(isProperty = {}.hasOwnProperty)) {
			isProperty = function (property) {
				var members = {}, constructor;
				if ((members.__proto__ = null, members.__proto__ = {
					// The *proto* property cannot be set multiple times in recent
					// versions of Firefox and SeaMonkey.
					"toString": 1
				}, members).toString != getClass) {
					// Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
					// supports the mutable *proto* property.
					isProperty = function (property) {
					  // Capture and break the object's prototype chain (see section 8.6.2
					  // of the ES 5.1 spec). The parenthesized expression prevents an
					  // unsafe transformation by the Closure Compiler.
					  var original = this.__proto__, result = property in (this.__proto__ = null, this);
					  // Restore the original prototype chain.
					  this.__proto__ = original;
					  return result;
					};
				} else {
					// Capture a reference to the top-level `Object` constructor.
					constructor = members.constructor;
					// Use the `constructor` property to simulate `Object#hasOwnProperty` in
					// other environments.
					isProperty = function (property) {
					  var parent = (this.constructor || constructor).prototype;
					  return property in this && !(property in parent && this[property] === parent[property]);
					};
				}
				members = null;
				return isProperty.call(this, property);
			};
		}

		// Internal: A set of primitive types used by `isHostType`.
		var PrimitiveTypes = {
			'boolean': 1,
			'number': 1,
			'string': 1,
			'undefined': 1
		};

		// Internal: Determines if the given object `property` value is a
		// non-primitive.
		var isHostType = function (object, property) {
			var type = typeof object[property];
			return type == 'object' ? !!object[property] : !PrimitiveTypes[type];
		};

		// Internal: Normalizes the `for...in` iteration algorithm across
		// environments. Each enumerated key is yielded to a `callback` function.
		forEach = function (object, callback) {
			var size = 0, Properties, members, property;

			// Tests for bugs in the current environment's `for...in` algorithm. The
			// `valueOf` property inherits the non-enumerable flag from
			// `Object.prototype` in older versions of IE, Netscape, and Mozilla.
			(Properties = function () {
				this.valueOf = 0;
			}).prototype.valueOf = 0;

			// Iterate over a new instance of the `Properties` class.
			members = new Properties();
			for (property in members) {
				// Ignore all properties inherited from `Object.prototype`.
				if (isProperty.call(members, property)) {
					size++;
				}
			}
			Properties = members = null;

			// Normalize the iteration algorithm.
			if (!size) {
				// A list of non-enumerable properties inherited from `Object.prototype`.
				members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
				// IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
				// properties.
				forEach = function (object, callback) {
					var isFunction = getClass.call(object) == functionClass, property, length;
					var hasProperty = !isFunction && typeof object.constructor != 'function' && isHostType(object, 'hasOwnProperty') ? object.hasOwnProperty : isProperty;
					for (property in object) {
					  // Gecko <= 1.0 enumerates the `prototype` property of functions under
					  // certain conditions; IE does not.
					  if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
						callback(property);
					  }
					}
					// Manually invoke the callback for each non-enumerable property.
					for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
				};
			} else if (size == 2) {
				// Safari <= 2.0.4 enumerates shadowed properties twice.
				forEach = function (object, callback) {
					// Create a set of iterated properties.
					var members = {}, isFunction = getClass.call(object) == functionClass, property;
					for (property in object) {
					  // Store each property name to prevent double enumeration. The
					  // `prototype` property of functions is not enumerated due to cross-
					  // environment inconsistencies.
					  if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
						callback(property);
					  }
					}
				};
			} else {
				// No bugs detected; use the standard `for...in` algorithm.
				forEach = function (object, callback) {
					var isFunction = getClass.call(object) == functionClass, property, isConstructor;
					for (property in object) {
					  if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
						callback(property);
					  }
					}
					// Manually invoke the callback for the `constructor` property due to
					// cross-environment inconsistencies.
					if (isConstructor || isProperty.call(object, (property = "constructor"))) {
					  callback(property);
					}
				};
			}
			return forEach(object, callback);
		};

		// Public: Serializes a JavaScript `value` as a JSON string. The optional
		// `filter` argument may specify either a function that alters how object and
		// array members are serialized, or an array of strings and numbers that
		// indicates which properties should be serialized. The optional `width`
		// argument may be either a string or number that specifies the indentation
		// level of the output.
		if (!has("json-stringify")) {
			// Internal: A map of control characters and their escaped equivalents.
			var Escapes = {
				92: "\\\\",
				34: '\\"',
				8: "\\b",
				12: "\\f",
				10: "\\n",
				13: "\\r",
				9: "\\t"
			};

			// Internal: Converts `value` into a zero-padded string such that its
			// length is at least equal to `width`. The `width` must be <= 6.
			var leadingZeroes = "000000";
			var toPaddedString = function (width, value) {
				// The `|| 0` expression is necessary to work around a bug in
				// Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
				return (leadingZeroes + (value || 0)).slice(-width);
			};

			// Internal: Double-quotes a string `value`, replacing all ASCII control
			// characters (characters with code unit values between 0 and 31) with
			// their escaped equivalents. This is an implementation of the
			// `Quote(value)` operation defined in ES 5.1 section 15.12.3.
			var unicodePrefix = "\\u00";
			var quote = function (value) {
				var result = '"', index = 0, length = value.length, isLarge = length > 10 && charIndexBuggy, symbols;
				if (isLarge) {
					symbols = value.split("");
				}
				for (; index < length; index++) {
					var charCode = value.charCodeAt(index);
					// If the character is a control character, append its Unicode or
					// shorthand escape sequence; otherwise, append the character as-is.
					switch (charCode) {
					  case 8: case 9: case 10: case 12: case 13: case 34: case 92:
						result += Escapes[charCode];
						break;
					  default:
						if (charCode < 32) {
						  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
						  break;
						}
						result += isLarge ? symbols[index] : charIndexBuggy ? value.charAt(index) : value[index];
					}
				}
				return result + '"';
			};

			// Internal: Recursively serializes an object. Implements the
			// `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
			var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
				var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
				try {
					// Necessary for host object support.
					value = object[property];
				} catch (exception) {}
				if (typeof value == "object" && value) {
					className = getClass.call(value);
					if (className == dateClass && !isProperty.call(value, "toJSON")) {
					  if (value > -1 / 0 && value < 1 / 0) {
						// Dates are serialized according to the `Date#toJSON` method
						// specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
						// for the ISO 8601 date time string format.
						if (getDay) {
						  // Manually compute the year, month, date, hours, minutes,
						  // seconds, and milliseconds if the `getUTC*` methods are
						  // buggy. Adapted from @Yaffle's `date-shim` project.
						  date = floor(value / 864e5);
						  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
						  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
						  date = 1 + date - getDay(year, month);
						  // The `time` value specifies the time within the day (see ES
						  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
						  // to compute `A modulo B`, as the `%` operator does not
						  // correspond to the `modulo` operation for negative numbers.
						  time = (value % 864e5 + 864e5) % 864e5;
						  // The hours, minutes, seconds, and milliseconds are obtained by
						  // decomposing the time within the day. See section 15.9.1.10.
						  hours = floor(time / 36e5) % 24;
						  minutes = floor(time / 6e4) % 60;
						  seconds = floor(time / 1e3) % 60;
						  milliseconds = time % 1e3;
						} else {
						  year = value.getUTCFullYear();
						  month = value.getUTCMonth();
						  date = value.getUTCDate();
						  hours = value.getUTCHours();
						  minutes = value.getUTCMinutes();
						  seconds = value.getUTCSeconds();
						  milliseconds = value.getUTCMilliseconds();
						}
						// Serialize extended years correctly.
						value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
						  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
						  // Months, dates, hours, minutes, and seconds should have two
						  // digits; milliseconds should have three.
						  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
						  // Milliseconds are optional in ES 5.0, but required in 5.1.
						  "." + toPaddedString(3, milliseconds) + "Z";
					  } else {
						value = null;
					  }
					} else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
					  // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
					  // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
					  // ignores all `toJSON` methods on these objects unless they are
					  // defined directly on an instance.
					  value = value.toJSON(property);
					}
				}
				if (callback) {
					// If a replacement function was provided, call it to obtain the value
					// for serialization.
					value = callback.call(object, property, value);
				}
				if (value === null) {
					return "null";
				}
				className = getClass.call(value);
				if (className == booleanClass) {
					// Booleans are represented literally.
					return "" + value;
				} else if (className == numberClass) {
					// JSON numbers must be finite. `Infinity` and `NaN` are serialized as
					// `"null"`.
					return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
				} else if (className == stringClass) {
					// Strings are double-quoted and escaped.
					return quote("" + value);
				}
				// Recursively serialize objects and arrays.
				if (typeof value == "object") {
					// Check for cyclic structures. This is a linear search; performance
					// is inversely proportional to the number of unique nested objects.
					for (length = stack.length; length--;) {
					  if (stack[length] === value) {
						// Cyclic structures cannot be serialized by `JSON.stringify`.
						throw TypeError();
					  }
					}
					// Add the object to the stack of traversed objects.
					stack.push(value);
					results = [];
					// Save the current indentation level and indent one additional level.
					prefix = indentation;
					indentation += whitespace;
					if (className == arrayClass) {
					  // Recursively serialize array elements.
					  for (index = 0, length = value.length; index < length; index++) {
						element = serialize(index, value, callback, properties, whitespace, indentation, stack);
						results.push(element === undef ? "null" : element);
					  }
					  result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
					} else {
					  // Recursively serialize object members. Members are selected from
					  // either a user-specified list of property names, or the object
					  // itself.
					  forEach(properties || value, function (property) {
						var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
						if (element !== undef) {
						  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
						  // is not the empty string, let `member` {quote(property) + ":"}
						  // be the concatenation of `member` and the `space` character."
						  // The "`space` character" refers to the literal space
						  // character, not the `space` {width} argument provided to
						  // `JSON.stringify`.
						  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
						}
					  });
					  result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
					}
					// Remove the object from the traversed object stack.
					stack.pop();
					return result;
				}
			};

			// Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
			JSON3.stringify = function (source, filter, width) {
				var whitespace, callback, properties, className;
				if (typeof filter == "function" || typeof filter == "object" && filter) {
					if ((className = getClass.call(filter)) == functionClass) {
					  callback = filter;
					} else if (className == arrayClass) {
					  // Convert the property names array into a makeshift set.
					  properties = {};
					  for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
					}
				}
				if (width) {
					if ((className = getClass.call(width)) == numberClass) {
					  // Convert the `width` to an integer and create a string containing
					  // `width` number of space characters.
					  if ((width -= width % 1) > 0) {
						for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
					  }
					} else if (className == stringClass) {
					  whitespace = width.length <= 10 ? width : width.slice(0, 10);
					}
				}
				// Opera <= 7.54u2 discards the values associated with empty string keys
				// (`""`) only if they are used directly within an object member list
				// (e.g., `!("" in { "": 1})`).
				return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
			};
		}

		// Public: Parses a JSON source string.
		if (!has("json-parse")) {
			var fromCharCode = String.fromCharCode;

			// Internal: A map of escaped control characters and their unescaped
			// equivalents.
			var Unescapes = {
				92: "\\",
				34: '"',
				47: "/",
				98: "\b",
				116: "\t",
				110: "\n",
				102: "\f",
				114: "\r"
			};

			// Internal: Stores the parser state.
			var Index, Source;

			// Internal: Resets the parser state and throws a `SyntaxError`.
			var abort = function() {
				Index = Source = null;
				throw SyntaxError();
			};

			// Internal: Returns the next token, or `"$"` if the parser has reached
			// the end of the source string. A token may be a string, number, `null`
			// literal, or Boolean literal.
			var lex = function () {
				var source = Source, length = source.length, value, begin, position, isSigned, charCode;
				while (Index < length) {
					charCode = source.charCodeAt(Index);
					switch (charCode) {
					  case 9: case 10: case 13: case 32:
						// Skip whitespace tokens, including tabs, carriage returns, line
						// feeds, and space characters.
						Index++;
						break;
					  case 123: case 125: case 91: case 93: case 58: case 44:
						// Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
						// the current position.
						value = charIndexBuggy ? source.charAt(Index) : source[Index];
						Index++;
						return value;
					  case 34:
						// `"` delimits a JSON string; advance to the next character and
						// begin parsing the string. String tokens are prefixed with the
						// sentinel `@` character to distinguish them from punctuators and
						// end-of-string tokens.
						for (value = "@", Index++; Index < length;) {
						  charCode = source.charCodeAt(Index);
						  if (charCode < 32) {
							// Unescaped ASCII control characters (those with a code unit
							// less than the space character) are not permitted.
							abort();
						  } else if (charCode == 92) {
							// A reverse solidus (`\`) marks the beginning of an escaped
							// control character (including `"`, `\`, and `/`) or Unicode
							// escape sequence.
							charCode = source.charCodeAt(++Index);
							switch (charCode) {
							  case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
								// Revive escaped control characters.
								value += Unescapes[charCode];
								Index++;
								break;
							  case 117:
								// `\u` marks the beginning of a Unicode escape sequence.
								// Advance to the first character and validate the
								// four-digit code point.
								begin = ++Index;
								for (position = Index + 4; Index < position; Index++) {
								  charCode = source.charCodeAt(Index);
								  // A valid sequence comprises four hexdigits (case-
								  // insensitive) that form a single hexadecimal value.
								  if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
									// Invalid Unicode escape sequence.
									abort();
								  }
								}
								// Revive the escaped character.
								value += fromCharCode("0x" + source.slice(begin, Index));
								break;
							  default:
								// Invalid escape sequence.
								abort();
							}
						  } else {
							if (charCode == 34) {
							  // An unescaped double-quote character marks the end of the
							  // string.
							  break;
							}
							charCode = source.charCodeAt(Index);
							begin = Index;
							// Optimize for the common case where a string is valid.
							while (charCode >= 32 && charCode != 92 && charCode != 34) {
							  charCode = source.charCodeAt(++Index);
							}
							// Append the string as-is.
							value += source.slice(begin, Index);
						  }
						}
						if (source.charCodeAt(Index) == 34) {
						  // Advance to the next character and return the revived string.
						  Index++;
						  return value;
						}
						// Unterminated string.
						abort();
					  default:
						// Parse numbers and literals.
						begin = Index;
						// Advance past the negative sign, if one is specified.
						if (charCode == 45) {
						  isSigned = true;
						  charCode = source.charCodeAt(++Index);
						}
						// Parse an integer or floating-point value.
						if (charCode >= 48 && charCode <= 57) {
						  // Leading zeroes are interpreted as octal literals.
						  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
							// Illegal octal literal.
							abort();
						  }
						  isSigned = false;
						  // Parse the integer component.
						  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
						  // Floats cannot contain a leading decimal point; however, this
						  // case is already accounted for by the parser.
						  if (source.charCodeAt(Index) == 46) {
							position = ++Index;
							// Parse the decimal component.
							for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
							if (position == Index) {
							  // Illegal trailing decimal.
							  abort();
							}
							Index = position;
						  }
						  // Parse exponents. The `e` denoting the exponent is
						  // case-insensitive.
						  charCode = source.charCodeAt(Index);
						  if (charCode == 101 || charCode == 69) {
							charCode = source.charCodeAt(++Index);
							// Skip past the sign following the exponent, if one is
							// specified.
							if (charCode == 43 || charCode == 45) {
							  Index++;
							}
							// Parse the exponential component.
							for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
							if (position == Index) {
							  // Illegal empty exponent.
							  abort();
							}
							Index = position;
						  }
						  // Coerce the parsed value to a JavaScript number.
						  return +source.slice(begin, Index);
						}
						// A negative sign may only precede numbers.
						if (isSigned) {
						  abort();
						}
						// `true`, `false`, and `null` literals.
						if (source.slice(Index, Index + 4) == "true") {
						  Index += 4;
						  return true;
						} else if (source.slice(Index, Index + 5) == "false") {
						  Index += 5;
						  return false;
						} else if (source.slice(Index, Index + 4) == "null") {
						  Index += 4;
						  return null;
						}
						// Unrecognized token.
						abort();
					}
				}
				// Return the sentinel `$` character if the parser has reached the end
				// of the source string.
				return "$";
			};

			// Internal: Parses a JSON `value` token.
			var get = function (value) {
				var results, hasMembers;
				if (value == "$") {
					// Unexpected end of input.
					abort();
				}
				if (typeof value == "string") {
					if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
					  // Remove the sentinel `@` character.
					  return value.slice(1);
					}
					// Parse object and array literals.
					if (value == "[") {
					  // Parses a JSON array, returning a new JavaScript array.
					  results = [];
					  for (;; hasMembers || (hasMembers = true)) {
						value = lex();
						// A closing square bracket marks the end of the array literal.
						if (value == "]") {
						  break;
						}
						// If the array literal contains elements, the current token
						// should be a comma separating the previous element from the
						// next.
						if (hasMembers) {
						  if (value == ",") {
							value = lex();
							if (value == "]") {
							  // Unexpected trailing `,` in array literal.
							  abort();
							}
						  } else {
							// A `,` must separate each array element.
							abort();
						  }
						}
						// Elisions and leading commas are not permitted.
						if (value == ",") {
						  abort();
						}
						results.push(get(value));
					  }
					  return results;
					} else if (value == "{") {
					  // Parses a JSON object, returning a new JavaScript object.
					  results = {};
					  for (;; hasMembers || (hasMembers = true)) {
						value = lex();
						// A closing curly brace marks the end of the object literal.
						if (value == "}") {
						  break;
						}
						// If the object literal contains members, the current token
						// should be a comma separator.
						if (hasMembers) {
						  if (value == ",") {
							value = lex();
							if (value == "}") {
							  // Unexpected trailing `,` in object literal.
							  abort();
							}
						  } else {
							// A `,` must separate each object member.
							abort();
						  }
						}
						// Leading commas are not permitted, object property names must be
						// double-quoted strings, and a `:` must separate each property
						// name and value.
						if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
						  abort();
						}
						results[value.slice(1)] = get(lex());
					  }
					  return results;
					}
					// Unexpected token encountered.
					abort();
				}
				return value;
			};

			// Internal: Updates a traversed object member.
			var update = function(source, property, callback) {
				var element = walk(source, property, callback);
				if (element === undef) {
					delete source[property];
				} else {
					source[property] = element;
				}
			};

			// Internal: Recursively traverses a parsed JSON object, invoking the
			// `callback` function for each value. This is an implementation of the
			// `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
			var walk = function (source, property, callback) {
				var value = source[property], length;
				if (typeof value == "object" && value) {
					// `forEach` can't be used to traverse an array in Opera <= 8.54
					// because its `Object#hasOwnProperty` implementation returns `false`
					// for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
					if (getClass.call(value) == arrayClass) {
					  for (length = value.length; length--;) {
						update(value, length, callback);
					  }
					} else {
					  forEach(value, function (property) {
						update(value, property, callback);
					  });
					}
				}
				return callback.call(source, property, value);
			};

			// Public: `JSON.parse`. See ES 5.1 section 15.12.2.
			JSON3.parse = function (source, callback) {
				var result, value;
				Index = 0;
				Source = "" + source;
				result = get(lex());
				// If a JSON string contains multiple tokens, it is invalid.
				if (lex() != "$") {
					abort();
				}
				// Reset the parser state.
				Index = Source = null;
				return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
			};
		}
	}

	// Export for asynchronous module loaders.
	if (isLoader) {
		define(function () {
			return JSON3;
		});
	}
}(this));

},{}],50:[function(_dereq_,module,exports) {
module.exports = toArray
function toArray(list, index) {
	var array = []
	index = index || 0
	for (var i = index || 0; i < list.length; i++) {
		array[i - index] = list[i]
	}
	return array
}
},{}]},{},[1])
(1)
});
/*

	DO NOT TOUCH

*/


