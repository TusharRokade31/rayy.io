import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import {AuthProvider} from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import {theme} from './theme';

const App = () => {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;
