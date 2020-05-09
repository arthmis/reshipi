const bcrypt = require('bcrypt');

const pg = require('pg-promise')();

module.exports = (db) => {
  const users = {
    db,
    addUser: async (userData) => {
      const saltRounds = 10;

      const hashResult = await bcrypt.hash(userData.password, saltRounds)
        .catch((err) => { throw err; });

      const insertNewUser = new pg.ParameterizedQuery({
        text: `INSERT INTO Users (email, hash)
                VALUES ($1, $2)`,
        values: [userData.email, hashResult],
      });

      // insert new user into users table
      await db.none(insertNewUser).catch((err) => { throw err; });
    },

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
        .catch((err) => { throw err; });
      if (userEmail !== null) {
        return true;
      }
      return false;
    },

    isValidLogin: async (credentials) => {
      const user = await db.oneOrNone(
        'SELECT email, hash FROM Users WHERE email=$1 LIMIT 1',
        [credentials.email],
      ).catch((err) => { throw err; });

      if (user !== null) {
        const match = await bcrypt.compare(credentials.password, user.hash);
        if (match) {
          return true;
        }

        return false;
      }
      return false;
    },

    deleteUser: async (userData) => {
      // checks whether user exists and whether userData is valid
      const user = await getUser(userData).catch((err) => { throw err; });
      const deleteUserStatement = new pg.ParameterizedQuery({
        text: 'DELETE FROM Users WHERE username=$1 AND email=$2 AND hash=$3 AND recipes_table=$4',
        values: [user.username, user.email, user.hash, user.recipes_table],
      });

      const deleteUserRecipesTable = new pg.ParameterizedQuery({
        text: 'DROP TABLE IF EXISTS $1:name',
        values: [user.recipes_table],
      });

      // first deletes user's recipes table before deleting user
      const result = await db.one(deleteUserRecipesTable).catch((err) => { throw err; });
      if (result) {
        return true;
      }

      // deletes user from Users table
      const count = await db.one(deleteUserStatement).catch((err) => { throw err; });
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

      await db.none(insertNewRecipe).catch((err) => { throw err; });
    },
    getRecipes: async (user) => {
      const findRecipes = new pg.ParameterizedQuery(
        {
          text: 'SELECT title, image FROM recipes WHERE username=$1',
          values: [user],
        },
      );
      const recipesData = await db.any(findRecipes).catch((err) => { throw err; });
      const recipes = [];
      for (const recipeData of recipesData) {
        const recipe = {};
        recipe.title = recipeData.title;
        recipe.image = recipeData.image.replace('\\', '/');
        recipe.image = recipe.image.replace('uploads/', '');

        recipes.push(recipe);
      }
      return recipes;
    },

    // needs user argument to know which user recipes to search under
    getRecipe: async (recipeTitle, user) => {
      const recipe = await db.one(
        'SELECT title, description, ingredients, ingredients_amount, directions, food_category, image, url FROM Recipes WHERE title = $1 AND username = $2',
        [recipeTitle, user],
      ).catch((err) => {
        throw err;
      });

      recipe.image = recipe.image.replace('\\', '/');
      recipe.image = recipe.image.replace('uploads/', '');
      return recipe;
    },

    // needs user argument to know which user recipes to search under
    isDuplicateTitle: async (recipeTitle) => {
      const title = await db.oneOrNone(
        'SELECT title FROM Recipes WHERE LOWER(title) = LOWER($1)',
        [recipeTitle],
      ).catch((err) => {
        throw err;
      });

      if (title) {
        return true;
      }

      return false;
    },

    isImageNameDuplicate: async (imageName) => {
      const findImageName = await db.oneOrNone(
        'SELECT image FROM Recipes WHERE image = $1',
        [imageName],
      ).catch((err) => {
        throw err;
      });

      if (findImageName) {
        return true;
      }

      return false;
    },

    deleteRecipe: async (recipeTitle, user) => {
      const queryResult = await db.result(
        'DELETE FROM Recipes WHERE title = $1 AND username = $2', [recipeTitle, user],
      ).catch((err) => {
        throw err;
      });

      const count = queryResult.rowCount;

      if (count === 1) {
        return true;
      }

      return false;
    },

    updateRecipe: async (recipe, user, image) => {
      if (image.length !== 0) {
        recipe.image = image[0].path;
      } else if (recipe.original_image.length > 0) {
        if (recipe.image_is_deleted === 'true') {
          recipe.image = '';
        } else {
          recipe.image = `uploads/${recipe.original_image}`;
        }
      } else {
        recipe.image = '';
      }

      const updateRecipe = new pg.ParameterizedQuery(
        {
          text: `
            UPDATE recipes
            SET 
              title = $1, 
              description = $2, 
              ingredients = $3, 
              ingredients_amount = $4, 
              directions = $5, 
              food_category = $6,
              image = $7,
              url = $8
            WHERE username=$9 and title=$10
          `,
          values: [
            recipe.title,
            recipe.description,
            recipe.ingredients,
            recipe.ingredient_amount,
            recipe.directions,
            recipe.food_category,
            recipe.image,
            recipe.original_url,
            user,
            recipe.original_title,
          ],
        },
      );

      await db.none(updateRecipe).catch((err) => { throw err; });
    },
  };
  return users;
};
