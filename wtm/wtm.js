const events=require('../node_modules/events');

function WTM(){
	let itself=new WTM();
	let wtm=this;
	events.EventEmitter.call(this);
	function init(name ,floder){

		fs.mkdir('profile/'+name,function(err){
			floder.forEach(function(e){
				fs.mkdir('profile/'+name+'/'+e,function(err){
					
				});
			});
		});
	}
	this.initWTM=function(id,createdAt, updateAt, name,description , tags , customFields,links) {

		function generateLink(name){
			return str='Link:<'+name+'/>; rel="'+name+'"\n';
		}

		let Links="";
		let profile={};
		let model={};
		let floder=['model','properties','actions','things','subscription','type','product','help','ui','custom'];
		fs.mkdir('profile',function(err){		
		
		});

		init(name,floder);//generate the floder

		profile.id=id;
		profile.name=name;
		profile.description=description;
		profile.createdAt=createdAt;
		profile.updateAt=updateAt;
		profile.tags=tags;
		profile.customFields=customFields;
		
		floder.forEach(function(e){
			Links+=generateLink(e);
		});

		fs.writeFile(`profile/${name}/links`,Links, function (err) {
	  		if (!err)
	  			console.log(colors.yellow(`WT(${name}) root links saved`));
		});
		fs.writeFile('profile/'+name+'/'+name+".json",JSON.stringify(profile), function (err) {
	  		if (!err)
	  			console.log(colors.yellow(`WT(${name}) root json saved`));
		});

		return JSON.stringify(profile);
	}
	this.generateWTMofVal=function(serviceName,floder,content){
		
		fs.mkdir('profile/'+serviceName+'/'+floder+'/',function(err){
			fs.writeFile('profile/'+serviceName+'/'+floder+'/'+serviceName+".json",JSON.stringify(content), function (err) {
		 		if (!err)
		  			console.log(colors.yellow(`${serviceName}/${floder} :\tWTM val is saved!`));
			});
		});
	}
	this.generateWTMLink=function(serviceName,floder,content){
		fs.mkdir('profile/'+serviceName+'/'+floder+'/',function(err){
			fs.writeFile('profile/'+serviceName+'/'+floder+'/links',content, function (err) {
		 		if (!err)
		  			console.log(colors.yellow(`${serviceName}/${floder} :\tWTM links is saved!`));
			});
		});
	}

	this.generateWTM=function(serviceName,domain){

		const dirTree=require('directory-tree');
		let properties=[];
		let propertiesContent=[];
		let actions=[];
		let actionSet=new Set();
		let actionsContent=[];
		let things=[];
		let thingsContent=[];
		let subscriptions=[];
		let subscriptionsContent=[];

		
		const tree = dirTree('profile/'+serviceName,{ extensions: /.json$/ },function(path,item){

			let str=path.path.split('/');
			
			if(str.length > 4){
				switch (str[2]){
					case 'properties':
						properties.push(path.path);
					break;

					case 'actions':
						if(str.length >5){
							actions.push(path.path);
							actionSet.add(str[3]);
						}
					break;

					case 'things':
						things.push(path.path);
					break;

					case 'subscription':
							subscriptions.push(path.path);
					break;

				}
			}
		});

		if(properties.length >0){
			for(let i=0; i<properties.length ; i++){

				fs.readFile(properties[i],'utf8',function(err,data){
					if(!err){
						try{
							propertiesContent.push(JSON.parse(data));
							if(propertiesContent.length == properties.length){
								let link=`Link:<http://${domain}/${serviceName}/properties/>; rel="type"`;
								if(domain !== undefined){
									itself.generateWTMLink(serviceName,`properties/`,link);
								}
								itself.generateWTMofVal(serviceName,`properties/`,propertiesContent);

							}
						}catch(e){
							console.log(e);
						}
					}
				});
			}	
		}
		if(actions.length>0){

			actionSet.forEach(function(classification){
				let arr=[];
				let count=0;
				let promise=new Promise(function(resolve,reject){
					actions.forEach(function(e){
						let str=e.split('/');
						if(str[3]==classification){
							arr.push(e);
						}
						if(++count==actions.length){
							let dataArry=[];
							let subcount=0;
							arr.forEach(function(path){
								fs.readFile(path,'utf8',function(err,data){
									dataArry.push(data);
									if(++subcount==arr.length){
										let promise=new Promise(function(resolve1,reject1){
											// console.log(dataArry);
											let subpath=path.split('/');
											fs.writeFile(`${subpath[0]}/${subpath[1]}/${subpath[2]}/${subpath[3]}/${serviceName}.json`,dataArry,function(err){
												if(!err){
													console.log(colors.yellow(`WTM actions folder is update (${subpath[3]})`));
													resolve1(0)
													resolve(0);
												}
											});
										});
										promise.then((f,r)=>{
											console.log(dataArry);
										});
									}
								});
							});
						}
					});
				});
				promise.then(function(full,rej){
					console.log("--------------------------------------");
				});	
			});
		}

		if(subscriptions.length>0){

			let arr=[];
			let count=0;
			subscriptions.forEach(function(subscription){
				let promise=new Promise(function(resolve,reject){
					// console.log("test subscription= "+subscription);
					fs.readFile(subscription,'utf8',function(err,data){
						if(!err){
							arr.push(JSON.parse(data));
						}
						if(++count == subscriptions.length){
							itself.generateWTMofVal(serviceName,`subscription/`,arr);

						}
					});
					resolve(0);
				});
				promise.then(function(full){
					console.log("####################################");
				});
			});
		}
		function model(serviceName,domain,properties,actions,subscription,things){
			
			let map=new Map();
			function generateResource(serviceName,arrResource,type){
				
				let promise=new Promise(function(resolve,reject){
					let resource=[];
					let actionResouce=new Set();
					let count=0;
					let length=arrResource.length;
					arrResource.forEach(function(e){
						
							fs.readFile(e,'utf8',function(err,data){
								let str="";
								if(!err){
									if(type == "properties"){
										let obj=JSON.parse(data);
										if(obj.values!=undefined)
											str=`"${obj.id}":{"name":"${obj.id}","description":"none","values":${JSON.stringify(obj.values)}}`;
										else
											str=`"${obj.id}":{"name":"${obj.id}","description":"none","value":${JSON.stringify(obj.value)}}`;

										resource.push(str);

									}
									if(type == "actions"){
										actionResouce.add(data);
									}				
								}
								if(++count == arrResource.length){
									if(type != "actions")
										resolve(resource);
									else{
										let str="";
										let count2=0;
										actionResouce.forEach(function(e){
											let obj=JSON.parse(e);
											str=`"${obj.id}":{"name":"${obj.id}","description":"none","value":${JSON.stringify(obj.value)}}`;
											resource.push(str);
										});
										resolve(resource);

									}
								}
							});
						

					});
				});
				// return promise;
				promise.then(function(full){
						map.set(type,full);
						return full;
				}).catch(function(rej){
				});
			}

			let promiseMode=new Promise(function(resolve,reject){


				generateResource(serviceName,properties,"properties");

				generateResource(serviceName,actions,"actions");
				setTimeout(function(){
					resolve(0)
				},100);
			});
			promiseMode.then(function(full){

				let obj={};
				obj.id=serviceName;
				obj.description="";
				obj.tags=[];
				obj.customField={};
				obj.customField.domain=domain;
				obj.links={};
				obj.links.properties={};
				obj.links.properties.links="/properties";
				obj.links.properties.title="List of Properties";
				obj.links.properties.resource=JSON.parse(`{${map.get("properties")}}`);
				obj.links.actions={};
				obj.links.actions.links="/actions";
				obj.links.actions.title="List of actions";
				obj.links.actions.resource=JSON.parse(`{${map.get("actions")}}`);

				itself.generateWTMofVal(serviceName,`model/`,obj);

			})
		}
		model(serviceName,domain,properties,actions,subscriptions,things)
	}
}
WTM.prototype.__proto__=events.EventEmitter.prototype;
module.exports=new WTM();