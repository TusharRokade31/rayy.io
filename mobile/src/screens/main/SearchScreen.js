import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {listingService} from '../../services/api';
import {colors} from '../../theme';

const SearchScreen = ({navigation, route}) => {
  const [searchQuery, setSearchQuery] = useState(route.params?.query || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    categorySlug: route.params?.categorySlug || null,
    trialOnly: route.params?.trialOnly || false,
  });

  useEffect(() => {
    if (searchQuery.length > 0 || filters.categorySlug || filters.trialOnly) {
      performSearch();
    }
  }, [searchQuery, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = {
        q: searchQuery,
        ...(filters.categorySlug && {category: filters.categorySlug}),
        ...(filters.trialOnly && {trial_only: true}),
      };

      const response = await listingService.search(params);
      setResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate('ListingDetail', {id: item.id})}>
      <Image source={{uri: item.image_url}} style={styles.resultImage} />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.resultMeta}>
          <Text style={styles.resultMetaText}>
            👥 {item.age_min}-{item.age_max}yrs
          </Text>
          <Text style={styles.resultMetaText}>⏱️ {item.duration_minutes}min</Text>
        </View>
        <View style={styles.resultFooter}>
          {item.trial_available && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>Trial ₹{item.trial_price_inr}</Text>
            </View>
          )}
          <Text style={styles.resultPrice}>₹{item.base_price_inr}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search classes, activities..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="magnify" size={64} color={colors.border} />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try different keywords</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultImage: {
    width: 120,
    height: 120,
    backgroundColor: colors.surface,
  },
  resultContent: {
    flex: 1,
    padding: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  resultMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trialBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trialBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  resultPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
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
});

export default SearchScreen;
