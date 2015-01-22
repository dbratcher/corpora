var HeaderView = Backbone.View.extend({
  tagName: 'div',
  id: 'header-box',
  render: function() {
    $(this.el).html('<h2>Corpora</h2><br/><a href="./">Home</a> | <a href=./about>About</a>');
    return this;
  }
});
