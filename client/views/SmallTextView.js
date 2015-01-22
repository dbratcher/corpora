var SmallTextView = Backbone.View.extend({
  tagName: 'li',
  id: 'text-item',
  render: function() {
    var link = this.model.get('link');
    $(this.el).html("Link:"+link);
  }
});
