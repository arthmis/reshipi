'use strict';

class Nav extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return(
            <nav id="nav">
                <a id="reshipi" href="/recipes">Reshipi</a>
                <form action="/logout" method="get">
                    <input id="logout" type="submit" name="logout" value="Logout"/>
                </form>
            </nav>
        );
    }
}

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
                    <h2>Reshipi recipe cards</h2>
                    <AddNewRecipe />
                    <Recipes />
                </main>
            </div>
        );
    }
}

class AddNewRecipe extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <form action="/new_recipe" method="get">
                <input id="new-recipe" type="submit" name="new_recipe" value="Add new recipe"/>
            </form>
        )
    }
}

class Recipes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            recipes: [],
        }
        this.deleteRecipe = this.deleteRecipe.bind(this);
        this.editRecipe = this.editRecipe.bind(this);
    }

    componentDidMount() {
        fetch('/all_recipes', {
            method: "GET",
            mode: 'same-origin',
            credentials: 'same-origin',
        })
        .then(response => response.json())
        .then(recipes => { this.setState({ recipes })});
    }

    async deleteRecipe (recipeTitle) {
        const formData = new FormData();
        formData.append('title', recipeTitle);

        await fetch('/delete_recipe', {
            method: "DELETE",
            body: formData,
            mode: 'same-origin',
            credentials: 'same-origin',
        });

        let allRecipes = await fetch('/all_recipes', {
                method: "GET",
                mode: 'same-origin',
                credentials: 'same-origin',
        });
        allRecipes = await allRecipes.json();
        this.setState({recipes: allRecipes});
    }
    async editRecipe(recipeTitle) {
        const formData = new FormData();
        formData.append('title', recipeTitle);

        const encodedTitle = encodeURIComponent(recipeTitle);
        const newUrl = `/edit_recipe?title=${encodedTitle}`;

        await fetch(newUrl, {
            method: "GET",
            mode: 'same-origin',
            credentials: 'same-origin',
        });
        document.location.href = newUrl;
    }

    render() {
        return (
            <div className="all-recipes">
                {this.state.recipes.map((recipe, index) => {
                    return (
                        <Recipe 
                            key={index.toString()} 
                            recipe={recipe} 
                            deleteRecipe={this.deleteRecipe} 
                            editRecipe={this.editRecipe}
                        />
                    );
                })}
            </div>
        )
    }
}

class Recipe extends React.Component {
    constructor(props) {
        super(props);
    }

    render () {
        return (
            <div className="recipe-wrapper">
                <div className="recipe-title-wrapper">
                    <h3>{this.props.recipe.title}</h3>
                    <RecipeMenu 
                        recipeTitle={this.props.recipe.title} 
                        deleteRecipe={this.props.deleteRecipe} 
                        editRecipe={this.props.editRecipe} 
                    />
                </div>
                <img className="recipe-image" src={this.props.recipe.image} alt="recipe image" />
                <p className="description">{this.props.recipe.description}</p>
            </div>
        )
    }
}

class RecipeMenu extends React.Component {
    constructor(props) {
        super(props); 
        this.state = {
            menu: 'invisible',
        };
        this.handleDropDown = this.handleDropDown.bind(this);
        this.deleteRecipe = this.deleteRecipe.bind(this);
        this.editRecipe = this.editRecipe.bind(this);
    }

    handleDropDown (event) {
        event.preventDefault();
        if (this.state.menu === 'invisible') {
            this.setState({menu: 'visible'});
        } else if (this.state.menu === 'visible') {
            this.setState({menu: 'invisible'});
        }
    }

    deleteRecipe (event) {
        event.preventDefault();
        this.setState({menu: 'invisible'});
        this.props.deleteRecipe(this.props.recipeTitle);
    }

    editRecipe(event) {
        event.preventDefault();
        this.setState({menu: 'invisible'});
        this.props.editRecipe(this.props.recipeTitle);
    }

    render () {
        if (this.state.menu === 'invisible') {
            return (
                <div>
                    <button onClick={this.handleDropDown} className="recipe-menu"><i className="fas fa-ellipsis-v" aria-hidden="true"></i></button>
                </div>
            )
        } else {
            return (
                <div className="recipe-dropdown">
                    <button onClick={this.handleDropDown} className="recipe-menu"><i className="fas fa-ellipsis-v" aria-hidden="true"></i></button>
                    <div className="recipe-buttons">
                        <button onClick={this.deleteRecipe}>Delete</button>
                        <button onClick={this.editRecipe}>Edit</button>
                    </div>
                </div>
            )
        }
    }
}

const root = document.getElementById("root");
ReactDOM.render(<App />, root);