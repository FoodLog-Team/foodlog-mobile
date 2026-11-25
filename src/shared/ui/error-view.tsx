import { Pressable, Text, View } from "react-native";

interface ErrorViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/** Full-screen error state with an optional retry action. */
export function ErrorView({ title = "Something went wrong", message, onRetry }: ErrorViewProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background px-6 dark:bg-background-dark">
      <Text
        accessibilityRole="header"
        className="text-center text-xl font-bold text-heading dark:text-heading-dark"
      >
        {title}
      </Text>
      <Text className="text-center text-base text-body dark:text-body-dark">{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          className="mt-3 min-h-11 justify-center rounded-xl bg-accent px-5 active:opacity-80 dark:bg-accent-dark"
        >
          <Text className="text-base font-semibold text-on-accent dark:text-on-accent-dark">
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
