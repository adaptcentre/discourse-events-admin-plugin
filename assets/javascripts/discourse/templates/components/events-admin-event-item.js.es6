export default Ember.Component.extend({
	actions: {
		eventsAdminButtonClick(actionName) {
      this.get('onButtonClick')(actionName, this.event);
		},
		eventsAdminButtonOpenTopic() {
			this.get('openTopic')(this.event.id);
		},
		eventsAdminButtonCloseTopic() {
			this.get('closeTopic')(this.event.id);
		}
	}
});