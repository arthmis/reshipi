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

const pg = require('pg-promise')();

const db = pg(process.env.DATABASE_URL);

'use strict'

// addUser
// deleteUser
// updateUserInfo
// readUserInfo
// addUserRecipesTable
// updateUserRecipe
// deleteUserRecipe
// addUserRecipe
// get7RandomRecipes

// let userCS = new pg.helpers.ColumnSet(['username', 'email', 'hash', 'recipes_table']);

class User {
  constructor(username, email, hash) {
    this.username = username;
    this.email = email;
    this.hash = hash;
  }
}

async function addUser(userData) {
  const saltRounds = 10;

  const hashResult = await bcrypt.hash(userData.password, saltRounds).catch((err) => { return err; });

  const insertNewUser = new pg.ParameterizedQuery({
    text: `INSERT INTO Users (username, email, hash)
            VALUES ($1, $2, $3)`,
    values: [
      userData.username,
      userData.email,
      hashResult
    ],
  });

  // insert new user into users table
  await db.none(insertNewUser).catch((err) => {return err;});
}

// this function should use db.oneOrNone because when finding a user
// it is possible the username doesn't exist and this can return None
async function getUser(userData) {
  const getUserHash = new pg.ParameterizedQuery({
    text: 'SELECT * FROM Users WHERE username=$1 LIMIT 1',
    values: [userData.username],
  });

  const user = await db.oneOrNone(getUserHash).catch((err) => {return err;});
  if (user === null) {
    return null;
  }

  const match = await bcrypt.compare(userData.password, user.hash).catch((err) => {return err;});
  if (match) {
    return user;
  }
}

async function checkCredentialsExist(userData) {
  const user_username = await db.oneOrNone(
    `SELECT * FROM Users WHERE username=$1 LIMIT 1`, 
    [userData.username]
  ).catch((err) => {return err});
  const user_email = await db.oneOrNone(`SELECT * FROM Users WHERE email=$1 LIMIT 1`, [userData.email])
    .catch((err) => {return err});
  return [user_username, user_email];
}

async function deleteUser(userData) {
  try {
    // checks whether user exists and whether userData is valid
    const user = await getUser(userData);
    const deleteUserStatement = new pg.ParameterizedQuery({
      text: 'DELETE FROM Users WHERE username=$1 AND email=$2 AND hash=$3 AND recipes_table=$4',
      values: [user.username, user.email, user.hash, user.recipes_table],
    });

    const deleteUserRecipesTable = new pg.ParameterizedQuery({
      text: 'DROP TABLE IF EXISTS $1:name',
      values: [user.recipes_table],
    });

    try {
      // first deletes user's recipes table before deleting user
      const result = await db.one(deleteUserRecipesTable);
      if (result) {
        return true;
      }
    } catch (err) {
      return err;
    }

    try {
      // deletes user from Users table
      const count = await db.one(deleteUserStatement);
      if (count === 1) {
        return true;
      }
    } catch (err) {
      return err;
    }

  } catch (err) {
    return err;
  }
}

exports.addUser = addUser;
exports.getUser = getUser;
exports.checkCredentialsExist = checkCredentialsExist;
exports.deleteUser = deleteUser;
exports.db = db;
exports.User = User;