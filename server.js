const mdns=require('multicast-dns')();

class dnssd{
	
	constructor(){

	}
	generateANY(Instance,Service){
			let obj={};
			obj={
				name:Instance+"._"+Service+"._udp.local",
				type:'ANY'
			}
			return obj; 
	}
	generatePTR(Instance,Service,ttl,discovery=0){
		
		let obj={};
		if(discovery==0){

			obj.name="_"+Service+"._udp.local";
			obj.type='PTR';
			obj.ttl=ttl;
			obj.data= Instance+"._"+Service+"._udp.local";	
		
		}else if(discovery == 1){

			obj.name="_services._dns-sd._udp.local";
			obj.type='PTR',
			obj.ttl=ttl;
			obj.data="_"+Service+"._udp.local";
		
		}if(discovery == 2){
			
			obj.name="_"+Service+"._udp.local";
			obj.type='PTR',
			obj.data= Instance+"._"+Service+"._udp.local";	

		}

		return obj;
	}
	generateSRV(Instance,Service,ttl,port){

		let obj={};
		let data={};
		
		obj.name= Instance+"._"+Service+"._udp.local";
		obj.type='SRV';
		obj.ttl=ttl;
		obj.flush=true;
		data.port=port;
		data.target=Instance+".local";
		obj.data=data;

		return obj;

	}
	generateTXT(Instance,Service,ttl,data){
		let obj={};
		const txt=require('dns-txt')();
		
		obj.name= Instance+"._"+Service+"._udp.local";
		obj.type="TXT";
		obj.ttl=ttl;
		obj.data=txt.encode(data);
		
		return obj;
			
	}
	generateA(Instance,ttl){
	
		const os = require('os');
		let obj={};
		let addrIPv4;
		let networkInterface =os.networkInterfaces();
		Object.keys(networkInterface).forEach(function(e){
			if( networkInterface[e][0].address !='127.0.0.1' ){
				addrIPv4=networkInterface[e][0].address;
				return e;
			}
		});

		obj.name=Instance+".local";
		obj.type="A";
		obj.ttl=ttl;
		obj.flush=true;
		obj.data=addrIPv4;
		
		return obj;

	}	
	
	generateAAAA(Instance,ttl){
		
		const os = require('os');
		let obj={};
		let addrIPv6;
		let networkInterface =os.networkInterfaces();
		Object.keys(networkInterface).forEach(function(e){
			if( networkInterface[e][0].address !='127.0.0.1' ){
				addrIPv6=networkInterface[e][1].address;
				//console.log(networkInterface);
				return e;
			}
		});

		obj.name=Instance+".local";
		obj.type="AAAA";
		obj.ttl=ttl;
		obj.flush=true;
		obj.data=addrIPv6;

		return obj;
	}
}

class myService{
	
	constructor(Instance,Service,TTL,TXT){
		
		let service=new Set();
		for(let e of Service.keys()){
			service.add(e);
		}


		this.instance=Instance;
		this.detailService=Service;
		this.myService=service;
		this.TTL=TTL;
		this.TXT=TXT;
	}

	anyTypePacket(){
	
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=this.TTL;
		let txt=this.TXT;
		let questions=[];
		let RRs=[];

		let dns=new dnssd();
		this.myService.forEach(function(e){
			questions.push(dns.generateANY(instance,e));
			RRs.push(dns.generateSRV(instance,e,ttl,detailService.get(e)));
		});
		
		for(let [key,val] of txt ){
			
			let str="{";
			let splitval=val.split(",");
			for(let i=0 ; i<splitval.length ; i++){
				let splitKeyValue=splitval[i].split('=');
				str += '"'+splitKeyValue[0]+'"'+":"+'"'+splitKeyValue[1]+'"';
				if(i != splitval.length-1)
					str +=',';
			}
			str+="}";
			RRs.push(dns.generateTXT(instance,key,ttl,JSON.parse(str)));
		}	

		let anyPacket={
			questions:questions,
			authorities:RRs
		};


		return anyPacket;
	}
	
	announcePacket(){

		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=this.TTL;
		let dns=new dnssd();
		let answers=[];
		
		answers.push(dns.generateA(instance,ttl));
		answers.push(dns.generateAAAA(instance,ttl));

		let announce={
			answers:answers
		};
		return announce;
	}

	byebyePacket(){
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=0;
		

		let dns=new dnssd();
		let answers=[];

		answers.push(dns.generateA(instance,ttl));
		answers.push(dns.generateAAAA(instance,ttl));

		let announce={
			answers:answers
		}
	}
	responsePTRofDNSSD(){
		
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=this.TTL;
		

		let dns=new dnssd();
		let answers=[];
		this.myService.forEach(function(e){
			answers.push(dns.generatePTR(instance,e,ttl,0));
			answers.push(dns.generatePTR(instance,e,ttl,1));
		});
	//	answers.push(dns.generateA(instance,ttl));
	//	answers.push(dns.generateAAAA(instance,ttl));

		let respond={
			answers:answers
		};

		return respond;
	
	}
	responsePTRTXT(Instance,Service){
		
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=this.TTL;
		let txt=this.TXT;
		let answers=[];
		let dns=new dnssd();

		this.myService.forEach(function(e){
			answers.push(dns.generatePTR(instance,e,ttl,2));
		});
		
		for(let [key,val] of txt ){
			
			let str="{";
			let splitval=val.split(",");
			for(let i=0 ; i<splitval.length ; i++){
				let splitKeyValue=splitval[i].split('=');
				str += '"'+splitKeyValue[0]+'"'+":"+'"'+splitKeyValue[1]+'"';
				if(i != splitval.length-1)
					str +=',';
			}
			str+="}";
			answers.push(dns.generateTXT(instance,key,ttl,JSON.parse(str)));
		}	


		answers.push(dns.generateA(instance,ttl));
		answers.push(dns.generateAAAA(instance,ttl));

		let respond={
			answers:answers
		}

		return respond;
		

	}
	responsePTRSRV(Instance, Service){
	
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=this.TTL;
		let txt=this.TXT;
		let answers=[];
		let dns=new dnssd();

		if(instance==Instance){
			
			answers.push(dns.generatePTR(instance,Service,ttl));
			answers.push(dns.generateSRV(instance,Service,ttl,detailService.get(Service)));
		
			for(let [key,val] of txt ){
				
				if(key==Service){
					let str="{";
					let splitval=val.split(",");
					for(let i=0 ; i<splitval.length ; i++){
						let splitKeyValue=splitval[i].split('=');
						str += '"'+splitKeyValue[0]+'"'+":"+'"'+splitKeyValue[1]+'"';
						if(i != splitval.length-1)
							str +=',';
					}
					str+="}";
					answers.push(dns.generateTXT(instance,key,ttl,JSON.parse(str)));
				}	
			}	


			answers.push(dns.generateA(instance,ttl));
		//	answers.push(dns.generateAAAA(instance,ttl));
	
			let respond={
				answers:answers
			}
			return respond;
		}else{
			return false;
		}

		
	}
}


function main(){
	
	let service= new Map();
	let txt=new Map();

	service.set("test1",10001);
	service.set("test2",10002);

	txt.set("test1","x=100,y=200");
	txt.set("test2","y=200");
	
	let p1= new myService("Percomlab",service,10,txt);

	mdns.query(p1.anyTypePacket());
	mdns.respond(p1.announcePacket());
	
	//console.log(p1.responsePTRTXT());
	
	mdns.on('query',function(query){
		let set = new Set();
		let set1 =new Set(); 
		let instance;
		let service;
		query.questions.forEach(function(e){
			if(e.type=="PTR" && e.name =="_services._dns-sd._udp.local"){
		//		console.log(p1.responsePTRofDNSSD() );
				mdns.respond(p1.responsePTRofDNSSD());
			}
			set.add(e.type);
			set1.add(e);
		});
		if(set.has('PTR') && set.has('TXT')){
			
			mdns.respond(p1.responsePTRTXT());	
		
		}
		if(set.has('PTR') && set.has('SRV')){
			let str;
			set1.forEach(function(element){
				let str=element.name.split('.');
				instance=str[0];
				service=str[1];
				service=str[1].split('_');
				service=service[1];
			});
			if(p1.responsePTRSRV(instance,service)!= false ){
				mdns.respond(p1.responsePTRSRV(instance,service));
				console.log(p1.responsePTRSRV(instance,service));
			}
		}

	});

}
main();

