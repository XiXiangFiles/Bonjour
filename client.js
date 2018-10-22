const mdns=require('multicast-dns')();
const spawn = require('threads').spawn;
const http= require('http');
const request=require('request');
const decode = require('urldecode');
const fs=require('fs');
const WebSocketServer = require('websocket').server;
const WebSocketClient = require('websocket').client;
var threadStack=new Map();;

function queryObj(name,type){
	obj={};
	obj.name=name;
	obj.type=type;
	return obj;
}

function query(name,type){
	let questions=[];
	if(typeof(name)==="string" && typeof(type)==="string"){

		questions.push(queryObj(name,type));

	}
	if(typeof(name)==="object" && typeof(type)==="object"){
		for(let i=0 ; i< name.length ; i++)
			questions.push(queryObj(name[i],type[i]));
	}
	if(questions.length >0){
		mdns.query({
			questions:questions
		});
	}
	
}

function parseSRVTXT(packet){
	
	let obj={};

	packet.answers.forEach(function(e){
		if(e.type=='PTR'&& e.name!=="_services._dns-sd._udp.local" ){
			let str=e.data;

			str=str.split('.');
			obj.instance=str[0];
			obj.service="";
			for(let i=1 ; i <str.length-1 ; i++){
				if(i != str.length -1 )
					obj.service+=str[i]+'.';
				else 
					obj.service+=str[i];
			}
		}
		else if(e.type=='SRV'){

			obj.ttl=e.ttl;
			obj.SRV=e.data;
			obj.domain=e.data.target;
		
		}else if(e.type=='TXT'){
			let txt=[];
			e.data.forEach(function(e2){
				txt.push(e2.toString('ascii'));
				//console.log(e2.toString('ascii'))
			});		
			obj.TXT=txt;

		}else if(e.type=='A')
			obj.ipv4=e.data;
		else if (e.type=='AAAA')
			obj.ipv6=e.data;
		
	});
	if(obj.SRV===undefined){
		packet.additionals.forEach(function(e){
	
			if(e.type=='SRV'){
				obj.ttl=e.ttl;
				obj.SRV=e.data;
				obj.domain=e.data.target;
			}
		});
	}
	if(obj.TXT === undefined){
		
		let txt=[];
		packet.additionals.forEach(function(e){
			
			if(e.type=='TXT'){
				e.data.forEach(function(e){

					txt.push(e.toString('ascii'));

				});
			}
			
		});
		obj.TXT=txt;
	}
	return JSON.stringify(obj);
}

function createWebsocketServer(server){
	
	wsServer = new WebSocketServer({
	    httpServer: server,
	    autoAcceptConnections: false
	});
	
	function originIsAllowed(origin,resource) {
	  // put logic here to detect whether the specified origin is allowed.
	 	console.log(`origin = ${origin}   resource=${resource}`);

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
	        	let clientData=JSON.parse(message.utf8Data);
	        	console.log(`message.utf8Data= ${message.utf8Data}`);
	            let client = new WebSocketClient();
	            client.on('connectFailed',function(err){
	            	console.log('Connect Error: ' + err.toString());
	            });
	            client.on('connect',function(connMDNS){
	            	connection.on('error', function(err) {
        				console.log("Connection Error: " + err.toString());
    				});
    				connMDNS.on('message', function(mDnsmsg) {
				        if (mDnsmsg.type === 'utf8') {
				            console.log("mDnsmsg Received: '" + mDnsmsg.utf8Data + "'");
				            connection.sendUTF(mDnsmsg.utf8Data);
				        }
				    });
				    connMDNS.sendUTF(message.utf8Data);
	            });
	            client.connect(`ws://${clientData.domain}:${clientData.port}/${clientData.data}`, 'echo-protocol');
	           	console.log(`ws://${clientData.domain}:${clientData.port}/${clientData.data}`);
	        }
	    });
	    connection.on('close', function(reasonCode, description) {
	        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	    });
	});
}

function main(){
	
	let allService=new Set();
	let mdnsService=new Set();
	let check=new Set();
	let temp=new Set();
	
	mdns.on('response',function(res){
		res.answers.forEach(function(e){
			if(e.type=='PTR' && e.name=="_services._dns-sd._udp.local"){

				allService.add(e.data);	
				if(allService.has(e.data)){
					query(e.data,'PTR');
					
				}
			}else{
				//console.log(res);
				let data=parseSRVTXT(res);
				
				mdnsService.forEach(function(e){
					let check=JSON.parse(e);
					let temp=JSON.parse(data);
					if(check.service==temp.service){
						mdnsService.delete(e);
					}
				});
				
				mdnsService.add(data);
				let dnssd=JSON.parse(data);
				
				if(mdnsService.has(data)&& dnssd.ttl !==undefined && check.has(data) === false){
					
					const thread = spawn(function(input, done){

						try{
							setTimeout(function(){
								done(input);
							},input.ttl*1000);
						}catch(e){
							console.log("child process error: "+e);	
						}
					});
					
					thread.send(dnssd).on('message',function(res){

						check.delete(JSON.stringify(res));
						temp.add(JSON.stringify(res));
						
						console.log("Resend query"+ res.service+"local");
						query([res.service+"local", res.instance+"."+res.service+"local", res.instance+"."+res.service+"local"],['PTR','SRV','TXT']);	
						
						thread.kill();

					}).on('exit',function(){
			
						console.log("call exit");

						setTimeout(function(){
							
							try{
								temp.forEach(function(e){
									if(check.has(e)===false){	
										console.log("delete\t "+ e );
										mdnsService.delete(e);	
																		}
								});
								temp.clear();
							}catch(error){
								console.log("temp error: "+ error);
							}
						},3000);
					});
					check.add(data);

				}
			}
		});
	});
	query("_services._dns-sd._udp.local","PTR");
	
	let server=http.createServer(function(req,res){

		function istype(type){
			if(type == 'html' || type == 'css' || type== 'png' || type== 'ico'|| type=='js')
				return true;
			else 
				return false;
		}
		if(req.method == 'GET' && req.url.substring(1,6)!='query'){
			
			let files;
			files=req.url.split('.');
			
			if(req.url=="/"){
				let txt=fs.readFile("floder/index.html",'utf-8',function(err,data){
					if(err){
						res.writeHead(404,{'Content-Type': 'text/html'});
					}else{
						res.writeHead(200,{'Content-Type': 'text/html'});
						res.write(data);
					}
				
						res.end();
				});
			}
			if(req.url.substring(0,12)=="/getServices"){
				let arr=[];
				mdnsService.forEach(function(e){
					arr.push(e);
					//console.log(e);
				});
				arr.sort((x,y)=>{x.length-y.length});
				res.write(arr.toString());
				res.end();
			}
			if(req.url.substring(0,8)=="/profile"){
				let file=req.url.split('?');
				fs.readFile("floder"+file[0],function(err,data){
					if(!err){
						res.write(data);	
					}else{
						console.log("failed to access "+ "floder"+req.url);
					}
					res.end();
				});

			}
			if(req.url.substring(0,11)=="/getProfile"){
				let data=req.url.split('?');
				if(data.length != 2 ){
					res.write("false");
					res.end();
				}else {
					let uri=data[1].split("&");
					if(uri.length<3){
						res.write("false");
						res.end();
					}else{

						let domain,port,profile;

						uri.forEach(function(e){
							let str=e.split('=');	
							switch(str[0]){
								case 'domain':
									domain=str[1];
									break;
								case 'port':
									port=str[1]
									break;
								case 'profile':
									profile=str[1];
									break;
							}
						});

						let finaluri="http://"+domain+":"+port+profile;
						//console.log(finaluri);

						request.get(finaluri).on('response',function(response){
							response.on('data',function(data){
								
								let count=0;
								let arr=[];
								let obj={};
								let content=data.toString('utf-8');
								let flag=false;
								let links=response.headers.link.split(',');
								links.pop();

								obj.query=finaluri;
								obj.service={domain:domain,port:port};
								obj.raw=content;
								obj.profile=JSON.parse(content);
								obj.links=links;
								res.write(JSON.stringify(obj));
								res.end();
							});
						});
					
					}
				}
			}

			if(istype(files[files.length-1])){
				fs.readFile("floder"+req.url,function(err,data){
					if(!err){
						res.write(data);	
					}else{
						console.log("failed to access "+ "floder"+req.url);
					}
					res.end();
				});	
			}			
		}
		if(req.url.substring(1,6)=='query'){
			if(req.url==='/query'){
				let content="";
				if(req.method =='PUT'){
					// console.log(req.url);
					// console.log(req.method);
					req.on('data', function (chunk) {
    					content += chunk.toString('utf8');

  					});
					req.on('end', function () {

						let data = new Map();
						let keyVal=content.split('&');
						let domain,port,name,url,finaluri,queryData;
						content = decode(content);

						keyVal.forEach(function(e){
							let dekeyVal=e.split('=');
							data.set(dekeyVal[0],dekeyVal[1]);
						});

						for(let [key , val] of data){
							if (key == "domain")
								domain=val;
							else if( key == "port")
								port=val;
							else if(key == "type"){
								url=val;
							}else if(key == 'name'){
								name=val;
							}else if(key == 'data')
								queryData=val;
						}
				
						finaluri=`http://${domain}:${port}/${name}/${url}`;
						finaluri=decode(finaluri);

						console.log(`finaluri=${finaluri}`);
						console.log(`data=${content}`);
						request.put({url:finaluri, form: {data:queryData}}, function(err,httpResponse,body){ /* ... */ 
							if(httpResponse.statusCode == 204 ){
								let data={};
								data.profile=`statusCode:204`;
								res.write(JSON.stringify(data));
								res.end();
							}
							
						});
						
					});
				
				}else if(req.method == 'POST'){
					req.on('data', function (chunk) {
    					content += chunk.toString('utf8');
  					});
  					req.on('end',function(){
  						let data = new Map();
						let keyVal=content.split('&');
						let domain,port,name,url,finaluri,queryData;
						content = decode(content);

						keyVal.forEach(function(e){
							let dekeyVal=e.split('=');
							data.set(dekeyVal[0],dekeyVal[1]);
						});

						for(let [key , val] of data){
							if (key == "domain")
								domain=val;
							else if( key == "port")
								port=val;
							else if(key == "type"){
								url=val;
							}else if(key == 'name'){
								name=val;
							}else if(key == 'data')
								queryData=val;
						}
				
						finaluri=`http://${domain}:${port}/${name}/${url}`;
						finaluri=decode(finaluri);

						console.log(`finaluri=${finaluri}`);
						console.log(`data=${queryData}`);
						request.post({url:finaluri, form: {data:queryData}}, function(err,httpResponse,body){ 
							if(!err){
								if(httpResponse.statusCode == 204 ){
									let data={};
									data.profile=`statusCode:204`;
									res.write(JSON.stringify(data));
									res.end();
								}
								if(httpResponse.statusCode == 201 ){
									let data={};
									data.profile=`statusCode:201`;
									res.write(JSON.stringify(data));
									res.end();
								}
							}else{
								res.writeHead('404',[]);
								res.write("Can't find this page");
								res.end();
							}	
						});
  					});
				}

			}else{
				
				let str=req.url;
				let deurl=str.split('?');
				let data = new Map();
				let keyVal=deurl[1].split('&');
				let domain,port,name,resource,url,finaluri;

				keyVal.forEach(function(e){
					let dekeyVal=e.split('=');
					data.set(dekeyVal[0],dekeyVal[1]);
				});
				for(let [key , val] of data){
					if (key == "domain")
						domain=val;
					else if( key == "port")
						port=val;
					else if(key == "type"){
						url=val;
					}else if(key == 'name'){
						name=val;
					}if(key == 'data')
						resource=val;
				}
				
				finaluri="http://"+domain+":"+port+"/"+name+'/'+url;
				finaluri=decode(finaluri);

				console.log(finaluri);

				if(req.method=='GET'){
					let obj={};
					obj.query=finaluri;
					obj.service={domain:domain,port:port};
					

					request.get(finaluri).on('response',function(response){
						
						response.on('error',function(err){
							res.write("false");
							res.end();		
						});

						console.log(`response.statusCode=${response.statusCode}`);

						if(response.statusCode == 101){

							obj.profile=`statusCode=${response.statusCode}`;
							res.write(JSON.stringify(obj));
							res.end();
						}
						response.on('data',function(data){

							obj.profile=JSON.parse(data.toString('utf8'));
							obj.links=response.headers.link;
							
							console.log(data);

							if(response.statusCode != 101 ){
								res.write(JSON.stringify(obj));
								res.end();
							}	
							console.log(obj);

						});
					});

				}else  if(req.method == 'DELETE'){
					res.write("DELETE");
					res.end();

				}
				
			}
		}
	}).listen(3001);
	createWebsocketServer(server);
}
main();
//module.exports
