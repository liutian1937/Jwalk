Jwalk
=====
Jwalk - JavaScript Animation Library . Smaller , Faster , Stronger

<h3>Jwalk是用来做什么的？</h3>
<p>前端开发过程中经常会用到一些动画效果，比如某个div的放大，缩小，左右移动，实现这些效果都是通过Js设置元素的style样式，我们可能会借助Jquery或者其他脚本库提供的动画接口来更容易的实现相关效果。但是如果我们可能只会用到Jquery的动画效果，以及一些简单的选择器，那么（在天朝）加载这个脚本库就显得多余了。为什么在天朝就多余，国内的网络环境与网速是：你懂得！所以为了适应国情，封装了这个Mini版的动画库-Jwalk(名字可轻喷)，Min压缩版+Gzip=2K</p>
<p>所以时间单位都为ms，由于脚本计时器是队列执行方式，可能会产生阻塞问题导致时间不准确。所以采用CSS3的动画与采用JS方式上，动画速度与流畅性都会有差别。对低版本浏览器动画效果要求高的话需要对低版本浏览器单独设置动画时间。在Jwalk中为了减小动画速度的差距，我加入了代码：<br/><code>params.speed = Unit.css3 ? params.speed : parseInt(params.speed/1.5) ;</code>，一个1.5倍的时间差。</p>
<p>动画执行的方式采用Css3/Js Tween算法相结合的方式，对于高级浏览器采用css3执行动画效果，不支持css3的采用缓动函数，默认集成了（linear，ease-in，ease-out，ease-in-out）四种动画效果，如果需要更多效果，可以参考<a href="http://easings.net/zh-cn" target="_blank">Easing functions</a>，<a href="http://www.gizma.com/easing/" target="_blank">Easing Equations</a>，<a href="http://www.cnblogs.com/cloudgamer/archive/2009/01/06/Tween.html" target="_blank">JavaScript Tween算法及缓动效果</a>。</p>
<p>Jwalk未压缩版本有粗糙的注释，大家可以扩展功能后自行压缩，欢迎尽情蹂躏。<br/>时间匆忙，不足之处欢迎给出意见。Email：ok8008@yeah.net</p>

<a href="http://liutian1937.github.io/Jwalk/" target="_blank">Jwalk - JavaScript Animation Library</a>