import Directions from './update_recipe_components/directions.js';
import {Ingredient, IngredientList} from './update_recipe_components/ingredients.js';
import {moveElementDownList, moveElementUpList} from './utility.js';

'use strict';

class App extends React.Component {
    constructor(props) {
        super(props);
    }



    render() {
        // console.log('rendering');
        // console.log(this.state.recipe);
        return(
            <div>
                <header>
                    <Nav />
                </header>
                <main>
                    <NewRecipeForm />
                </main>
            </div>
        );
    }
}

class Nav extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return(
            <nav id="nav">
                <a id="home-link" href="/recipes">Reshipi</a>
                <form id="logout-form" action="/logout" method="get">
                    <input id="logout" type="submit" name="logout" value="Logout"/>
                </form>
            </nav>
        );
    }
}

class NewRecipeForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            recipe: {
                title: '',
                description: '',
                ingredients: [],
                ingredients_amount: [],
                directions: [],
                food_category: '',
                image: '',
                url: '',
            },
            imageUrl: '',
            imageName: '',
            image: null,
            originalImage: '',
            originalTitle: '',
            imageIsDeleted: false,
        };
        this.handleSubmit = this.handleSubmit.bind(this);

        this.handleTitle = this.handleTitle.bind(this);

        this.handleDescription = this.handleDescription.bind(this);

        this.clearImage = this.clearImage.bind(this);
        this.handleImageChange = this.handleImageChange.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.handleFileInput = this.handleFileInput.bind(this);

        this.handleUrlChange = this.handleUrlChange.bind(this);

        this.handleFoodCategory = this.handleFoodCategory.bind(this);

        this.directionsOnDrop = this.directionsOnDrop.bind(this);
        this.addDirection = this.addDirection.bind(this);
        this.updateDirections = this.updateDirections.bind(this);
        this.removeDirection = this.removeDirection.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.onDragStart = this.onDragStart.bind(this);

        this.addNewIngredientInput = this.addNewIngredientInput.bind(this);
        this.removeIngredientInput = this.removeIngredientInput.bind(this);
        this.updateIngredient = this.updateIngredient.bind(this);
        this.updateIngredientQuantity = this.updateIngredientQuantity.bind(this);
        this.onIngredientDrop = this.onIngredientDrop.bind(this)
    }

    async componentDidMount() {
        const urlKeys = new URLSearchParams(window.location.search);
        const title = urlKeys.get('title');
        const encodedTitle = encodeURIComponent(title);
        const newUrl = `/get_recipe?title=${encodedTitle}`;
        let response = await fetch(newUrl, {
            method: "GET",
            mode: 'same-origin',
            credentials: 'same-origin',
        });
        let recipe = await response.json();
        recipe.ingredients = recipe.ingredients.split('\n');
        recipe.ingredients_amount = recipe.ingredients_amount.split('\n');
        recipe.directions = recipe.directions.split('\n');

        const ingredientAndQuantity = [];
        for (let i = 0; i < recipe.ingredients.length; i += 1) {
            ingredientAndQuantity.push(new Ingredient(recipe.ingredients[i], recipe.ingredients_amount[i]))
        }

        recipe.ingredients = ingredientAndQuantity;
        delete recipe.ingredients_amount;

        this.setState((prevState, props) => {
            prevState.recipe = recipe;
            prevState.originalTitle = recipe.title;
            prevState.originalImage = recipe.image;
            prevState.imageUrl = recipe.image;

            // only update recipe image name if there is an original one
            // otherwise the made up name interferes with client
            // validation when submitting the form
            if (recipe.image !== '') {
                let imageNameSplit = recipe.image.split('.');
                let imageExtenstion = imageNameSplit[imageNameSplit.length - 1];
                prevState.imageName = `${recipe.title}.${imageExtenstion}`;
            }

            return(prevState);
        });
    }

    handleSubmit (event) {
        event.preventDefault();

        const form = ReactDOM.findDOMNode(this);

        let inputImage = document.getElementById('recipe-image');
        let split = this.state.imageName.split('.');
        if (this.state.imageName !== '') {
            if (split.length > 1) {
                let extension = split[split.length - 1].toLowerCase();
                if (extension === 'jpeg' || extension === 'jpg' || extension === 'png') {
                    inputImage.setCustomValidity('');
                } else {
                    inputImage.setCustomValidity('Image has to have a file extension of jpeg, jpg, or png.');
                }
            } else {
                inputImage.setCustomValidity('Image has to have a valid file extension.');
            }
        }

        if (form.reportValidity()) {
            let formData = new FormData(form);
            formData.append('image', this.state.image);
            formData.append('original_title', this.state.originalTitle);
            formData.append('original_image', this.state.originalImage);
            formData.append('image_is_deleted', this.state.imageIsDeleted);

            fetch('/update_recipe', {
                method: 'PUT',
                body: formData,
                mode: 'same-origin',
                credentials: 'same-origin',
            }).then(response => {
                console.log(response.body);
                document.location.href = '/recipes';
            });
        }
    }
    handleImageChange (event) {
        event.preventDefault();
        const file = event.target.files[0];
        let imageName = file.name;
        const imageUrl = URL.createObjectURL(file); 
        this.setState((prevState, props) => {
            prevState.imageUrl = imageUrl;
            prevState.imageName = imageName;
            prevState.image = file;
            prevState.recipe.image = file;
            return (prevState);
        });
    }

    removeImage (event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.imageUrl = '';
            prevState.imageName = '';
            prevState.image = null;
            // this allows the server to check if a recipe
            // image was deleted so that it will be removed
            // on the server if the image is updated or completely 
            // deleted
            if (prevState.originalImage !== '') {
                prevState.imageIsDeleted = true;
            }
            return (prevState);
        });
    }

    clearImage (event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.imageUrl = '';
            prevState.imageName = '';
            prevState.image = null;
            return (prevState);
        });
    }

    handleFileInput (event) {
        event.preventDefault();
        document.getElementById('recipe-image').click();
    }

    handleTitle(event) {
        const title = event.target; 
        if (title.value.length === 0) {
            title.setCustomValidity('Please provide a title.');
        }
        else if (title.value.trim().length === 0) {
            title.setCustomValidity('Title cannot only contain empty spaces.'); 
        } else {
            title.setCustomValidity(''); 
        }

        const value = event.target.value;
        this.setState((prevState, props) => {
            prevState.recipe.title = value;
            return (prevState);
        });
    }

    handleDescription(event) {
        const description = event.target; 
        if (description.value.length === 0) {
            description.setCustomValidity('')
        }
        else if (description.value.length > 0 && description.value.trim().length === 0) {
            description.setCustomValidity('Description cannot only contain empty spaces.');
        }
        else {
            description.setCustomValidity('');
        }

        const value = event.target.value;
        this.setState((prevState, props) => {
            prevState.recipe.description = value;
            return (prevState);
        });
    }

    handleUrlChange (event) {
        const value = event.target.value;
        this.setState((prevState, props) => {
            prevState.recipe.url = value;
            return prevState;
        });
    }

    handleFoodCategory(event) {
        const value = event.target.value;
        this.setState((prevState, props) => {
            prevState.recipe.food_category = value;
            return (prevState);
        });
    }

    addDirection(event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.recipe.directions.push('');
            return (prevState);
        })
    }

    updateDirections(index, direction) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.recipe.directions[index] = direction;
            return (prevState);
        });
    }

    removeDirection(event, index) {
        event.preventDefault();
        if (this.state.recipe.directions.length > 1) {
            this.setState((prevState, props) => {
                prevState.recipe.directions.splice(index, 1);
                return(prevState);
            });
        }
    }
    directionsOnDrop(event, dropIndex) {
        event.preventDefault();

        // dataTransfer turns the data into a DOMstring
        const element_index = Number(event.dataTransfer.getData("text/plain"));

        const directions = this.state.recipe.directions;
        const directionToDrag = directions[element_index];

        // if greater than dropIndex I will have to right shift
        // the array elements up to index
        if (element_index > dropIndex) {
            moveElementUpList(directions, element_index, dropIndex);
            // this.setState({directions});
            this.setState((prevState, props) => {
                prevState.recipe.directions = directions;
                return (prevState);
            });
        } else if (element_index < dropIndex) { // left shifts elements
            moveElementDownList(directions, element_index, dropIndex);
            // this.setState({directions});
            this.setState((prevState, props) => {
                prevState.recipe.directions = directions;
                return (prevState);
            });
        }
    }

    handleDragOver (event) {
        event.preventDefault();
    }

    onDragStart (event, index) {
        event.dataTransfer.setData("text/plain", index);
    }

    addNewIngredientInput(event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.recipe.ingredients.push(new Ingredient('', ''));
            return (prevState);
        });
    }

    removeIngredientInput(event, index) {
        event.preventDefault();
        if (this.state.recipe.ingredients.length > 1) {
            this.setState((prevState, props) => {
                prevState.recipe.ingredients.splice(index, 1);
                return (prevState);
            });
        }
    }

    updateIngredient(index, ingredient) {
        this.setState((prevState, props) => {
            prevState.recipe.ingredients[index].ingredient = ingredient;
            return (prevState);
        });
    }
    updateIngredientQuantity(index, quantity) {
        this.setState((prevState, props) => {
            prevState.recipe.ingredients[index].quantity = quantity;
            return (prevState);
        });
    }

    onIngredientDrop(event, dropIndex) {
        event.preventDefault();

        // dataTransfer turns the data into a DOMstring
        const element_index = Number(event.dataTransfer.getData("text/plain"));

        const ingredients = this.state.recipe.ingredients;

        // if greater than dropIndex I will have to right shift
        // the array elements up to index
        if (element_index > dropIndex) {
            moveElementUpList(ingredients, element_index, dropIndex);
            this.setState((prevState, props) => {
                prevState.recipe.ingredients = ingredients;
                return (prevState);
            });
            // this.setState({ingredients});
        } else if (element_index < dropIndex) { // left shifts elements
            moveElementDownList(ingredients, element_index, dropIndex);
            // this.setState({ingredients});
            this.setState((prevState, props) => {
                prevState.recipe.ingredients = ingredients;
                return (prevState);
            });
        }
    }

    render() {
        return(
            <form id="new-recipe" action="/add_recipe" onSubmit={this.handleSubmit} method="post" encType="multipart/form-data">
                <div id="form-inputs">
                    <div className="input-group">
                        <label className="label" form="new-recipe" htmlFor="title">Recipe Title</label><br />
                        <input className="input user-input" onChange={this.handleTitle} value={this.state.recipe.title} form="new-recipe" id="title" name="title" type="text" placeholder="Your recipe title" required /><br />
                    </div>
                    <div className="input-group">
                        <label 
                            className="label" 
                            form="new-recipe" 
                            htmlFor="description">Description</label><br 
                        />
                        <textarea 
                            className="input user-input" 
                            form="new-recipe" 
                            onChange={this.handleDescription} 
                            value={this.state.recipe.description} 
                            rows="3" 
                            form="new-recipe" 
                            id="description" 
                            name="description" 
                            type="text" 
                            placeholder="Short description of the recipe" /><br 
                        />
                    </div>
                    <IngredientList 
                        ingredients={this.state.recipe.ingredients} 
                        ingredientsAmount={this.state.recipe.ingredients_amount}
                        addNewIngredientInput={this.addNewIngredientInput}
                        removeIngredientInput={this.removeIngredientInput}
                        updateIngredient={this.updateIngredient}
                        updateIngredientQuantity={this.updateIngredientQuantity}
                        onDrop={this.onIngredientDrop}
                        onDragStart={this.onDragStart}
                        handleDragOver={this.handleDragOver}
                    />
                    <Directions 
                        directions={this.state.recipe.directions} 
                        addDirection={this.addDirection}
                        removeDirection={this.removeDirection}
                        updateDirections={this.updateDirections}
                        onDrop={this.directionsOnDrop}
                        onDragStart={this.onDragStart}
                        handleDragOver={this.handleDragOver}
                    />
                    <FoodCategory foodCategory={this.state.recipe.food_category} handleFoodCategory={this.handleFoodCategory} />
                    <ImageInput 
                        handleImageChange={this.handleImageChange} 
                        removeImage={this.removeImage} 
                        handleFileInput={this.handleFileInput}
                        imageUrl={this.state.imageUrl}
                        imageName={this.state.imageName}
                        clearImage={this.clearImage}
                    />
                    <OriginalUrl url={this.state.recipe.url} handleUrlChange={this.handleUrlChange} />
                    <input id="submit-button" type="submit" value="Update Recipe" />
                </div>
            </form>
        );
    }
}


class FoodCategory extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({value: ''});
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        event.preventDefault();
        const foodType = event.target;
        if (foodType.value.trim().length === 0) {
            foodType.setCustomValidity("Food category cannot contain only empty spaces.");
        } else {
            foodType.setCustomValidity('');
        }
        const value = event.target.value;
        this.setState(({value}));
    }

    render () {
        return (
            <div className="input-group">
                <label className="label" form="new-recipe" htmlFor="food-category">Food Type</label><br />
                <div>
                    <input 
                        className="user-input" 
                        form="new-recipe" 
                        id="food-category" 
                        name="food_category" 
                        type="text" 
                        onChange={this.props.handleFoodCategory} 
                        value={this.props.foodCategory}
                        placeholder='"Italian", "French", "Japanese".'
                    />
                    <br />
                </div>
            </div>
        )
    }


}

class ImageInput extends React.Component {
    constructor(props) {
        super(props);
    }

    render () {
        let imageName = this.props.imageName;
        let extension = '';
        const imageNameSplit = imageName.split('.');

        if (imageNameSplit.length > 1) {
            extension = imageNameSplit[imageNameSplit.length - 1].toLowerCase();
        }

        if (this.props.imageUrl === '') {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="recipe-image">Image</label><br />
                    <button className="image-input-button" onClick={this.props.handleFileInput}>Upload Image</button>
                    <div>
                        <input 
                            style={{visibility: 'hidden'}} 
                            onChange={this.props.handleImageChange} 
                            type="file" 
                            id="recipe-image" 
                            name="recipe_image" 
                            accept=".png, .jpg, .jpeg" 
                            form="new-recipe"
                            htmlFor="new-recipe"
                        />
                    </div>
                </div>
            )
        } else {
            if (extension === 'jpeg' || extension === 'jpg' || extension === 'png') {
                return (
                    <div className="input-group">
                        <label className="label" form="new-recipe" htmlFor="recipe-image">Image</label><br />
                        <button className="image-input-button" onClick={this.props.handleFileInput}>Upload Image</button>
                        <input 
                            style={{visibility: 'hidden'}} 
                            onChange={this.props.handleImageChange} 
                            type="file" 
                            id="recipe-image" 
                            name="recipe_image" 
                            accept=".png, .jpg, .jpeg" 
                            form="new-recipe"
                            htmlFor="new-recipe"
                        />
                        <div id="image-input">
                            <img id="user-image" src={this.props.imageUrl} alt="recipe image" />
                            <p id="image-name">{this.props.imageName}</p>
                            <button id="remove-image" className="image-input-button" onClick={this.props.removeImage}>Remove Image</button> 
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="input-group">
                        <label className="label" form="new-recipe" htmlFor="recipe-image">Image</label><br />
                        <button className="image-input-button" onClick={this.props.handleFileInput}>Upload Image</button>
                        <p id="invalid-image">
                            Please provide a jpeg or png file with a valid jpg, jpeg, or png file extension.
                        </p>
                        <button id="remove-invalid-image" onClick={this.props.clearImage}>Remove Invalid Image</button>
                        <div>
                            <input 
                                style={{visibility: 'hidden'}} 
                                onChange={this.props.handleImageChange} 
                                type="file" 
                                id="recipe-image" 
                                name="recipe_image" 
                                accept=".png, .jpg, .jpeg" 
                                form="new-recipe"
                                htmlFor="new-recipe"
                            />
                        </div>
                    </div>
                )
            }
        }
    }
}

class OriginalUrl extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({value: ''});
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange (event) {
        this.setState({value: event.target.value});
    }

    render () {
        return (
            <div className="input-group">
                <label className="label" form="new-recipe" htmlFor="original-url">Original link</label><br />
                <div>
                    <input value={this.props.url} className="user-input" onChange={this.props.handleUrlChange} type="url" id="original-url" name="original_url" placeholder="Link to original recipe if any" />
                </div>
            </div>
        )
    }
}

const root = document.getElementById("root");
ReactDOM.render(<App />, root);
