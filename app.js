//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mycluster.jbkld.mongodb.net/todoListDB?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});




const Schema = mongoose.Schema;

const itemsSchema = new Schema({
  name: String
});

const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to the to-do list'
});
const item2 = new Item({
  name: 'Add by pressing the + sign'
});
const item3 = new Item({
  name: '<-- Delete from here'
});

const defaultItems = [item1, item2, item3];


app.get("/", function (req, res) {

  Item.find({}, (err, items) => {
    if (err) {
      console.log(err);
    } else if (items.length === 0) {
      Item.insertMany(defaultItems, err => {
        if (!err) {
          console.log('Default items added to the database');
        } else {
          console.log(err);
        }
      });
      res.redirect('/');
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: items
      });
    }
  });

});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({
      name: listName
    }, (err, foundList) => {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`);
      } else {
        console.log(err);
      }
    });
  }


});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, err => {
      if (!err) {
        res.redirect('/');
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, (err, foundList) => {
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }

});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, (err, list) => {
    if (err) {
      console.log(err);
    } else {
      if (!list) {
        // Create a new list if it doesn't exist yet
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save(err => {
          if (!err) {
            res.redirect('/' + customListName);
          } else {
            console.log(err);
          }
        });


      } else {
        //Show an existing list
        res.render('list', {
          listTitle: list.name,
          newListItems: list.items
        });
      }
    }
  });


});

app.get("/about", (req, res) => {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("Server started succesfully");
});