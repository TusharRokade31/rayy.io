import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import BookingsScreen from '../screens/main/BookingsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ListingDetailScreen from '../screens/main/ListingDetailScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import AIAdvisorScreen from '../screens/main/AIAdvisorScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen 
      name="ListingDetail" 
      component={ListingDetailScreen}
      options={{headerShown: true, title: 'Class Details'}}
    />
    <Stack.Screen 
      name="Checkout" 
      component={CheckoutScreen}
      options={{headerShown: true, title: 'Checkout'}}
    />
    <Stack.Screen 
      name="AIAdvisor" 
      component={AIAdvisorScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

// Search Stack
const SearchStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="SearchMain" 
      component={SearchScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen 
      name="ListingDetail" 
      component={ListingDetailScreen}
      options={{headerShown: true, title: 'Class Details'}}
    />
  </Stack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'magnify' : 'magnify';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar-check' : 'calendar-check-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#06B6D4',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{headerShown: false}}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchStack}
        options={{headerShown: false}}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingsScreen}
        options={{headerShown: true, title: 'My Bookings'}}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{headerShown: true, title: 'Profile'}}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
