import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {homeService, listingService} from '../../services/api';
import {colors} from '../../theme';
import {useAuth} from '../../context/AuthContext';

const HomeScreen = ({navigation}) => {
  const {user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [trials, setTrials] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [camps, setCamps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [categoriesRes, trialsRes, workshopsRes, campsRes] = await Promise.all([
        homeService.getCategories(),
        homeService.getTrials(),
        homeService.getWorkshops(),
        homeService.getCamps(),
      ]);

      setCategories(categoriesRes.data || []);
      setTrials(trialsRes.data || []);
      setWorkshops(workshopsRes.data.workshops || workshopsRes.data || []);
      setCamps(campsRes.data.camps || campsRes.data || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleSearch = () => {
    navigation.navigate('Search', {query: searchQuery});
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.greeting}>Hello {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>Find amazing classes today</Text>
        </View>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate('AIAdvisor')}>
          <Icon name="robot" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search classes, activities..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.slice(0, 8).map(category => (
            <TouchableOpacity
              key={category.id || category.slug}
              style={styles.categoryCard}
              onPress={() =>
                navigation.navigate('Search', {categorySlug: category.slug})
              }>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>{category.icon || '🎨'}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* This Week's Trials */}
      {trials.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ This Week's Trials</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search', {trialOnly: true})}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trials.map(listing => (
              <TouchableOpacity
                key={listing.id}
                style={styles.trialCard}
                onPress={() => navigation.navigate('ListingDetail', {id: listing.id})}>
                <Image
                  source={{uri: listing.image_url}}
                  style={styles.trialImage}
                />
                <View style={styles.trialBadge}>
                  <Text style={styles.trialBadgeText}>₹{listing.trial_price_inr}</Text>
                </View>
                <View style={styles.trialContent}>
                  <Text style={styles.trialTitle} numberOfLines={2}>
                    {listing.title}
                  </Text>
                  <View style={styles.trialInfo}>
                    <Text style={styles.trialInfoText}>
                      👥 {listing.age_min}-{listing.age_max}yrs
                    </Text>
                    <Text style={styles.trialInfoText}>⏱️ {listing.duration_minutes}min</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Workshops */}
      {workshops.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Workshops</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {workshops.slice(0, 5).map(workshop => (
              <TouchableOpacity
                key={workshop.id}
                style={styles.workshopCard}
                onPress={() => navigation.navigate('ListingDetail', {id: workshop.id})}>
                <Image
                  source={{uri: workshop.image_url}}
                  style={styles.workshopImage}
                />
                <View style={styles.workshopContent}>
                  <Text style={styles.workshopTitle} numberOfLines={2}>
                    {workshop.title}
                  </Text>
                  <Text style={styles.workshopPrice}>₹{workshop.base_price_inr}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Camps */}
      {camps.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏕️ Weekend Camps</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {camps.slice(0, 5).map(camp => (
              <TouchableOpacity
                key={camp.id}
                style={styles.campCard}
                onPress={() => navigation.navigate('ListingDetail', {id: camp.id})}>
                <Image source={{uri: camp.image_url}} style={styles.campImage} />
                <View style={styles.campContent}>
                  <Text style={styles.campTitle} numberOfLines={2}>
                    {camp.title}
                  </Text>
                  <Text style={styles.campPrice}>₹{camp.base_price_inr}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{height: 40}} />
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  categoryCard: {
    alignItems: 'center',
    marginLeft: 20,
    width: 80,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  trialCard: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    marginLeft: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  trialImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surface,
  },
  trialBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trialBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  trialContent: {
    padding: 12,
  },
  trialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  trialInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  trialInfoText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  workshopCard: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    marginLeft: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  workshopImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surface,
  },
  workshopContent: {
    padding: 12,
  },
  workshopTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  workshopPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  campCard: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    marginLeft: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  campImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surface,
  },
  campContent: {
    padding: 12,
  },
  campTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  campPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default HomeScreen;
