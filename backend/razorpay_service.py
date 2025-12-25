"""
Razorpay Integration Service for YUNO
Handles payment order creation, verification, webhooks, and refunds
"""
import razorpay
import os
import hmac
import hashlib
from typing import Dict, Optional
from datetime import datetime, timezone

class RazorpayService:
    def __init__(self):
        self.key_id = os.environ.get('RAZORPAY_KEY_ID', '')
        self.key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
        self.webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
        self.mode = os.environ.get('PAYMENTS_MODE', 'mock')
        
        if self.mode in ['test', 'live'] and self.key_id and self.key_secret:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            self.client.set_app_details({"title": "YUNO", "version": "1.0.0"})
        else:
            self.client = None
    
    def create_order(self, amount_inr: float, booking_id: str, user_email: str, user_phone: str) -> Dict:
        """
        Create Razorpay order
        
        Args:
            amount_inr: Amount in INR (will be converted to paise)
            booking_id: Booking reference ID
            user_email: Customer email
            user_phone: Customer phone
        
        Returns:
            Dict with order_id, amount, currency, and razorpay_key_id
        """
        if self.mode == 'mock':
            return {
                "order_id": f"mock_order_{booking_id[:12]}",
                "amount": int(amount_inr * 100),
                "currency": "INR",
                "razorpay_key_id": "mock_key",
                "status": "mock"
            }
        
        if not self.client:
            raise Exception("Razorpay client not initialized. Check API keys.")
        
        try:
            # Amount in paise
            amount_paise = int(amount_inr * 100)
            
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": booking_id,
                "payment_capture": 1,  # Auto capture
                "notes": {
                    "booking_id": booking_id,
                    "email": user_email,
                    "phone": user_phone
                }
            }
            
            order = self.client.order.create(data=order_data)
            
            return {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "razorpay_key_id": self.key_id,
                "status": order["status"]
            }
        
        except Exception as e:
            raise Exception(f"Razorpay order creation failed: {str(e)}")
    
    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """
        Verify Razorpay payment signature
        
        Args:
            razorpay_order_id: Order ID from Razorpay
            razorpay_payment_id: Payment ID from Razorpay
            razorpay_signature: Signature from Razorpay
        
        Returns:
            True if signature is valid, False otherwise
        """
        if self.mode == 'mock':
            return True
        
        if not self.client:
            return False
        
        try:
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            
            self.client.utility.verify_payment_signature(params_dict)
            return True
        
        except razorpay.errors.SignatureVerificationError:
            return False
    
    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """
        Verify webhook signature
        
        Args:
            payload: Webhook payload as string
            signature: X-Razorpay-Signature header value
        
        Returns:
            True if signature is valid, False otherwise
        """
        if self.mode == 'mock':
            return True
        
        if not self.webhook_secret:
            return False
        
        try:
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
        
        except Exception:
            return False
    
    def fetch_payment(self, payment_id: str) -> Optional[Dict]:
        """
        Fetch payment details from Razorpay
        
        Args:
            payment_id: Razorpay payment ID
        
        Returns:
            Payment details dict or None
        """
        if self.mode == 'mock':
            return {
                "id": payment_id,
                "status": "captured",
                "amount": 100000,
                "currency": "INR",
                "method": "card"
            }
        
        if not self.client:
            return None
        
        try:
            return self.client.payment.fetch(payment_id)
        except Exception:
            return None
    
    def create_refund(self, payment_id: str, amount_inr: float, reason: str = "Customer cancellation") -> Dict:
        """
        Create refund for a payment
        
        Args:
            payment_id: Razorpay payment ID
            amount_inr: Refund amount in INR
            reason: Refund reason
        
        Returns:
            Refund details dict
        """
        if self.mode == 'mock':
            return {
                "id": f"mock_rfnd_{payment_id[:12]}",
                "amount": int(amount_inr * 100),
                "currency": "INR",
                "payment_id": payment_id,
                "status": "processed",
                "created_at": int(datetime.now(timezone.utc).timestamp())
            }
        
        if not self.client:
            raise Exception("Razorpay client not initialized")
        
        try:
            amount_paise = int(amount_inr * 100)
            
            refund_data = {
                "amount": amount_paise,
                "notes": {
                    "reason": reason
                }
            }
            
            refund = self.client.payment.refund(payment_id, refund_data)
            return refund
        
        except Exception as e:
            raise Exception(f"Refund creation failed: {str(e)}")
    
    def get_invoice_url(self, payment_id: str) -> Optional[str]:
        """
        Generate invoice/receipt URL
        
        Args:
            payment_id: Razorpay payment ID
        
        Returns:
            Invoice URL or None
        """
        if self.mode == 'mock':
            return f"https://mock-invoice.yuno.app/{payment_id}"
        
        # Razorpay doesn't provide direct invoice URLs
        # We would need to generate PDFs on our end
        # For now, return None - will implement PDF generation separately
        return None

# Global service instance
razorpay_service = RazorpayService()
