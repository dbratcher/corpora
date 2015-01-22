var AboutView = Backbone.View.extend({
  tagName: 'div',
  id: 'about-box',
  render: function() {
    $(this.el).html("<br/><br/><center><h4>Created By Drew Bratcher</h3>A simple app built on redis, nodejs, and backbone through heroku.</center>");
    return this;
  }
});
