import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Search, Coffee, Cake, Sandwich } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  icon: React.ElementType;
  color: string;
}

interface CartItem extends Product {
  quantity: number;
}

const PRODUCTS: Product[] = [
  { id: '1', name: 'Espresso', price: 3.50, category: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { id: '2', name: 'Cappuccino', price: 4.50, category: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { id: '3', name: 'Latte', price: 4.75, category: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { id: '4', name: 'Americano', price: 3.00, category: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { id: '5', name: 'Mocha', price: 5.00, category: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { id: '6', name: 'Croissant', price: 3.25, category: 'Pastry', icon: Cake, color: 'bg-orange-100 text-orange-700' },
  { id: '7', name: 'Blueberry Muffin', price: 3.75, category: 'Pastry', icon: Cake, color: 'bg-orange-100 text-orange-700' },
  { id: '8', name: 'Chocolate Chip Cookie', price: 2.50, category: 'Pastry', icon: Cake, color: 'bg-orange-100 text-orange-700' },
  { id: '9', name: 'Turkey Sandwich', price: 8.50, category: 'Food', icon: Sandwich, color: 'bg-green-100 text-green-700' },
  { id: '10', name: 'Veggie Wrap', price: 7.50, category: 'Food', icon: Sandwich, color: 'bg-green-100 text-green-700' },
];

const CATEGORIES = ['All', 'Coffee', 'Pastry', 'Food'];

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    alert(`Checkout complete! Total: $${total.toFixed(2)}`);
    setCart([]);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Main Content - Product Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Cafe POS</h1>
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Categories */}
        <div className="px-6 py-4 shrink-0">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const Icon = product.icon;
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${product.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-gray-500">${product.price.toFixed(2)}</p>
                </button>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Cart */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shrink-0 shadow-xl z-10">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
            Current Order
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                  <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-gray-100 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-gray-200 rounded-l-lg text-gray-600 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-gray-200 rounded-r-lg text-gray-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center text-white font-medium transition-colors ${
              cart.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
