var Word = Backbone.Model.extend({
  url: function() {
    return '/word_fetch/'+this.get("id");
  },
  defaults: {
    text: 'default',
    link: 'http://en.wikipedia.org/wiki/Default',
  }
});
