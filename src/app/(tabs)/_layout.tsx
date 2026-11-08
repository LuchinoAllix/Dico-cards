import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return <Tabs> 
            <Tabs.Screen name="index" options={{ title:"Home", tabBarIcon: ({ color, size }) => <FontAwesome5 name="home" size={size} color={color} />}}/>
            <Tabs.Screen name="dictionary" options={{ title:"Dictionary", tabBarIcon: ({ color, size }) => <FontAwesome5 name="book" size={size} color={color} />}}/>
            <Tabs.Screen name="saved" options={{ title:"Saved words", tabBarIcon: ({ color, size }) => <FontAwesome5 name="save" size={size} color={color} />}}/>
            <Tabs.Screen name="quiz" options={{ title:"Quiz", tabBarIcon: ({ color, size }) => <FontAwesome5 name="play" size={size} color={color} />}}/>
        </Tabs>;
}