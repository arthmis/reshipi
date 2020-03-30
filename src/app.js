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

const express = require('express');
const { check, validationResult, body } = require('express-validator');
const bodyParser = require('body-parser');
const csp = require('helmet-csp');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const multer = require('multer');
const validator = require('validator');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // console.log(file);
    const originalNameSplit = file.originalname.split('.');
    const extension = originalNameSplit[originalNameSplit.length - 1];
    const newFileName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
    cb(null, newFileName);
  },
});
const upload = multer({ storage });


module.exports = (users, db) => {
  const app = express();

  // app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  function getMinutesInMilliseconds(minutes) {
    return minutes * 60 * 1000;
  }
  // millisecond * second * milliseconds
  const cookieAge = getMinutesInMilliseconds(120);

  app.use(session({
    cookie: {
      // secure: true,
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: cookieAge,
      sameSite: true,

    },
    secret: process.env.SECRET,
    name: 'id',
    // do more research into this because it depends
    // on the session store i use
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pgPromise: db,
      tableName: 'sessions',
    }),
  }));


  app.set('view engine', 'ejs');

  app.use(
    csp({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'blob:'],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          'https://fonts.gstatic.com',
          "'self'",
        ],
        // upgradeInsecureRequests: true,
        reportUri: '/report-violation',
      },
      reportOnly: true,
    }),
  );

  const reportCspViolation = (req, res) => {
    if (req.body) {
      console.log('CSP Violation: ', req.body);
    }
    res.status(204).end();
  };

  app.post('/report-violation', reportCspViolation);

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
      user.emailSpan = 'Email not available';
      console.log('found duplicate user');

      res.status(200);
      res.render('pages/signup', { user });
    } else {
      await users.addUser(userData).catch((err) => err);
      // console.log('response: successfully added user');
      res.status(201);
      user.username = '';
      user.email = '';
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
    const credentials = req.body;

    // console.log(validationResult(req));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };
      res.status(401);
      res.render('pages/login', {
        user,
      });
      return;
    }

    if (!(await users.isValidLogin(credentials))) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };
      res.status(401);
      res.render('pages/login', {
        user,
      });
      return;
    }
    req.session.regenerate((err) => {
      if (err) {
        console.log(err);
      }
      req.session.user = credentials.email;
      res.redirect(303, '/recipes');
    });
  };

  app.post('/recipes_login',
    [
      check('email').isEmail().normalizeEmail(),
      check('password').isLength({ min: 8, max: 50 }),
    ],
    loginUser,
  );

  const logout = (req, res) => {
    req.sessionStore.get(req.session.id, (err, sesh) => {
      if (err) {
        console.log(err);
        return;
      }
      if (!sesh) {
        res.redirect(303, '/');
      }
    });
    req.sessionStore.destroy((err) => {
      if (err) {
        console.log(err);
        return;
      }
      res.redirect(303, '/');
    });
  };

  app.get('/logout', logout);

  app.get('/recipes', (req, res) => {
    req.sessionStore.get(req.session.id, (err, sesh) => {
      if (err) {
        console.log('err: ', err);
        return;
      }
      if (!sesh) {
        // res.status(401);
        res.redirect(303, '/login');
        // res.render('pages/login_plain');
        return;
      }
      res.status(200);
      res.render('pages/recipes');
    });
  });

  app.get('/new_recipe', (req, res) => {
    req.sessionStore.get(req.session.id, (err, sesh) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sesh) {
        res.redirect(303, '/login');
        return;
      }
      res.status(200);
      res.render('pages/new_recipe');
      // res.send("got the recipe");
    });
  });

  const addRecipe = (req, res) => {
    req.sessionStore.get(req.session.id, async (err, sess) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sess) {
        res.redirect(303, '/login');
        return;
      }
      const validationErrors = validationResult(req);
      const recipe = req.body;
      if (!validationErrors.isEmpty()) {
        console.log(validationErrors);
        res.status(401);
        return;
      }
      // console.log(req.files);
      if (Array.isArray(recipe.ingredients)) {
        let ingredients = '';
        for (const ingredient of recipe.ingredients) {
          ingredients += (`\n${ingredient}`);
        }
        recipe.ingredients = ingredients;
      }
      if (Array.isArray(recipe.directions)) {
        let directions = '';
        for (const direction of recipe.directions) {
          directions += (`\n${direction}`);
        }
        recipe.directions = directions;
      }
      if (Array.isArray(recipe.ingredient_amount)) {
        let quantities = '';
        for (const quantity of recipe.ingredient_amount) {
          quantities += (`\n${quantity}`);
        }
        recipe.ingredient_amount = quantities;
      }

      await users.addRecipe(recipe, req.session.user, req.files);
      res.status(200);
      res.render('pages/recipes');
    });
  };

  const checkIngredients = (ingredients, { req }) => {
    if (Array.isArray(ingredients)) {
      for (let i = 0; i < ingredients.length; i += 1) {
        ingredients[i] = validator.trim(ingredients[i]);
        ingredients[i] = validator.escape(ingredients[i]);

        if (validator.isEmpty(ingredients[i])) {
          return false;
        }
      }
      return true;
    }

    ingredients = validator.trim(ingredients);
    ingredients = validator.escape(ingredients);
    if (validator.isEmpty(ingredients)) {
      return false;
    }
    req.body.ingredients = ingredients;
    return true;
  };
  const checkIngredientQuantity = (quantities, { req }) => {
    if (Array.isArray(quantities)) {
      for (let i = 0; i < quantities.length; i += 1) {
        quantities[i] = validator.trim(quantities[i]);
        quantities[i] = validator.escape(quantities[i]);

        if (validator.isEmpty(quantities[i])) {
          return false;
        }
      }
      return true;
    }

    let quantity = validator.trim(quantities);
    quantity = validator.escape(quantity);
    if (validator.isEmpty(quantity)) {
      return false;
    }
    req.body.ingredient_amount = quantity;
    return true;
  };
  const checkDirections = (directions, { req }) => {
    if (Array.isArray(directions)) {
      for (let i = 0; i < directions.length; i += 1) {
        directions[i] = validator.trim(directions[i]);
        directions[i] = validator.escape(directions[i]);

        if (validator.isEmpty(directions[i])) {
          return false;
        }
      }
      return true;
    }

    let direction = validator.trim(directions);
    direction = validator.escape(direction);
    if (validator.isEmpty(direction)) {
      return false;
    }
    req.body.directions = direction;
    return true;
  };
  app.post(
    '/add_recipe',
    upload.any('recipe_image'),
    [
      body('title').trim().not().isEmpty()
        .escape()
        .isLength({ min: 3, max: 50 }),
      body('description').trim().escape().isLength({ min: 0, max: 240 }),
      body('ingredients', 'Provided ingredient must not be empty.')
        .custom(checkIngredients),
      body('ingredient_amount', 'Provided ingredient quantity cannot be empty.')
        .custom(checkIngredientQuantity),
      body('directions', 'Provided direction cannot be empty.')
        .custom(checkDirections),
      body('original_url').if(body('original_url').not().isEmpty())
        .trim()
        .not()
        .isEmpty()
        .isURL(),
      body('food_category').isEmpty().trim().escape(),
    ],
    addRecipe,
  );

  app.get('/all_recipes', async (req, res) => {
    const recipes = await users.getRecipes(req.session.user, 15);
    res.status(200);
    res.send(recipes);
  });


  return { app };
};

// updateUserRecipe
// deleteUserRecipe
// addUserRecipe
// get7RandomRecipes
