import React from 'react';

export class FoodCategory extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({value: ''});
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        this.setState(({value: event.target.value}));
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
                        // onChange={this.handleInput} 
                        onChange={this.props.handleFoodCategoryInput} 
                        placeholder='"Italian", "French", "Japanese".'
                    />
                    <br />
                </div>
            </div>
        )
    }


}

export class ImageInput extends React.Component {
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
        if (this.props.url === '') {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="recipe-image">Image</label><br />
                    <button className="image-input-button" onClick={this.props.handleImageFileInput}>Upload Image</button>
                    <div>
                        <input style={{visibility: 'hidden'}} onChange={this.props.handleImageChange} type="file" id="recipe-image" name="recipe_image" accept=".png, .jpg, .jpeg" />
                    </div>
                </div>
            )
        } else {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="recipe-image">Image</label><br />
                    <button className="image-input-button" onClick={this.props.handleImageFileInput}>Upload Image</button>
                    <input style={{display: 'none'}} onChange={this.props.handleImageChange} type="file" id="recipe-image" name="recipe_image" accept=".png, .jpg, .jpeg" />
                    <div id="image-input">
                        <p id="image-name">{this.props.name}</p>
                        <img id="user-image" src={this.props.url} alt="user uploaded image" />
                        <button id="remove-image" className="image-input-button" onClick={this.props.removeImage}>Remove Image</button> 
                    </div>
                </div>
            );
        }
    }
}

export class OriginalUrl extends React.Component {
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
                    <input 
                        className="user-input" 
                        onChange={this.props.handleOriginalUrlChange} 
                        type="url" 
                        id="original-url" 
                        name="original_url" 
                        placeholder="Link to original recipe if any" 
                    />
                </div>
            </div>
        )
    }
}