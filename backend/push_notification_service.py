# Firebase Cloud Messaging Service for Push Notifications
import os
import firebase_admin
from firebase_admin import credentials, messaging
from typing import List, Dict, Optional

# Initialize Firebase Admin (only once)
_firebase_initialized = False

def init_firebase():
    """Initialize Firebase Admin SDK"""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    try:
        # Check if service account key file exists
        cred_path = os.path.join(os.path.dirname(__file__), 'firebase-service-account.json')
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            print("✅ Firebase Admin SDK initialized successfully")
        else:
            print("⚠️ Firebase service account file not found. Push notifications will not work.")
            print(f"   Expected location: {cred_path}")
    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")

# Initialize on import
init_firebase()

async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[Dict] = None,
    image_url: Optional[str] = None
) -> Dict:
    """
    Send push notification to a single device
    
    Args:
        token: FCM device token
        title: Notification title
        body: Notification body text
        data: Additional data payload (optional)
        image_url: Image URL for rich notification (optional)
    
    Returns:
        Dict with success status and message_id or error
    """
    if not _firebase_initialized:
        return {
            'success': False,
            'error': 'Firebase not initialized. Add firebase-service-account.json'
        }
    
    try:
        # Build notification
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image_url
        )
        
        # Build Android config
        android_config = messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                icon='ic_notification',
                color='#3B82F6',
                sound='default',
                channel_id='rrray_general'
            )
        )
        
        # Build iOS config
        apns_config = messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title=title,
                        body=body
                    ),
                    badge=1,
                    sound='default'
                )
            )
        )
        
        # Create message
        message = messaging.Message(
            notification=notification,
            data=data or {},
            token=token,
            android=android_config,
            apns=apns_config
        )
        
        # Send message
        response = messaging.send(message)
        
        return {
            'success': True,
            'message_id': response
        }
    
    except Exception as e:
        print(f"Push notification error: {e}")
        return {
            'success': False,
            'error': str(e)
        }

async def send_push_to_multiple(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict] = None,
    image_url: Optional[str] = None
) -> Dict:
    """
    Send push notification to multiple devices
    
    Args:
        tokens: List of FCM device tokens
        title: Notification title
        body: Notification body text
        data: Additional data payload (optional)
        image_url: Image URL for rich notification (optional)
    
    Returns:
        Dict with success/failure counts
    """
    if not _firebase_initialized:
        return {
            'success': False,
            'error': 'Firebase not initialized'
        }
    
    try:
        # Build multicast message
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
                image=image_url
            ),
            data=data or {},
            tokens=tokens,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='ic_notification',
                    color='#3B82F6',
                    sound='default'
                )
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(
                            title=title,
                            body=body
                        ),
                        badge=1,
                        sound='default'
                    )
                )
            )
        )
        
        # Send to multiple devices
        response = messaging.send_multicast(message)
        
        return {
            'success': True,
            'success_count': response.success_count,
            'failure_count': response.failure_count,
            'responses': [{'success': r.success, 'message_id': r.message_id if r.success else None, 'error': str(r.exception) if not r.success else None} for r in response.responses]
        }
    
    except Exception as e:
        print(f"Multicast push notification error: {e}")
        return {
            'success': False,
            'error': str(e)
        }

async def send_push_to_topic(
    topic: str,
    title: str,
    body: str,
    data: Optional[Dict] = None,
    image_url: Optional[str] = None
) -> Dict:
    """
    Send push notification to a topic (all users subscribed to that topic)
    
    Args:
        topic: Topic name (e.g., 'booking_reminders', 'new_classes')
        title: Notification title
        body: Notification body text
        data: Additional data payload (optional)
        image_url: Image URL for rich notification (optional)
    
    Returns:
        Dict with success status and message_id
    """
    if not _firebase_initialized:
        return {
            'success': False,
            'error': 'Firebase not initialized'
        }
    
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
                image=image_url
            ),
            data=data or {},
            topic=topic,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='ic_notification',
                    color='#3B82F6',
                    sound='default'
                )
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(
                            title=title,
                            body=body
                        ),
                        badge=1,
                        sound='default'
                    )
                )
            )
        )
        
        response = messaging.send(message)
        
        return {
            'success': True,
            'message_id': response
        }
    
    except Exception as e:
        print(f"Topic push notification error: {e}")
        return {
            'success': False,
            'error': str(e)
        }

async def subscribe_to_topic(tokens: List[str], topic: str) -> Dict:
    """Subscribe devices to a topic"""
    if not _firebase_initialized:
        return {'success': False, 'error': 'Firebase not initialized'}
    
    try:
        response = messaging.subscribe_to_topic(tokens, topic)
        return {
            'success': True,
            'success_count': response.success_count,
            'failure_count': response.failure_count
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

async def unsubscribe_from_topic(tokens: List[str], topic: str) -> Dict:
    """Unsubscribe devices from a topic"""
    if not _firebase_initialized:
        return {'success': False, 'error': 'Firebase not initialized'}
    
    try:
        response = messaging.unsubscribe_from_topic(tokens, topic)
        return {
            'success': True,
            'success_count': response.success_count,
            'failure_count': response.failure_count
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}
