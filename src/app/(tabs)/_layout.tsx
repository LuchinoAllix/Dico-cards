import { FontAwesome5 } from '@expo/vector-icons';
import { Link, Tabs } from "expo-router";
import { useTheme } from "../../theme/useTheme";

export default function TabsLayout() {
  const { colors, font } = useTheme();

  return <Tabs
    screenOptions={{
      headerTitleStyle: font ? { fontFamily: font.bold } : undefined,
      tabBarLabelStyle: font ? { fontFamily: font.regular } : undefined,
    }}
    > 
            <Tabs.Screen name="index" options={{
                                        title: "Home",
                                        tabBarIcon: ({ color, size }) => <FontAwesome5 name="home" size={size} color={color}/>,
                                        headerRight: () => (
                                          <Link href="/settings" style={{ marginRight: 16 }}>
                                            <FontAwesome5 name="cog" size={24} color={colors.text}/>
                                          </Link>)
                                        }}/>
            <Tabs.Screen name="dictionary" options={{ title:"Dictionary", tabBarIcon: ({ color, size }) => <FontAwesome5 name="book" size={size} color={color} />}}/>
            <Tabs.Screen name="saved" options={{ title:"Saved words", tabBarIcon: ({ color, size }) => <FontAwesome5 name="save" size={size} color={color} />}}/>
            <Tabs.Screen name="quiz" options={{ title:"Quiz", tabBarIcon: ({ color, size }) => <FontAwesome5 name="play" size={size} color={color} />}}/>
        </Tabs>; 
}