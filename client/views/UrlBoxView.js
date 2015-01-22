var UrlBoxView = Backbone.View.extend({
  tagName: 'div',
  
  id: 'url-box',
  
  className: 'well',

  events: {
    'click button#url-btn': 'upcall'
  },
 
  render: function() {
    $(this.el).html('Enter Url: <input id="url-input" type=text></input><br/>');
    $(this.el).append('<button id="url-btn" class="btn">Build Corpus</button>');
    return this;
  },

  upcall: function() {
    $('#url-input', this.el).attr("disabled", "disabled");
    var url = $('#url-input', this.el).val();
    this.options.parent.populate(url);
  }

});
