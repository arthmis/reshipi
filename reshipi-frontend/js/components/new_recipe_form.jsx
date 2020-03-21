import React from 'react';
import Directions from './directions.jsx';
import {IngredientList, Ingredient} from './ingredients.jsx';
import {ImageInput, FoodCategory, OriginalUrl} from './other_components.jsx';

export default class NewRecipeForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            recipeTitle: '',
            description: '',
            ingredients: [],
            directions: [],
            foodCategory: '',
            imageInput: {
                url: '',
                name: '',
            },
            originalUrl: '',
        };
        this.handleFoodCategoryInput = this.handleFoodCategoryInput.bind(this);
        this.handleTitleInput = this.handleTitleInput.bind(this);
        this.handleDescriptionInput = this.handleDescriptionInput.bind(this);
        this.handleImageChange = this.handleImageChange.bind(this);
        this.handleImageFileInput = this.handleImageFileInput.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.handleOriginalUrlChange = this.handleOriginalUrlChange.bind(this); 
    }

    handleTitleInput(event) {
        const value = event.target.value;
        this.setState((prevState, props) => {
            prevState.recipeTitle = value;
            return (prevState); 
        });
    }

    handleDescriptionInput(event) {
        const value = event.target.value;
        this.setState((prevState, props) => {
            prevState.description = value;
            return (prevState); 
        });
    }

    handleFoodCategoryInput(event) {
        const value = event.target.value;
        this.setState((prevState, props) => {
            prevState.foodCategory = value;
            return (prevState); 
        });
    }

    handleImageChange (event) {
        event.preventDefault();
        const file = event.currentTarget.files[0];
        let imageName = file.name;
        const imageUrl = URL.createObjectURL(file); 
        this.setState((prevState, props) => {
            prevState.imageInput.name = imageName;
            prevState.imageInput.url = imageUrl;
            return (prevState);
        });
    }

    removeImage (event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.imageInput = {
                name: '',
                url: '',
            };
            return (prevState);
        });
    }

    handleImageFileInput (event) {
        event.preventDefault();
        document.getElementById('recipe-image').click();
    }

    handleOriginalUrlChange (event) {
        const value = event.target.value;
        this.setState((prevState, props) => {
            prevState.originalUrl = value;
            return (prevState);
        });
    }

    handleSubmit(event) {
        event.preventDefault();

        fetch('/add_recipe', {
            method: "POST",
            body: JSON.stringify(userData),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(response => {
            console.log("submitted");
        })
    }

    render() {
        return(
            <form id="new-recipe" action="/add_recipe" method="post">
            {/* // <form onSubmit={this.handleSubmit} id="new-recipe"> */}
                <div id="form-inputs">
                    <div className="input-group">
                        <label className="label" form="new-recipe" htmlFor="title">Recipe Title</label><br />
                        <input onChange={this.handleTitleInput} className="input user-input" form="new-recipe" id="title" name="title" type="text" placeholder="Your recipe title" required /><br />
                    </div>
                    <div className="input-group">
                        <label className="label" form="new-recipe" htmlFor="description">Description</label><br />
                        <textarea onChange={this.handleDescriptionInput} className="input user-input" rows="3" form="new-recipe" id="description" name="description" type="text" placeholder="Short description of the recipe" required/><br />
                    </div>
                    <IngredientList />
                    <Directions />
                    <FoodCategory handleFoodCategoryInput={this.handleFoodCategoryInput}/>
                    <ImageInput 
                        removeImage={this.removeImage}
                        handleImageChange={this.handleImageChange}
                        handleImageFileInput={this.handleImageFileInput}
                        name={this.state.imageInput.name}
                        url={this.state.imageInput.url}
                    />
                    <OriginalUrl handleOriginalUrlChange={this.handleOriginalUrlChange}/>
                    <input id="submit-button" type="submit" value="Save Recipe" />
                </div>
            </form>
        );
    }
}