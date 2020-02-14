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
const {check, validationResult } = require('express-validator');

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

  console.log(userData);

  let user = {
    username: userData.username,
    email: userData.email,
    usernameSpan: "",
    emailSpan: "",
  };

  // console.log(validationResult(req));
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    console.log(validationErrors);
    user.emailSpan = `${validationErrors.errors[0].value} is not a valid email`;
    res.status(200);
    res.render('pages/signup', {
      user: user,
    });
  }

  try {
    const [previouslyUsedUsername, previouslyUsedEmail] = await users.checkCredentialsExist(userData);
    if (previouslyUsedEmail || previouslyUsedUsername) {
      // let user = {
      //   username: userData.username,
      //   email: userData.email,
      //   usernameSpan: "",
      //   emailSpan: "",
      // };
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
        // await users.addUser(userData); 
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

app.post('/signup', [
    check('username').trim().escape().stripLow().isLength( {min: 4, max: 30}),
    check('email').isEmail().normalizeEmail(),
    check('password').isLength( {min: 8, max: 50}),
  ], 
  signupNewUser);

main()


// signup_new_user(test_user, 3);

// deleteUser
// updateUserInfo
// readUserInfo
// addUserRecipesTable
// updateUserRecipe
// deleteUserRecipe
// addUserRecipe
// get7RandomRecipes
