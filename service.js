//const bonjour=require('bonjour')();
const mdns=require('multicast-dns')();
const txt=require('dns-txt')();
//bonjour.publish({name: 'test123', type: '_Wong',port: 3000 });

mdns.on('query',function(query){
	//console.log(query);
//	let service="_PercomTest._udp.local";
//	let serviceInstance="PercomTest";
	mdns.respond({
		answers: [{
			name: '_test._udp.local', ttl: 10, type: 'PTR', data: 'test._test._udp.local'
		},{
			name: '_services._dns-sd._udp.local', ttl: 10, type: 'PTR', data: '_test._udp.local'
		}],
		additionals:[{
			
			name:'test._test._udp.local',
			type:'TXT',
			ttl:10,
			data:txt.encode({x:"testewrwer"})

		},{
			name:'test._test._udp.local',
			type:'SRV',
			ttl:10,
			flush:true,
			data:{
				port:9900,
				target:'test.local'
			}
		},{
			name:'test.local',
			type:'A',
			ttl:10,
			flush:true,
			data:'192.168.4.220'

		}]

	});
});

