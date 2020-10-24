import React from 'react';
import ReactDOM from 'react-dom';
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";

export default class Directions extends React.Component {
    constructor(props) {
        super(props);

        this.state = {directions: ['']};
        this.addDirection = this.addDirection.bind(this);
        this.updateDirections = this.updateDirections.bind(this);
        this.removeDirection = this.removeDirection.bind(this);
        this.dragEnd = this.dragEnd.bind(this);
    }

    addDirection(event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.directions.push('');
            return (prevState);
        });
    }

    updateDirections(index, direction) {
        this.setState((prevState, props) => {
            prevState.directions[index] = direction;
            return (prevState);
        });
    }

    removeDirection(event, index) {
        event.preventDefault();
        if (this.state.directions.length > 1) {
            this.setState((prevState, props) => {
                prevState.directions.splice(index, 1);
                return(prevState);
            });
        }
    }

    dragEnd(result) {
        if (!result.destination) {
            return;
        }
        const dropIndex = result.destination.index;
        const sourceIndex = result.source.index;
        const directions = this.state.directions;

        const [movedItem] = directions.splice(sourceIndex, 1);
        directions.splice(dropIndex, 0, movedItem)
        this.setState({directions});
    }

    render() {
        let directionList = null;
        directionList = this.state.directions.map((direction, index) => {
            return (
                <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                    {(provided) => (
                        <li className="list-item" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <div className="drag-item">
                                <DirectionInput
                                    direction={direction} 
                                    updateDirections={this.updateDirections} 
                                    index={index} 
                                />
                                <span className="draggable-icon"> 
                                    <i className="fas fa-grip-lines"></i>
                                </span>
                            </div>
                            <span className="remove-input-wrapper">
                                {this.state.directions.length === 1 ? 
                                    <button onClick={(e) => this.removeDirection(e, index)} className="remove-input-button" disabled><i className="fas fa-times"></i></button> : 
                                    <button onClick={(e) => this.removeDirection(e, index)} className="remove-input-button"><i className="fas fa-times"></i></button>
                                }
                            </span>
                        </li>
                    )}
                </Draggable>
            )
        });

        return (
            <div className="input-group">
                <label className="label" form="new-recipe" htmlFor="directions">Directions</label><br />
                <DragDropContext onDragEnd={this.dragEnd}>
                    <Droppable droppableId="directions">
                        {(provided) => (
                            <ul id="directions" {...provided.droppableProps} ref={provided.innerRef}>
                                {directionList}
                                ...
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
                <button className="add-new-input" onClick={this.addDirection}>Add direction</button>
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