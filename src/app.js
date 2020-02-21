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

    const previouslyUsedEmail = await users
      .checkCredentialsExist(userData)
      .catch((err) => err);

    if (previouslyUsedEmail) {
      if (previouslyUsedEmail) {
        user.emailSpan = 'Email not available';
      }
      console.log('found duplicate user');

      res.status(200);
      res.render('pages/signup', { user });
    } else {
      await users.addUser(userData).catch((err) => err);
      // console.log('response: successfully added user');
      res.status(201);
      res.render('pages/login', { user });
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

  const loginUser = async (req, res) => {
    // console.log(res);
    const credentials = req.body;

    // console.log(validationResult(req));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };
      // console.log(validationErrors);
      res.status(200);
      res.render('pages/login', {
        user,
      });
      return;
    }

    if (!(await users.validateLogin(credentials))) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };
      res.status(200);
      res.render('pages/login', {
        user,
      });
      return;
    }
    res.status(200);
    res.send('login successful');
    // res.text = 'login successful';
    // res.render('pages/recipes');
    // res.render('pages/login');
  };

  app.post('/login',
    [
      // check('email').trim().isEmail().normalizeEmail(),
      check('email').isEmail().normalizeEmail(),
      check('password').isLength({ min: 8, max: 50 }),
    ],
    loginUser,
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
