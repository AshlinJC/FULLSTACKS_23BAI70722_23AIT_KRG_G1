const filterDropdown = document.getElementById("filter");
const products = document.querySelectorAll(".product");

filterDropdown.addEventListener("change", function () {
  const selected = this.value;

  products.forEach(product => {
    const category = product.getAttribute("data-category");
    product.style.display = (selected === "all" || category === selected) 
                            ? "block" 
                            : "none";
  });
});
