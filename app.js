
const STORAGE_KEYS = {
  products: "shineOnProducts",
  cart: "shineOnCart",
  orders: "shineOnOrders",
  catalogVersion: "shineOnCatalogVersion"
};

const CATALOG_VERSION = "2026-07-11-rumduol-1";

if (localStorage.getItem(STORAGE_KEYS.catalogVersion) !== CATALOG_VERSION) {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(window.DEFAULT_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.catalogVersion, CATALOG_VERSION);
}

const state = {
  products: JSON.parse(localStorage.getItem(STORAGE_KEYS.products)) || window.DEFAULT_PRODUCTS,
  cart: JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)) || []
};

const els = {
  productGrid: document.getElementById("productGrid"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  cartCount: document.getElementById("cartCount"),
  cartDrawer: document.getElementById("cartDrawer"),
  cartItems: document.getElementById("cartItems"),
  cartSubtotal: document.getElementById("cartSubtotal"),
  overlay: document.getElementById("overlay"),
  checkoutModal: document.getElementById("checkoutModal"),
  toast: document.getElementById("toast"),
  mainNav: document.getElementById("mainNav")
};

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function saveCart() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state.cart));
}

function renderProducts() {
  const search = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;

  const filtered = state.products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);
    const matchesCategory = category === "All" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    els.productGrid.innerHTML = `<p>No jewelry found. Try another search.</p>`;
    return;
  }

  els.productGrid.innerHTML = filtered.map(product => {
    const productVisual = product.image
      ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
      : `<span>${product.emoji || "💎"}</span>`;
    const productBadge = product.badge
      ? `<div class="product-badge">${product.badge}</div>`
      : "";

    return `
    <article class="product-card">
      <div class="product-image">
        ${productVisual}
        ${productBadge}
      </div>
      <div class="product-body">
        <small>${product.category}</small>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-bottom">
          <span class="price">${money(product.price)}</span>
          <button class="add-button" onclick="addToCart(${product.id})">Add to cart</button>
        </div>
      </div>
    </article>
  `;
  }).join("");
}

window.addToCart = function(id) {
  const existing = state.cart.find(item => item.id === id);
  if (existing) existing.qty += 1;
  else state.cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  showToast("Added to cart ✨");
};

window.changeQty = function(id, delta) {
  const item = state.cart.find(item => item.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(item => item.id !== id);
  saveCart();
  renderCart();
};

window.removeFromCart = function(id) {
  state.cart = state.cart.filter(item => item.id !== id);
  saveCart();
  renderCart();
};

function renderCart() {
  const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
  els.cartCount.textContent = totalQty;

  if (!state.cart.length) {
    els.cartItems.innerHTML = `
      <div class="empty-cart">
        <div>
          <div style="font-size:54px">🛍️</div>
          <h3>Your cart is empty</h3>
          <p>Add something beautiful.</p>
        </div>
      </div>`;
    els.cartSubtotal.textContent = "$0.00";
    return;
  }

  let subtotal = 0;
  els.cartItems.innerHTML = state.cart.map(item => {
    const product = state.products.find(product => product.id === item.id);
    if (!product) return "";
    subtotal += product.price * item.qty;

    return `
      <div class="cart-item">
        <div class="cart-thumb">${
          product.image
            ? `<img src="${product.image}" alt="${product.name}">`
            : (product.emoji || "💎")
        }</div>
        <div>
          <h4>${product.name}</h4>
          <strong>${money(product.price)}</strong>
          <div class="qty-controls">
            <button onclick="changeQty(${item.id}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${item.id}, 1)">+</button>
          </div>
        </div>
        <button class="remove-button" onclick="removeFromCart(${item.id})">Remove</button>
      </div>`;
  }).join("");

  els.cartSubtotal.textContent = money(subtotal);
}

function openCart() {
  els.cartDrawer.classList.add("open");
  els.overlay.classList.add("show");
  els.cartDrawer.setAttribute("aria-hidden", "false");
}

function closeAll() {
  els.cartDrawer.classList.remove("open");
  els.checkoutModal.classList.remove("show");
  els.overlay.classList.remove("show");
  els.cartDrawer.setAttribute("aria-hidden", "true");
  els.checkoutModal.setAttribute("aria-hidden", "true");
}

function openCheckout() {
  if (!state.cart.length) {
    showToast("Your cart is empty");
    return;
  }
  els.cartDrawer.classList.remove("open");
  els.checkoutModal.classList.add("show");
  els.overlay.classList.add("show");
  els.checkoutModal.setAttribute("aria-hidden", "false");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeAll);
document.getElementById("checkoutButton").addEventListener("click", openCheckout);
document.getElementById("closeCheckout").addEventListener("click", closeAll);
els.overlay.addEventListener("click", closeAll);
els.searchInput.addEventListener("input", renderProducts);
els.categoryFilter.addEventListener("change", renderProducts);

document.getElementById("menuButton").addEventListener("click", () => {
  els.mainNav.classList.toggle("open");
});

document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", () => els.mainNav.classList.remove("open"));
});

document.getElementById("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  const formData = Object.fromEntries(new FormData(event.target).entries());
  const items = state.cart.map(item => {
    const product = state.products.find(product => product.id === item.id);
    return { ...item, name: product?.name, price: product?.price };
  });

  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.orders)) || [];
  orders.unshift({
    id: Date.now(),
    createdAt: new Date().toISOString(),
    customer: formData,
    items,
    total,
    status: "New"
  });
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));

  state.cart = [];
  saveCart();
  renderCart();
  closeAll();
  event.target.reset();
  showToast("Order saved successfully 🎉");
});

document.getElementById("year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
