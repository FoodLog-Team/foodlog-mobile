import { Text, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6 dark:bg-background-dark">
      <Text
        accessibilityRole="header"
        className="text-center text-5xl font-bold tracking-tight text-heading dark:text-heading-dark"
      >
        FoodLog
      </Text>
      <View className="mt-4 h-1 w-10 rounded-full bg-accent dark:bg-accent-dark" />
    </View>
  );
}
