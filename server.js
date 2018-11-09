const http=require('http');
const fs=require('fs');
const datetime=require('node-datetime');
const decode = require('urldecode');
const WebSocketServer = require('websocket').server;
const WebSocketClient = require('websocket').client;
const colors = require('colors');
const lottery = require ('./sensor/lottery');
const sensor = require('./sensor/temperature.js');
const bonjour=require('./myService/bonjour.js');
const wtm= require('./wtm/wtm.js');

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
					    		res.writeHead(200,[]);
								res.write(data);
				    			res.end();
							}else{ 
								res.writeHead(204,[]);
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
							    		res.writeHead(200,[]);
										res.write(data);
						    			res.end();
									}else{
										res.writeHead(204,[]);
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
							    		res.writeHead(200,[]);
										res.write(data);
						    			res.end();
									}else{
										res.writeHead(204,[]);
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
											res.writeHead(200,[]);
											res.write(data);
											res.end();
										
										}else{

											res.writeHead(101,[]);
											res.end();
										}
						    			
									}else{
										res.writeHead(204,[]);
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
					res.writeHead(204,[]);
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
					res.writeHead(204,[]);
					res.write("false");
					res.end();
				}
			});
		}
	}).listen(port);
	createWebsocketServer(httpServer);

}


function temperatureSensor(serviceName,id,name){

		let promise=new Promise(function(resolve,reject){
				
			sensor.on('data',function(e){
				console.log(colors.red('%s'),e)
				let data=JSON.parse(e);
				let dt = datetime.create();
				let link=`<model/>; rel="model"`
				let obj={};
				obj.id=id;
				obj.name;
				obj.values={};
				obj.values.timestamp=data.timestamp;
				obj.values.temperature=data.temperature;
				obj.values.humidity=data.humidity;
				wtm.generateWTMofVal(serviceName,'properties/'+id,obj);
				wtm.generateWTMLink(serviceName,`properties/${id}`,link);
				resolve(`%{JSON.stringify(obj)}<;>${link}`);
			});
		}).then(function(full,reject){

		});
//	obj.values={values:Math.floor((Math.random() * 20) + 1),timestamp:dt.format('Y-m-d H:M:S')};
}


async function discribeAction(serviceName,doamin,actions){

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

	wtm.generateWTMLink(serviceName,`actions/`,links);
	wtm.generateWTMofVal(serviceName,`actions/`,res);

	return JSON.stringify(res);

}

// the idOfValue are Map object type that map the id and the value in object 
async function demoActions(serviceName,floder,idOfValue,cmd,flag){ 

	let dt = datetime.create();
	console.log(`floder = ${floder}  cmd = ${cmd}`);
	let arr=[];
	let properties=new Set();
	lottery.listen();
	let deviceLog="";
	lottery.on('data',function(e){
		deviceLog+=e;
		if(deviceLog.includes('close')){
			demoActions(serviceName,floder,idOfValue,"stop");
			deviceLog="";
		}

	});

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
				
				wtm.generateWTMofVal(serviceName,`actions/${floder}`,arr);
			
				arr.forEach(function(e){

					wtm.generateWTMofVal(serviceName,`actions/${floder}/${e.id}`,e);
					
				});
				properties.forEach(function(e){
					let data=JSON.parse(e);
					// generateWTMLink(serviceName,`properties/${id}`,link);
					let link=`<model/>; rel"model"`;
					wtm.generateWTMLink(serviceName,`properties/${data.id}`,link);
					wtm.generateWTMofVal(serviceName,`properties/${data.id}`,data);
					
				});
			});
			return 0;
		break;


		case 'ready':

			console.log("into Damo actions");
			idOfValue.forEach(function(val,key){
				let obj={};
				obj.id=key;
				obj.value="ready";
				obj.status="ready";
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
					  	wtm.generateWTM(serviceName,undefined);
					}
				});
				lottery.ready();
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
					  	wtm.generateWTM(serviceName,undefined);
					}
				});
				lottery.start();
			});
			return 0;
		break;
	
		case 'stop':
			console.log("into Damo actions");
			idOfValue.forEach(function(val,key){
				let obj={};
				obj.id=key;
				obj.value="stop";
				obj.status="stop";
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
					  	wtm.generateWTM(serviceName,undefined);
					}
				});
				
			});

			return 0;
		break;

		default : 
			return 1;
	}
}
async function subscribeComponet(serviceName,componets){
		let promise=new Promise(function(resolve,reject){
			componets.forEach(function(componet){
			fs.mkdir(`profile/${serviceName}/subscription/${componet.id}`,function(err){
				fs.writeFile(`profile/${serviceName}/subscription/${componet.id}/${serviceName}.json`,JSON.stringify(componet),function(err){
					if(!err)
						console.log(`Subscription Component = profile/${serviceName}/subscription/${componet.id}/${serviceName}.json`);
				});
			});
		});
		promise.then(function(full){
			console.log(full);
			console.log(componet);
		});
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
	
	bonjour.setup(Instance,Service,txt,domain,120);
	bonjour.start();
	bonjour.on('sendData',function(response){

	});
	// serverStart(Instance,Service,txt,domain,120); //serverStart(Instance,Service,txt,domain,ttl)
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
		
	wtm.initWTM(0,"2018-09-06","2018-09-07",serviceName[0],"This is experiment device 1",[{tag:"0"}],customField,gererateLinks(properties("properties/","properties"), properties("action/","actions of this web things"),properties("product/","NULL"), properties("type/","NULL") ,properties("help/","NULL"),properties("ui/","NULL"),properties("custom/","NULL"))).then(function(){
		wtm.initWTM(1,"2018-09-06","2018-09-07",serviceName[1],"this is experiment device 2",[{tag:"1"}],customField2,gererateLinks(properties("properties/","properties"), properties("action/","actions of this web things"),properties("product/","NULL"), properties("type/","NULL") ,properties("help/","NULL"),properties("ui/","NULL"),properties("custom/","NULL"))).then(function(){
			temperatureSensor(serviceName[1],"temperature","DEMO 1");
		}).then(function(){
			let actions=new Map();
			actions.set("Demo_lottery","the resource start");
			actions.set("Demo_actions_restart","the resource restart");
			discribeAction(serviceName[1],`${domain}.local:8080`,actions).then(function(){	
				let websocket={};
				let componetsArr=[];
				websocket.id="DEMO_Temperature_WebSocket";
				websocket.subscribeId="test1";
				websocket.type="websocket";
				websocket.resource="properties/temperature";
				componetsArr.push(websocket);
				subscribeComponet(serviceName[1],componetsArr).then(function(){
					
				setTimeout(()=>{
					wtm.generateWTM(serviceName[1],`${domain}.local:8080`);
				},1000);

				});
				
			});
		});
	});		
}

main();
