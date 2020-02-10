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
const bcrypt = require('bcrypt');

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const csp = require('helmet-csp');
const pg = require('pg-promise')();

const app = express();
const port = 8000;
const db = pg(process.env.DATABASE_URL);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
      reportUri: '/signin',
    },
    reportOnly: true,
  }),
);

const router = express.Router();

app.post('/signup', (req, res) => {
  console.log(req.body);
  res.send('/signup');
});

router.get('/', (req, res) => {
  res.send('Got your request for page landing');
});

app.use(express.static(__dirname.join('/reshipi-frontend')));
app.listen(port);

async function main() {
  const createUserTable = `CREATE TABLE IF NOT EXISTS
            Users(
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT NOT NULL,
                hash TEXT NOT NULL,
                recipes_table TEXT NOT NULL
            )`;

  const client = await db.connect().catch(err => console.log(err));
  client.none(createUserTable);

  app.use(express.static('reshipi-frontend'));
  app.listen(port);
}

async function signup_new_user(req, res) {
  const saltRounds = 10;

  const userData = JSON.parse(req);
  const hashResult = await bcrypt
    .hash(userData.password, saltRounds)
    .catch((err) => console.log(err));

  // const delete_user = pg.as.format(
  //     `DELETE FROM Users WHERE $1:name=$2`,
  //     ["username", user_data.username],
  // );
  // let num_rows_del = await db.none(delete_user);
  // // console.log(num_rows_del);

  userData.recipe_table = `${userData.username}_recipes`;

  const createUserRecipesTable = pg.as.format(
    `CREATE TABLE IF NOT EXISTS
                $1:name(
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    ingredients TEXT NOT NULL,
                    directions TEXT NOT NULL,
                    description TEXT NOT NULL,
                    food_category TEXT NOT NULL,
                    tags TEXT
                );`,
    [userData.recipe_table],
  );

  // create table for user recipes
  db.none(createUserRecipesTable);

  const insertNewUser = new pg.ParameterizedQuery({
    text: `INSERT INTO Users (username, email, hash, recipes_table)
            VALUES ($1, $2, $3, $4);`,
    values: [
      userData.username,
      userData.email,
      hashResult,
      userData.recipe_table
    ]
  });
  await db.none(insertNewUser).catch((err) => console.log(err));
  const getOneUser = new pg.ParameterizedQuery({
    text: 'SELECT * FROM Users WHERE username=$1 LIMIT 1;',
    values: [userData.username],
  });
  const user = await db.one(getOneUser);
  console.log(user);
}

// main()


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
