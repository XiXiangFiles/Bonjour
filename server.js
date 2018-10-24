const mdns=require('multicast-dns')();
const http=require('http');
const fs=require('fs');
const datetime=require('node-datetime');
const decode = require('urldecode');
const WebSocketServer = require('websocket').server;
const WebSocketClient = require('websocket').client;
const colors = require('colors');

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
function createWebsocketServer(server){
	wsServer = new WebSocketServer({
	    httpServer: server,
	    // You should not use autoAcceptConnections for production
	    // applications, as it defeats all standard cross-origin protection
	    // facilities built into the protocol and the browser.  You should
	    // *always* verify the connection's origin and decide whether or not
	    // to accept it.
	    autoAcceptConnections: false
	});
	 
	function originIsAllowed(origin) {
	  // put logic here to detect whether the specified origin is allowed.
	  return true;
	}
	 
	wsServer.on('request', function(request) {
	    if (!originIsAllowed(request.origin)) {
	      // Make sure we only accept requests from an allowed origin
	      request.reject();
	      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
	      return;
	    }
	    
	    var connection = request.accept('echo-protocol', request.origin);
	    console.log((new Date()) + ' Connection accepted.');
	    connection.on('message', function(message) {
	        if (message.type === 'utf8') {
	        	console.log(`message.utf8Data :${message.utf8Data}`)
	        	let queryData=JSON.parse(message.utf8Data);
	        	console.log(`profile/${queryData.name}/${queryData.type}/${queryData.name}.json`);
	        	setInterval(function(){

	        		fs.readFile(`profile/${queryData.name}/${queryData.data}/${queryData.name}.json`,'utf8',function(err,data){
	        			// console.log(data);
	        			connection.sendUTF(data);
	        		});
	        	},1000);
	            
	        }
	    });
	    
	    connection.on('close', function(reasonCode, description) {
	        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	    });
	});
}
function createServer(service,port){

	const Service=service;	
	let httpServer=http.createServer(function(req,res){	
		
		let flag=false;
		if(req.method == 'GET'){

			let count=0;
			let str;
			Service.forEach(function(e){
			
				if(req.url.substring(1,e.length+1)== e){

					if(req.url.length==(e.length+1)){

						console.log(colors.green('%s'), req.url.substring(1,e.length+1));
						
						fs.readFile(`profile/${e}/links`, function(err, data) {
					    	if(!err){

					    		flag=false;
					    		let string=data.toString('utf8');
					    		res.writeHead(200,{'Link':string.split('\n')});
								fs.readFile(`profile/${e}/${e}.json`,function(err,data){
									if(!err){
										res.write(data);
									}else{
										res.end();
									}
								});
							}else{ 
								res.write("false");
								res.end();
							}
						});
						count--;
					}
					if((str=("/"+e+"/model"))==req.url.substring(0,str.length)){
						
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
					if((str=("/"+e+"/properties"))==req.url.substring(0,str.length)){
						

						fs.readFile(`profile${req.url}/links`, function(err, data) {
					    	if(!err){
					    		res.writeHead(200,{'Link':[data.toString('utf8')]});
					    		fs.readFile(`profile${req.url}/${e}.json`,function(err,data){
									console.log(colors.green(`profile${req.url}/${e}.json`));
						    		flag=false;
									res.write(data);
					    			res.end();
					    		});

							}else{ 

								fs.readFile(`profile${req.url}/${e}.json`,function(err,data){
									if(!err){
										console.log(colors.green(`profile${req.url}/${e}.json`));
							    		flag=false;
										res.write(data);
						    			res.end();
									}else{
										res.write("false");
										res.end();
									}
					    		});
								
							}
						});
						count--;
					}
					if((str=("/"+e+"/actions"))==req.url.substring(0,str.length)){
						
						console.log(colors.green(`profile${req.url}/${e}.json`));
						fs.readFile(`profile${req.url}/links`, function(err, data) {
					    	if(!err){
					    		
					    		res.writeHead(200,{'Link':[data.toString('utf8')]});
					    		fs.readFile(`profile${req.url}/${e}.json`,function(err,data){
									console.log(colors.green(`profile${req.url}/${e}.json`));
						    		flag=false;
									res.write(data);
					    			res.end();
					    		});

							}else{ 
								fs.readFile(`profile${req.url}/${e}.json`,function(err,data){
									if(!err){
										console.log(colors.green(`profile${req.url}/${e}.json`));
							    		flag=false;
										res.write(data);
						    			res.end();
									}else{
										res.write("false");
										res.end();
									}
					    		});
							}
						});
						count--;
					}
					if((str=("/"+e+"/subscription"))==req.url.substring(0,str.length)){
						
						console.log(colors.green(`profile${req.url}/${e}.json`));
						fs.readFile(`profile${req.url}/links`, function(err, data) {
					    	if(!err){
					    		
					    		res.writeHead(200,{'Link':[data.toString('utf8')]});
					    		fs.readFile(`profile${req.url}/${e}.json`,function(err,data){
									// console.log(`profile${req.url}/${e}.json`);
						    		flag=false;
									res.write(data);
					    			res.end();
					    		});

							}else{ 
								fs.readFile(`profile${req.url}/${e}.json`,function(err,data){
									if(!err){
										// console.log(colors.green(`profile${req.url}/${e}.json`));
										flag=false;
										if(Array.isArray(JSON.parse(data))){
										
											res.write(data);
											res.end();
										
										}else{

											res.writeHead(101,[]);
											res.end();
										}
						    			
									}else{
										res.write("false");
										res.end();
									}
					    		});
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
				
		}else if(req.method == 'PUT'){
			let content="";
			let uri=decode(req.url);
			req.on('data', function (chunk) {
				content += chunk.toString('utf8');
  			});
  			req.on('end', function () {

  				let count=0;
				let str;

				content = decode(content);
				console.log(colors.green('%s'),decode(content));

				Service.forEach(function(e){
					if(uri == '/'){
						res.writeHead(204,[]);
							res.end();
							count--;
					}
					if(uri.substring(1,e.length+1)== e){
						if((str=("/"+e+"/properties"))==req.url.substring(0,str.length)){
							res.writeHead(204,[]);
							res.end();
							count--;
						}
						if((str=("/"+e+"/actions"))==req.url.substring(0,str.length)){
							res.writeHead(204,[]);
							res.end();
							count--;
						}
					}
					count++;
				});
				if(count==Service.length){
					res.write("false");
					res.end();
				}
			});
		}else if(req.method == 'POST'){
			let content="";
			let uri=decode(req.url);
			req.on('data', function (chunk) {
				content += chunk.toString('utf8');
  			});
  			req.on('end', function () {

  				let count=0;
				let str;

				content = decode(content);
				console.log(colors.green('%s'),decode(content));

				Service.forEach(function(e){
					if(uri == '/'){
						res.writeHead(204,[]);
							res.end();
							count--;
					}
					if(uri.substring(1,e.length+1)== e){
						if((str=("/"+e+"/actions"))==req.url.substring(0,str.length)){
							// console.log(`str = ${str}`);
							console.log(colors.green('%s'),str);
							try{
								let queryData=decode(content);
								queryData=queryData.split('=');
								queryData=JSON.parse(queryData[1]);

								fs.readFile(`profile${decode(req.url)}/${queryData.id}/${e}.json`,'utf8',function(err,data){
									if(!err){
										let action=JSON.parse(data);
										if(action.id==queryData.id){
											let url=decode(req.url);
											let floder=url.split('actions/');
											let idOfValue=new Map();
											idOfValue.set(action.id,undefined);
											if(demoActions(e,`${floder[1]}/${queryData.id}`,idOfValue,queryData.value) == 0){
												res.writeHead(204,[]);
												res.end();
											}else {
												res.writeHead(201,[]);
												res.end();
											}
										}
									}	
								});
							}catch(e){
								console.log(`err = ${e}`);
								res.writeHead(201,[]);
								res.end();
							}
							
							count--;
						}
					}
					count++;
				});
				if(count==Service.length){
					res.write("false");
					res.end();
				}
			});
		}
	}).listen(port);
	createWebsocketServer(httpServer);

}

function init(name ,floder){

	fs.mkdir('profile/'+name,function(err){
		floder.forEach(function(e){
			fs.mkdir('profile/'+name+'/'+e,function(err){
				
			});
		});
	});
}

function initWTM(id,createdAt, updateAt, name,description , tags , customFields,links) {

	function generateLink(name){
		return str='Link:<'+name+'/>; rel="'+name+'"\n';
	}

	let Links="";
	let profile={};
	let model={};
	let floder=['model','properties','actions','things','subscription','type','product','help','ui','custom'];
	fs.mkdir('profile',function(err){		
	
	});

	init(name,floder);//generate the floder

	profile.id=id;
	profile.name=name;
	profile.description=description;
	profile.createdAt=createdAt;
	profile.updateAt=updateAt;
	profile.tags=tags;
	profile.customFields=customFields;
	
	floder.forEach(function(e){
		Links+=generateLink(e);
	});

	fs.writeFile(`profile/${name}/links`,Links, function (err) {
  		if (!err)
  			console.log(colors.yellow(`WT(${name}) root links saved`));
	});
	fs.writeFile('profile/'+name+'/'+name+".json",JSON.stringify(profile), function (err) {
  		if (!err)
  			console.log(colors.yellow(`WT(${name}) root json saved`));
	});

	return JSON.stringify(profile);
}
function generateWTMofVal(serviceName,floder,content){
	
	fs.mkdir('profile/'+serviceName+'/'+floder+'/',function(err){
		fs.writeFile('profile/'+serviceName+'/'+floder+'/'+serviceName+".json",JSON.stringify(content), function (err) {
	 		if (!err)
	  			console.log(colors.yellow('WTM val is saved!'));
		});
	});
}
function gpsSensor(){

	let temperature=Math.floor((Math.random() * 20) + 1);

}

function temperatureSensor(serviceName,id,name){
	
	let dt = datetime.create();
	let obj={};
	obj.id=id;
	obj.name;
	obj.values={values:Math.floor((Math.random() * 20) + 1),timestamp:dt.format('Y-m-d H:M:S')};
	console.log(obj);
	generateWTMofVal(serviceName,'properties/'+id,obj);
}



function generateWTM(serviceName,domain){

	const dirTree=require('directory-tree');
	let properties=[];
	let propertiesContent=[];
	let actions=[];
	let actionSet=new Set();
	let actionsContent=[];
	let things=[];
	let thingsContent=[];
	let subscriptions=[];
	let subscriptionsContent=[];

	
	const tree = dirTree('profile/'+serviceName,{ extensions: /.json$/ },function(path,item){

		let str=path.path.split('/');
		
		if(str.length > 4){
			switch (str[2]){
				case 'properties':
					properties.push(path.path);
				break;

				case 'actions':
					if(str.length >5){
						actions.push(path.path);
						actionSet.add(str[3]);
					}
				break;

				case 'things':
					things.push(path.path);
				break;

				case 'subscription':
						subscriptions.push(path.path);
				break;

			}
		}
	});

	if(properties.length >0){
		for(let i=0; i<properties.length ; i++){

			fs.readFile(properties[i],'utf8',function(err,data){
				if(!err){
					try{
						propertiesContent.push(JSON.parse(data));
						if(propertiesContent.length == properties.length){
							let link=`Link:<http://${domain}/${serviceName}/properties/>; rel="type"`;
							if(domain !== undefined){
								fs.writeFile(`profile/${serviceName}/properties/links`,link, function (err) {
									if (!err)
										console.log(colors.yellow('WTM properties link val is saved!'));
								});
							}
							fs.writeFile('profile/'+serviceName+'/properties/'+serviceName+".json",JSON.stringify(propertiesContent), function (err) {
						 		if (!err)
						  			console.log(colors.yellow('WTM properties val is saved!'));
							});
						}
					}catch(e){
						console.log(e);
					}
				}
			});
		}	
	}
	if(actions.length>0){

		actionSet.forEach(function(classification){
			let arr=[];
			let count=0;
			let promise=new Promise(function(resolve,reject){
				actions.forEach(function(e){
					let str=e.split('/');
					if(str[3]==classification){
						arr.push(e);
					}
					if(++count==actions.length){
						let dataArry=[];
						let subcount=0;
						arr.forEach(function(path){
							fs.readFile(path,'utf8',function(err,data){
								dataArry.push(data);
								if(++subcount==arr.length){
									let promise=new Promise(function(resolve1,reject1){
										// console.log(dataArry);
										let subpath=path.split('/');
										fs.writeFile(`${subpath[0]}/${subpath[1]}/${subpath[2]}/${subpath[3]}/${serviceName}.json`,dataArry,function(err){
											if(!err){
												console.log(colors.yellow(`WTM actions folder is update (${subpath[3]})`));
												resolve1(0)
												resolve(0);
											}
										});
									});
									promise.then((f,r)=>{
										console.log(dataArry);
									});
								}
							});
						});
					}
				});
			});
			promise.then(function(full,rej){
				console.log("--------------------------------------");
			});	
		});
	}

	if(subscriptions.length>0){

		let arr=[];
		let count=0;
		subscriptions.forEach(function(subscription){
			let promise=new Promise(function(resolve,reject){
				console.log("test subscription= "+subscription);
				fs.readFile(subscription,'utf8',function(err,data){
					if(!err){
						arr.push(JSON.parse(data));
					}
					if(++count == subscriptions.length){
						fs.writeFile(`profile/${serviceName}/subscription/${serviceName}.json`,JSON.stringify(arr),function(err){
							if(!err)
								console.log(colors.yellow(`profile/${serviceName}/subscription/${serviceName}.json`));
						});
					}
				});
				resolve(0);
			});
			promise.then(function(full){
				console.log("####################################");
			});
		});
	}
	function model(serviceName,domain,properties,actions,subscription,things){
		
		let map=new Map();
		function generateResource(serviceName,arrResource,type){
			
			let promise=new Promise(function(resolve,reject){
				let resource=[];
				let actionResouce=new Set();
				let count=0;
				let length=arrResource.length;
				arrResource.forEach(function(e){
					
						fs.readFile(e,'utf8',function(err,data){
							let str="";
							if(!err){
								if(type == "properties"){
									let obj=JSON.parse(data);
									if(obj.values!=undefined)
										str=`"${obj.id}":{"name":"${obj.id}","description":"none","values":${JSON.stringify(obj.values)}}`;
									else
										str=`"${obj.id}":{"name":"${obj.id}","description":"none","value":${JSON.stringify(obj.value)}}`;

									resource.push(str);

								}
								if(type == "actions"){
									actionResouce.add(data);
								}				
							}
							if(++count == arrResource.length){
								if(type != "actions")
									resolve(resource);
								else{
									let str="";
									let count2=0;
									actionResouce.forEach(function(e){
										let obj=JSON.parse(e);
										str=`"${obj.id}":{"name":"${obj.id}","description":"none","value":${JSON.stringify(obj.value)}}`;
										resource.push(str);
									});
									resolve(resource);

								}
							}
						});
					

				});
			});
			// return promise;
			promise.then(function(full){
					map.set(type,full);
					return full;
			});
		}

		let promiseMode=new Promise(function(resolve,reject){


			generateResource(serviceName,properties,"properties");

			generateResource(serviceName,actions,"actions");
			setTimeout(function(){
				resolve(0)
			},100);
		});
		promiseMode.then(function(full){

			let obj={};
			obj.id=serviceName;
			obj.description="";
			obj.tags=[];
			obj.customField={};
			obj.customField.domain=domain;
			obj.links={};
			obj.links.properties={};
			obj.links.properties.links="/properties";
			obj.links.properties.title="List of Properties";
			obj.links.properties.resource=JSON.parse(`{${map.get("properties")}}`);
			obj.links.actions={};
			obj.links.actions.links="/actions";
			obj.links.actions.title="List of actions";
			obj.links.actions.resource=JSON.parse(`{${map.get("actions")}}`);

			fs.writeFile(`profile/${serviceName}/model/${serviceName}.json`,JSON.stringify(obj),function(err){
				if(!err)
					console.log(colors.yellow(`profile/${serviceName}/model/${serviceName}.json is saved`));
			});
		})
	}
	model(serviceName,domain,properties,actions,subscriptions,things)
}
function discribeAction(serviceName,doamin,actions){

	let res=[];
	let actionDemo=new Map();
	let links=`Link:<http://${doamin}/${serviceName}/actions/>; rel="type"`;
	
	//This Map  be used to describe the reource of action field
	actionDemo.set("Demo1",undefined);

	actions.forEach(function(val,key){
		let obj={};
		obj.id=key;
		obj.name=val;
		res.push(obj);

		// To save the actions of description.
		demoActions(serviceName,key,actionDemo,"create");
	});
	fs.mkdir(`profile/${serviceName}/actions`,function(err){
		
		fs.writeFile(`profile/${serviceName}/actions/links`,links, function (err) {
			if (!err)
				console.log(colors.yellow('WTM actions link val is saved!'));
		});
		fs.writeFile('profile/'+serviceName+'/actions/'+serviceName+".json",JSON.stringify(res), function (err) {
			if (!err)
				console.log(colors.yellow('WTM actions val is saved!'));
		});

	});
	
	return JSON.stringify(res);

}

// the idOfValue are Map object type that map the id and the value in object 
function demoActions(serviceName,floder,idOfValue,cmd,flag){ 

	let dt = datetime.create();
	console.log(`floder = ${floder}  cmd = ${cmd}`);
	let arr=[];
	let properties=new Set();
	switch(cmd){
		case 'create':

			idOfValue.forEach(function(val,key){
				let obj={};
				obj.id=key;
				obj.value="none";
				obj.status="init";
				obj.timestamp=dt.format('Y-m-d H:M:S');
				arr.push(obj);
				properties.add(JSON.stringify(obj));
			});
			fs.mkdir(`profile/${serviceName}/actions/${floder}`,function(err){
				fs.writeFile(`profile/${serviceName}/actions/${floder}/${serviceName}.json`,JSON.stringify(arr),function(err){
					if (!err)
					  	console.log(colors.yellow(`WTM actions ${floder} val is saved!`));
				});
				arr.forEach(function(e){
					fs.mkdir(`profile/${serviceName}/actions/${floder}/${e.id}`,function(err){
						fs.writeFile(`profile/${serviceName}/actions/${floder}/${e.id}/${serviceName}.json`,JSON.stringify(e),function(err){
							if (!err)
							  	console.log(colors.yellow(`WTM actions ${floder}/${e.id}/${serviceName}.json val is saved!`));
						});
					});
				});
				properties.forEach(function(e){
					let data=JSON.parse(e);
					fs.mkdir(`profile/${serviceName}/properties/${data.id}`,function(err){
							fs.writeFile(`profile/${serviceName}/properties/${data.id}/${serviceName}.json`,e,function(err){
								if (!err)
								  	console.log(colors.yellow(`WTM properties ${data.id}/${serviceName}.json val is saved!`));
							});
					});
				});
			});
			return 0;
		break;

		case 'start':
			console.log("into Damo actions");
			idOfValue.forEach(function(val,key){
				let obj={};
				obj.id=key;
				obj.value="start";
				obj.status="executing";
				obj.timestamp=dt.format('Y-m-d H:M:S');
				let path=floder.split('/');
				fs.writeFile(`profile/${serviceName}/actions/${floder}/${serviceName}.json`,JSON.stringify(obj),function(err){
					if (!err){
					  	console.log(colors.yellow(`WTM actions actions/${floder}/${serviceName}.json val is updated`));
					}
				});
				fs.writeFile(`profile/${serviceName}/properties/${path[1]}/${serviceName}.json`,JSON.stringify(obj),function(err){
					if (!err){
					  	console.log(colors.yellow(`WTM properties /${path[1]}/${serviceName}.json val is updated`));
					  	generateWTM(serviceName,undefined);
					}
				});
			});
			return 0;
		break;

		default : 
			return 1;
	}
}
function subscribeComponet(serviceName,componets){
	componets.forEach(function(componet){

		let promise=new Promise(function(resolve,reject){
			
			fs.mkdir(`profile/${serviceName}/subscription/${componet.id}`,function(err){
				fs.writeFile(`profile/${serviceName}/subscription/${componet.id}/${serviceName}.json`,JSON.stringify(componet),function(err){
					if(!err)
						resolve(`Subscription Component = profile/${serviceName}/subscription/${componet.id}/${serviceName}.json`);
				});
			});
		});
		promise.then(function(full){
			console.log(full);
			console.log(componet);
		})

	});
}

function main(){
	
	let Service= new Map();
	let txt=new Map();
	let domain="testdomain";

	const Instance="Percomlab";
	let serviceName=['testResource1','testResource2']
	Service.set(serviceName[0],8080);
	Service.set(serviceName[1],8080);
	
	/*
		set up txt packet, it use ';' to split the string.
		Note : txt.set(Service name,TXT descriptions)
	*/
	txt.set(serviceName[0],"profile=/"+serviceName[0]+";info=testmulti-values;test=test");
	txt.set(serviceName[1],"profile=/"+serviceName[1]);
	

	serverStart(Instance,Service,txt,domain,120); //serverStart(Instance,Service,txt,domain,ttl)
	createServer([serviceName[0],serviceName[1]],8080);// createServer(service,port)

	/*
		"function properties(link,title)" used to create the initial Link will be used it in which server reply it when client query {WT} . 
	*/
	function properties(link,title){
		let obj={};
		obj.link=link;
		obj.title=title;
		return obj;
	}

	let customField={};
	let customField2={};

	customField.sensor="GPS ensor";
	customField.type="1568-1703-ND";

	customField2.sensor="Temperature sensor";
	customField2.type="DH11";
		
	initWTM(0,"2018-09-06","2018-09-07",serviceName[0],"This is experiment device 1",[{tag:"0"}],customField,gererateLinks(properties("properties/","properties"), properties("action/","actions of this web things"),properties("product/","NULL"), properties("type/","NULL") ,properties("help/","NULL"),properties("ui/","NULL"),properties("custom/","NULL")));		
	initWTM(1,"2018-09-06","2018-09-07",serviceName[1],"this is experiment device 2",[{tag:"1"}],customField2,gererateLinks(properties("properties/","properties"), properties("action/","actions of this web things"),properties("product/","NULL"), properties("type/","NULL") ,properties("help/","NULL"),properties("ui/","NULL"),properties("custom/","NULL")));
	
	// function temperatureSensor(serviceName,id,name)
	setTimeout(()=>{temperatureSensor(serviceName[1],"temperature","DEMO 1")},100);

	let actions=new Map();
	actions.set("Demo_actions_start","the resource start");
	actions.set("Demo_actions_restart","the resource restart");

	// discribeAction(serviceName,doamin,actions)
	// discribeAction(serviceName[1],`${domain}.local:8080`,actions);
	setTimeout(()=>{discribeAction(serviceName[1],`${domain}.local:8080`,actions)},100);

	let websocket={};
	websocket.id="DEMO_Temperature_WebSocket";
	websocket.subscribeId="test1";
	websocket.type="websocket";
	websocket.resource="properties/temperature";


	let componetsArr=[];
	componetsArr.push(websocket);

	setTimeout(()=>{subscribeComponet(serviceName[1],componetsArr)},500);
	
	setTimeout(()=>{generateWTM(serviceName[1],`${domain}.local:8080`)},1000);
}

main();