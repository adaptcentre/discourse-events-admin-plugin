export default Ember.Component.extend({
  
  init() {
 
  	this._super();

  	this.catIds = {
  		bucket: this.siteSettings.events_admin_plugin_cat_bucket_id,
  		comingUp: this.siteSettings.events_admin_plugin_cat_comingUp_id,
  		nowOn: this.siteSettings.events_admin_plugin_cat_nowOn_id,
  		finished: this.siteSettings.events_admin_plugin_cat_finished_id
  	}

  	this.allEvents = [];

  	Ember.defineProperty( this, 'bucketList', Ember.computed( 'allEvents.@each.category_id', () => {
  		return this.allEvents.filter( (event) => {
  			return parseInt(event.category_id) === parseInt(this.catIds['bucket']);
  		});
  	}));

  	Ember.defineProperty( this, 'comingUpList', Ember.computed( 'allEvents.@each.category_id', () => {
  		return this.allEvents.filter( (event) => {
  			return parseInt(event.category_id) === parseInt(this.catIds['comingUp']);
  		});
  	}));

  	Ember.defineProperty( this, 'nowOnList',Ember.computed( 'allEvents.@each.category_id', () => {
  		return this.allEvents.filter( (event) => {
  			return parseInt(event.category_id) === parseInt(this.catIds['nowOn']);
  		});
  	}));

  	Ember.defineProperty( this, 'finishedList', Ember.computed( 'allEvents.@each.category_id', () => {
  		return this.allEvents.filter( (event) => {
  			return parseInt(event.category_id) === parseInt(this.catIds['finished']);
  		});
  	}));

  	let apiKey = this.siteSettings.events_admin_plugin_api_key;
    let apiKeyUser = this.siteSettings.events_admin_plugin_api_user;

    this.queryEndpoint = `?api_key=${apiKey}&api_username=${apiKeyUser}`;

    this.time = getTime();
    this.timeInterval = null;
  },

  didInsertElement() {

    resolveCategory(this.catIds.bucket, this.queryEndpoint)
	    .then( (topics1) => {

	    	let list = topics1.map( (event) => {
	    		let res = parseRawEvent(event); 
	    		
	    		res.actions = getEventActions('bucket');

	    		return res;
	    	});
	    	
	    	this.set('allEvents', this.allEvents.concat(list) );
	    	return resolveCategory(this.catIds.comingUp, this.queryEndpoint);
	    })
	    .then( (topics2) => {

	    	let list = topics2.map( (event) => {
	    		let res = parseRawEvent(event); 
	    		
	    		res.actions = getEventActions('coming up');

	    		return res;
	    	});

	    	this.set('allEvents', this.allEvents.concat(list) );
	    	return resolveCategory(this.catIds.nowOn, this.queryEndpoint);
	    })
	    .then( (topics3) => {

	    	let list = topics3.map( (event) => {
	    		let res = parseRawEvent(event); 
	    		
	    		res.actions = getEventActions('now on');

	    		return res;
	    	});

	    	
	    	this.set('allEvents', this.allEvents.concat(list) );
	    	return resolveCategory(this.catIds.finished, this.queryEndpoint);
	    })
	    .then( (topics4) => {

	    	let list = topics4.map( (event) => {
	    		let res = parseRawEvent(event); 
	    		
	    		res.actions = getEventActions('finished');

	    		return res;
	    	});

	    	
	    	this.set('allEvents', this.allEvents.concat(list) );
	    	//now we need to check if the events aka topics are closed or open
	    	return checkIfTopicsAreClosed( JSON.stringify( this.allEvents ), this.queryEndpoint );
	    })
	    .then( ( updatedEvents ) => {
		  	
		  	//need to do it like this instead of replacing whole array
		  	for( let i = 0; i < updatedEvents.length; i++ ) {

		  		Ember.set(this.allEvents[i], 'linked_closed', updatedEvents[i].linked_closed );
		  		Ember.set(this.allEvents[i], 'loading', false );
		  		Ember.set(this.allEvents[i], 'closed_loading', false );
		  	}
		  });

	  //start interval for clock
	  this.timeInterval = setInterval( () => {
	  	this.set('time', getTime());
	  },500);

  },

  willUpdate() {
  	//console.log('will update');
  	//gets called every time we use this.set()
  },


  didUpdate() {
  	//console.log('did update');
  	//gets called every time we use this.set()
  },

  willDestroyElement() {
    //this._super();
   	
   	clearInterval( this.timeInterval  );
  },

  didDestroyElement() {
  	//console.log('did destroy');
  },

  actions: {
  	onButtonClickClick(actionName, eventClone) {
 	
 			let event = this.allEvents.find( (el) => {
 				return parseInt(el.id) === parseInt(eventClone.id);
 			});

  		
  		let newCatId = null;

  		Ember.set(event, 'loading', true );

  		if(actionName === 'bucket') {
  			newCatId = this.catIds['bucket'];
  		}

  		if(actionName === 'coming up') {
  			newCatId = this.catIds['comingUp'];
  		}

  		if(actionName === 'now on') {
  			newCatId = this.catIds['nowOn'];
  		}

  		if(actionName === 'finished') {
  			newCatId = this.catIds['finished'];
  		}

  		console.log('changing cat of event', event.id, 'to', newCatId);

  		updateTopic(event.id, {category_id: newCatId}, this.queryEndpoint)
  		.then( () => {

  			addFadeOutAnimationToElement( event.id );
  			
  			setTimeout( () => {
  				addFadeInAnimationToElement( event.id );
  				
  				Ember.set(event, 'actions', getEventActions(actionName) );
  				Ember.set(event, 'category_id', parseInt(newCatId) );
  				Ember.set(event, 'loading', false );
  			}, 1000);
  		});
  	},
  	openTopic(eventId) {
  		let event = this.allEvents.find( (el) => {
  			return parseInt(el.id) === parseInt(eventId);
  		});

  		Ember.set(event, 'closed_loading', true );

  		openTopic( event.linked_id, this.queryEndpoint )
  		.then( (data) => {
  			console.log(data)

  			Ember.set(event, 'closed_loading', false );
  			Ember.set(event, 'linked_closed', false );
  		});
  	},
  	closeTopic(eventId) {
  		let event = this.allEvents.find( (el) => {
  			return parseInt(el.id) === parseInt(eventId);
  		});

  		Ember.set(event, 'closed_loading', true );

  		closeTopic( event.linked_id, this.queryEndpoint )
  		.then( (data) => {
  			console.log(data)

  			Ember.set(event, 'closed_loading', false );
  			Ember.set(event, 'linked_closed', true );
  		});
  	}
  }
});

function resolveCategory(id, endpoint) {
	
	let p = new Promise( (resolve, reject) => {

		fetch(`/c/${id}.json${endpoint}`)
	    .then( (res) => {
	      return res.json();
	    })
	    .then( (data) => {
	    	if(!data && !data.topics_list) {
	        return null;
	      }

	      let topics = data.topic_list.topics;
	      let asyncTasks = [];

	      for( let topic of topics ) {
	      	let title = topic.title;
	        let isClosed = topic.closed;

	        if( title.startsWith('About the') || isClosed ) {
	          continue;
	        }
	        console.log('creating task for topic:', topic.id)
	        let task = createTask( topic.id, endpoint);
	        asyncTasks.push(task);
	      }

	      return asyncTasks;
	    })
	    .then( (tasks) => {
	    	let p = new Promise( (resolve, reject) => {
	        async.series( tasks, (err, results) => {

	          if(err) {
	            console.log(err);
	            reject(err);
	          }

	          resolve(results);
	        });
	      });

	      return p;
	    })
	    .then( (topics) => {
	    	resolve( topics );
	    })
	    .catch( (err) => {
	    	reject(err);
	    });

    });

	return p;
}

function createTask(id, endpoint) {

	return function(callback) {
		console.log('fetching topic:', id);

		fetch(`/t/${id}.json${endpoint}`)
    .then( (res) => {
      return res.json()
    })
    .then( (data) => {
      callback(null, data); 
    })
    .catch( (err) => {
      callback(err, null);
    });
	}
}

function getTime() {
	let today = new Date();
	
	let hours = today.getHours();
	let minutes = today.getMinutes();
	let seconds = today.getSeconds();

	if(hours < 10) {
		hours = '0' + hours;
	}
	if(minutes < 10) {
		minutes = '0' + minutes;
	}
	if(seconds < 10) {
		seconds = '0' + seconds;
	}

	let time = hours + ":" + minutes + ":" + seconds;

	return time;
}

function parseRawEvent( rawEvent ) {
	
	let title = rawEvent.fancy_title;

  let startTime = '';
  let endTime = '';
  let urlLink = '';
  let category = '';
  let bg_col = '';
  let linked_id = '';

  let body = rawEvent.post_stream.posts[0].cooked;
  let lines = body.split('<br>');

  lines.forEach((text) => {
    let line = text
    line = line.replace('<p>', '')
    line = line.replace('</p>', '')
    line = line.trim();

    if (line.startsWith('Actual URL==' || line.startsWith('URL==') || line.startsWith('url=='))) {
      urlLink = line.split('==')[1].trim();

      linked_id = urlLink.replace('/t/',''); // we assume that linked_id looks like "/t/25"
    }

    if (line.startsWith('Start Time==') || line.startsWith('start time==')) {
      startTime = line.split('==')[1].trim()
    }

    if (line.startsWith('End Time==') || line.startsWith('end time==')) {
      endTime = line.split('==')[1].trim()
    }

    if (line.startsWith('Category==') || line.startsWith('category==')) {
      category = line.split('==')[1].trim()
    }

    if (line.startsWith('Cat-bg==') || line.startsWith('Cat-bg==')) {
      bg_col = line.split('==')[1].trim();
    }
  });


  let parsed = {
  	id: rawEvent.id,
  	url: '/t/' + rawEvent.id,
  	category_id: rawEvent.category_id,
  	title: title,
  	startTime: startTime,
  	endTime: endTime,
  	urlLink: urlLink,
  	category: category,
  	bg_col: bg_col,
  	linked_closed: null, //lets not assume anything and show a loading symbol untill we know more
  	closed_loading: true,
  	linked_id: linked_id,
  	loading: true
  };

  console.log(rawEvent)
  console.log(parsed)


	return parsed;
}

function checkIfTopicsAreClosed(events, queryEndpoint) {

	events = JSON.parse(events);

  let tasks = [];

  let q = async.queue( (task, callback) => {
	 	console.log('fetching linked topic', task.linked_id, 'for', task.id);
		fetch(`/t/${task.linked_id}.json`) //dont need admin api key here
	    .then( (res) => {
	 			
	    	if(res.ok) {
	    		return res.json();    		
	    	}

	    	return null
	    })
	    .then( (data) => {

	    	if(data) {
	    		task.linked_closed = data.closed;
	    	}
	    	callback();
	    });
	}, 1);

	let p = new Promise( (resolve, reject) => {
  	q.drain = function() {
			resolve( events );
		};
  })

  events.forEach( (event) => {
		q.push(event, (err) => {});
  });
    
  return p;  
}

function updateTopic(topicId, data, endpoint) {
	
	let p = new Promise( (resolve, reject) => {

		fetch(`/t/-/${topicId}.json${endpoint}`, {
			method: 'PUT',
			headers: {
	        'Content-Type': 'application/json'
	    },
			body: JSON.stringify(data)
		})
		.then( response => response.json() )
		.then( (data) => { 
			resolve(data)
		})
		.catch( (err) => {
			reject(err);
		});

	});

	return p;
}

	
function openTopic( topicId, endpoint ) {
	
	let req = {
		'status': 'closed',
		'enabled': 'false'
	}
	
	let p = new Promise( (resolve, reject) => {

		fetch(`/t/${topicId}/status${endpoint}`, {
			method: 'PUT',
			headers: {
	        'Content-Type': 'application/json'
	    },
			body: JSON.stringify(req)
		})
		.then( response => response.json() )
		.then( (data) => { 
			resolve(data)
		})
		.catch( (err) => {
			reject(err);
		});

	});

	return p;
}

function closeTopic( topicId, endpoint ) {
	
	let req = {
		'status': 'closed',
		'enabled': 'true'
	}

	let p = new Promise( (resolve, reject) => {

		fetch(`/t/${topicId}/status${endpoint}`, {
			method: 'PUT',
			headers: {
	        'Content-Type': 'application/json'
	    },
			body: JSON.stringify(req)
		})
		.then( response => response.json() )
		.then( (data) => { 
			resolve(data)
		})
		.catch( (err) => {
			reject(err);
		});

	});

	return p;
}

function getEventActions( listType ) {

	let actions = [];

	if(listType === 'bucket') {
		actions.push('coming up');
		actions.push('now on');
	  actions.push('finished');
	}

	if(listType === 'coming up') {
		actions.push('bucket');
		actions.push('now on');
	  actions.push('finished');
	}

	if(listType === 'now on') {
		actions.push('bucket');
	  actions.push('coming up');
	  actions.push('finished');
	}

	if(listType === 'finished') {
		actions.push('bucket');
	  actions.push('coming up');
	  actions.push('now on');
	}

	return actions;
}


function addFadeInAnimationToElement(elementId) {
//events-admin-event-{{event.id}}
	$('#events-admin-event-' + elementId).removeClass('fadeOut');
	$('#events-admin-event-' + elementId).addClass('fadeIn');
}

function addFadeOutAnimationToElement(elementId) {
//events-admin-event-{{event.id}}
	$('#events-admin-event-' + elementId).removeClass('fadeIn');
	$('#events-admin-event-' + elementId).addClass('fadeOut');
}






