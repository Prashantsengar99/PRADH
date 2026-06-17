document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartWrapper = document.getElementById('cart-wrapper');
    if (!cartWrapper) return;

    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];

    if (cart.length === 0) {
        cartWrapper.innerHTML = `
            <div class="empty-message">
                <p>Your shopping cart is currently empty.</p>
                <a href="product.html" class="btn btn-primary" style="margin-top: 1.5rem;">Explore Products</a>
            </div>`;
        return;
    }

    let cartHTML = `<div class="cart-container">`;
    let dynamicTotal = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        dynamicTotal += itemTotal;

        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Variant Size: ${item.variant}</p>
                </div>
                <div><strong>₹${item.price}</strong></div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="adjustQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="adjustQuantity(${index}, 1)">+</button>
                </div>
                <div><strong>₹${itemTotal}</strong></div>
                <div>
                    <button class="remove-btn" onclick="removeCartItem(${index})">Remove</button>
                </div>
            </div>
        `;
    });

    cartHTML += `
        <div class="cart-summary">
            <h3>Grand Total: <span>₹${dynamicTotal}</span></h3>
            <button class="btn btn-primary" onclick="openDetailsModal()" style="background-color: var(--accent-green); color: white;">
                ORDER NOW
            </button>
        </div>
    </div>`;

    cartWrapper.innerHTML = cartHTML;
}

function adjustQuantity(index, shift) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    cart[index].quantity += shift;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

// --- MODAL FUNCTIONS ---
function openDetailsModal() {
    document.getElementById('detailsModal').style.display = 'flex';
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// --- WHATSAPP ORDER SUBMISSION ---
function handleFormSubmit(event) {
    event.preventDefault();

    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    if (cart.length === 0) return;

    // Fetching customer details from form
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    const pincode = document.getElementById('custPincode').value;
    const payment = document.getElementById('paymentMethod').value;

    let dynamicTotal = 0;
    
    // Building beautiful WhatsApp message template
    let textMessage = `⚡ *NEW ORDER - PRADH DESI FUEL* ⚡\n\n`;
    textMessage += `👤 *CUSTOMER DETAILS:*\n`;
    textMessage += `• *Name:* ${name}\n`;
    textMessage += `• *Phone:* ${phone}\n`;
    textMessage += `• *Address:* ${address}\n`;
    textMessage += `• *Pincode:* ${pincode}\n`;
    textMessage += `• *Payment Mode:* ${payment}\n\n`;
    
    textMessage += `📦 *ORDERED ITEMS:*\n`;
    textMessage += `-----------------------------------\n`;

    cart.forEach((item) => {
        let sub = item.price * item.quantity;
        dynamicTotal += sub;
        textMessage += `• ${item.name} (${item.variant}) x ${item.quantity} = *₹${sub}*\n`;
    });

    textMessage += `-----------------------------------\n`;
    textMessage += `💰 *Grand Total Amount:* ₹${dynamicTotal}\n\n`;
    textMessage += `Please confirm my order and share shipping updates!`;

    const encodedText = encodeURIComponent(textMessage);
    const targetWhatsAppNumber = "918979993655"; 
    const finalWhatsAppUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodedText}`;

    // Clear cart and redirect
    localStorage.removeItem('pradh_cart');
    closeDetailsModal();
    window.open(finalWhatsAppUrl, '_blank');
    window.location.href = "index.html";
}