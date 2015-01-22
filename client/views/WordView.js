var WordView = Backbone.View.extend({
  tagName: 'div',
  render: function(){
    var id = this.model.get('id');
    var text = this.model.get('text');
    var link = this.model.get('link');
    $(this.el).html('<span>'+text+':<a href='+link+'>'+link+'</a></span>');
    return this;
  }
});
