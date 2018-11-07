const mdns=require('../node_modules/multicast-dns')();
const myService=require("./myService.js");
const events=require('../node_modules/events');

function bonjourServer(){
	let Instance,Service,txt,domain,ttl;
	let bonjour=this;
	this.setup=function(instance,service,txtfield,domainName,timeToLive){
		Instance=instance;
		Service=service;
		txt=txtfield;
		domain=domainName;
		ttl=timeToLive;
	};

	this.start=function(){
		let checkService=Service;
		let p1= new myService(Instance,Service,ttl,txt,domain);

		mdns.query(p1.anyTypePacket());
		mdns.respond(p1.announcePacket());

		
		mdns.on('query',function(query){
			let getServicename = new Set();
			let saveQuery =new Set(); 
			let instance;
			let service;
			let PTRservice;

			query.questions.forEach(function(e){
				if(e.type=="PTR" && e.name =="_services._dns-sd._udp.local"){

					bonjour.emit('data',p1.responsePTRofDNSSD());
					mdns.respond(p1.responsePTRofDNSSD());

				}

				getServicename.add(e.type);
				saveQuery.add(e);

			});

			
			try{
				saveQuery.forEach(function(element){
					PTRservice=element.name.split('_');
					PTRservice=PTRservice[1].split('.');
					PTRservice=PTRservice[0];
				});
			}catch(e){}

			if(getServicename.has('PTR') && getServicename.size == 1 && checkService.has(PTRservice ) ){

				if(p1.responsePTR( Instance ,PTRservice ) != false ){
					bonjour.emit('data',p1.responsePTR(Instance,PTRservice));
					mdns.respond(p1.responsePTR(Instance,PTRservice ));
				}

			}

			if(getServicename.has('PTR') && getServicename.has('TXT')){
			
				let str;

				saveQuery.forEach(function(element){
					if(element.type==='TXT'){
						let str=element.name.split('.');
						instance=str[0];
						service=str[1];
						service=str[1].split('_');
						service=service[1];
					}
				});

				if(p1.responsePTRTXT(instance,service)!= false ){
					mdns.respond(p1.responsePTRTXT(instance,service));
					bonjour.emit('data',p1.responsePTRTXT(instance,service));
				}	
			
			}

			if(getServicename.has('PTR') && getServicename.has('SRV')){

				let str;
				saveQuery.forEach(function(element){

					if(element.type==='SRV'){
						let str=element.name.split('.');
						instance=str[0];
						service=str[1];
						service=str[1].split('_');
						service=service[1];
					}

				});
				if(p1.responsePTRSRV(instance,service)!= false ){
					
					mdns.respond(p1.responsePTRSRV(instance,service));
					bonjour.emit('data',p1.responsePTRSRV(instance,service));

				}
			}
			if( getServicename.has('PTR') && getServicename.has('SRV') && getServicename.has('TXT') ){

				let str;
				saveQuery.forEach(function(element){

					if(element.type==='SRV'){
						let str=element.name.split('.');
						instance=str[0];
						service=str[1];
						service=str[1].split('_');
						service=service[1];
					}

				});
				if(p1.responsePTRSRVTXT(instance,service)!= false ){
					mdns.respond(p1.responsePTRSRVTXT(instance,service));
					bonjour.emit('data',p1.responsePTRSRVTXT(instance,service));
				}
			}

		});
	}
}

bonjourServer.prototype.__proto__=events.EventEmitter.prototype;
module.exports=new bonjourServer();
