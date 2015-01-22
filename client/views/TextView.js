var TextView = Backbone.View.extend({
  tagName: 'div',
  id: 'results-box',
  initialize: function() {
    _.bindAll(this, 'render', 'update');
  },
  render: function() {
    $('#results-box').html("");
    var self = this;
    var link = this.model.get('link');
    var words = this.model.get('words');
    $(this.el).html("Words for Link:"+link+"<br/>");
    words.forEach(this.add_word);
    return this;
  },
  update: function() {
    var self = this;
    var uid = this.model.get("id");
    $.get("/url_fetch/"+uid, function(words) {
      var a = self.model.get("words");
      var new_words = words.filter(function(i) {return !(a.indexOf(i)>-1);});
      new_words.forEach(self.add_word);
      self.model.set("words", words);
      $.get('/status/'+uid, function(res) {
        if(res!="100%") {
          setTimeout(self.update, 1000);
        }
      });   
    }); 
  },
  add_word: function(word_id) {
    var word = new Word();
    word.set({id:word_id});
    word.fetch({success:function() {
      var wordView = new WordView({model:word});
      $('#results-box').append(wordView.render().el);
    }});
  },
});
