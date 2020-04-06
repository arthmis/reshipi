import {moveElementDownList, moveElementUpList} from '../utility.js';
'use strict';

export default class Directions extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        console.log(this.props.directions);
        let directionList = null;
        if (this.props.directions.length === 1) {
            directionList = this.props.directions.map((direction, index) => {
                return (
                    <li className="list-item" key={index.toString()} >
                        <div className="drag-item"
                            draggable
                            onDragStart={(e) => this.props.onDragStart(e, index)}
                            onDragOver={this.props.handleDragOver}
                            onDragOver={this.props.handleDragOver}
                            onDrop={(e) => this.props.onDrop(e, index)}
                        >
                            <DirectionInput
                                direction={direction} 
                                updateDirections={this.props.updateDirections} 
                                index={index} 
                            />
                            <span className="draggable-icon">
                                <i className="fas fa-grip-lines"></i>
                            </span>
                        </div>
                        <span className="remove-input-wrapper">
                            <button onClick={(e) => this.props.removeDirection(e, index)} className="remove-input-button" disabled><i className="fas fa-times"></i></button>
                        </span>
                    </li>
                );
            });
        } else {
            directionList = this.props.directions.map((direction, index) => {
                return (
                    <li className="list-item" key={index.toString()} >
                        <div className="drag-item"
                            draggable
                            onDragStart={(e) => this.props.onDragStart(e, index)}
                            onDragOver={this.props.handleDragOver}
                            onDragOver={this.props.handleDragOver}
                            onDrop={(e) => this.props.onDrop(e, index)}
                        >
                            <DirectionInput
                                direction={direction} 
                                updateDirections={this.props.updateDirections} 
                                index={index} 
                            />
                            <span className="draggable-icon"> 
                                <i className="fas fa-grip-lines"></i>
                            </span>
                        </div>
                        <span className="remove-input-wrapper">
                            <button onClick={(e) => this.props.removeDirection(e, index)} className="remove-input-button"><i className="fas fa-times"></i></button>
                        </span>
                    </li>
                )
            });
        }

        return (
            <div className="input-group">
                <label className="label" form="new-recipe" htmlFor="directions">Directions</label><br />
                <ol>
                    {directionList}
                </ol>
                <button className="add-new-input" onClick={this.props.addDirection}>Add direction</button>
            </div>
        );
    }
}

class DirectionInput extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        event.preventDefault();

        const direction = event.target; 
        if (direction.value.length === 0) {
            direction.setCustomValidity('Please provide a direction.');
        }
        else if (direction.value.trim().length === 0) {
            direction.setCustomValidity('Title cannot only contain empty spaces.'); 
        } 
        else {
            direction.setCustomValidity(''); 
        }
        this.props.updateDirections(Number(this.props.index), direction.value);
    }

    render() {
        return (
            <div className="direction-input">
                <input 
                    className="direction"
                    form="new-recipe" 
                    name="directions" 
                    type="text" 
                    value={this.props.direction} 
                    onChange={this.handleInput} 
                    placeholder="Enter new direction" 
                    required 
                />
            </div>
        )
    }
}