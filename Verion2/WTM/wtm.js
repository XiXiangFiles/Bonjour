const fs=require('fs');
const color=require('colors');
const http = require('http');
const datetime=require('../node_modules/node-datetime');
const decode = require('../node_modules/urldecode');
const dirTree=require('../node_modules/directory-tree');
let config;
let file=fs.readFileSync('../config.json','utf8');
config=JSON.parse(file);
function wtm(){
	this.mkdirFloder= function(){
		return new Promise(function(resolve){
			try{
				fs.mkdirSync('root',(err)=>{ });
			}catch(e){}
			config.folder.forEach(function(floder){
				try{
					fs.mkdirSync(`root/${floder}`,(err)=>{});
				}catch(e){}
			});
			resolve();
		});
	}
	this.init=function(){
		return new Promise(function(resolve){
			function generateLink(name){
				return str='Link:<'+name+'/>; rel="'+name+'"\n';
			}
			let dt = datetime.create();
			let profile={}
			let Links="";
			profile.id=0;
			profile.name=config.Instance;
			profile.description=config.tags[config.Instance].description;
			profile.createdAt=dt.format('Y-m-d H:M:S');
			profile.updateAt=dt.format('Y-m-d H:M:S');
			for(let i=0 ; i< config.folder.length; i++ )
				Links+=generateLink(config.folder[i]);

			fs.writeFileSync(`root/links`,Links, function (err) {});
			fs.writeFileSync(`root/${config.Instance}.json`,JSON.stringify(profile), function (err) {});
			resolve();
		});
	}
	this.adjust=function(){
		return new Promise(function(resolve){
			let properties=[];
			let propertiesContent=[];
			let actions=[];
			let actionSet=new Set();
			let actionsContent=[];
			let things=[];
			let thingsContent=[];
			let subscriptions=[];
			let subscriptionsContent=[];
			let tree = dirTree('root',{ extensions: /.json$/ },function(path,item){
				console.log(path);
			});
			resolve();
		});
	}
}
let setupTest=new wtm;
setupTest.mkdirFloder().then(function(){
	setupTest.init().then(function(){
		setupTest.adjust(function(){

		});
	})
});
