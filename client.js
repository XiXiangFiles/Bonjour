const mdns=require('multicast-dns')();
const spawn = require('threads').spawn;
const http= require('http');
const request=require('request');
const fs=require('fs');

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
			
		})		
		obj.TXT=txt;

	}
	return JSON.stringify(obj);

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
	
	http.createServer(function(req,res){
		function istype(type){
			if(type == 'html' || type == 'css' || type== 'png' || type== 'ico'|| type=='js')
				return true;
			else 
				return false;
		}
		if(req.method == 'GET'){
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
				arr.sort((x,y)=>{x-y});
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
						
						request.get(finaluri).on('response',function(response){
							response.on('data',function(data){
								let obj={};
								obj.query=finaluri;
								obj.profile=JSON.parse(data.toString('utf-8'));
								//console.log(data.toString('utf-8'));
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
		

	}).listen(3001);

	setInterval(function(){
		//mDNSservice=mdsnService;
		//console.log(mdnsService.size);
	/*	
		mdnsService.forEach(function(e){
			let element = JSON.parse(e);
			if(element.instance=="Percomlab"){
				if(element.TXT.length != 0 ){
					let profile=element.TXT[0].split('=');
					let url='http://'+element.domain+":"+element.SRV.port+profile[1];
					console.log("url=\t"+url);
					
					let option={
						hostname:element.domain,
						port:element.SRV.port,
						path:'/'+profile[1],
						method:'GET'
					};

					request(url,function(err,res,body){
						console.log(body);
					});
					
				}
				

			}
		});
	*/	
	},1000);
}
main();
//module.exports
