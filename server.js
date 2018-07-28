const mdns=require('multicast-dns');
const txt=require('dns-txt');

class myService{
	
	constructor(Instance,Service,SRV,TXT){
		
		let serviceArray = Service;
		let service=new Set();
		Service.forEach(function(e){
			service.add(e);
		});

		this.instance=Instance;
		this.myService=service;
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
		function generateAnyauth(SRV , TXT){
			return 0;	
		}

		let instance=this.instance;
		let query=[];
		
		this.myService.forEach(function(e){
			query.push(generateAnyQuery(instance,e));
		})
		return 0;
	}
	

//	----------------------------
	show(){
		console.log(this.instance);
		console.log(this.myService);
	}
}


function main(){
	
	let arg=[];
	arg.push("test1","test2","test3");

	let p1= new myService("Percomlab",arg);
	p1.show();
	console.log(p1.anyTypePacket());
}

main();
