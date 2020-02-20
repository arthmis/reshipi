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

require('dotenv').config();

const { check, validationResult } = require('express-validator');

const express = require('express');
const csp = require('helmet-csp');
const bodyParser = require('body-parser');

module.exports = (users) => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

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
          'https://fonts.googleapis.com/css?family=Open+Sans&display=swap',
        ],
      },
      reportOnly: true,
    }),
  );

  const signupNewUser = async (req, res) => {
    const userData = req.body;

    const user = {
      username: userData.username,
      email: userData.email,
      usernameSpan: '',
      emailSpan: '',
    };

    // console.log(validationResult(req));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      // console.log(validationErrors);
      user.emailSpan = `${validationErrors.errors[0].value} is not a valid email`;
      res.status(200);
      res.render('pages/signup', {
        user,
      });
      return;
    }

    const [previouslyUsedUsername, previouslyUsedEmail] = await users
      .checkCredentialsExist(userData)
      .catch((err) => err);

    if (previouslyUsedEmail || previouslyUsedUsername) {
      if (previouslyUsedUsername) {
        user.usernameSpan = 'Username not available';
      }
      if (previouslyUsedEmail) {
        user.emailSpan = 'Email not available';
      }
      console.log('found duplicate user');

      res.status(200);
      res.render('pages/signup', {
        user,
      });
    } else {
      await users.addUser(userData).catch((err) => err);
      // console.log('response: successfully added user');
      res.status(201).send('successfully added user');
    }
  };
  app.post('/signup',
    [
      check('username').trim().escape().stripLow()
        .isLength({ min: 4, max: 30 }),
      check('email').isEmail().normalizeEmail(),
      check('password').isLength({ min: 8, max: 50 }),
    ],
    signupNewUser,
  );

  const tempApp = {
    app,
  };

  return tempApp;
};

// module.exports = function(app, usersDatabase) {
//   return new App(app, usersDatabase);
// }
// deleteUser
// updateUserInfo
// readUserInfo
// addUserRecipesTable
// updateUserRecipe
// deleteUserRecipe
// addUserRecipe
// get7RandomRecipes
