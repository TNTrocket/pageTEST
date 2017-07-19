$(function(){
	// 百度地图API功能
	var map = new BMap.Map("allmap");
	var point = new BMap.Point(113.34913,23.142316);
	map.enableScrollWheelZoom();
	var marker = new BMap.Marker(point);  // 创建标注
	map.addOverlay(marker);              // 将标注添加到地图中
	map.centerAndZoom(point, 18);
	var opts = {
	  width : 344,     // 信息窗口宽度
	  height: 126,     // 信息窗口高度
	  title : "广州市熙励教育信息咨询有限公司" , // 信息窗口标题
	  enableMessage:true,//设置允许信息窗发送短息
	  /*message:"亲耐滴，晚上一起吃个饭吧？戳下面的链接看下地址喔~"*/
	}
	var infoWindow = new BMap.InfoWindow("地址：广州市天河区五山路1号华晟大厦1506<br>电话：400-612-5351<br>邮编：510000", opts);  // 创建信息窗口对象 
	marker.addEventListener("click", function(){          
		map.openInfoWindow(infoWindow,point); //开启信息窗口
	});

	
})