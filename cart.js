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
                PAY NOW
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

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // 1. Cart data validation
    let cart = JSON.parse(localStorage.getItem('pradh_cart')) || [];
    if (cart.length === 0) { 
        alert("Cart khali hai!"); 
        return; 
    }

    // 2. Form data collection
    const orderData = {
        name: document.getElementById('custName').value,
        phone: document.getElementById('custPhone').value,
        email: document.getElementById('custEmail').value,
        address: document.getElementById('custAddress').value,
        pincode: document.getElementById('custPincode').value,
        cart: cart,
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    try {
        const response = await fetch("http://localhost:3000/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        // Agar response 200-299 ke beech hai
        if (response.ok) {
            alert("Order placed successfully!"); // User ko feedback do
            localStorage.removeItem('pradh_cart');
            window.location.href = "https://razorpay.me/@pradhfood";
        } else {
            // Agar server ne error bheja hai
            const result = await response.json();
            alert("Error: " + (result.message || "Something went wrong"));
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Server se connection nahi ban pa raha. Check karein ki server chalu hai.");
    }
}