// Database schema
// Title TEXT
// Description TEXT
// Ingredients TEXT
// Directions TEXT
// Image(Optional) TEXT(path to image)
// Food Category
// Tags TEXT
// The amount of times this recipe has been accessed/searched INT
// link to recipe if there is a url for the original recipe URL
// Related Account ID

// const bcryptjs = require('bcryptjs');
const users = require('./users.js')

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const csp = require('helmet-csp');
const pg = require('pg-promise')();

const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(
  csp({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com/css?family=Open+Sans&display=swap'
      ],
    },
    reportOnly: true,
  }),
);

async function main() {
  const createUserTable = `CREATE TABLE IF NOT EXISTS
    Users(
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        hash TEXT NOT NULL,
        recipes_table TEXT NOT NULL
    )`;

  users.db.none(createUserTable);

  app.use(express.static('reshipi-frontend'));
  app.listen(port);
}

async function signupNewUser(req, res) {
  const userData = req.body;

  try {
    const [previouslyUsedUsername, previouslyUsedEmail] = await users.getUser(userData);
    if (previouslyUsedEmail || previouslyUsedUsername) {
      let user = {
        username: userData.username,
        email: userData.email,
        usernameSpan: "",
        emailSpan: "",
      };
      if (previouslyUsedUsername) {
        user.usernameSpan = "Username not available";
      }
      if (previouslyUsedEmail) {
        user.emailSpan = "Email not available";
      }

      res.render('pages/signup', {
        user: user,
      });
    }
    else {
      try {
        await users.addUser(userData); 
        console.log('response: successfully added user');
        res.status(201).send("successfully added user");
        // res.render('pages/recipes');
        return;
      } catch (err) {
        return err; 
      } 
    }
  } catch (err) {
      console.log(err);
      return err;
    }
}

app.post('/signup', signupNewUser);

main()


// signup_new_user(test_user, 3);

// addUser
// deleteUser
// updateUserInfo
// readUserInfo
// addUserRecipesTable
// updateUserRecipe
// deleteUserRecipe
// addUserRecipe
// get7RandomRecipes
