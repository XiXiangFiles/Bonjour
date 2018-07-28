const mdns=require('multicast-dns')();
const txt=require('dns-txt')();

class dnssd{
	
	constructor(){

	}
	generateAnyQuery(Instance,Service){
			let obj={};
			obj={
				name:Instance+"._"+Service+"._udp",
				type:'ANY'
			}
			return obj; 
	}
	generatePTR(Instance,Service){
		let obj={};
	
		return obj;
	}
	generateSRV(Instance,Service,ttl,port){

		let obj={};
		let data={};
		obj.name= Instance+"._"+Service+"._udp";
		obj.type='SRV';
		obj.ttl=ttl;
		data.port=port;
		data.target=Instance+".local"
		
		obj.data=data;
		return obj;

	}
	generateTXT(Instance,Service,ttl,data){
		let obj={};
	
		const txt=require('dns-txt')();
		obj.name= Instance+"._"+Service+"._udp";
		obj.type="TXT";
		obj.ttl=ttl;
		obj.data=txt.encode(data);
		return obj;
			
	}
	generateA(Instance,Service,ttl,data){
		let obj={};
		
		return obj;

	}	
	
	generateAAAA(Instance,Service,ttl,data){
		let obj={};
		
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
			questions.push(dns.generateAnyQuery(instance,e));
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
	
	show(){
		console.log(this.instance);
		console.log(this.myService);
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
	p1.show();
	mdns.query(p1.anyTypePacket());
	console.log(p1.anyTypePacket());

	
}
main();

