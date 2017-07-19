$(function () {
	/*$('.collectinformationbtn').click(function () {
		$('.informationwindowout,.bg').css('display','block')
	});*/
	$('.bg').click(function () {
		$('.informationwindowout,.bg').css('display','none')
	});
	 var h1=$(window).height()*0.5
	 var backtop=function(){
	 	var h2=$(document).scrollTop();
			  if(h2>h1){
			   $('.backtop').css('display','block')
			  }else{
			   $('.backtop').css('display','none')
			  }
		 }
	 backtop();
	 $(window).scroll(function() {
	   backtop();
	 });
	 $('.backtop').click(function(){
	 	$('body,html').animate({scrollTop:0},500);
          return false;
	 })
})

