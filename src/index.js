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


const pgp = require('pg-promise')();

const db = pgp(process.env.DATABASE_URL);

const users = require('./users.js')(db);
const { app } = require('./app.js')(users, db);

const port = 8000;

async function main() {
  const createUserTable = `CREATE TABLE IF NOT EXISTS
    Users(
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      hash TEXT NOT NULL
    )`;

  const createRecipesTable = `CREATE TABLE IF NOT EXISTS
    Recipes(
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      ingredients_amount TEXT NOT NULL,
      directions TEXT NOT NULL,
      food_category TEXT,
      image TEXT NOT NULL,
      url TEXT NOT NULL
    )`;

  // need to put unique for sid or will get error
  const createSessionsTable = `CREATE TABLE IF NOT EXISTS
    Sessions(
      sid VARCHAR UNIQUE,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )`;


  await db.none(createUserTable).catch((err) => err);
  await db.none(createRecipesTable).catch((err) => err);
  await db.none(createSessionsTable).catch((err) => err);

  app.use(express.static('reshipi-frontend'));
  app.use(express.static('uploads'));
  app.listen(port);

  return null;
}


main()
  .then((err) => {
    if (err === null) {
      console.log('Starting server!');
      return;
    }

    console.log(err);
  });
