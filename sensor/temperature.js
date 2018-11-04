const sensor=require('node-dht-sensor');
const events=require('events');
const datetime=require('node-datetime');

function TemperatureSensor(){
	events.EventEmitter.call(this);
	let device=this;
	setInterval(function(){
		sensor.read(11,4,function(err,temperature,humidity){
		
			let dt = datetime.create();
			let obj={};
			obj.timestamp=dt.format('Y-m-d H:M:S');
			obj.temperature=temperature;
			obj.humidity=humidity;
			
			if(!err){
				device.emit('data',JSON.stringify(obj)); }

		});
	},1000);
	
}
TemperatureSensor.prototype.__proto__=events.EventEmitter.prototype;



module.exports=new TemperatureSensor();
