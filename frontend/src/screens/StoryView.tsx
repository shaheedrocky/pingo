import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const StoryView = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { story } = route.params;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start progress bar animation
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000, // 5 seconds duration
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleClose();
      }
    });

    return () => progress.stopAnimation();
  }, []);

  const handleClose = () => {
    navigation.goBack();
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Fullscreen Story Image background */}
      <Image
        source={{ uri: story.storyImage }}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        className="absolute top-0 left-0"
        resizeMode="contain"
      />

      {/* Floating Header Controls inside SafeAreaView */}
      <SafeAreaView className="flex-1 justify-between z-10">
        <View className="px-4 pt-3">
          {/* Top Progress Bar */}
          <View className="h-[3px] bg-white/30 rounded-full overflow-hidden mb-4">
            <Animated.View
              style={{ width: progressWidth }}
              className="h-full bg-white"
            />
          </View>

          {/* User Profile Info & Close Button Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: story.avatar }}
                className="w-10 h-10 rounded-full border-[1.5px] border-white/60"
              />
              <View>
                <Text className="text-white text-base font-bold shadow-sm">
                  {story.name}
                </Text>
                <Text className="text-gray-200 text-xs shadow-sm">
                  {story.time}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              className="p-1.5"
            >
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty spacing box at the bottom */}
        <View className="h-10" />
      </SafeAreaView>
    </View>
  );
};

export default StoryView;
