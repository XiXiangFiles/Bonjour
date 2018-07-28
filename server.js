const mdns=require('multicast-dns');
const txt=require('dns-txt');

class myService{
	
	constructor(Instance,Service,TTL,TXT){
		
		let serviceArray = Service;
		let service=new Set();
		Service.forEach(function(e){
			service.add(e);
		});

		this.instance=Instance;
		this.myService=service;
		this.TTL=TTL;
		this.TXT=TXT;
	}


	anyTypePacket()
	{
		function generateAnyQuery(Instance,Service){
			let obj={};
			obj={
				name:Instance+"._"+Service+"._udp",
				type:'ANY'
			}
			return obj; 
		}
		function generateSRV(Instance,Service,ttl,port){
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
		function generateTXT(Instance,Service,ttl,data){
			let obj={};
			obj.name= Instance+"._"+Service+"._udp";
			obj.type="TXT";
			obj.ttl=ttl;
			obj.data=txt.encode(data);

			return obj;
			
		}
		function generateAnyauth(...args){

			return 0;	
		}
		

		let instance=this.instance;
		let query=[];
		this.myService.forEach(function(e){
			query.push(generateAnyQuery(instance,e));
		});

		return 0;
	}
	
	show(){
		console.log(this.instance);
		console.log(this.myService);
	}
}



function main(){
	
	let service=[];
	service.push("test1","test2","test3");

	let p1= new myService("Percomlab",service);
	p1.show();
	console.log(p1.anyTypePacket());
}

main();
