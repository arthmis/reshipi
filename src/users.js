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
  constructor(username, email, hash, recipesTable) {
    this.username = username;
    this.email = email;
    this.hash = hash;
    this.recipesTable = recipesTable;
  }
}

async function addUser(userData) {
  const saltRounds = 10;

  try {
    const hashResult = await bcrypt.hash(userData.password, saltRounds);
    const recipeTable = `${userData.username}_recipes`;
    const newUser = new User(userData.username, userData.email, hashResult, recipeTable);

    // sql code to create user recipes table
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
      [newUser.recipesTable],
    );

    // create table for user recipes
    try {
      await db.none(createUserRecipesTable);
    } catch (err) {
      return err;
    }

    const insertNewUser = new pg.ParameterizedQuery({
      text: `INSERT INTO Users (username, email, hash, recipes_table)
              VALUES ($1, $2, $3, $4)`,
      values: [
        newUser.username,
        newUser.email,
        newUser.hash,
        newUser.recipesTable,
      ],
    });

    // const values = [{
    //   username: userData.username,
    //   email: userData.email,
    //   hash: hashResult,
    //   recipes_table: recipeTable,   
    // }];
    // const query = pg.helpers.insert(values, userCS);

    // insert new user into users table
    try {
      await db.none(insertNewUser);
    } catch (err) {
      return err;
    }
  } catch (err) {
    return err;
  }
}

async function validateUser(userData) {
  const getUserHash = new pg.ParameterizedQuery({
    text: 'SELECT * FROM Users WHERE username=$1 LIMIT 1',
    values: [userData.username],
  });

  try {
    const user = await db.one(`SELECT * FROM Users WHERE username=$1 LIMIT 1`, [userData.username]);
    try {
      const match = await bcrypt.compare(userData.password, user.hash);
      if (match) {
        return (null, user);
      }
      return new Error('user not found');
    } catch (err) {
      return err;
    }
  } catch (err) {
    return err;
  }
}

async function getUser(userData) {
  try {
    const user_username = await db.oneOrNone(`SELECT * FROM Users WHERE username=$1 LIMIT 1`, [userData.username]);
    const user_email = await db.oneOrNone(`SELECT * FROM Users WHERE email=$1 LIMIT 1`, [userData.email]);
    return [user_username, user_email];
  } catch (err) {
    return err;
  }
}

async function deleteUser(userData) {
  try {
    // checks whether user exists and whether userData is valid
    const user = await validateUser(userData);
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
exports.validateUser = validateUser;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
exports.db = db;
exports.User = User;