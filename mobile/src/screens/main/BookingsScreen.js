import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {bookingService} from '../../services/api';
import {colors} from '../../theme';

const BookingsScreen = ({navigation}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookingService.getMyBookings();
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.cancel(bookingId);
              Alert.alert('Success', 'Booking cancelled successfully');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      case 'completed':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'cancelled':
        return 'close-circle';
      case 'completed':
        return 'check-all';
      default:
        return 'information';
    }
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => navigation.navigate('ListingDetail', {id: item.listing_id})}>
      <Image source={{uri: item.listing_image}} style={styles.bookingImage} />
      <View style={styles.bookingContent}>
        <Text style={styles.bookingTitle} numberOfLines={2}>
          {item.listing_title}
        </Text>
        <View style={styles.bookingMeta}>
          <Icon name="calendar" size={14} color={colors.textSecondary} />
          <Text style={styles.bookingMetaText}>{item.session_date}</Text>
        </View>
        <View style={styles.bookingMeta}>
          <Icon name="clock-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.bookingMetaText}>{item.session_time}</Text>
        </View>
        <View style={styles.bookingFooter}>
          <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status) + '20'}]}>
            <Icon name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, {color: getStatusColor(item.status)}]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          {item.status === 'confirmed' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item.id)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank" size={64} color={colors.border} />
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>Your bookings will appear here</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}>
              <Text style={styles.browseButtonText}>Browse Classes</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingImage: {
    width: 100,
    height: 140,
    backgroundColor: colors.surface,
  },
  bookingContent: {
    flex: 1,
    padding: 12,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bookingMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  browseButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BookingsScreen;
