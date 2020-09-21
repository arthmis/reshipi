require('dotenv').config();

const fs = require('fs');
const express = require('express');
const pgp = require('pg-promise')();

const db = pgp(process.env.DATABASE_URL);

const { Client } = require('@elastic/elasticsearch');
const searchClient = new Client({ node: 'http://localhost:9200' });

const users = require('./users.js')(db);
const { app } = require('./app.js')(users, db);
const logger = require('./log.js');

logger.logger.emitErrs = false;

// const port = process.env.PORT;
const port = 8000;

process.on('uncaughtException', (err) => {
  logger.error(err.stack);
  // send email
  process.exit(1);
  // restart
});

process.on('unhandledRejection', (err) => {
  logger.error(err.stack);
  // send email
  process.exit(1);
  // restart
});

async function main() {
  const createUserTable = `CREATE TABLE IF NOT EXISTS
    Users(
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      hash TEXT NOT NULL
    )`;

  const createRecipesTable = `CREATE TABLE IF NOT EXISTS
    Recipes(
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      recipe JSONB NOT NULL
    )`;

  // need to put unique for sid or will get error
  const createSessionsTable = `CREATE TABLE IF NOT EXISTS
    Sessions(
      sid VARCHAR UNIQUE,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )`;

  await db.none(createUserTable).catch((err) => {
    throw err;
  });
  // logger.info("Created Users table if it doesn't exist");

  await db.none(createRecipesTable).catch((err) => {
    throw err;
  });
  // logger.info("Created Recipes table if it doesn't exist");

  await db.none(createSessionsTable).catch((err) => {
    throw err;
  });
  // logger.info("Created Sessions table if it doesn't exist");

  try {
    if (!fs.existsSync('../uploads')) {
      fs.mkdirSync('../uploads');
      logger.info('Upload folder created.');
    }
  } catch (err) {
    logger.error(err.stack);
  }

  const recipeIndexDoesExist = await searchClient.indices.exists({
    index: 'recipes',
  });
  if (recipeIndexDoesExist.statusCode === 404) {
    await searchClient.indices.create({
      index: 'recipes',
      body: {
        mappings: {
          properties: {
            email: { type: 'keyword' },
            title: { type: 'text' },
            description: { type: 'text' },
            ingredients: { type: 'text' },
            ingredient_amount: { type: 'text' },
            directions: { type: 'text' },
          }
        }
      }
    });
  }
  app.use(express.static('../uploads'));
  app.use(express.static('reshipi-frontend'));
  app.listen(port, 'localhost');
}

main()
  .then(() => {
    logger.info('Starting server!');
  })
  .catch((err) => {
    logger.error(err.stack);
  });
