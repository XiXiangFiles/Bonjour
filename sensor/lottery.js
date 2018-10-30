const Serial=require('serialport');
const port= new Serial('/dev/serial/by-id/usb-Arduino__www.arduino.cc__0043_8543034393735181F140-if00',{baudRate : 9600});

/*
port.on('data',function(data){
	console.log(data);
});
*/
class LotteryDevice{
	start(){
		port.write("start",function(err){});
		return 0;
	}
	ready(){
		port.write("resdy",function(err){});
		return 0;
	}
}
module.exports=LotteryDevice;

