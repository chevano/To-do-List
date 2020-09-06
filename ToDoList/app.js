//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
//const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Creating a database called todoListDB
// localhost: mongoose.connect("mongodb://localhost:27017/todoListDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect("mongodb+srv://admin-chevano:Fiao@1234@cluster0.cdt1i.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true, "Please check your data entry, no name specified!"]
  }
});

// Creating a new collection
const Item = mongoose.model("Item", itemsSchema);

// Creating a new document
const item1 = new Item ({
  name: "Buy Food"
});

const item2 = new Item ({
  name: "Cook Food"
});

const item3 = new Item ({
  name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: {
    type: String,
    required: [true, "Please check your data entry, no name specified!"]
  },
  items:[itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

//const day = date.getDate();
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully inserted all the items");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req, res) {
  // capitalize the first letter in the newly created list
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        // Create a new list if one doesn't exist
        const list = new List ({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      }
      else {
      // Show an existing list from the Database that has a collection(model) of List
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  // Add items to the default route
  if(listName === "Today") {
    item.save();
    res.redirect("/");
  }
  // Add items to the custom routes
  else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // Checks if we are in our home route, then deletes the item that is checked off the list
  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/"); // Goes back to our home route
      }
    });
  }
  // Checks if we are in a custom list, then deletes the item that is checked off the list
  else {
    List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err) {
        res.redirect("/" + listName); // Go back to the custom list
      }
    });
  }
});

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
