const mdns=require('multicast-dns')();
const spawn = require('threads').spawn;

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
//	console.log(packet.answers);
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
					//console.log("~~~"+JSON.stringify(e));
					query(e.data,'PTR');
					
				}
			}else{
				let data=parseSRVTXT(res);
				mdnsService.add(data);
				let dnssd=JSON.parse(data);
				//console.log(data);
				if(mdnsService.has(data)&& dnssd.ttl !==undefined && check.has(data) === false){
					
					
					const thread = spawn(function(input, done){

						try{
							let i=0;
							//console.log(input);
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
	//query(["_test1._udp.local", "Percomlab._test1._udp.local","Percomlab._test1._udp.local" ],["PTR","SRV","TXT"] );
		
}

main();
