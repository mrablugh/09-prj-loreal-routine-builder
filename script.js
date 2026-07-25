/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineButton = document.getElementById("generateRoutine");

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
const API_URL = "https://misty-bar-8439.mrablugh.workers.dev/";

// Keep a small conversation history so the assistant can respond in context.
const messages = [
  {
    role: "system",
    content: `You are a helpful beauty advisor for the entire L’Oréal family of brands, including skincare, makeup, haircare, and fragrance.

Only give recommendations that use brands and products from the L’Oréal family. If a request is outside that scope, politely decline and redirect the user to a L’Oréal-related topic.

After you generate a routine, keep the conversation anchored to that routine and answer follow-up questions using the full chat history. Follow-up questions should stay related to the routine or to connected beauty topics like skincare, haircare, makeup, fragrance, and other L’Oréal family products.

When giving a routine, keep it clear, practical, and complete. Do not cut off the final step or leave the answer unfinished.`,
  },
];

function appendMessage(role, text) {
  const messageElement = document.createElement("div");
  messageElement.className = `msg ${role}`;

  if (role === "assistant") {
    messageElement.innerHTML = formatMarkdown(text);
  } else {
    messageElement.textContent = text;
  }

  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return messageElement;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMarkdown(text) {
  const lines = escapeHtml(text.trim()).split(/\n/);
  const blocks = [];
  let orderedItems = [];
  let bulletItems = [];

  const closeBulletList = () => {
    if (bulletItems.length === 0) {
      return;
    }

    blocks.push(
      `<ul>${bulletItems
        .map((item) => `<li>${formatInlineMarkdown(item)}</li>`)
        .join("")}</ul>`,
    );
    bulletItems = [];
  };

  const closeOrderedList = () => {
    if (orderedItems.length === 0) {
      return;
    }

    blocks.push(
      `<ol>${orderedItems
        .map((item) => {
          const nestedList =
            item.subitems.length > 0
              ? `<ul>${item.subitems
                  .map((subitem) => `<li>${formatInlineMarkdown(subitem)}</li>`)
                  .join("")}</ul>`
              : "";

          return `<li>${formatInlineMarkdown(item.text)}${nestedList}</li>`;
        })
        .join("")}</ol>`,
    );
    orderedItems = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      closeBulletList();
      closeOrderedList();
      continue;
    }

    const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);
    if (orderedListMatch) {
      closeBulletList();
      orderedItems.push({ text: orderedListMatch[1], subitems: [] });
      continue;
    }

    const bulletListMatch = trimmedLine.match(/^[-*]\s+(.*)$/);
    if (bulletListMatch) {
      if (orderedItems.length > 0) {
        orderedItems[orderedItems.length - 1].subitems.push(bulletListMatch[1]);
      } else {
        bulletItems.push(bulletListMatch[1]);
      }

      continue;
    }

    closeBulletList();
    closeOrderedList();
    blocks.push(`<p>${formatInlineMarkdown(trimmedLine)}</p>`);
  }

  closeBulletList();
  closeOrderedList();

  return blocks.join("") || "<p></p>";
}

function formatInlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "$1<em>$2</em>");
}

function setFormState(isBusy) {
  userInput.disabled = isBusy;
  sendBtn.disabled = isBusy;
  generateRoutineButton.disabled = isBusy;
}

async function sendMessage(userText) {
  messages.push({ role: "user", content: userText });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("No assistant response was returned.");
  }

  messages.push({ role: "assistant", content: reply });
  return reply;
}

function buildRoutinePrompt() {
  const selectedProductData = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  return `Create a short personalized routine using only the selected products below.

Selected products JSON:
${JSON.stringify(selectedProductData, null, 2)}

Rules:
- Keep the answer to 5 short bullets or fewer.
- Use the headings "Morning" and "Evening" only if they fit.
- Do not add extra explanation, intro, or closing text.
- Make sure every step is complete and does not cut off.

Write only the routine.`;
}

async function generateRoutine() {
  if (selectedProducts.length === 0) {
    appendMessage(
      "assistant",
      "Please select at least one product before generating a routine.",
    );
    return;
  }

  const routinePrompt = buildRoutinePrompt();
  messages.push({ role: "user", content: routinePrompt });

  setFormState(true);
  const loadingMessage = appendMessage(
    "assistant",
    "Generating your routine...",
  );

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("No assistant response was returned.");
    }

    messages.push({ role: "assistant", content: reply });
    loadingMessage.innerHTML = formatMarkdown(reply);
  } catch (error) {
    loadingMessage.textContent =
      "Sorry, I couldn't generate a routine right now. Please try again.";
    console.error(error);
  } finally {
    setFormState(false);
    userInput.focus();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

/* Handle form submit */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userText = userInput.value.trim();
  if (!userText) {
    return;
  }

  appendMessage("user", userText);
  userInput.value = "";
  setFormState(true);

  const loadingMessage = appendMessage("assistant", "Typing...");

  try {
    const reply = await sendMessage(userText);
    loadingMessage.innerHTML = formatMarkdown(reply);
  } catch (error) {
    loadingMessage.textContent =
      "Sorry, I couldn't get a response right now. Please try again.";
    console.error(error);
  } finally {
    setFormState(false);
    userInput.focus();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});

generateRoutineButton.addEventListener("click", async () => {
  await generateRoutine();
});
