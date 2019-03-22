var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var db = require("./models");
var axios = require("axios")
var PORT = process.env.PORT || 3000;
var app = express();


app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/carsdb";

mongoose.connect(MONGODB_URI);
app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname + "./public/index.html"));
  });
  
  app.post("/submit", function(req, res) {
    console.log(req.body);
    db.Note.insert(req.body, function(error, saved) {
      if (error) {
        console.log(error);
      }
      else {
        res.send(saved);
      }
    });
  });
  

  app.get("/all", function(req, res) {
 
    db.Note.find({}, function(error, found) {

      if (error) {
        console.log(error);
      }
      else {
        res.json(found);
      }
    });
  });
  

  app.get("/find/:id", function(req, res) {

    db.Note.findOne(
      {
    
        _id: mongojs.ObjectId(req.params.id)
      },
      function(error, found) {
   
        if (error) {
          console.log(error);
          res.send(error);
        }
        else {
          console.log(found);
          res.send(found);
        }
      }
    );
  });

  app.post("/update/:id", function(req, res) {

    db.Note.update(
      {
        _id: mongojs.ObjectId(req.params.id)
      },
      {
        $set: {
          title: req.body.title,
          note: req.body.note,
          modified: Date.now()
        }
      },
      function(error, edited) {
      
        if (error) {
          console.log(error);
          res.send(error);
        }
        else {
          console.log(edited);
          res.send(edited);
        }
      }
    );
  });
  

  app.get("/delete/:id", function(req, res) {
    
    db.Note.remove(
      {
        _id: mongojs.ObjectID(req.params.id)
      },
      function(error, removed) {
      
        if (error) {
          console.log(error);
          res.send(error);
        }
        else {
    
          console.log(removed);
          res.send(removed);
        }
      }
    );
  });
  

  app.get("/clearall", function(req, res) {

    db.Note.remove({}, function(error, response) {

      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        console.log(response);
        res.send(response);
      }
    });
  });
app.get("/scrape", function(req, res) {
  axios.get("https://jalopnik.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $("h3, h6, h1, h4").each(function(i, element) {
    
      var result = {};
    
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

    res.send("Scrape Complete");
  });
});


app.get("/articles", function(req, res) {

  db.Article.find({})
  .then(function(dbArticle){
    res.json(dbArticle)
  })

    .catch(function(err){
      res.json(err)
    })
  })

app.get("/articles/:id", function(req, res) {
  
  db.Article.findOne({ _id: req.params.id })

    .populate("note")
    .then(function(dbArticle) {
     
      res.json(dbArticle);
    })
    .catch(function(err) {

      res.json(err);
    });
});



app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
  .then(function(dbNote){
    return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
  })
  .then(function(dbArticle) {

    res.json(dbArticle);
  })
  .catch(function(err) {

    res.json(err);
  });
});



app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
