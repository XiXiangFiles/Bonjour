const mdns=require('multicast-dns')();

function queryObj(name,type){
	obj={};
	obj.name=name;
	obj.type=type;
	return obj;
}
function query(name,type){
	questions=[];
	if(typeof(name)=="string" && typeof(type)=="string"){

		questions.push(queryObj(name,type));

	}
	if(typeof(name)=="object" && typeof(type)=="object"){
		for(let i=0 ; i< name.length ; i++)
			questions.push(queryObj(name[i],type[i]));
	}
	if(questions!=undefined){
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
	return obj;
}

function main(){
	let allService=new Set();
	let serviceTTL=new Map();
	let mdnsService=new Set();
	mdns.on('response',function(res){
		res.answers.forEach(function(e){
			if(e.type=='PTR' && e.name=="_services._dns-sd._udp.local"){

				allService.add(e.data);	
			
			}else{
				mdnsService.add(parseSRVTXT(res));			
			}
		});
	});
	query("_services._dns-sd._udp.local","PTR");

	setTimeout(function(){
		allService.forEach(function(service){
			query([service,service,service],['PTR','SRV','TXT']);
		});
	},1000);
	
	setInterval(function(){
		let update=new Set();
		
		mdnsService.forEach(function(e){
			
			if(e.ttl != undefined ){
				
				console.log(e.instance+"\t"+e.ttl);
				let obj=e;
				obj.ttl--;
				if(obj.obj > 0){
					update.add(obj);			
				}else{
					query([obj.service+"local",obj.service+"local",obj.service+"local"],['PTR','SRV','TXT']);
				}	
			}

		});
		mdnsService.clear();
		mdnsService=update;

	},1000);
	
}

main();
