import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {listingService} from '../../services/api';
import {colors} from '../../theme';

const {width} = Dimensions.get('window');

const ListingDetailScreen = ({navigation, route}) => {
  const {id} = route.params;
  const [listing, setListing] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('trial'); // trial or regular
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const [listingRes, sessionsRes] = await Promise.all([
        listingService.getById(id),
        listingService.getSessions(id),
      ]);

      setListing(listingRes.data);
      setSessions(sessionsRes.data || []);
      if (!listingRes.data.trial_available) {
        setSelectedType('regular');
      }
      // Auto-select first available session
      if (sessionsRes.data && sessionsRes.data.length > 0) {
        setSelectedSession(sessionsRes.data[0]);
      }
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!selectedSession) {
      Alert.alert('No Session Selected', 'Please select a session to book');
      return;
    }
    navigation.navigate('Checkout', {
      listingId: listing.id,
      sessionId: selectedSession.id,
      bookingType: selectedType,
      price: selectedType === 'trial' ? listing.trial_price_inr : listing.base_price_inr,
      sessionDate: selectedSession.date,
      sessionTime: selectedSession.time,
      listingTitle: listing.title,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Listing not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Image */}
        <Image source={{uri: listing.image_url}} style={styles.heroImage} />

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Icon name="account-group" size={20} color={colors.primary} />
              <Text style={styles.metaText}>
                {listing.age_min}-{listing.age_max} years
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="clock-outline" size={20} color={colors.primary} />
              <Text style={styles.metaText}>{listing.duration_minutes} mins</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="map-marker" size={20} color={colors.primary} />
              <Text style={styles.metaText}>{listing.location || 'Online'}</Text>
            </View>
          </View>

          {/* Booking Type Selector */}
          {listing.trial_available && (
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === 'trial' && styles.typeButtonActive,
                ]}
                onPress={() => setSelectedType('trial')}>
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedType === 'trial' && styles.typeButtonTextActive,
                  ]}>
                  Trial Class
                </Text>
                <Text
                  style={[
                    styles.typePrice,
                    selectedType === 'trial' && styles.typePriceActive,
                  ]}>
                  ₹{listing.trial_price_inr}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === 'regular' && styles.typeButtonActive,
                ]}
                onPress={() => setSelectedType('regular')}>
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedType === 'regular' && styles.typeButtonTextActive,
                  ]}>
                  Regular Class
                </Text>
                <Text
                  style={[
                    styles.typePrice,
                    selectedType === 'regular' && styles.typePriceActive,
                  ]}>
                  ₹{listing.base_price_inr}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this class</Text>
            <Text style={styles.description}>{listing.description || 'No description available.'}</Text>
          </View>

          {/* What to Expect */}
          {listing.what_to_expect && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What to Expect</Text>
              <Text style={styles.description}>{listing.what_to_expect}</Text>
            </View>
          )}

          {/* Available Sessions */}
          {sessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Sessions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionsScroll}>
                {sessions.slice(0, 5).map(session => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionCard,
                      selectedSession?.id === session.id && styles.sessionCardSelected,
                    ]}
                    onPress={() => setSelectedSession(session)}>
                    <View style={styles.sessionDate}>
                      <Icon name="calendar" size={16} color={selectedSession?.id === session.id ? 'white' : colors.primary} />
                      <Text style={[styles.sessionDateText, selectedSession?.id === session.id && styles.sessionTextSelected]}>
                        {session.date}
                      </Text>
                    </View>
                    <View style={styles.sessionTime}>
                      <Icon name="clock-outline" size={16} color={selectedSession?.id === session.id ? 'white' : colors.textSecondary} />
                      <Text style={[styles.sessionTimeText, selectedSession?.id === session.id && styles.sessionTextSelected]}>
                        {session.time}
                      </Text>
                    </View>
                    <Text style={[styles.sessionSeats, selectedSession?.id === session.id && styles.sessionTextSelected]}>
                      {session.seats_available || (session.seats_total - session.seats_reserved)} seats left
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{height: 100}} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarLabel}>Total Price</Text>
          <Text style={styles.bottomBarPrice}>
            ₹{selectedType === 'trial' ? listing.trial_price_inr : listing.base_price_inr}
          </Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  heroImage: {
    width: width,
    height: 250,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  typeButtonTextActive: {
    color: colors.primary,
  },
  typePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  typePriceActive: {
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  sessionsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 140,
  },
  sessionCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sessionDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sessionDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sessionTimeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sessionSeats: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  sessionTextSelected: {
    color: 'white',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomBarLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bottomBarPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ListingDetailScreen;
