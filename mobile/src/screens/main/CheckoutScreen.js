import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {bookingService} from '../../services/api';
import {initiatePayment} from '../../services/razorpay';
import {colors} from '../../theme';
import {useAuth} from '../../context/AuthContext';

const CheckoutScreen = ({navigation, route}) => {
  const {user} = useAuth();
  const {listingId, sessionId, bookingType, price, sessionDate, sessionTime, listingTitle} = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    childName: '',
    notes: '',
  });

  const handlePaymentAndBooking = async () => {
    if (!formData.childName) {
      Alert.alert('Missing Information', 'Please enter child name');
      return;
    }

    setLoading(true);
    try {
      // Initiate Razorpay payment
      const paymentResult = await initiatePayment({
        amount: price,
        orderId: sessionId,
        name: user?.name || 'Customer',
        email: user?.email || '',
        contact: user?.phone || '',
        description: `${bookingType === 'trial' ? 'Trial' : 'Regular'} class booking`,
      });

      if (!paymentResult.success) {
        Alert.alert('Payment Failed', paymentResult.error || 'Please try again');
        setLoading(false);
        return;
      }

      // Payment successful, create booking
      const bookingData = {
        session_id: sessionId,
        child_name: formData.childName,
        notes: formData.notes,
        payment_method: 'razorpay',
        payment_id: paymentResult.paymentId,
        razorpay_order_id: paymentResult.orderId,
        razorpay_signature: paymentResult.signature,
      };

      await bookingService.create(bookingData);
      
      Alert.alert(
        'Booking Confirmed! 🎉',
        'Payment successful! Your booking has been confirmed.',
        [
          {
            text: 'View My Bookings',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{name: 'Main'}],
              });
              navigation.navigate('Bookings');
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Booking Failed', error.response?.data?.detail || error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Booking Type</Text>
            <Text style={styles.summaryValue}>
              {bookingType === 'trial' ? 'Trial Class' : 'Regular Class'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Session Date</Text>
            <Text style={styles.summaryValue}>{sessionDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Session Time</Text>
            <Text style={styles.summaryValue}>{sessionTime}</Text>
          </View>
          <View style={[styles.summaryRow, {marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border}]}>
            <Text style={styles.summaryLabel}>Total Price</Text>
            <Text style={styles.summaryPrice}>₹{price}</Text>
          </View>
        </View>

        {/* Child Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Child Details</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Child's Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter child's name"
              placeholderTextColor={colors.textSecondary}
              value={formData.childName}
              onChangeText={text => setFormData({...formData, childName: text})}
            />
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special requirements or notes..."
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={text => setFormData({...formData, notes: text})}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handlePaymentAndBooking}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon name="shield-check" size={20} color="white" />
              <Text style={styles.bookButtonText}>Pay ₹{price} with Razorpay</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.paymentIcons}>
          <Text style={styles.secureText}>
            <Icon name="lock" size={14} color={colors.success} /> Secure Payment
          </Text>
          <Text style={styles.poweredBy}>Powered by Razorpay</Text>
        </View>

        <Text style={styles.disclaimer}>
          * Payment will be processed securely via Razorpay. You'll receive a confirmation email after booking.
        </Text>

        <View style={{height: 40}} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  paymentIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  secureText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '600',
  },
  poweredBy: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});

export default CheckoutScreen;
