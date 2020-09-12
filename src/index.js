require('dotenv').config();

const fs = require('fs');
const express = require('express');
const pgp = require('pg-promise')();

const db = pgp(process.env.DATABASE_URL);

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
  logger.info("Created Users table if it doesn't exist");

  await db.none(createRecipesTable).catch((err) => {
    throw err;
  });
  logger.info("Created Recipes table if it doesn't exist");

  await db.none(createSessionsTable).catch((err) => {
    throw err;
  });
  logger.info("Created Sessions table if it doesn't exist");

  app.use(express.static('reshipi-frontend'));
  try {
    if (!fs.existsSync('../uploads')) {
      fs.mkdirSync('../uploads');
      logger.info('Upload folder created.');
    }
  } catch (err) {
    logger.error(err.stack);
  }
  app.use(express.static('../uploads'));
  app.listen(port, 'localhost');
}

main()
  .then(() => {
    logger.info('Starting server!');
  })
  .catch((err) => {
    logger.error(err.stack);
  });
