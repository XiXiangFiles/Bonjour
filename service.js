let bonjour=require('bonjour')();
//bonjour.publish({name: 'test', type: 'http',port: 3000 });


bonjour.find({type:'http'},function(service){
	console.log('Found an http server:',service);
});

