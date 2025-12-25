import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {colors} from '../../theme';

const WelcomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.logo}>✨ RRRAY</Text>
        <Text style={styles.tagline}>Learn • Play • Shine</Text>
        <Text style={styles.description}>
          Discover the best kids' classes, camps & activities near you
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    padding: 32,
    paddingBottom: 48,
  },
  primaryButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default WelcomeScreen;
