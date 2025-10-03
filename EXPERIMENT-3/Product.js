   // Define the products with categories
    const products = [
      { name: "T-Shirt", category: "clothing" },
      { name: "Jeans", category: "clothing" },
      { name: "Headphones", category: "electronics" },
      { name: "Smartphone", category: "electronics" },
      { name: "Novel", category: "books" },
      { name: "Cookbook", category: "books" }
    ];

    // Container to hold product elements
    const productList = document.getElementById("productList");

    // Function to render products
    function renderProducts(items) {
      productList.innerHTML = "";
      if (items.length === 0) {
        productList.textContent = "No products available.";
        return;
      }
      items.forEach(product => {
        const productDiv = document.createElement("div");
        productDiv.className = "product";
        productDiv.textContent = product.name;
        productList.appendChild(productDiv);
      });
    }

    // Initial render (show all)
    renderProducts(products);

    // Handle dropdown change event
    document.getElementById("categoryFilter").addEventListener("change", (event) => {
      const selectedCategory = event.target.value;
      if (selectedCategory === "all") {
        renderProducts(products);
      } else {
        const filtered = products.filter(p => p.category === selectedCategory);
        renderProducts(filtered);
      }
    });