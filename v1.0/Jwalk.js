/*
	Description : Jwalk - JavaScript Animation Library
	Version ： V1.0
	Author : ok8008@yeah.net
	Link : http://liutian1937.github.io/Jwalk/
*/
(function () {
	var Unit = (function () {
		var style = document.documentElement.style, self = {};
		//each函数，封装for循环
		function _each (arr, fn) {
			var i = 0, len = arr.length;
			for (;i < len; i += 1 ) {
				fn(arr[i]);
			};
		};
		//获取css3前缀
		var _prefix = (function () {
			var head = ['t', 'webkitT', 'MozT', 'msT', 'OT'], transform, ret;
			_each(head, function (val) {
				transform = val + 'ransform';
				if (transform in style) {
					ret = val.substr(0,val.length - 1);
				}
			});
			return ret;
		})();
		//扩展函数，克隆对象属性
		self.extend = function (target, obj) {
			for (var i in obj) {
				target[i] = obj[i];
			}
		};
		//拼接css3属性，并返回
		function _prefixStyle (style) {
			if ( _prefix === '' ) return style;
			if (! _prefix ) return false;
			return _prefix + style.charAt(0).toUpperCase() + style.substr(1);
		};
		
		self.extend(self, {
			css3 : _prefixStyle('transition'),
			Transform : _prefixStyle('transform'),
			Property : _prefixStyle('transitionProperty'),
			Duration : _prefixStyle('transitionDuration'),
			TimingFunction : _prefixStyle('transitionTimingFunction')
		});
		return self;
	})();
	
	var Jwalk = function(elem, params){
		params = params || null;
		if (!(this instanceof Jwalk)) {
			return new Jwalk (elem, params);
		};
		this.elem = elem || {};
		this.options = {
			openProcess : false, //是否开启时时进程，消耗性能，默认关闭
			speeds : {
				normal : 400 ,
				fast : 200 ,
				slow : 600
			}, //默认的动画执行时间
			easing : 'linear', //默认动画效果
			em2px : 16 ,//em与px转换单位，默认1em = 16px
			interval : 0 //两个animate动画之间的时间间隔
		};
		
		if(params && typeof params == 'object'){
			for (var key in params) {
				if(this.options.hasOwnProperty(key)){
					this.options[key] = params[key] ;
				}
			}
		};
		this.init(); //初始化
		this._closeFn();//闭包
	};
	Jwalk.prototype = {
		init : function () {
			//初始化
			var _this = this;
			this.isAnimate = false; //是否有动作在执行
			this.data = {}; //回调数据
			this.beginStyle = {}; //动画开始的样式
			this.finalStyle = null; //每次执行的最终结果
			this.played = true;//是否play过，默认为true，方便第一次初始化
			return this;
		},
		animate : function () {
			/*
				animate完成下列事件：
				1.接收参数
				2.缓存至params对象
				3.实例化Animate，传参params
				4.动画实例加入数组
			*/
			var _this = this, arg = arguments, len = arg.length, params = {};
			if(typeof arg[0] === 'object'){
				//检查animate中传入的参数
				params.style = arg[0];
			}else{
				//console.log('参数不正确');
				return false;
			};
			
			//设置回调
			params.callback = (function(){
				return function (data, fn) {
					if(arg[len - 1] && typeof arg[len - 1] === 'function') {
						arg[len - 1](data);
					};
					if(fn && typeof fn === 'function'){
						fn();
					};
				}
			})();
			
			//设置速度
			params.speed = (typeof arg[1] === 'number') ? 
			arg[1] :
			(function () {
				return (typeof arg[1] === 'string' && arg[1] in _this.options.speeds) ? 
				_this.options.speeds[arg[1]] :
				_this.options.speeds['normal'] ;
			})();
			
			params.speed = Unit.css3 ? params.speed : parseInt(params.speed/1.5) ;		
			
			//设置动画效果
			params.easing = (len > 1) ? 
			(function () {
				return (arg[2] && typeof arg[2] === 'string') ? 
				arg[2] :
				(function () {
					return (typeof arg[1] === 'string' && !(arg[1] in _this.options.speeds)) ?
					arg[1] :
					_this.options.easing ;
				})();
			})() :
			_this.options.easing ;
			params.startStyle = {};
			params.endStyle = {};
			params.pauseStyle = {};
			params.remainderTime = params.speed;
			
			if(_this.played){
				//如果play过，初始化数组
				this.stepArray = []; //缓存动画的数组
				this.newStepArray = null;
				_this.played = false;
			};
			_this.stepArray.push(params); //缓存动画数组
			_this.current = 0; //当前执行的第几个动作
			_this.total = _this.stepArray.length; //一共几个动作
			return _this; //链式操作
		},
		play : function (replay) {
			var obj;
			if(this.isAnimate){
				return false;
			};
			if(!this.newStepArray){
				this.newStepArray = this.stepArray.concat();
			};
			this.played = true;
			obj = this.newStepArray[this.current];
			if (!replay && this.data.status === 'pause') {
				//如果不是replay，那么继续暂停时的动作
				this._move(obj);
			}else{
				this._initStyle(obj, this.finalStyle);
			};
			this.stoped = false;
		},
		pause : function () {
			var obj, elem = this.elem;
			if(!this.newStepArray || this.data.status === 'pause'){
				return false;
			};
			if(this.delayTimer && this.data.status === 'end'){
				this.stoped = true;
				return false;
			};
			this.isAnimate = false;
			obj = this.newStepArray[this.current];
			clearInterval(this.timer); //停止计时器
			if( obj.remainderTime > 0 ){
				if(Unit.css3){
					for (var attr in obj.startStyle){
						elem.style[attr] = this._getStyle(elem, attr);
					};
				}else{
					this._compute(obj, obj.endStyle);
				}
			};
			//暂停回调
			this.data.status = 'pause';
			obj.callback(this.data);
		},
		stop : function () {
			this.stoped = true;
		},
		step : function () {
			//返回第num个动作
			var i = 0, len, queue;
			if(arguments.length > 1){
				this.stepActive = false; //关闭单步执行
				this.newStepArray = [];
				queue = Array.prototype.slice.call(arguments,0);
				for (;i < queue.length ; i += 1) {
					//需要验证数组是否存在
					if(this.stepArray[queue[i]]){
						this.newStepArray.push(this.stepArray[queue[i]]);
					}
				};
				this.total = this.newStepArray.length;
			}else{
				this.stepActive = true; //单步执行激活
				this.newStepArray = this.stepArray.concat();
				this.total = this.newStepArray.length;
				if( typeof arguments[0] === 'number' && arguments[0] < this.total ) {
					this.current = Math.ceil(arguments[0]);
				};
			};
			return this;
		},
		replay : function () {
			//重新开始一轮动画
			this._initData();
			this.play(true);
		},
		reset : function () {
			if(this.isAnimate){
				return false;
			};
			this._initData();
			for (var attr in this.elem.style){
				if(this.elem.style[attr])
				this.elem.style[attr] = this.beginStyle[attr];
			};
		},
		cycle : function (times) {
			//循环动画
			this.stepActive = false; //关闭单步执行
			this.times = times || null;
			if(times && typeof times === 'number'){
				this.times = times - 1;
			}else{
				this.infinite = true; //无限循环
			}
			this.play();
			//return this; //链式调用
		},
		extend : function (obj) {
			if(obj && typeof obj === 'object'){
				for(var attr in obj){
					if(!this.hasOwnProperty(attr)){
						Jwalk.prototype[attr] = obj[attr];
					}
				};
			}
		},
		_closeFn : function () {
			var _this = this;
			_this.control = (function(){
				//用闭包保存动作
				return {
					process : function (obj){
						//动画执行过程中
						//如果开启了实时数据，进程执行过程中，返回数据
						_this.data.result = {};
						for(var attr in obj.style){
							_this.data.result[attr] = _this._getStyle(_this.elem, attr); //时时数据
						};
						_this.data.status = 'process';
						//console.log(_this.data.result);
						obj.callback(_this.data);
					},
					end : function (obj) {
						_this.isAnimate = false;
						if(_this.stepActive){
							//如果单步执行激活，不触发end事件
							return false;
						};
						(_this.current < _this.total - 1) ? (function(){
							_this.current += 1;
							if(_this.data.status !== 'pause'){
								_this.control.delay();
							}
						})() : (function(){
							_this.current = 0;
							if( _this.data.status !== 'pause'){
								if(_this.infinite || _this.times){
									if(_this.times){
										_this.times -= 1;
									};
									_this.control.delay();
								};
							};
						})();
					},
					delay : function () {
						//如果有动画时间间隔，多长时间后执行
						if(_this.options.interval){
							if(_this.delayTimer){
								clearTimeout(_this.delayTimer);
							};
							_this.delayTimer = setTimeout(function(){
								if(_this.stoped){
									return false;
								};
								_this.play();
								clearTimeout(_this.delayTimer);
							},_this.options.interval);
						}else{
							if(_this.stoped){
								return false;
							};
							_this.play();
						};
					}
				}
			})();
			
			_this.extend(
				{
					width : function () {
						return  _this._offset(_this.elem,'width') + 'px';
					},
					height : function () {
						return  _this._offset(_this.elem,'height') + 'px';
					},
					toggle : function () {
						if (_this.isAnimate) {
							return false;
						};
						(_this._getStyle(_this.elem, 'display') === 'none') ?
						_this.show(arguments) :
						_this.hide(arguments) ;
					},
					hide : function () {
						var speed = (arguments.length > 0 && typeof arguments[0] != 'function') ? arguments[0] : 'normal',
							callback = ( arguments.length > 0 ) ? arguments[arguments.length-1] : null;
						_this._act({opacity:'0'},speed,function(){
							_this.elem.style.display = 'none';
							if(callback && typeof callback === 'function'){
								callback();
							};
						});
					},
					show : function () {
						var speed = (arguments.length > 0 && typeof arguments[0] != 'function') ? arguments[0] : 'normal',
							callback = ( arguments.length > 0 ) ? arguments[arguments.length-1] : null;
						_this._css({
							'display' : 'block'
						});
						_this._act({opacity:'1'},speed,callback);
					},
					slideToggle : function () {
						if (_this.isAnimate) {
							return false;
						};
						(_this._getStyle(_this.elem, 'height') === '0px' || _this._getStyle(_this.elem, 'display') === 'none') ?
						_this.slideDown(arguments) :
						_this.slideUp(arguments) ;
					},
					slideUp : function () {
						var speed = (arguments.length > 0 && typeof arguments[0] != 'function') ? arguments[0] : 'normal',
							callback = ( arguments.length > 0 ) ? arguments[arguments.length-1] : null;
						_this.tempHeight = _this.tempHeight ? _this.tempHeight : _this._offset(_this.elem,'height')+'px';
						_this._act({height:'0px'},speed,function(){
							_this._css({
								'display' : 'none',
								'height' : _this.tempHeight
							});
							if(callback && typeof callback === 'function'){
								callback();
							};
						});
					},
					slideDown : function () {
						var speed = (arguments.length > 0 && typeof arguments[0] != 'function') ? arguments[0] : 'normal',
							callback = ( arguments.length > 0 ) ? arguments[arguments.length-1] : null;
						_this.tempHeight = _this.tempHeight ? _this.tempHeight : _this._offset(_this.elem,'height')+'px';
						_this._css({
							'display' : 'block',
							'overflow' : 'hidden',
							'height' : '0px'
						});
						_this._act({height:_this.tempHeight},speed,callback);
					}
				}
			);
		},
		_act : function (style,speed,callback) {
			var _this = this;
			_this.init(); //初始化
			speed = speed || 0 ;
			_this.animate(style, speed, function(data){
				if(data.status === 'end'){
					if(callback && typeof callback === 'function'){
						callback();
					};
				}
			}).play();
		},
		_initData : function () {
			this.current = 0;
			this.finalStyle = null;
			this.stepActive = false; //关闭单步执行
			this.infinite = false; //循环关闭
			this.data.status = '';
		},
		_initStyle : function (obj, start) {
			var _this = this, val = obj.style, startData, endData, hasProperty, tempData;
			if(Unit.css3){
				for(var attr in val){
					if (start && start[attr]){
						//如果传入了开始的样式
						startData = start[attr];
					}else{
						startData = _this._getStyle(_this.elem, attr); //初始数据
					};
					endData = (val[attr].match(/^\-=|\+=/)) ? 
					(function () {
						return _this._conversion(startData) + _this._conversion(val[attr],attr) + 'px';
					})() :
					val[attr] ;
					//console.log(val[attr]);
					if(!_this.beginStyle[attr]){
						//初始的样式
						if(attr == 'transform'){
							var s;
							attr = Unit.Transform;
							s = _this._getStyle(_this.elem, attr);
							_this.beginStyle['transform'] = s;
							_this.beginStyle[attr] = s;
						}else{
							_this.beginStyle[attr] = _this._getStyle(_this.elem, attr);
						}						
					};
					obj.startStyle[attr] = startData;
					obj.endStyle[attr] = endData;
				};
			}else{
				for(var attr in val){
					if(attr === 'opacity'){
						if (start && start[attr]){
							//如果传入了开始的样式
							startData = start[attr];
						}else{
							startData = parseInt((_this._getStyle(_this.elem, 'filter')).replace(/[^0-9]/ig,""));
							startData = (startData || startData === 0) ? startData : 100;
						}
						processData = val[attr]*100;
						hasProperty = true;
					}else{
						tempData = _this._getStyle(_this.elem, attr);
						if(tempData){
							hasProperty = true;
							if (start && start[attr]){
								//如果传入了开始的样式
								startData = start[attr];
							}else{
								tempData = (tempData == 'auto') ? 
								(function(){
									if(attr === 'width'){
										return _this.elem.offsetWidth;
									}else if(attr === 'height'){
										return _this.elem.offsetHeight;
									}else{
										return '0px';
									}
								})()
								: tempData;
								startData = _this._conversion(tempData);
							}
							processData = (Math.abs(parseInt(val[attr].replace(/=|px|em/g,''))) >= 0) ? _this._conversion(val[attr],attr) : val[attr];
						}else{
							hasProperty = false;
						}
					};
					
					if(!_this.beginStyle[attr]){
						//初始的样式
						_this.beginStyle[attr] = _this._getStyle(_this.elem, attr);
					};
					
					if ( hasProperty ) {
						endData = (val[attr].match(/^\-=|\+=/)) ? startData + processData : processData;
						obj.startStyle[attr] = startData;
						obj.endStyle[attr] = endData;
					};
				};
				obj.pauseStyle = obj.startStyle;
			};
			this.finalStyle = obj.endStyle;
			
			//执行回调函数，开始
			_this.data.status = 'start';
			obj.callback(_this.data);
			
			obj.remainderTime = obj.speed;
			_this._move(obj);
		},
		_move : function (obj) {
			this.isAnimate = true; //动画开始
			if(Unit.css3){
				this._transition(obj, obj.remainderTime, obj.easing);
				this._css(obj.endStyle); //继续动画
			}else{
				this._run(obj, obj.remainderTime, obj.easing);
			};
			this.data.status = 'process';
		},
		_transition : function (obj, speed, easing){
			//css3改变transition
			var _this = this;
			_this.elem.style[Unit.Property] = 'all' ;
			_this.elem.style[Unit.Duration] = speed + 'ms';
			_this.elem.style[Unit.TimingFunction] = easing || _this.options.easing;
			
			_this.timer = setInterval(function(){
				_this.isAnimate = true;
				obj.remainderTime = (obj.remainderTime > 0) ? obj.remainderTime - 20 : 0 ; //剩余时间递减
				
				if (_this.options.openProcess) {
					_this.control.process(obj); //进程执行中...
				};
				if(obj.remainderTime <= 0){
					//动画结束
					clearInterval(_this.timer);
					
					_this.data.status = 'end';
					obj.callback(_this.data,function(){
						_this.control.end(obj); //结束的回调函数
					});
				}
			},20);
		},
		_css : function(val){
			//设置css3的属性值
			for(var attr in val){
				attr = (attr == 'transform') ? Unit.Transform : attr ;
				if(attr in this.elem.style){
					this.elem.style[attr] = val[attr];
				}
			};
		},
		_compute : function (obj, val) {
			//不支持css3,计算并缓存暂停时的数据
			var _this = this, pauseData;
			for(var attr in val){
				if(attr === 'opacity'){
					pauseData = parseInt((_this._getStyle(_this.elem, 'filter')).replace(/[^0-9]/ig,"")) || 100;
				}else{
					pauseData = _this._conversion(_this._getStyle(_this.elem, attr));
				}
				obj.pauseStyle[attr] = pauseData;
			};
		},
		_run : function(obj, speed, easing){
			//用tween实现动画效果，并设置css样式
			var _this = this, t = 0, d = parseInt(speed/10), styles = _this.elem.style, start = obj.pauseStyle, end = obj.endStyle, tween = (Tween[easing]) ? Tween[easing] : Tween[_this.options.easing];
			function Run(){
				if(t < d){
					t++;
					_this.isAnimate = true; //动画执行
					for (var j in start){
						if(typeof end[j] === 'number'){
							if(j === 'opacity'){
								styles['filter'] = 'alpha(opacity='+Math.ceil(tween(t,start[j],end[j]-start[j],d))+')';
							}else{
								styles[j] = Math.ceil(tween(t,start[j],end[j]-start[j],d)) + 'px';
							}
						}else if(typeof start[j] === 'string' && typeof end[j] === 'string' && start[j].match(/\%/) && end[j].match(/\%/)){
							styles[j] = Math.ceil(tween(t,parseInt(start[j]),parseInt(end[j])-parseInt(start[j]),d))+'%';
						};
					};
					
					if (_this.options.openProcess) {
						_this.control.process(obj); //进程执行中...
					};
					
				}else{
					//设置最终效果
					for (var k in end){
						if(typeof end[j] === 'number'){
							if(j === 'opacity'){
								styles['filter'] = 'alpha(opacity='+end['opacity']+')';
							}else{
								styles[k] = end[k] + 'px';
							}
						}else{
							styles[k] = end[k];
						};
					};
					clearInterval(_this.timer); //清除计时器
					
					_this.data.status = 'end';
					obj.callback(_this.data);
					_this.control.end(obj); //结束的回调函数
				};
				obj.remainderTime = (obj.remainderTime > 0) ? obj.remainderTime - 10 : 0 ; //剩余时间递减				
				//console.log(_this.remainderTime); //调试选项，打印剩余时间
			};
			_this.timer = setInterval(Run, 10);
		},
		_getStyle : function (elem, attr) {
			return (elem.currentStyle? elem.currentStyle : window.getComputedStyle(elem, null))[attr];
		},
		_offset : function (elem, type) {
			var _this = this, method = type === 'width' ? 'offsetWidth' : 'offsetHeight', tempData, ret;
			tempData = _this._getStyle(elem, type);
			return (tempData === '0px' || tempData === 'auto') ? 
			(function(){
				if(_this._getStyle(elem, 'display') === 'none'){
					elem.style.display = 'block';
					elem.style.height = 'auto';
					ret = elem[method] - _this._distance(type);
					elem.style.display = 'none';
				}else{
					ret = elem[method] - _this._distance(type);
				}
				return ret;
			})() :
			parseInt(tempData) ;
		},
		_distance : function (type) {
			var direction = [ 'Top', 'Right', 'Bottom', 'Left' ], i = type === 'width' ? 1 : 0, val = 0, _this = this, padding, border;
			for(;i < 4 ; i += 2) {
				padding = _this._getStyle(_this.elem, 'padding'+direction[i]);
				border = _this._getStyle(_this.elem, 'border'+direction[i]+'Width');
				if(padding && parseFloat(padding) > 0){
					val += _this._conversion(padding);
				};
				if(border && parseFloat(border) > 0){
					val +=  _this._conversion(border);
				}
			};
			return val;
		},
		_conversion : function (num, attr) {
			//返回带正负的数值，并换算单位为PX
			var _this = this;
			num = num.replace(/=/g,'');
			if(num.match(/\%/)){
				if(attr){
					attr = attr.toLowerCase();
					if(attr.match(/left|right|width/)){
						var width = parseInt(_this.elem.parentNode.offsetWidth);
						return parseInt(num)*width/100;
					}else if(attr.match(/top|bottom|height/) > 0){
						var height = parseInt(_this.elem.parentNode.offsetHeight);
						return parseInt(num)*height/100;
					}else{
						return num;
					}
				}else{
					return num;
				}
			};
			return num.match(/em/) ? parseInt(num,10) * _this.options.em2px : parseInt(num,10) ;
		}
	};
	//动画算法
	var Tween = {
		'linear': function(t,b,c,d){ return c*t/d + b; },
		'ease-in': function(t, b, c, d) { return -c * Math.cos(t/d *(Math.PI/2)) + c + b; },
		'ease-out': function(t, b, c, d) { return c * Math.sin(t/d *(Math.PI/2)) + b; },
		'ease-in-out': function(t, b, c, d) { return -c/2 *(Math.cos(Math.PI*t/d) - 1) + b; }
	};

	window.Jwalk = Jwalk;
})();
