import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './screens/Home'; 
import Gerador from './screens/Gerador';
import Topicos from './screens/Topicos';
import Teste from './screens/Teste';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Gerador" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Gerador" component={Gerador} />
        <Stack.Screen name="Topicos" component={Topicos} />
        <Stack.Screen name="Teste" component={Teste} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}