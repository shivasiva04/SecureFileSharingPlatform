const gridContainer = document.getElementById("gridContainer");
const popup = document.getElementById("popup");
let selectedBoxes = [];

// Create a grid box
function createBox(index) {
    const box = document.createElement("div");
    box.classList.add("box");
    box.dataset.index = index;
    box.addEventListener("click", () => toggleBox(box));

    // Add animation delay
    box.style.animationDelay = `${index * 50}ms`; 
    return box;
}


// Arrange a square grid
function arrangeSquareGrid(size) {
    gridContainer.innerHTML = "";
    const boxSize = 40;
    for (let i = 0; i < size * size; i++) {
        const box = createBox(i);
        const row = Math.floor(i / size);
        const col = i % size;
        box.style.left = (col * boxSize) + 'px';
        box.style.top = (row * boxSize) + 'px';
        gridContainer.appendChild(box);
    }
    gridContainer.style.width = (size * boxSize) + 'px';
    gridContainer.style.height = (size * boxSize) + 'px';
}

// Arrange a circular grid
function arrangeCircularGrid(size) {
    gridContainer.innerHTML = "";
    const boxSize = 40;
    const diameter = size * boxSize;
    const radius = diameter / 2;
    const center = radius;
    let boxIndex = 0;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const box = createBox(boxIndex++);
            const posX = x * boxSize;
            const posY = y * boxSize;

            // Calculate distance from center
            const distX = (posX + boxSize / 2) - center;
            const distY = (posY + boxSize / 2) - center;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance <= radius) {
                box.style.left = posX + 'px';
                box.style.top = posY + 'px';
                gridContainer.appendChild(box);
            }
        }
    }
    gridContainer.style.width = diameter + 'px';
    gridContainer.style.height = diameter + 'px';
}

// Arrange a triangular grid
function arrangeTriangleGrid(size) {
    gridContainer.innerHTML = "";
    const boxSize = 40;
    let boxCount = 0;

    for (let row = 0; row < size; row++) {
        const boxesInRow = row + 1;
        const rowOffset = (size - boxesInRow) * (boxSize / 2);

        for (let col = 0; col < boxesInRow; col++) {
            const box = createBox(boxCount++);
            box.style.left = (col * boxSize + rowOffset) + 'px';
            box.style.top = (row * boxSize) + 'px';
            gridContainer.appendChild(box);
        }
    }
    gridContainer.style.width = (size * boxSize) + 'px';
    gridContainer.style.height = (size * boxSize) + 'px';
}

// Show grid popup
function showGridPopup() {
    const gridSize = parseInt(document.getElementById("gridSize").value);
    const shape = document.getElementById("gridShape").value;

    if (!gridSize || gridSize < 2 || gridSize > 10) {
        alert("Please enter a valid grid size between 2 and 10.");
        return;
    }

    selectedBoxes = [];
    gridContainer.innerHTML = "";
    popup.style.display = "block";

    switch (shape) {
        case "square":
            arrangeSquareGrid(gridSize);
            break;
        case "circle":
            arrangeCircularGrid(gridSize);
            break;
        case "triangle":
            arrangeTriangleGrid(gridSize);
            break;
        default:
            alert("Invalid grid shape selected.");
    }
}

// Toggle selection of boxes
function toggleBox(box) {
    const index = box.dataset.index;
    if (selectedBoxes.includes(index)) {
        selectedBoxes = selectedBoxes.filter(i => i !== index);
        box.classList.remove("selected");
    } else {
        selectedBoxes.push(index);
        box.classList.add("selected");
    }
}

// Register selected pattern as password & send to backend
async function registerPassword() {
    if (selectedBoxes.length < 3) {
        alert("Select at least three boxes as your password.");
        return;
    }

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const gridSize = document.getElementById("gridSize").value;
    const gridShape = document.getElementById("gridShape").value;
    const pattern = selectedBoxes; // Keep as an array

    if (!username || !email || !gridSize || !gridShape) {
        alert("Please enter all details.");
        return;
    }

    const userData = {
        username,
        email,
        gridSize,
        gridShape,
        pattern
    };

    try {
        const response = await fetch("/signup", { // Change endpoint from `/register` to `/signup`
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            alert("User registered successfully!");
            window.location.href = "/"; // Redirect after successful signup
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error registering user:", error);
        alert("This username is alread used. Please try another.");
    }
}


// Close popup
function closePopup() {
    popup.style.display = "none";
}

// docement.getElementById('body').addEventListener("click",()=>{
    
// })
