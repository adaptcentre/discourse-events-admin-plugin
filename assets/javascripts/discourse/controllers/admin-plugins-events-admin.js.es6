import Ember from 'ember';

export default Ember.Controller.extend({
  testAttr: false,

  actions: {
    testAction() {
    	console.log(this.siteSettings)
      this.set('testAttr', true);
    }
  }
});