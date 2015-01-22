var Corpus = Backbone.Collection.extend({
  model:Word,
  url: function() {
    return '/word/'+this.id;
  }
});
