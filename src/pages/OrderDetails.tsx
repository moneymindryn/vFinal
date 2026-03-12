import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { formatPrice, formatDate } from '../utils/utils';
import { motion } from 'framer-motion';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Hash, 
  Calendar, 
  CreditCard,
  Printer,
  Download,
  MessageSquare
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() } as Order);
        } else {
          console.error("Order not found");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const generateInvoice = () => {
    if (!order) return;

    const doc = new jsPDF();
    const tracking = order.trackingNumber || `#${order.id.slice(-8).toUpperCase()}`;
    const date = formatDate(order.createdAt);

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('Pixi Marts', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Order Invoice', 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Tracking: ${tracking}`, 14, 38);
    doc.text(`Date: ${date}`, 14, 44);
    doc.text(`Status: ${order.status}`, 14, 50);

    // Customer Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Customer Details', 14, 65);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Name: ${order.customerName}`, 14, 72);
    doc.text(`Gmail: ${order.customerGmail}`, 14, 78);
    doc.text(`Phone: ${order.customerPhone}`, 14, 84);

    // Payment Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Payment Information', 120, 65);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Method: ${order.paymentMethod}`, 120, 72);
    doc.text(`TxID: ${order.transactionId || 'N/A'}`, 120, 78);

    // Items Table
    const tableData = order.items.map(item => [
      item.title + (item.variantName ? ` (${item.variantName})` : ''),
      item.quantity.toString(),
      formatPrice(item.price),
      formatPrice(item.price * item.quantity)
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Product', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Amount: ${formatPrice(order.totalAmount)}`, 140, finalY);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Thank you for shopping with Pixi Marts!', 105, finalY + 30, { align: 'center' });
    doc.text('If you have any questions, please contact our support.', 105, finalY + 36, { align: 'center' });

    doc.save(`Invoice_${tracking}.pdf`);
  };

  const handleWhatsAppSupport = () => {
    if (!order) return;
    
    const tracking = order.trackingNumber || `#${order.id.slice(-8).toUpperCase()}`;
    const amount = formatPrice(order.totalAmount);
    const trx = order.transactionId || 'N/A';
    const dateTime = formatDate(order.createdAt);
    
    let message = '';
    if (order.status === 'Pending') {
      message = `Hello Admin, I have paid ${amount} for Order ${tracking}. My Trx ID is ${trx}. Please verify and complete it.\n\nOrder ID: ${tracking}\nTotal Amount: ${amount}\nTransaction ID: ${trx}\nDate: ${dateTime}`;
    } else if (order.status === 'Reject') {
      message = `Hello Admin, my order ${tracking} was rejected. I paid ${amount} with Trx ID: ${trx}. Could you please check this and let me know the reason or refund status?\n\nOrder ID: ${tracking}\nTotal Amount: ${amount}\nTransaction ID: ${trx}\nDate: ${dateTime}`;
    }
    
    if (!message) return;

    const whatsappUrl = `https://wa.me/8801887076101?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete':
      case 'Completed':
      case 'Delivered':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Reject':
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Complete':
      case 'Completed':
      case 'Delivered':
        return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30';
      case 'Reject':
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="bg-red-50 dark:bg-red-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400">
          <Package className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-4">Order Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">We couldn't find the order you're looking for.</p>
        <button
          onClick={() => navigate('/my-orders')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          Back to My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 transition-colors duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={() => navigate('/my-orders')}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Orders
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button 
            onClick={generateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            <Download className="w-5 h-5" />
            Download Invoice
          </button>
          {(order.status === 'Pending' || order.status === 'Reject') && (
            <button 
              onClick={handleWhatsAppSupport}
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#128C7E] transition-all shadow-lg shadow-green-100 dark:shadow-none"
            >
              <MessageSquare className="w-5 h-5" />
              {order.status === 'Pending' ? 'Get Product Fast' : 'Why Reject/ Refund'}
            </button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-colors duration-500"
      >
        {/* Header Section */}
        <div className="p-8 md:p-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 transition-colors duration-500">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-indigo-600 p-2 rounded-xl">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Order Invoice</h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                Tracking: <span className="text-indigo-600 dark:text-indigo-400">{order.trackingNumber || `#${order.id.slice(-8).toUpperCase()}`}</span>
              </p>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-xl border inline-flex items-center gap-2 font-bold text-sm mb-2 ${getStatusClass(order.status)}`}>
                {getStatusIcon(order.status)}
                {order.status === 'Complete' || order.status === 'Delivered' ? 'Completed' : order.status === 'Reject' ? 'Rejected' : order.status}
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 md:p-12 space-y-12">
          {/* Customer & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</p>
                    <p className="font-bold text-slate-900 dark:text-slate-50">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gmail Address</p>
                    <p className="font-bold text-slate-900 dark:text-slate-50">{order.customerGmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phone Number</p>
                    <p className="font-bold text-slate-900 dark:text-slate-50">{order.customerPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Method</p>
                    <p className="font-bold text-slate-900 dark:text-slate-50">{order.paymentMethod}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transaction ID</p>
                    <p className="font-bold text-slate-900 dark:text-slate-50">{order.transactionId || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order ID</p>
                    <p className="font-bold text-slate-900 dark:text-slate-50 text-xs truncate max-w-[150px]">{order.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Summary</h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden transition-colors duration-500">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 transition-colors duration-500">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 transition-colors duration-500">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-50">{item.title}</p>
                        {item.variantName && <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{item.variantName}</p>}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600 dark:text-slate-400">{formatPrice(item.price)}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-50">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Section */}
          <div className="flex justify-end">
            <div className="w-full md:w-72 space-y-3">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold">
                <span>Subtotal</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold">
                <span>Tax</span>
                <span>{formatPrice(0)}</span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-4 transition-colors duration-500" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-black text-slate-900 dark:text-slate-50">Total Paid</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 text-center transition-colors duration-500">
          <p className="text-slate-400 dark:text-slate-500 text-sm font-bold">
            Thank you for shopping with Pixi Marts! If you have any questions, please contact our support.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetails;
