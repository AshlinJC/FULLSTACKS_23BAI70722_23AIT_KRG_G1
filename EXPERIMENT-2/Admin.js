const button = document.getElementById("toggleTheme");
const body = document.body;
button.addEventListener("click", function() {
    if (body.classList.contains("light")) 
    {
        body.classList.remove("light");
        body.classList.add("dark");
    } 
    else 
    {
        body.classList.remove("dark");
        body.classList.add("light");
    }
});