import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import editProfile from "../components/editProfile";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AddScreen from "../screens/AddScreen";
import ChatScreen from "../screens/ChatScreen";
import UpdatePhotoScreen from "../screens/UpdatePhotoScreen";
import ExploreScreen from "../screens/ExploreScreen";
import FollowingScreen from "../screens/FollowingScreen";
import GezenlerScreen from "../screens/GezenlerScreen";
import GezenlerChatScreen from "../screens/GezenlerChatScreen";
import CommentScreen from "../screens/CommentScreen";
import ZilScreen from "../screens/ZilScreen";
import AIChatComponent from "../components/AIChatComponent ";
import DeviceInfo from "../components/DeviceInfo";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === "Home") iconName = "home";
        else if (route.name === "Add") iconName = "add";
        else if (route.name === "Profile") iconName = "person";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Add" component={AddScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Chat" component={ChatScreen} options={{headerShown: false }} />
            <Stack.Screen name="UpdatePhotoScreen" component={UpdatePhotoScreen} options={{headerShown: false }}  />
            <Stack.Screen name="editProfile" component={editProfile} options={{headerShown: false }}  />
            <Stack.Screen name="Explore" component={ExploreScreen} options={{headerShown: false }}/>
            <Stack.Screen name="Following" component={FollowingScreen}  />
            <Stack.Screen name="GezenlerScreen" component={GezenlerScreen} options={{headerShown: false }}  />
            <Stack.Screen name="GezenlerChatScreen" component={GezenlerChatScreen} options={{headerShown: false }}/>
            <Stack.Screen name="Yorumlar" component={CommentScreen} />
            <Stack.Screen name="Bildirimler" component={ZilScreen}  options={{headerShown: false }}/>
            <Stack.Screen name="AIChat" component={AIChatComponent} />
            <Stack.Screen name="DeviceInfo" component={DeviceInfo} />
       
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
