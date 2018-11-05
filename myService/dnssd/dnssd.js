
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
module.exports=dnssd;