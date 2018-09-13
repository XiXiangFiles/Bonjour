const mdns=require('multicast-dns')();
const spawn = require('threads').spawn;
const http= require('http');
const request=require('request');
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
		}if(e.tpye=='TXT'){
			let txt=[];
			e.data.forEach(function(e){
				txt.push(Buffer.from(e,'utf8'));
			});		
			obj.TXT=e;
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

	setInterval(function(){
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
