const mdns=require('multicast-dns')();
mdns.on('query',function(res){
	console.log(res);
});

mdns.on('response',function(res){
	for(let i=0; i< res.answers.length ; i++){
		
		if(res.answers[i].type=="SRV"){
			//console.log("domain ="+res.answers[i].data.target);
		}
		if(res.answers[i].type=="TXT"){
			//console.log(res.answers[i]);
		}
	}
	//console.log("response res="+JSON.stringify(res.answers));
});
for(let i=0; i<3 ; i++){
	mdns.query({
		questions:[{
			name:'_test._udp.local',
			type:'PTR'
		},{
			name:'Test._test._udp.local',
			type:'SRV'
		}]
	});
}

