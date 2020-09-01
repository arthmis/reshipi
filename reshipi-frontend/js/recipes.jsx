'use strict';

class Nav extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <nav id="nav">
                <a id="reshipi" href="/recipes">RE&middot;SHI&middot;PI</a>
                <form id="logout-form" action="/logout" method="post">
                    <input id="logout" type="submit" name="logout" value="Logout" />
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
        return (
            <div>
                <header>
                    <Nav />
                </header>
                <Recipes />
            </div>
        );
    }
}

class SearchRecipes extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="search">
                <input type="text" placeholder="Search" onChange={this.props.searchRecipes} />
            </div>
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
        this.searchRecipes = this.searchRecipes.bind(this);
    }

    componentDidMount() {
        fetch('/all_recipes', {
            method: "GET",
            mode: 'same-origin',
            credentials: 'same-origin',
        })
            .then(response => response.json())
            .then(res => {
                const recipes = res.recipes;
                const substituteImages = res.images;
                for (let i = 0; i < recipes.length; i += 1) {
                    if (recipes[i].image === '') {
                        let ranNumber = Math.round((Math.random() * (substituteImages.length - 1)));
                        recipes[i].image = substituteImages[ranNumber];
                    }
                }
                this.setState({ recipes });
            });
    }

    async deleteRecipe(recipeTitle) {
        const formData = new FormData();
        formData.append('title', recipeTitle);

        await fetch('/delete_recipe', {
            method: "DELETE",
            body: formData,
            mode: 'same-origin',
            credentials: 'same-origin',
        });

        let recipes = await fetch('/all_recipes', {
            method: "GET",
            mode: 'same-origin',
            credentials: 'same-origin',
        });

        recipes = await recipes.json();
        recipes = recipes.recipes;
        this.setState({ recipes });
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

    async searchRecipes(event) {
        event.preventDefault();

        const searchParameters = event.target.value;

        const newUrl = `/search_recipes?search=${searchParameters}`;

        const res = await fetch(newUrl, {
            method: 'GET',
            mode: 'same-origin',
            credentials: 'same-origin',
        });

        if (res.ok) {
            const recipes = await res.json();

            this.setState((prevState, props) => {
                prevState.recipes = recipes;
                return (prevState);
            });
        } else {
            this.setState((prevState, props) => {
                prevState.recipes = [];
                return (prevState);
            });
        }
    }

    render() {
        return (
            <main>
                <div id="search-and-new-recipe">
                    <SearchRecipes searchRecipes={this.searchRecipes} />
                    <form action="/new_recipe" method="get">
                        <button id="new-recipe" type="submit" name="new_recipe" value="New ">
                            <i className="fas fa-plus"></i> New Recipe
                        </button>
                    </form>
                </div>
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
            </main>
        )
    }
}

class Recipe extends React.Component {
    constructor(props) {
        super(props);
        this.recipeLink = this.recipeLink.bind(this);
    }

    async recipeLink(event) {
        event.preventDefault();

        let recipeTitle = this.props.recipe.title;
        const formData = new FormData();
        formData.append('title', recipeTitle);

        const encodedTitle = encodeURIComponent(recipeTitle);
        const newUrl = `/recipe?title=${encodedTitle}`;

        let result = await fetch(newUrl, {
            method: "GET",
            mode: 'same-origin',
            credentials: 'same-origin',
        });
        document.location.href = newUrl;
    }

    render() {
        if (this.props.recipe.image === undefined) {
            return (<div></div>);
        } else {
            if (this.props.recipe.image.split('.')[1] === 'svg') {
                return (
                    <div className="recipe-wrapper">
                        <img className="recipe-image svg-recipe-image" src={this.props.recipe.image} alt="recipe image" />
                        <div className="recipe-title-wrapper">
                            <h3>
                                <a onClick={this.recipeLink} href="/recipe">{this.props.recipe.title}</a>
                            </h3>
                            <RecipeMenu
                                recipeTitle={this.props.recipe.title}
                                deleteRecipe={this.props.deleteRecipe}
                                editRecipe={this.props.editRecipe}
                            />
                        </div>
                    </div>
                )
            }
            else {
                return (
                    <div className="recipe-wrapper">
                        <img className="recipe-image" src={this.props.recipe.image} alt="recipe image" />
                        <div className="recipe-title-wrapper">
                            <h3>
                                <a onClick={this.recipeLink} href="/recipe">{this.props.recipe.title}</a>
                            </h3>
                            <RecipeMenu
                                recipeTitle={this.props.recipe.title}
                                deleteRecipe={this.props.deleteRecipe}
                                editRecipe={this.props.editRecipe}
                            />
                        </div>
                    </div>
                )
            }
        }
    }
}

class RecipeMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menu: 'invisible',
            isDeletePromptVisible: false,
        };
        this.handleDropDown = this.handleDropDown.bind(this);
        this.deleteRecipe = this.deleteRecipe.bind(this);
        this.editRecipe = this.editRecipe.bind(this);
        this.openDeletePrompt = this.openDeletePrompt.bind(this);
        this.closePrompt = this.closePrompt.bind(this);
    }

    handleDropDown(event) {
        event.preventDefault();
        if (this.state.menu === 'invisible') {
            this.setState((prevState, props) => {
                prevState.menu = 'visible';
                return (prevState);
            });
        } else if (this.state.menu === 'visible') {
            this.setState((prevState, props) => {
                prevState.menu = 'invisible';
                return (prevState);
            });
        }
    }

    deleteRecipe(event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.menu = 'invisible';
            prevState.isDeletePromptVisible = false;
        });
        this.props.deleteRecipe(this.props.recipeTitle);
    }

    editRecipe(event) {
        event.preventDefault();
        this.setState({ menu: 'invisible' });
        this.props.editRecipe(this.props.recipeTitle);
    }

    openDeletePrompt() {
        this.setState((prevState, props) => {
            prevState.isDeletePromptVisible = true;
            return (prevState);
        });
    }

    closePrompt(event) {
        event.preventDefault();
        const closePrompt = document.getElementById("close-delete-prompt");
        const deletePromptWrapper = document.getElementById("delete-prompt-wrapper");
        const noDelete = document.getElementById("no-delete");

        if (
            event.target === deletePromptWrapper ||
            event.target === closePrompt ||
            event.target === closePrompt.children[0] ||
            event.target === noDelete
        ) {
            this.setState((prevState, props) => {
                prevState.menu = 'invisible';
                prevState.isDeletePromptVisible = false;
                return (prevState);
            });
        }
    }

    render() {

        if (this.state.isDeletePromptVisible) {
            return (
                <div className="recipe-menu-button-wrapper">
                    <button
                        onClick={this.handleDropDown}
                        className="recipe-menu"
                    >
                        <i className="fas fa-ellipsis-v" aria-hidden="true"></i>
                    </button>
                    <div id="delete-prompt-wrapper" onClick={this.closePrompt}>
                        <div id="delete-prompt">
                            <div id="close-delete-prompt-wrapper">
                                <button id="close-delete-prompt" onClick={this.closePrompt}><i className="fa fa-times" aria-hidden="true"></i></button>
                            </div>
                            <div id="user-delete-options-wrapper">
                                <p>Are you sure you want to delete this recipe?</p>
                                <div id="user-delete-options">
                                    <button onClick={this.deleteRecipe} id="yes-delete" className="delete-options">
                                        Yes
                                    </button>
                                    <button onClick={this.closePrompt} id="no-delete" className="delete-options">
                                        No
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        else {
            if (this.state.menu === 'invisible') {
                return (
                    <div className="recipe-menu-button-wrapper">
                        <button
                            onClick={this.handleDropDown}
                            className="recipe-menu">
                            <i className="fas fa-ellipsis-v" aria-hidden="true"></i>
                        </button>
                    </div>
                )
            } else {
                return (
                    <div className="recipe-menu-button-wrapper recipe-dropdown">
                        <button onClick={this.handleDropDown} className="recipe-menu"><i className="fas fa-ellipsis-v" aria-hidden="true"></i></button>
                        <div className="recipe-buttons">
                            <button className="dropdown-button" onClick={this.openDeletePrompt}>Delete</button>
                            <button className="dropdown-button" onClick={this.editRecipe}>Edit</button>
                        </div>
                    </div>
                )
            }
        }
    }
}

const root = document.getElementById("root");
ReactDOM.render(<App />, root);