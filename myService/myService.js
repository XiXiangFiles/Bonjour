const dnssd= require('./dnssd/dnssd.js');
class myService{
	
	constructor(Instance,Service,TTL,TXT,Domain){
		
		let service=new Set();
		for(let e of Service.keys()){
			service.add(e);
		}


		this.instance=Instance;
		this.detailService=Service;
		this.myService=service;
		this.TTL=TTL;
		this.TXT=TXT;
		this.Domain=Domain;
	}

	anyTypePacket(){
	
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=this.TTL;
		let txt=this.TXT;
		let questions=[];
		let Domain=this.Domain;
		let RRs=[];

		let dns=new dnssd();
		this.myService.forEach(function(e){
			questions.push(dns.generateANY(Domain,e));
			RRs.push(dns.generateSRV(instance,e,ttl,detailService.get(e),Domain));
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
		let Domain=this.Domain;
		let dns=new dnssd();
		let answers=[];
		
		
		this.myService.forEach(function(e){
			answers.push(dns.generatePTR(instance,e,ttl,0));
			answers.push(dns.generatePTR(instance,e,ttl,1));
		});
		answers.push(dns.generateA(Domain,ttl));
		answers.push(dns.generateAAAA(Domain,ttl));

		let announce={
			answers:answers
		};
		return announce;
	}

	byebyePacket(){
		let instance=this.instance;
		let detailService=this.detailService;
		let ttl=0;
		let Domain=this.Domain;
		let dns=new dnssd();
		let answers=[];

		answers.push(dns.generateA(Domain,ttl));
		answers.push(dns.generateAAAA(Domain,ttl));

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
		let Domain=this.Domain;
		let additionals=[];
		let answers=[];
		let dns=new dnssd();
		
		if(instance==Instance){
			
			answers.push(dns.generatePTR(instance,Service,ttl));
			additionals.push(dns.generateSRV(instance,Service,ttl,detailService.get(Service),Domain));
		
			for(let [key,val] of txt ){
				
				if(key==Service){
				
					additionals.push(dns.generateTXT(instance,key,ttl,val));
				}	
			}	


			additionals.push(dns.generateA(Domain,ttl));
			additionals.push(dns.generateAAAA(Domain,ttl));
	
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
		let Domain=this.Domain;
		let answers=[];
		let additionals=[];
		let dns=new dnssd();

		if(instance==Instance){

			answers.push(dns.generatePTR(instance,Service,ttl));

			for(let [key,val] of txt ){
				answers.push(dns.generateTXT(instance,key,ttl,val));
			}	
			additionals.push(dns.generateA(Domain,ttl));
			additionals.push(dns.generateAAAA(Domain,ttl));

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
		let Domain=this.Domain;
		let answers=[];
		let dns=new dnssd();

		if(instance==Instance){
			
			answers.push(dns.generatePTR(instance,Service,ttl));
			answers.push(dns.generateSRV(instance,Service,ttl,detailService.get(Service),Domain));
			
			for(let [key,val] of txt ){
				answers.push(dns.generateTXT(instance,key,ttl,val));
			}	
			
			
			answers.push(dns.generateA(Domain,ttl));
			answers.push(dns.generateAAAA(Domain,ttl));
	
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
		let Domain=this.Domain;
		let answers=[];
		let dns=new dnssd();

		if(instance==Instance){
			
			answers.push(dns.generatePTR(instance,Service,ttl));
			answers.push(dns.generateSRV(instance,Service,ttl,detailService.get(Service),Domain));
		
			for(let [key,val] of txt ){
				
				if(key==Service){
					answers.push(dns.generateTXT(instance,key,ttl,val));
				}	
			}	


			answers.push(dns.generateA(Domain,ttl));
			answers.push(dns.generateAAAA(Domain,ttl));
	
			let respond={
				answers:answers
			}

			return respond;

		}else{

			return false;

		}

	}
}
module.exports=myService;