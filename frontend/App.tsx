import { LogBox } from "react-native";
import "./global.css"
import { ThemeProvider } from "./src/context/ThemeContext";
import Home from "./src/screens/Home";
import CreatePost from "./src/screens/CreatePost";
import StoryView from "./src/screens/StoryView";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Chat from "./src/screens/Chat";
import Profile from "./src/screens/Profile";
import SignUp from "./src/screens/SignUp";
import SignIn from "./src/screens/SignIn";
import ForgotPassword from "./src/screens/ForgotPassword";

LogBox.ignoreAllLogs()

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="SignIn">
              <Stack.Screen
                name="Home"
                component={Home}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="CreatePost"
                component={CreatePost}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="StoryView"
                component={StoryView}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Chat"
                component={Chat}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Profile"
                component={Profile}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SignUp"
                component={SignUp}
                options={{ headerShown: false }}
              />
                    <Stack.Screen
                name="SignIn"
                component={SignIn}
                options={{ headerShown: false }}
              />
              
                <Stack.Screen
                name="ForgotPassword"
                component={ForgotPassword}
                options={{ headerShown: false }}
              />
              

            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}