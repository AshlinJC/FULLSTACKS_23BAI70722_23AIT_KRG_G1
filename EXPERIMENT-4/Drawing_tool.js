const canvas = document.getElementById('drawingCanvas');    
const context = canvas.getContext('2d');
let drawing = false;
//Draw when mouse is pressed down
canvas.addEventListener('mousedown', function(event) {
    drawing = true;
    context.beginPath();
    context.moveTo(event.offsetX, event.offsetY);
});
//Stop drawing when mouse is released   
canvas.addEventListener('mouseup', function(event) {
    drawing = false;
}); 
//Draw when mouse is pressed down and moved
canvas.addEventListener('mousemove', function(event) {  
    if (drawing) {
        context.lineTo(event.offsetX, event.offsetY);
        context.stroke();
    }
});
//Clear canvas when button is clicked
document.getElementById('clearButton').addEventListener('click', function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}); 
//change the color of the stroke
document.getElementById('colorPicker').addEventListener('input', function() {
    context.strokeStyle = this.value;
});