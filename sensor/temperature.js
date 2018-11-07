const sensor=require('../node_modules/node-dht-sensor');
const events=require('../node_modules/events');
const datetime=require('../node_modules/node-datetime');

function TemperatureSensor(){
	events.EventEmitter.call(this);
	let device=this;
	function getSensorData(){
		sensor.read(11,4,function(err,temperature,humidity){
		
			let dt = datetime.create();
			let obj={};
			obj.timestamp=dt.format('Y-m-d H:M:S');
			obj.temperature=temperature;
			obj.humidity=humidity;
			
			if(!err){
				device.emit('data',JSON.stringify(obj)); }

		});
	}
	getSensorData();
	setInterval(()=>{getSensorData()},1000);
	
}

TemperatureSensor.prototype.__proto__=events.EventEmitter.prototype;

module.exports=new TemperatureSensor();
