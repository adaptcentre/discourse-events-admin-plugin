export default Ember.Component.extend({
  
  init() {
  	console.log('init');
  	this._super();

  	this.lists = {
  		bucket: [],
  		comingUp: [],
  		nowOn: [],
  		finished: []
  	}

  	this.catIds = {
  		bucket: this.siteSettings.events_admin_plugin_cat_bucket_id,
  		comingUp: this.siteSettings.events_admin_plugin_cat_comingUp_id,
  		nowOn: this.siteSettings.events_admin_plugin_cat_nowOn_id,
  		finished: this.siteSettings.events_admin_plugin_cat_finished_id
  	}

  	let apiKey = this.siteSettings.events_admin_plugin_api_key;
    let apiKeyUser = this.siteSettings.events_admin_plugin_api_user;

    this.queryEndpoint = `?api_key=${apiKey}&api_username=${apiKeyUser}`;


    this.time = getTime();
    this.timeInterval = null;
  },

  didInsertElement() {
    console.log('did insert');

    let endpoint = this.queryEndpoint;
    let id1 = this.catIds.bucket;
    let id2 = this.catIds.comingUp;
    let id3 = this.catIds.nowOn;
    let id4 = this.catIds.finished;

    //get topics from category 1
    resolveCategory(id1, endpoint)
	    .then( (topics1) => {

	    	let list = topics1.map( (event) => {
	    		let res = parseRawEvent(event); 
	    		
	    		res.actions = [];
	    		res.actions.push('coming up');
	    		res.actions.push('now on');
	    		res.actions.push('finished');

	    		return res;
	    	});
	    	
	    	this.set('lists.bucket', list);

	    	return resolveCategory(id2, endpoint);
	    })
	    .then( (topics2) => {

	    	let list = topics2.map( (event) => {
	    		let res = parseRawEvent(event); 
	    		
	    		res.actions = [];
	    		res.actions.push('bucket');
	    		res.actions.push('now on');
	    		res.actions.push('finished');

	    		return res;
	    	});

	    	this.set('lists.comingUp', list);

	    	return resolveCategory(id3, endpoint);
	    })
	    .then( (topics3) => {

	    	let list = topics3.map( (event) => {
	    		let res = parseRawEvent(event); 
	    		
	    		res.actions = [];
	    		res.actions.push('bucket');
	    		res.actions.push('coming up');
	    		res.actions.push('finished');

	    		return res;
	    	});

	    	this.set('lists.nowOn', list);

	    	return resolveCategory(id4, endpoint);
	    })
	    .then( (topics4) => {

	    	let list = topics4.map( (event) => {
	    		let res = parseRawEvent(event); 
	    		
	    		res.actions = [];
	    		res.actions.push('bucket');
	    		res.actions.push('coming up');
	    		res.actions.push('now on');

	    		return res;
	    	});

	    	this.set('lists.finished', list);

	    	//now we need to check if the events aka topics are closed or open
	    	return checkIfTopicsAreClosed( JSON.stringify( this.lists ), this.queryEndpoint );
	    })
	    .then( ( updatedLists ) => {
		  	this.set('lists', updatedLists);
		  	console.log('check if closed completed')

		  	console.log(this.lists)
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
   	console.log('will destroy');
   	clearInterval( this.timeInterval  );
  },

  didDestroyElement() {
  	console.log('did destroy');
  },

  actions: {
  	onButtonClickClick(actionName, event) {
  		console.log( 'do something', actionName)
  		console.log( 'do something', event)
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

	/*
    Example title:
    A Distinctive NUI Galway - Our distinctive location

    Need to parse out first part

    so: "A Distinctive NUI Galway - Our distinctive location" turns into "Our distinctive location"
  */
  
  let tempIndex = title.indexOf('-');

  if(tempIndex > 0) {
    title = title.substring( tempIndex + 2 ); // +2 because there is a whitespace + - 
  }

  let startTime = '';
  let endTime = '';
  let urlLink = '';
  let category = '';
  let speakers = [];
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

    if (line.startsWith('Speakers==') || line.startsWith('speakers==')) {
      speakers = line.split('==')[1].trim().split(',')
      if (speakers.length === 1 && speakers[0] === '') {
        speakers = [];
      }
    }

    if (line.startsWith('Cat-bg==') || line.startsWith('Cat-bg==')) {
      bg_col = line.split('==')[1].trim();
    }
  });


  let parsed = {
  	title: title,
  	startTime: startTime,
  	endTime: endTime,
  	urlLink: urlLink,
  	category: category,
  	speakers: speakers,
  	bg_col: bg_col,
  	linked_closed: null, //lets not assume anything and show a loading symbol untill we know more
  	linked_id: linked_id,
  	loading: true
  };


	return parsed;
}

function checkIfTopicsAreClosed(lists, queryEndpoint) {
	
	lists = JSON.parse(lists);

	let events = [];

  lists.bucket.forEach( (event) => {
  	events.push(event);
  });
  
  lists.comingUp.forEach( (event) => {
  	events.push(event);
  });
  
  lists.nowOn.forEach( (event) => {
  	events.push(event);
  });
  
  lists.finished.forEach( (event) => {
  	events.push(event);
  });

  let tasks = [];

  let q = async.queue( (task, callback) => {
	  console.log('Starting ' + task.linked_id);

		fetch(`/t/${task.linked_id}.json${queryEndpoint}`)
	    .then( (res) => {
	 			
	    	if(res.ok) {
	    		return res.json();    		
	    	}

	    	return null
	    })
	    .then( (data) => {

	    	if(data) {
	    		task.linked_closed = data.closed;
	    		task.loading = false;
	    	}
	    	callback();
	    });
	}, 1);

	let p = new Promise( (resolve, reject) => {
  	q.drain = function() {
			console.log('all items have been processed');
			resolve( lists );
		};
  })

  events.forEach( (event) => {
		q.push(event, (err) => {});
  });
    
  return p;  
}