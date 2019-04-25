export default Ember.Component.extend({
	actions: {
		eventsAdminButtonClick(actionName) {
			//call the onConfirm property to invoke the parent component action
      this.get('onButtonClick')(actionName, this.event);
		}
	}
});