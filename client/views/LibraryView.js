var LibraryView = Backbone.View.extend({
  tagName: 'div',
  id: 'library-box',
  render: function() {
    var self = this;
    this.collection.each(function(text) {
      var smallTextView = new SmallTextView({model:text});
      $('ul', self.el).append(smallTextView.render().el);
    });
  }
});
