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
		let arr=[];
		
		obj.name= Instance+"._"+Service+"._udp.local";
		obj.type="TXT";
		obj.ttl=ttl;
		obj.flush=true;

		if(data.includes(';')){
			let str=data.split(';');
			str.forEach(function(e){
				arr.push(Buffer.from(e,'ascii'));
			});
			obj.data=arr;
		}else{
			obj.data=Buffer.from(data,'ascii');	
		}

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
			RRs.push(dns.generateTXT(instance,key,ttl,val));
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
		
		let respond={
			answers:answers
		};

		return respond;
	
	}
	responsePTR(Instance,Service){
		
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=this.TTL;
		let txt=this.TXT;
		let additionals=[];
		let answers=[];
		let dns=new dnssd();
		
		if(instance==Instance){
			
			answers.push(dns.generatePTR(instance,Service,ttl));
			additionals.push(dns.generateSRV(instance,Service,ttl,detailService.get(Service)));
		
			for(let [key,val] of txt ){
				
				if(key==Service){
				
					additionals.push(dns.generateTXT(instance,key,ttl,val));
				}	
			}	


			additionals.push(dns.generateA(instance,ttl));
			additionals.push(dns.generateAAAA(instance,ttl));
	
			let respond={
				answers:answers,
				additionals:additionals
			}

			return respond;

		}else{

			return false;

		}


	}
	responsePTRTXT(Instance,Service){
		
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=this.TTL;
		let txt=this.TXT;
		let answers=[];
		let additionals=[];
		let dns=new dnssd();

		if(instance==Instance){

			answers.push(dns.generatePTR(instance,Service,ttl));

			for(let [key,val] of txt ){
				answers.push(dns.generateTXT(instance,key,ttl,val));
			}	
			additionals.push(dns.generateA(instance,ttl));
			additionals.push(dns.generateAAAA(instance,ttl));

			let respond={
				answers:answers,
				additionals:additionals
			}

			return respond;
		}else{
			return false;
		}		
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
		
			answers.push(dns.generateA(instance,ttl));
			answers.push(dns.generateAAAA(instance,ttl));
	
			let respond={
				answers:answers
			}

			return respond;

		}else{

			return false;

		}
	}

	responsePTRSRVTXT(Instance, Service){

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
					answers.push(dns.generateTXT(instance,key,ttl,val));
				}	
			}	


			answers.push(dns.generateA(instance,ttl));
			answers.push(dns.generateAAAA(instance,ttl));
	
			let respond={
				answers:answers
			}

			return respond;

		}else{

			return false;

		}

	}
}


function serverStart(Instance,Service,txt,ttl){
	let checkService=Service;

	let p1= new myService(Instance,Service,ttl,txt);

	mdns.query(p1.anyTypePacket());
	mdns.respond(p1.announcePacket());

	
	mdns.on('query',function(query){
		let getServicename = new Set();
		let saveQery =new Set(); 
		let instance;
		let service;
		let PTRservice;

		query.questions.forEach(function(e){
			if(e.type=="PTR" && e.name =="_services._dns-sd._udp.local"){

				mdns.respond(p1.responsePTRofDNSSD());

			}

			getServicename.add(e.type);
			saveQery.add(e);

		});

		
		try{
			saveQery.forEach(function(element){
				PTRservice=element.name.split('_');
				PTRservice=PTRservice[1].split('.');
				PTRservice=PTRservice[0];
			});
		}catch(e){}

		if(getServicename.has('PTR') && getServicename.size == 1 && checkService.has(PTRservice ) ){

			if(p1.responsePTR( Instance ,PTRservice ) != false ){
				mdns.respond(p1.responsePTR(Instance,PTRservice ));
			}

		}

		if(getServicename.has('PTR') && getServicename.has('TXT')){
		
			let str;

			saveQery.forEach(function(element){

				let str=element.name.split('.');
				instance=str[0];
				service=str[1];
				service=str[1].split('_');
				service=service[1];

			});

			if(p1.responsePTRTXT(instance,service)!= false ){
				mdns.respond(p1.responsePTRTXT(instance,service));
			}	
		
		}

		if(getServicename.has('PTR') && getServicename.has('SRV')){

			let str;
			saveQery.forEach(function(element){

				let str=element.name.split('.');
				instance=str[0];
				service=str[1];
				service=str[1].split('_');
				service=service[1];

			});
			if(p1.responsePTRSRV(instance,service)!= false ){
				
				mdns.respond(p1.responsePTRSRV(instance,service));

			}
		}
		if( getServicename.has('PTR') && getServicename.has('SRV') && getServicename.has('TXT') ){

			let str;
			saveQery.forEach(function(element){

				let str=element.name.split('.');
				instance=str[0];
				service=str[1];
				service=str[1].split('_');
				service=service[1];

			});
			if(p1.responsePTRSRVTXT(instance,service)!= false ){
				
				mdns.respond(p1.responsePTRSRVTXT(instance,service));

			}
		}

	});
	
	setInterval(function(){
		mdns.respond(p1.announcePacket());
		mdns.respond(p1.responsePTRofDNSSD());

	},ttl*1000);
	
}

function main(){
	
	let Service= new Map();
	let txt=new Map();

	const Instance="Percomlab";
	Service.set("test1",10001);
	Service.set("test2",10002);
	

	txt.set("test1","path=140.119.163.195;test=wongwong");
	txt.set("test2","y=200");
	
	serverStart(Instance,Service,txt,60);
	mdns.on('response',function(res){
		res.answers.forEach(function(e){
			if(e.type=='TXT'){
				console.log(e.data);
			}
		});
	})

}
main();

