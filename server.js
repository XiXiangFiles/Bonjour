const mdns=require('multicast-dns')();
const http=require('http');
const fs=require('fs');
class dnssd{
	
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
	generateSRV(Instance,Service,ttl,port,domain){

		let obj={};
		let data={};
		
		obj.name= Instance+"._"+Service+"._udp.local";
		obj.type='SRV';
		obj.ttl=ttl;
		obj.flush=true;
		data.port=port;
		data.target=domain+".local";
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
				//	arr.push(e);
			});
			obj.data=arr;
		}else{
			obj.data=Buffer.from(data,'ascii');	
		}

		return obj;
			
	}
	generateA(domain,ttl){
	
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

		obj.name=domain+".local";
		obj.type="A";
		obj.ttl=ttl;
		obj.flush=true;
		obj.data=addrIPv4;
		
		return obj;

	}	
	
	generateAAAA(domain,ttl){
		
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

		obj.name=domain+".local";
		obj.type="AAAA";
		obj.ttl=ttl;
		obj.flush=true;
		obj.data=addrIPv6;

		return obj;
	}
}

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


function serverStart(Instance,Service,txt,domain,ttl){
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

			}
		}

	});
}
function gererateLinks(model,properties,actions,things,subscriptions,type,product,help,ui,customRelType){
	
	let obj={};
	
	obj.model=model;
	obj.properties=properties;
	obj.actions=actions;
	obj.things=things;
	obj.subscriptions=subscriptions;
	obj.type=type;
	obj.product=product;
	obj.help=help;
	obj.ui=ui;
	obj.customRelType=customRelType;
	
	return obj;
}
function createServer(service,port){
	function properties(link,title){
		let obj={};
		obj.link=link;
		obj.title=title;
		return obj;
	}

	const Service=service;	
	let customField={};
	let customField2={};

	customField.sersor="GPS Sersor";
	customField.type="GPS";

	customField2.sersor="Temperature Sersor";
	customField2.type="DH11";
		
	generateWTM(0,"2018-09-06","2018-09-07",service[0],service[0],[{tag:"0"}],customField,gererateLinks(properties("properties/","properties"), properties("action/","actions of this web things"),properties("product/","NULL"), properties("type/","NULL") ,properties("help/","NULL"),properties("ui/","NULL"),properties("custom/","NULL")));		
	generateWTM(1,"2018-09-06","2018-09-07",service[1],service[1],[{tag:"1"}],customField2,gererateLinks(properties("properties/","properties"), properties("action/","actions of this web things"),properties("product/","NULL"), properties("type/","NULL") ,properties("help/","NULL"),properties("ui/","NULL"),properties("custom/","NULL")));
	
	http.createServer(function(req,res){	
		//console.log(Service);
		let flag=false;
		if(req.method == 'GET'){
			let count=0;
			Service.forEach(function(e){
			
				if(req.url.substring(1,e.length+1)== e){
					if(req.url.length==(e.length+1)){
						console.log(req.url.substring(1,e.length+1));
						res.writeHead(200,{'Content-Type':'text/html'});
						fs.readFile('profile/'+e+"/"+e+".json", function(err, data) {
					    		if(!err){
					    			flag=false;
								res.write(data);
				    				res.end();
							}else{ 
								res.write("false");
								res.end();
							}
						});
						count--;
					}
					if(req.url== ("/"+e+"/model/")){
						
						fs.readFile('profile/'+e+"/model/"+e+".json", function(err, data) {
					    		if(!err){
					    			flag=false;
								res.write(data);
				    				res.end();
							}else{ 
								res.write("false");
								res.end();
							}
						});
						count--;
					}
						
				}
				count++;	
			});
			if(count==Service.length){
				res.write("false");
				res.end();

			}
				
		}
	}).listen(port);

}
function generateWTM(id,createdAt, updateAt, name,description , tags , customFields,links) {
	function generateLink(name){
		return str='Link:<'+name+'/>; rel="'+name+'"\n';
	}
	let Links="";
	let profile={};
	let model={};
	let floder=['model','properties','actions','things','subscription','type','product','help','ui','custom'];
	profile.id=id;
	profile.name=name;
	profile.description=description;
	profile.createdAt=createdAt;
	profile.tags=tags;
	profile.customFields=customFields;

	model.id=id;
	model.name=name;
	model.description=description;
	model.createdAt=createdAt;
	model.tags=tags;
	model.customFields=customFields;
	model.links=links;
	

	fs.mkdir('profile',function(err){
		console.log(err);
	});
	fs.mkdir('profile/'+name,function(err){
		console.log(err);
	});
	floder.forEach(function(e){
		Links+=generateLink(e);
		fs.mkdir('profile/'+name+'/'+e,function(err){
			console.log(err);
		});
		
	});

	fs.writeFile('profile/'+name+'/'+name+".json",Links+JSON.stringify(profile), function (err) {
  		if (!err)
  			console.log('Saved!');
	});

	fs.writeFile('profile/'+name+'/model/'+name+".json",JSON.stringify(model), function (err) {
  		if (!err)
  			console.log('Saved!');
	});

	return JSON.stringify(profile);
}
function main(){
	
	let Service= new Map();
	let txt=new Map();
	let domain="testdomain";

	const Instance="Percomlab";
	Service.set("Temperature",8080);
	Service.set("GPS",8080);
	


	txt.set("Temperature","profile=/Temperature;info=testmulti-values;test=test");
	txt.set("GPS","profile=/GPS");
	
	serverStart(Instance,Service,txt,domain,10);

	createServer(["GPS","Temperature"],8080);

}
main();
