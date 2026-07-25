/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Keep the full product list and selected products in memory */
let allProducts = [];
let currentProducts = [];
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Show an empty state in the selected products box */
selectedProductsList.innerHTML = `
  <div class="placeholder-message selected-placeholder">
    No products selected yet
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  if (allProducts.length > 0) {
    return allProducts;
  }

  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Add or remove a product from the selection */
function toggleProductSelection(productId) {
  const selectedIndex = selectedProducts.findIndex(
    (product) => product.id === productId,
  );

  if (selectedIndex === -1) {
    const productToAdd = allProducts.find(
      (product) => product.id === productId,
    );

    if (productToAdd) {
      selectedProducts.push(productToAdd);
    }
  } else {
    selectedProducts.splice(selectedIndex, 1);
  }

  renderSelectedProducts();
  renderProductGrid(currentProducts);
}

/* Show the selected products below the grid */
function renderSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <div class="placeholder-message selected-placeholder">
        No products selected yet
      </div>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product-item" data-product-id="${product.id}">
          <div>
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
          <button type="button" class="remove-selected-btn" aria-label="Remove ${product.name}">
            Remove
          </button>
        </div>
      `,
    )
    .join("");
}

/* Create HTML for displaying product cards */
function renderProductGrid(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some(
        (selectedProduct) => selectedProduct.id === product.id,
      );

      return `
    <div class="product-card-shell">
      <div class="product-card ${isSelected ? "selected" : ""}" data-product-id="${product.id}" role="button" tabindex="0" aria-pressed="${isSelected}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
        <span class="selection-badge">${isSelected ? "Selected" : "Select"}</span>
      </div>
      <div class="product-description-popout" aria-hidden="true">
        <p>${product.description}</p>
      </div>
    </div>
  `;
    })
    .join("");
}

/* Handle clicks on product cards so users can toggle selection */
productsContainer.addEventListener("click", (event) => {
  const card = event.target.closest(".product-card");

  if (!card) {
    return;
  }

  toggleProductSelection(Number(card.dataset.productId));
});

/* Allow keyboard users to toggle cards with Enter or Space */
productsContainer.addEventListener("keydown", (event) => {
  const card = event.target.closest(".product-card");

  if (!card) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleProductSelection(Number(card.dataset.productId));
  }
});

/* Let users remove products from the selected list */
selectedProductsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-selected-btn");

  if (!removeButton) {
    return;
  }

  const selectedItem = removeButton.closest(".selected-product-item");

  if (!selectedItem) {
    return;
  }

  toggleProductSelection(Number(selectedItem.dataset.productId));
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  currentProducts = products.filter(
    (product) => product.category === selectedCategory,
  );

  renderProductGrid(currentProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
