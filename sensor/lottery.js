const Serial=require('serialport');
const events=require('events');
const port= new Serial('/dev/serial/by-id/usb-Arduino__www.arduino.cc__0043_8543034393735181F140-if00',{baudRate : 9600});


function LotteryDevice(){
		
	events.EventEmitter.call(this);
	let device=this;

	this.start=function(){
		port.write("start",function(err){});
	}
	this.ready=function(){
		port.write("ready",function(err){});
		return 0;
	}
	this.listen=function(){
		port.on('data',function(data){
			device.emit('data',data.toString('ascii'));
		});
	}
}
LotteryDevice.prototype.__proto__=events.EventEmitter.prototype;

/*
let device= new LotteryDevice();
device.listen();
device.on('data',(e)=>{
	console.log(e);
})
setTimeout(function(){
	device.start();
},3000);
*/

module.exports=new LotteryDevice();
//module.exports=msg;

