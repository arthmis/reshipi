export function moveElementUpList(array, oldIndex, newIndex) {
    const elementToMove = array[oldIndex];
    for (let i = oldIndex-1; i >= newIndex; i--) {
        array[i + 1] = array[i];
    } 
    array[newIndex] = elementToMove; 
}
export function moveElementDownList(array, oldIndex, newIndex) {
    const elementToMove = array[oldIndex];
    for (let i = oldIndex; i < newIndex; i++) {
        array[i] = array[i + 1];
    } 
    array[newIndex] = elementToMove; 
}