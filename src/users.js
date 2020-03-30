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

// require('dotenv').config();

const pg = require('pg-promise')();

'use strict';

// addUser
// deleteUser
// updateUserInfo
// readUserInfo
// addUserRecipesTable
// updateUserRecipe
// deleteUserRecipe
// addUserRecipe
// get7RandomRecipes

module.exports = (db) => {
  const users = {
    db,
    addUser: async (userData) => {
      const saltRounds = 10;

      const hashResult = await bcrypt.hash(userData.password, saltRounds)
        .catch((err) => err);

      const insertNewUser = new pg.ParameterizedQuery({
        text: `INSERT INTO Users (username, email, hash)
                VALUES ($1, $2, $3)`,
        values: [
          userData.username,
          userData.email,
          hashResult,
        ],
      });

      // insert new user into users table
      await db.none(insertNewUser).catch((err) => err);
    },

    // this function should use db.oneOrNone because when finding a user
    // it is possible the username doesn't exist and this can return None
    getUser: async (userData) => {
      const getUserHash = new pg.ParameterizedQuery({
        text: 'SELECT * FROM Users WHERE email=$1 LIMIT 1',
        values: [userData.email],
      });

      const user = await db.oneOrNone(getUserHash).catch((err) => err);
      if (user === null) {
        return null;
      }

      const match = await bcrypt.compare(userData.password, user.hash)
        .catch((err) => err);
      if (match) {
        return user;
      }
      // todo HAVE TO LOOK THIS OVER IN CASE there is no need to
      // check if password matches
      // return user;
    },

    checkCredentialsExist: async (userData) => {
      const userEmail = await db.oneOrNone(
        'SELECT email FROM Users WHERE email=$1 LIMIT 1',
        [userData.email],
      )
        .catch((err) => err);
      if (userEmail !== null) {
        return true;
      }
      return false;
    },
    isValidLogin: async (credentials) => {
      const user = await db.oneOrNone(
        'SELECT email, hash FROM Users WHERE email=$1 LIMIT 1',
        [credentials.email],
      ).catch((err) => err);

      if (user !== null) {
        const match = await bcrypt.compare(credentials.password, user.hash)
          .catch((err) => err);
        if (match) {
          return true;
        }

        return false;
      }
      return false;
    },

    deleteUser: async (userData) => {
      // checks whether user exists and whether userData is valid
      const user = await getUser(userData).catch((err) => err);
      const deleteUserStatement = new pg.ParameterizedQuery({
        text: 'DELETE FROM Users WHERE username=$1 AND email=$2 AND hash=$3 AND recipes_table=$4',
        values: [user.username, user.email, user.hash, user.recipes_table],
      });

      const deleteUserRecipesTable = new pg.ParameterizedQuery({
        text: 'DROP TABLE IF EXISTS $1:name',
        values: [user.recipes_table],
      });

      // first deletes user's recipes table before deleting user
      const result = await db.one(deleteUserRecipesTable).catch((err) => err);
      if (result) {
        return true;
      }

      // deletes user from Users table
      const count = await db.one(deleteUserStatement).catch((err) => err);
      if (count === 1) {
        return true;
      }
    },
    addRecipe: async (recipe, user, image) => {
      if (image.length === 0) {
        recipe.image = '';
      } else {
        recipe.image = image[0].path;
      }
      const insertNewRecipe = new pg.ParameterizedQuery(
        {
          text: `INSERT INTO recipes (
              username, 
              title, 
              description, 
              ingredients, 
              ingredients_amount, 
              directions, 
              food_category,
              image,
              url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          values: [
            user,
            recipe.title,
            recipe.description,
            recipe.ingredients,
            recipe.ingredient_amount,
            recipe.directions,
            recipe.food_category,
            recipe.image,
            recipe.original_url,
          ],
        },
      );

      await db.none(insertNewRecipe).catch((err) => console.log(err));
    },
    getRecipes: async (user, numberOfRecipes) => {
      const findRecipes = new pg.ParameterizedQuery(
        {
          text: 'SELECT * FROM recipes WHERE username=$1 LIMIT 15',
          values: [user],
        },
      );
      const recipesData = await db.any(findRecipes).catch((err) => err);
      const recipes = [];
      for (const recipeData of recipesData) {
        const recipe = {};
        recipe.title = recipeData.title;
        recipe.description = recipeData.description;
        recipe.ingredients = recipeData.ingredients;
        recipe.ingredients_amount = recipeData.ingredients_amount;
        recipe.directions = recipeData.directions;
        recipe.food_category = recipeData.food_category;
        recipe.original_url = recipeData.original_url;
        recipe.image = recipeData.image.replace('uploads\\', '');

        recipes.push(recipe);
      }
      return recipes;
    },
  };
  return users;
};
