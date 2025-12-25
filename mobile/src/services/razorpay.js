import RazorpayCheckout from 'react-native-razorpay';
import api from './api';

// Razorpay Key (get from backend or env)
const RAZORPAY_KEY_ID = 'rzp_test_dummy'; // This will be replaced with actual key

export const initiatePayment = async ({
  amount, // in rupees
  orderId,
  name,
  email,
  contact,
  description,
}) => {
  try {
    // Create Razorpay order from backend
    const orderResponse = await api.post('/payments/create-razorpay-order', {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
    });

    const {order_id, key_id} = orderResponse.data;

    // Razorpay payment options
    const options = {
      description: description || 'Class Booking Payment',
      image: 'https://rrray.com/logo.png',
      currency: 'INR',
      key: key_id || RAZORPAY_KEY_ID,
      amount: amount * 100, // amount in paise
      order_id: order_id,
      name: 'RRRAY',
      prefill: {
        email: email,
        contact: contact,
        name: name,
      },
      theme: {color: '#06B6D4'},
    };

    // Open Razorpay checkout
    const data = await RazorpayCheckout.open(options);

    // Payment successful
    return {
      success: true,
      paymentId: data.razorpay_payment_id,
      orderId: data.razorpay_order_id,
      signature: data.razorpay_signature,
    };
  } catch (error) {
    // Payment failed or cancelled
    if (error.code) {
      // Razorpay error codes
      return {
        success: false,
        error: error.description || 'Payment failed',
        code: error.code,
      };
    }
    throw error;
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/verify-razorpay-payment', paymentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
