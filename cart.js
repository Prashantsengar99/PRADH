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
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    renderCart();
}

function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('pradh_cart', JSON.stringify(cart));
    renderCart();
}

function openDetailsModal() { document.getElementById('detailsModal').style.display = 'flex'; }
function closeDetailsModal() { document.getElementById('detailsModal').style.display = 'none'; }

// --- FIXED SUBMIT FUNCTION ---
async function handleFormSubmit(event) {
    event.preventDefault();
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const pincode = document.getElementById('custPincode').value.trim();
    const payment = document.getElementById('paymentMethod').value;
    
    let dynamicTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = { name, phone, address, pincode, payment, cart, totalAmount: dynamicTotal };

    try {
        const response = await fetch("https://pradh-backend.onrender.com/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            let textMessage = `⚡ *NEW ORDER* ⚡\n\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}\n📍 *Address:* ${address}\n💰 *Total:* ₹${dynamicTotal}\n\n`;
            cart.forEach(i => textMessage += `• ${i.name} x ${i.quantity}\n`);
            
            const finalWhatsAppUrl = `https://wa.me/918979993655?text=${encodeURIComponent(textMessage)}`;
            localStorage.removeItem('pradh_cart');
            window.location.assign(finalWhatsAppUrl);
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        alert("Server Error! Check console.");
    }
}

async function fetchMyOrders() {
    const phoneInput = document.getElementById('searchOrderPhone').value.trim();
    const ordersWrapper = document.getElementById('my-orders-wrapper');
    if (!phoneInput) return;

    try {
        const response = await fetch("https://pradh-backend.onrender.com/api/orders");
        const allOrders = await response.json();
        const myOrders = allOrders.filter(o => o.phone === phoneInput);

        if (myOrders.length === 0) { ordersWrapper.innerHTML = "<p>No orders found.</p>"; return; }

        ordersWrapper.innerHTML = myOrders.reverse().map(order => `
            <div style="border:1px solid #ddd; padding:1rem; margin:1rem;">
                <h4>Order ID: #${order.id}</h4>
                <p>Status: ${order.status || 'Placed'}</p>
                <p>Total: ₹${order.totalAmount}</p>
            </div>
        `).join('');
    } catch (error) { ordersWrapper.innerHTML = "Error loading orders."; }
}