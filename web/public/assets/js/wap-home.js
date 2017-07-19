$(function(){
	/**轮播**/
	var bullets = $('#position li')/*document.getElementById('position').getElementsByTagName('li')*/;

	var banner = Swipe(document.getElementById('mySwipe'), {
		auto: 5000,
		continuous: true,
		disableScroll:false,
		callback: function(pos) {
			var i = bullets.length;
			while (i--) {
				bullets[i].className = ' ';
			}
			bullets[pos].className = 'cur';
		}
	})
	/**主页和城市切换页之间切换**/
	$('.homepage .headerline .selectcitybtn').click(function (){
		
		$('.homepage').css('display','none');
		$('.selectcitypage').css('display','block');
	})
	$('.selectcitypage .headerline .back').click(function (){
		
		$('.homepage').css('display','block');
		$('.selectcitypage').css('display','none');
	})
	/**选择城市**/
	$('.selectcitypage .allcitys .city').click(function() {
		//$(this).addClass('on').siblings().removeClass('on');
		//var city=$(this).text();
		//$('.homepage .headerline .selectcitybtn span').text(city)
	})
	//限制字符个数
	$('.titleline').each(function(){
		var maxwidth=15;
		if($(this).text().length>maxwidth){
		$(this).text($(this).text().substring(0,maxwidth));
		$(this).html($(this).html()+'…');
		}
	});
	$('.summary').each(function(){
		var maxwidth=15;
		if($(this).text().length>maxwidth){
		$(this).text($(this).text().substring(0,maxwidth));
		$(this).html($(this).html()+'…');
		}
	});
})