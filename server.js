var express = require('express');
var redis = require('redis');
var url = require('url');
require.cache["request"]="";
var request = require('request');

var server = express();
server.use(express.static(__dirname+'/client'));
server.use(express.bodyParser());

var redisClient;

if(process.env.REDISTOGO_URL) {
    var redisURL = url.parse(process.env.REDISTOGO_URL);
    redisClient = redis.createClient(redisURL.port, redisURL.hostname, {});
    redisClient.auth(redisURL.auth.split(":")[1]);
    console.log("On production machine, using redis to go.");
} else {
    redisClient = redis.createClient();
    console.log("On development machine, using local redis server.");
}

//populate helpers
function urlexists(url, callback) {
  redisClient.hget("url_hash", url, function(err, body) {
    if(body==null) {
      callback("false");
    } else {
      callback({url_id:body});
    }
  });
}

function textfetch(url, callback) {
  //console.log("fetching:"+url);
  var longurl = "http://textalyser.net/?q="+url;
  request({uri:longurl}, function(error, response, body){
    var words = [];
    var textregex = /<td>(.+)<\/td><td>(.+)<\/td><td>.+<\/td><td>.+<\/td>/g;
    while((match = textregex.exec(body)) !== null) {
      var word = match[1].toLowerCase();;
      var count = match[2];
      word = word.trim();
      count = count.trim();
      var formatted = word.replace(/\s/g, '_');
      words.push(formatted);
    }
    callback(words);
  });
}

function wordexists(word, callback) {
  redisClient.hget("word_hash", word, function(err, body) {
    if(body==null) {
      callback("undefined");
    } else {
      callback(body);
    }
  });
}

function wikicheck(pword, callback) {
  var word = pword;
  //console.log("wiki checking:"+word);
  var longurl = "http://en.wikipedia.org/wiki/"+word;
  request({uri:longurl, headers: {'user-agent':'Mozilla/5.0'}, maxRedirects:200}, function(error, response, body) {
    var wikiregex = /((.+computer science.+)|(.+software development.+)|(.+information technology.+))/ig;
    match = wikiregex.exec(body);
    if(match!=null) {
      var wikiregex2 = /.+references.+/ig;
      match = wikiregex2.exec(body);
      if(match!=null) {
        //console.log(word + " is a word");
        callback("true");
      } else {
        callback("false");
      }
    } else {
      callback("false");
    }
  });
}


function populate_word(pword, index, array) {
  var url_id = this;
  var word = pword;
  //atomic incr site_word
  redisClient.incr(url_id+"_"+word, function(err, result) {
    //if greater than 1 return
    if(result>1) {
    redisClient.incr("url_"+url_id+"_count", function(err, result) {});
    } else {
      //console.log("checking if word:"+word+" exists");
      wordexists(word, function(verdict) {
        if(verdict!="undefined") {
          if(verdict!="false") {
            //add word to list
            redisClient.lpush("url_"+url_id, verdict);
            redisClient.incr("url_"+url_id+"_count", function(err, result) {});
          } else {
            redisClient.incr("url_"+url_id+"_count", function(err, result) {});
            return;
          }
        } else {
          wikicheck(word, function(wiki) {
            if(wiki=="false") {
              //add word to word hash value false
              redisClient.hset("word_hash", word, "false");
              redisClient.incr("url_"+url_id+"_count", function(err, result) {});
            } else {
              //get next word id
              //console.log("adding word "+word);
              redisClient.incr("word_id", function(err, word_id) {
                console.log(word+" has id " + word_id);
                //add word id to word hash
                redisClient.hset("word_hash", word, word_id);
                var wiki = "http://en.wikipedia.org/wiki/";
                //create word with id
                wordbody = {id:word_id, text:word, link:wiki+word};
                var body = JSON.stringify(wordbody);
                redisClient.set("word_"+word_id, body, function(err){});
                //console.log("inserting id"+word_id+" to "+url_id);
                //add word id to url list
                redisClient.lpush("url_"+url_id, word_id);
                redisClient.incr("url_"+url_id+"_count", function(err, result) {});
              });
              //console.log("need to add word "+word+"to hash with id");
            }
          });
        }
      });
    }
  });
}

function wait_then_flush(purl_id, pfinished, pwords, res) {
  var url_id = purl_id;
  var finished = pfinished;
  var words = pwords;
  redisClient.get("url_"+url_id+"_count", function(err, count) {
    if(count==finished) {
      //flush keys
      words.forEach(function(element) {
        redisClient.del(url_id+"_"+element);
      });
    } else {
      wait_then_flush(purl_id, pfinished, pwords);
    }
  });
}

function populate_url(req, res, next) {
  var url = req.body.url;
  console.log("url populate:"+url);
  //check if url has been checked before
  urlexists(url,  function(data) {
    console.log("result:"+data);
    if(data!="false") {
      //if so return
      res.send(data);
    } else {
      console.log("getting url id");
      redisClient.incr("url_id", function(err, url_id) {
        redisClient.hset("url_hash", url, url_id);
        console.log("getting text for url:"+url);
        //get text
        textfetch(url, function(data) {
          //async for each word
          var count = data.length;
          redisClient.set("url_"+url_id+"_count", 0);
          redisClient.set("url_"+url_id+"_total", count);
          console.log("checking "+count+" words");
          res.send({"url_id":url_id});
          data.forEach(populate_word, url_id);
          wait_then_flush(url_id, count, data, res); 
        });
      });
    }
  });
}

function url_status(req, res, next) {
  var id = req.params.url_id;
  redisClient.get("url_"+id+"_count", function(err, pcount) {
    var count = pcount;
    redisClient.get("url_"+id+"_total", function(err, total) {
      var percent = Math.floor(count/total*100);
      res.send(percent + "%");
    });
  });
}

function word_fetch(req, res, next) {
  var word_id = req.params.word_id;
  redisClient.get("word_"+word_id, function(err, word) {
    res.send(word);
  });
}

function url_fetch(req, res, next) {
  var url_id = req.params.url_id;
  redisClient.llen("url_"+url_id, function(err, len) {
    redisClient.lrange("url_"+url_id, 0, len, function(err, list) {
      res.send(list);
    });
  });
}

function flush(req, res, next) {
  console.log("database flush");
  redisClient.flushall();
}

server.post('/populate', populate_url);
server.get('/status/:url_id', url_status);
server.get('/word_fetch/:word_id', word_fetch);
server.get('/url_fetch/:url_id', url_fetch);
server.get('/flushall', flush);
server.get('*', function(req, res, next) {
  res.sendfile(__dirname+'/client/index.html');
});
 
var port = process.env.PORT || 8080;
server.listen(port, function(){ console.log("we are listening on port ", port);});




