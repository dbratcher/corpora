var ProgressView = Backbone.View.extend({
  tagName:'div',
  id: 'progress-bar',
  className: 'progress progress-striped active',
  render: function() {
    $(this.el).html('<div id="bar" class="bar" style="width: 1%;"></div>');
    return this;
  },

  initialize: function(options) {
    _.bindAll(this, 'update');
  },

  update: function() {
    var self = this;
    var par = this.options.parent;
    var uid = this.options.url_id;
    $.get('/status/'+uid, function(res) {
      $('#bar', this.el).css("width", res);
      $('#bar', this.el).html(res);
      if(res=="100%") {
        setTimeout(par.text(uid), 1000);
      } else {
        setTimeout(self.update, 1000);
      }
    });
  }
});
