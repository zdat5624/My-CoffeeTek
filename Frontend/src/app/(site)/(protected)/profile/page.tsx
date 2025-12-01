"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  ShoppingBag,
  Lock,
  Camera,
  Save,
  LogOut,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Eye,
  EyeOff,
  Home,
  ShieldCheck,
  Star,
  Package,
  Receipt,
  CreditCard,
  Utensils,
  Store,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OrderTrackingStepper } from "./OrderTrackingStepper";

// --- 1. ENUMS & INTERFACES (New Logic) ---

export enum OrderType {
  POS = 'POS',       // Tại quầy (Không có ship)
  ONLINE = 'ONLINE'  // Web/App (Có ship)
}

export enum OrderStatus {
  PENDING = 'pending',    // Mới đặt
  PAID = 'paid',          // Đã thanh toán / Đang chuẩn bị món
  SHIPPING = 'shipping',  // Đang giao (Chỉ dành cho ONLINE)
  COMPLETED = 'completed', // Hoàn thành
  CANCELED = 'canceled',   // Đã hủy
}

interface Topping {
  name: string;
  price: number;
}

interface OrderDetailItem {
  id: number;
  name: string;
  quantity: number;
  price: number; // Unit price (base + size)
  size?: string;
  toppings?: Topping[];
  image: string;
  note?: string;
}

interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  orderType: OrderType;

  // Pricing
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;

  // Info
  customerName: string;
  customerPhone: string;
  shippingAddress: string | null; // Null if POS
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'E_WALLET' | 'CASH';
  note?: string;

  items: OrderDetailItem[];
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
}

// --- HELPER FUNCTIONS ---
const formatVND = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Color Mapping (Tailwind) based on Requirements
const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "Pending" };
    case OrderStatus.PAID:
      return { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Utensils, label: "Paid / Preparing" }; // Paid & Preparing treated similarly visually
    case OrderStatus.SHIPPING:
      return { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Truck, label: "Shipping" };
    case OrderStatus.COMPLETED:
      return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Completed" };
    case OrderStatus.CANCELED:
      return { color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: "Canceled" };
    default:
      return { color: "bg-gray-100 text-gray-700", icon: Clock, label: status };
  }
};

// --- MOCK DATA ---
const MOCK_USER: UserProfile = {
  firstName: "Tuan",
  lastName: "Le",
  email: "tuan.le@example.com",
  phone: "0909123456",
  address: "123 Nguyen Hue, District 1, HCMC",
  avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80",
  gender: "Male",
  dob: "1995-05-15",
};

// Generate diverse mock orders
const generateMockOrders = (): Order[] => {
  return Array.from({ length: 12 }).map((_, i) => {
    // 1. Determine Type: Mix of POS and ONLINE
    const isPos = i % 4 === 0; // Every 4th order is POS
    const orderType = isPos ? OrderType.POS : OrderType.ONLINE;

    // 2. Determine Status: Ensure we have all types for testing
    let status: OrderStatus;
    if (i === 0) status = OrderStatus.PENDING;
    else if (i === 1) status = OrderStatus.PAID;
    else if (i === 2) status = OrderStatus.SHIPPING;
    else if (i === 3) status = OrderStatus.CANCELED;
    else status = OrderStatus.COMPLETED;

    // Correction: POS cannot be SHIPPING
    if (isPos && status === OrderStatus.SHIPPING) status = OrderStatus.COMPLETED;

    const date = new Date();
    date.setDate(date.getDate() - i);

    // 3. Generate Items
    const items: OrderDetailItem[] = [
      {
        id: 1,
        name: i % 2 === 0 ? "Cappuccino Delight" : "Matcha Latte",
        quantity: 1,
        price: 55000,
        size: "M",
        image: i % 2 === 0
          ? "https://images.unsplash.com/photo-1572442388796-11668a67e569?auto=format&fit=crop&w=200&q=80"
          : "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?auto=format&fit=crop&w=200&q=80",
        toppings: []
      },
      ...(i % 2 !== 0 ? [{
        id: 2,
        name: "Royal Milk Tea",
        quantity: 2,
        price: 45000,
        size: "L",
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200&q=80",
        toppings: [{ name: "Black Pearl", price: 5000 }]
      }] : [])
    ];

    const subtotal = items.reduce((acc, item) => {
      const toppingPrice = item.toppings?.reduce((tAcc, t) => tAcc + t.price, 0) || 0;
      return acc + (item.price + toppingPrice) * item.quantity;
    }, 0);

    const shippingFee = isPos ? 0 : 15000;
    const discount = i % 5 === 0 ? 10000 : 0;

    return {
      id: `ORD-${orderType}-${(2024000 + i).toString()}`,
      date: date.toISOString(),
      status: status,
      orderType: orderType,
      subtotal,
      shippingFee,
      discount,
      total: subtotal + shippingFee - discount,
      customerName: "Tuan Le",
      customerPhone: "0909123456",
      shippingAddress: isPos ? null : "123 Nguyen Hue, District 1, Ho Chi Minh City",
      paymentMethod: isPos ? 'CASH' : (i % 2 === 0 ? 'COD' : 'E_WALLET'),
      note: i % 4 === 0 ? "Less ice please." : undefined,
      items
    };
  });
};

const MOCK_ORDERS = generateMockOrders();

// --- COMPONENTS ---

// 1. Sidebar Component
const ProfileSidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const menuItems = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit sticky top-24">
      <div className="p-6 bg-gradient-to-b from-emerald-50 to-white text-center border-b border-gray-100">
        <div className="relative inline-block">
          <img
            src={MOCK_USER.avatar}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto mb-3"
          />
          <button className="absolute bottom-0 right-0 bg-emerald-600 p-1.5 rounded-full text-white hover:bg-emerald-700 transition-colors shadow-sm">
            <Camera size={14} />
          </button>
        </div>
        <h3 className="font-bold text-gray-900 text-lg">{MOCK_USER.firstName} {MOCK_USER.lastName}</h3>
        <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1">
          <Star size={14} className="text-yellow-500 fill-yellow-500" /> Loyal Member
        </p>
      </div>

      <div className="p-3">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === item.id
                  ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={activeTab === item.id ? "text-emerald-600" : "text-gray-400"} />
                {item.label}
              </div>
              {activeTab === item.id && <ChevronRight size={16} className="text-emerald-500" />}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 mt-2 border-t border-gray-100">
        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3">
          <LogOut size={18} /> Sign Out
        </Button>
      </div>
    </div>
  );
};

// 2. Personal Info Tab
const PersonalInfoView = () => {
  const [formData, setFormData] = useState(MOCK_USER);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your personal details</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="ghost">Cancel</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Save size={16} /> Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            disabled={!isEditing}
            className="focus-visible:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            disabled={!isEditing}
            className="focus-visible:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <Label>Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={formData.email}
              disabled={true}
              className="pl-9 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className="pl-9 focus-visible:ring-emerald-500"
            />
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
              className="pl-9 focus-visible:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Order Detail Component (Advanced Logic & Stepper)
const OrderDetailView = ({ order, onBack }: { order: Order; onBack: () => void }) => {
  const statusConfig = getStatusConfig(order.status);
  const isCancelled = order.status === OrderStatus.CANCELED;

  // === STEPPER LOGIC ===
  // Define steps based on OrderType
  const onlineSteps = [
    { id: OrderStatus.PENDING, label: "Pending", icon: Clock },
    { id: OrderStatus.PAID, label: "Paid", icon: CheckCircle2 },
    { id: OrderStatus.SHIPPING, label: "Shipping", icon: Truck },
    { id: OrderStatus.COMPLETED, label: "Completed", icon: Package },
  ];

  const posSteps = [
    { id: OrderStatus.PENDING, label: "Pending", icon: Clock },
    { id: OrderStatus.PAID, label: "Paid", icon: CheckCircle2 },
    { id: OrderStatus.COMPLETED, label: "Completed", icon: Package },
  ];

  const steps = order.orderType === OrderType.ONLINE ? onlineSteps : posSteps;

  // Find current step index
  let currentStepIndex = steps.findIndex(s => s.id === order.status);
  // If status not found (e.g. CANCELED) or special handling, index might vary
  if (isCancelled) currentStepIndex = -1;

  const handleCancelOrder = () => {
    // In a real app, call API here
    toast.error("Order cancellation requested.");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <Button onClick={onBack} variant="ghost" className="mb-4 pl-0 hover:bg-transparent text-gray-500 hover:text-emerald-700">
          <ChevronLeft size={20} className="mr-1" /> Back to Orders
        </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
              <Badge className={statusConfig.color}>
                <statusConfig.icon size={14} className="mr-1.5" /> {statusConfig.label}
              </Badge>
              {order.orderType === OrderType.ONLINE ? (
                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                  <Truck size={12} className="mr-1" /> Online
                </Badge>
              ) : (
                <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                  <Store size={12} className="mr-1" /> POS
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.date).toLocaleDateString("en-GB", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Action Buttons: Only show Cancel if PENDING */}
          <div className="flex gap-2">
            {order.status === OrderStatus.PENDING && (
              <Button onClick={handleCancelOrder} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>




      {/* GỌI STEPPER Ở ĐÂY */}
      <div className="my-6">
        <OrderTrackingStepper
          status={order.status}
          orderType={order.orderType}
        />
      </div>



      {/* Main Content Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2 font-semibold text-gray-800">
              <ShoppingBag size={18} className="text-emerald-600" /> Order Items
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover border border-gray-100 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      <span className="font-semibold text-gray-900">
                        {formatVND((item.price + (item.toppings?.reduce((acc, t) => acc + t.price, 0) || 0)) * item.quantity)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      Size: {item.size || 'Regular'} • Qty: {item.quantity}
                    </div>
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.toppings.map((t, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-600 font-normal border-gray-200">
                            +{t.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-emerald-600 font-medium">
                      {formatVND(item.price)} / unit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Note */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                <Receipt size={18} className="text-emerald-600" /> Note
              </div>
              <p className="text-sm text-gray-600 italic">
                {order.note ? `"${order.note}"` : "No special instructions."}
              </p>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                <CreditCard size={18} className="text-emerald-600" /> Payment
              </div>
              <p className="text-sm text-gray-600">
                Method: <span className="font-medium text-gray-900">{order.paymentMethod.replace('_', ' ')}</span>
              </p>
              <div className="mt-2">
                {(order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.SHIPPING)
                  ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>
                  : <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Payment Pending</Badge>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Info & Summary */}
        <div className="space-y-6">
          {/* Delivery Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={18} className="text-emerald-600" />
              {order.orderType === OrderType.ONLINE ? "Delivery Info" : "Pickup Info"}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                  {order.orderType === OrderType.ONLINE ? "Receiver" : "Customer"}
                </p>
                <p className="font-medium text-gray-900">{order.customerName}</p>
                <p className="text-sm text-gray-500">{order.customerPhone}</p>
              </div>

              {/* Only show address if ONLINE */}
              {order.orderType === OrderType.ONLINE && order.shippingAddress && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Delivery Address</p>
                  <div className="flex gap-2 items-start">
                    <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 leading-relaxed">{order.shippingAddress}</p>
                  </div>
                </div>
              )}

              {order.orderType === OrderType.POS && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Store Location</p>
                  <div className="flex gap-2 items-start">
                    <Store size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 leading-relaxed">Purchased at Store (POS)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatVND(order.subtotal)}</span>
              </div>

              {/* Only show shipping fee if ONLINE */}
              {order.orderType === OrderType.ONLINE && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Fee</span>
                  <span>{formatVND(order.shippingFee)}</span>
                </div>
              )}

              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-{formatVND(order.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 my-2 pt-2 flex justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span className="text-emerald-700">{formatVND(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// 3. Order History Tab (With Pagination & Detail View)
const OrderHistoryView = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(MOCK_ORDERS.length / itemsPerPage);
  const currentOrders = MOCK_ORDERS.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedOrder = MOCK_ORDERS.find(o => o.id === selectedOrderId);

  // === RENDER DETAIL VIEW ===
  if (selectedOrder) {
    return <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrderId(null)} />;
  }

  // === RENDER LIST VIEW ===
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Order History</h2>
          <p className="text-sm text-gray-500 mt-1">Track your past orders</p>
        </div>
        <div className="text-sm text-gray-500">
          Showing <span className="font-bold text-gray-900">{currentOrders.length}</span> of {MOCK_ORDERS.length}
        </div>
      </div>

      {/* ORDER LIST */}
      <div className="p-6 bg-gray-50/30 min-h-[400px]">
        {currentOrders.length > 0 ? (
          <div className="space-y-4">
            {currentOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                        <ShoppingBag size={20} className="text-gray-500 group-hover:text-emerald-600" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-lg block">{order.id}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(order.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          {/* Order Type Badge (Small) */}
                          {order.orderType === OrderType.ONLINE ? (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              <Truck size={12} /> Online
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                              <Store size={12} /> POS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <Badge className={statusConfig.color}>
                        <statusConfig.icon size={12} className="mr-1" /> {statusConfig.label}
                      </Badge>
                      <div className="text-right sm:min-w-[100px]">
                        <span className="text-lg font-bold text-emerald-600">
                          {formatVND(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600 w-full sm:w-auto">
                      <span className="font-medium text-gray-900">{order.items.reduce((acc, i) => acc + i.quantity, 0)} items</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-gray-500 truncate inline-block max-w-[200px] align-bottom">
                        {order.items.map(i => i.name).join(", ")}
                      </span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {/* Cancel Button logic: Only if PENDING */}
                      {order.status === OrderStatus.PENDING && (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 h-9">
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 sm:flex-none h-9 hover:bg-gray-100 group-hover:text-emerald-700"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        View Details <ChevronRight size={16} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <ShoppingBag size={48} className="text-gray-200 mb-4" />
            <p className="text-lg font-medium text-gray-900">No orders found</p>
            <p className="text-sm mb-6">Looks like you haven't placed any orders yet.</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Start Shopping</Button>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="text-sm text-gray-500 hidden sm:block">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-gray-200"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) ? (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-lg ${currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : "border-gray-200 text-gray-600"}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ) : (
                (page === currentPage - 2 || page === currentPage + 2) && <span key={page} className="text-gray-400 px-1">...</span>
              )
            ))}

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-gray-200"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Change Password Tab
const ChangePasswordView = () => {
  const [showPassword, setShowPassword] = useState(false);
  const toggleVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    toast.success("Password updated successfully!");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
        <p className="text-sm text-gray-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
      </div>

      <div className="p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pass">Current Password</Label>
            <div className="relative">
              <Input
                id="current-pass"
                type={showPassword ? "text" : "password"}
                className="pr-10 focus-visible:ring-emerald-500"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={toggleVisibility}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-pass">New Password</Label>
            <div className="relative">
              <Input
                id="new-pass"
                type={showPassword ? "text" : "password"}
                className="pr-10 focus-visible:ring-emerald-500"
                placeholder="Enter new password"
              />
            </div>
            <p className="text-xs text-gray-500">Minimum 8 characters, containing letters and numbers.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pass">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-pass"
                type={showPassword ? "text" : "password"}
                className="pr-10 focus-visible:ring-emerald-500"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <main className="container mx-auto px-4 py-8">

        {/* --- HERO / HEADER SECTION --- */}
        <div className="relative bg-gradient-to-r from-emerald-50 to-white rounded-3xl p-6 mb-8 overflow-hidden border border-emerald-100 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-4">
              <span className="cursor-pointer hover:underline flex items-center gap-1" onClick={() => router.push('/')}>
                <Home size={14} /> Home
              </span>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-gray-500">My Profile</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600" size={28} />
                  Account Settings
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Manage your personal info, order history, and security.
                </p>
              </div>
              <div className="bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm flex items-center gap-2 text-sm text-emerald-700">
                <ShoppingBag size={16} />
                Total Orders: <span className="font-bold">{MOCK_ORDERS.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* LEFT SIDEBAR */}
          <aside className="w-full md:w-72 flex-shrink-0">
            <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </aside>

          {/* RIGHT CONTENT */}
          <div className="flex-1 min-w-0">
            {activeTab === 'info' && <PersonalInfoView />}
            {activeTab === 'orders' && <OrderHistoryView />}
            {activeTab === 'password' && <ChangePasswordView />}
          </div>
        </div>

      </main>
    </div>
  );
}