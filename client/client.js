$(function(){

  var CorporaRouter = Backbone.Router.extend({
    routes: {
      "home":           "home",
      "about":          "about",
      ":uid":           "text",
      "":               "home",
    },

    home: function() {
      var header = new HeaderView();
      $('body').html(header.render().el);
      var url_box = new UrlBoxView({parent:this});
      $('body').append(url_box.render().el);
    },

    about: function() {
      var header = new HeaderView();
      $('body').html(header.render().el);
      var about = new AboutView();
      $('body').append(about.render().el);
    },

    library: function() {
      var header = new HeaderView();
      $('body').html(header.render().el);
      var library = new LibraryView();
      $('body').append(library.render().el);
    },

    text: function(uid) {
      this.navigate(""+uid);
      var header = new HeaderView();
      var url_id = uid;
      $('body').html(header.render().el);
      $.get("/url_fetch/"+url_id, function(words) {
        var text = new Text({id:url_id, link:"", words:words});
        var view = new TextView({model:text});
        $('body').append(view.render().el);
      });
    },

    populate: function(purl) {
      var url = purl;
      var self = this;
      var header = new HeaderView();
      $('body').html(header.render().el);
      $('body').append("<br/><center>Checking words from "+url+"</center>");
      $.post( "/populate", {url:url}, function(data, stat, req) {
        var progress = new ProgressView({parent:self, url_id:data.url_id});
        $('body').append(progress.render().el);
        //update every second
        setTimeout(progress.update, 1000);
        $.get("/url_fetch/"+data.url_id, function(words) {
          var text = new Text({id:data.url_id, link:url, words:words});
          var view = new TextView({model:text});
          $('body').append(view.render().el);
          setTimeout(view.update, 1500);
        });
      });
    },

  });

  var router = new CorporaRouter();
  Backbone.history.start({pushState:true, root:'/'});

});
