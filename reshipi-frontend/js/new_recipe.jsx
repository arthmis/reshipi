import React from 'react';
import ReactDom from 'react-dom';
import Directions from './components/directions.jsx';
import IngredientList from './components/ingredients.jsx';

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
                <a id="home-link" href="/recipes">Reshipi</a>
                <form id="logout-form" action="/logout" method="post">
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
                        <input className="input user-input" form="new-recipe" id="title" name="title" type="text" placeholder="Your recipe title" required /><br />
                    </div>
                    <div className="input-group">
                        <label className="label" form="new-recipe" htmlFor="description">Description</label><br />
                        <textarea className="input user-input" rows="3" form="new-recipe" id="description" name="description" type="text" placeholder="Short description of the recipe" required/><br />
                    </div>
                    <IngredientList />
                    <Directions />
                    <FoodCategory />
                    <ImageInput />
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
        this.setState((state, props) => ({value: event.target.value}))
    }

    render () {
        return (
            <div className="input-group">
                <label className="label" form="new-recipe" htmlFor="food-category">Food Type</label><br />
                <div>
                    <input 
                        className="user-input" 
                        form="new-recipe" 
                        id="title" 
                        name="food-category" 
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
        this.state = ({
            imageUrl: '',
            imageName: '',
        });
        this.handleChange = this.handleChange.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.handleFileInput = this.handleFileInput.bind(this);
    }

    handleChange (event) {
        event.preventDefault();
        const file = event.currentTarget.files[0];
        let imageName = file.name;
        const imageUrl = URL.createObjectURL(file); 
        this.setState({imageUrl, imageName});
    }

    removeImage (event) {
        event.preventDefault();
        this.setState({imageUrl: ''});
    }

    handleFileInput (event) {
        event.preventDefault();
        document.getElementById('recipe-image').click();
    }

    render () {
        if (this.state.imageUrl === '') {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="recipe-image">Image</label><br />
                    <button className="image-input-button" onClick={this.handleFileInput}>Upload Image</button>
                    <div>
                        <input style={{visibility: 'hidden'}} onChange={this.handleChange} type="file" id="recipe-image" name="recipe_image" accept=".png, .jpg, .jpeg" />
                    </div>
                </div>
            )
        } else {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="recipe-image">Image</label><br />
                    <button className="image-input-button" onClick={this.handleFileInput}>Upload Image</button>
                    <input style={{display: 'none'}} onChange={this.handleChange} type="file" id="recipe-image" name="recipe_image" accept=".png, .jpg, .jpeg" />
                    <div id="image-input">
                        <p id="image-name">{this.state.imageName}</p>
                        <img id="user-image" src={this.state.imageUrl} alt="user uploaded image" />
                        <button id="remove-image" className="image-input-button" onClick={this.removeImage}>Remove Image</button> 
                    </div>
                </div>
            );
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
ReactDom.render(<App />, root);