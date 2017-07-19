
$(document).ready(function(){
//限制字符个数
	$('.titleline').each(function(){
		var maxwidth=15;
		if($(this).text().length>maxwidth){
		$(this).text($(this).text().substring(0,maxwidth));
		$(this).html($(this).html()+'…');
		}
	});
	$('.summary').each(function(){
		var maxwidth=20;
		if($(this).text().length>maxwidth){
		$(this).text($(this).text().substring(0,maxwidth));
		$(this).html($(this).html()+'…');
		}
	});
});