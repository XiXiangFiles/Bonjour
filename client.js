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
	packet.answers.forEach(function(e){
		if(e.type=='PTR'){
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
			obj.txt=e;
		}else if(e.type=='A')
			obj.ipv4=e.data;
		else if (e.type=='AAAA')
			obj.ipv6=e.data;
		
	});

	//console.log(obj);
	return JSON.stringify(obj);
}

function main(){
	let allService=new Set();
	let mdnsService=new Set();
	let check=new Set();
	
	mdns.on('response',function(res){
		res.answers.forEach(function(e){
			if(e.type=='PTR' && e.name=="_services._dns-sd._udp.local"){

				allService.add(e.data);	
				if(allService.has(e.data)){
					query([e.data,e.data,e.data],['PTR','SRV','TXT']);
				}
			}else{
				let data=parseSRVTXT(res);
				mdnsService.add(data);
				let dnssd=JSON.parse(data);
				
				if(mdnsService.has(data)&& dnssd.ttl !==undefined && check.has(data) === false){
					thread.send(dnssd);
					check.add(data);
					console.log(check.has(data));
				}
			}
		});
	});
	query("_services._dns-sd._udp.local","PTR");
	const thread = spawn(function(input, done){
	
		try{
			let i=0;
			console.log(input);
			setInterval(function(){
				console.log(i++);	
			},1000);
			if(i>input.ttl){
				query([input.service, input.service, input.service ],['PTR','SRV','TXT']);
				check.delete(JSON.stringify(input));
			}
			
			
		}catch(e){
		
		}
	});	
}

main();
