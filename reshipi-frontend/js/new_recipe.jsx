import Directions from './create_recipe_components/directions.jsx';
import IngredientList from './create_recipe_components/ingredients.jsx';
import React from 'react';
import ReactDOM from 'react-dom';

'use strict';

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
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
                <a id="home-link" href="/recipes">RE&middot;SHI&middot;PI</a>
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
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            title: '',
            description: '',
            imageUrl: '',
            imageName: '',
            image: null,
        };
        this.handleImageChange = this.handleImageChange.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.handleFileInput = this.handleFileInput.bind(this);
        this.handleTitle = this.handleTitle.bind(this);
        this.handleDescription = this.handleDescription.bind(this);
        this.clearImage = this.clearImage.bind(this);
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

        let recipeTitle = new FormData();
        recipeTitle.append("title", this.state.title);
        fetch('/check_duplicate_recipe', {
            method: "POST",
            body: recipeTitle,
            mode: 'same-origin',
            credentials: 'same-origin',
        })
        .then((response) => response.json())
        .then((result) => {
            if (result.isDuplicate) {
                title.setCustomValidity('That recipe name is already in use.');
            } else {
                title.setCustomValidity('');
            }

            if (form.reportValidity()) {
                let formData = new FormData(form);
                formData.append("image", this.state.image);
                fetch('/add_recipe', {
                    method: "POST",
                    body: formData,
                    mode: 'same-origin',
                    credentials: 'same-origin',
                }).then(response => {
                    document.location.href = '/recipes';
                });
            }
        });
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
            return (prevState);
        });
    }

    removeImage (event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.imageUrl = '';
            prevState.imageName = '';
            prevState.image = null;
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
        const value = event.target.value;

        if (value.length === 0) {
            title.setCustomValidity('Please provide a title.');
        }
        else if (value.trim().length === 0) {
            title.setCustomValidity('Title cannot only contain empty spaces.'); 
        } 
        else {
            title.setCustomValidity(''); 
        }

        this.setState((prevState, props) => {
            prevState.title = value;
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
            prevState.description = value;
            return (prevState);
        });
    }

    render() {
        return(
            <form id="new-recipe" action="/add_recipe" onSubmit={this.handleSubmit} method="post" encType="multipart/form-data">
                <div id="form-inputs">
                    <div className="input-group">
                        <label className="label" form="new-recipe" htmlFor="title">Recipe Title</label><br />
                        <input className="input user-input" onChange={this.handleTitle} value={this.state.title} form="new-recipe" id="title" name="title" type="text" placeholder="Your recipe title" required /><br />
                    </div>
                    <div className="input-group">
                        <label className="label" form="new-recipe" htmlFor="description">Description</label><br />
                        <textarea className="input user-input" form="new-recipe" onChange={this.handleDescription} value={this.state.description} rows="3" form="new-recipe" id="description" name="description" type="text" placeholder="Short description of the recipe" /><br />
                    </div>
                    <IngredientList />
                    <Directions />
                    <FoodCategory />
                    <ImageInput 
                        handleImageChange={this.handleImageChange} 
                        removeImage={this.removeImage} 
                        handleFileInput={this.handleFileInput}
                        imageUrl={this.state.imageUrl}
                        imageName={this.state.imageName}
                        clearImage={this.clearImage}
                    />
                    <OriginalUrl />
                    <input id="submit-button" type="submit" value="Save Recipe" />
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
                        onChange={this.handleInput} 
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
                    <div id="image-input-button">
                        <button className="image-input-button" onClick={this.props.handleFileInput}>Upload Image</button>
                        <div>Max file size: 1mb</div>
                    </div>
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
                            <img id="user-image" src={this.props.imageUrl} alt="user uploaded image" />
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
                    <input className="user-input" onChange={this.handleChange} type="url" id="original-url" name="original_url" placeholder="Link to original recipe if any" />
                </div>
            </div>
        )
    }
}

const root = document.getElementById("root");
ReactDOM.render(<App />, root);