import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
  snapTo: (index: number) => void;
}

interface Props {
  children: React.ReactNode;
  height?: number; // Fixed height if no snap points
  dynamicHeight?: boolean; // Fits content dynamically if no snap points
  snapPoints?: (string | number)[]; // e.g. ['30%', '60%', '90%']
  initialSnapIndex?: number;
  showHandle?: boolean;
  closeOnBackdropPress?: boolean;
  backdropOpacity?: number;
  onClose?: () => void;
}

const BottomSheet = forwardRef<BottomSheetRef, Props>(
  (
    {
      children,
      height = 400,
      dynamicHeight = false,
      snapPoints,
      initialSnapIndex = 0,
      showHandle = true,
      closeOnBackdropPress = true,
      backdropOpacity = 0.5,
      onClose,
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const activeHeight = useSharedValue(0);
    const startY = useSharedValue(0);
    const maxHeightShared = useSharedValue(dynamicHeight ? 0 : height);

    // Calculate actual pixel snap heights
    const parsedSnapPoints = React.useMemo(() => {
      if (!snapPoints) return [];
      return snapPoints.map(p => {
        if (typeof p === 'string') {
          if (p.endsWith('%')) {
            const pct = parseFloat(p) / 100;
            return pct * SCREEN_HEIGHT;
          }
          return parseFloat(p);
        }
        return p;
      });
    }, [snapPoints]);

    useEffect(() => {
      if (parsedSnapPoints.length > 0) {
        maxHeightShared.value = parsedSnapPoints[parsedSnapPoints.length - 1];
      } else if (!dynamicHeight) {
        maxHeightShared.value = height;
      } else {
        maxHeightShared.value = contentHeight;
      }
    }, [parsedSnapPoints, dynamicHeight, contentHeight, height]);

    const close = () => {
      translateY.value = withTiming(
        maxHeightShared.value,
        { duration: 250 },
        finished => {
          if (finished) {
            setVisible(false);
            if (onClose) onClose();
          }
        },
      );
    };

    const open = () => {
      setVisible(true);
    };

    const handleShow = () => {
      const destHeight = parsedSnapPoints.length > 0
        ? parsedSnapPoints[initialSnapIndex]
        : (dynamicHeight ? contentHeight : height);

      const maxH = parsedSnapPoints.length > 0
        ? parsedSnapPoints[parsedSnapPoints.length - 1]
        : (dynamicHeight ? contentHeight : height);

      activeHeight.value = destHeight;
      translateY.value = withSpring(maxH - destHeight, { damping: 15 });
    };

    const snapTo = (index: number) => {
      if (parsedSnapPoints.length > 0 && index >= 0 && index < parsedSnapPoints.length) {
        const destHeight = parsedSnapPoints[index];
        activeHeight.value = destHeight;
        translateY.value = withSpring(maxHeightShared.value - destHeight, { damping: 15 });
      }
    };

    useImperativeHandle(ref, () => ({
      open,
      close,
      snapTo,
    }));

    // Gesture Handling
    const pan = Gesture.Pan()
      .onStart(() => {
        startY.value = translateY.value;
      })
      .onUpdate(e => {
        const limitY = 0; // fully open visual top offset is 0
        const nextY = startY.value + e.translationY;

        // Allow dragging down, restrict drag up beyond max height
        if (nextY >= limitY) {
          translateY.value = nextY;
        }
      })
      .onEnd(e => {
        const currentSheetTop = translateY.value;
        const currentSheetHeight = maxHeightShared.value - currentSheetTop;

        // 1. Dragged down far enough to close
        if (e.velocityY > 500 || currentSheetHeight < maxHeightShared.value * 0.4) {
          runOnJS(close)();
          return;
        }

        // 2. Snap points snapping logic
        if (parsedSnapPoints.length > 0) {
          let closestIndex = 0;
          let minDiff = Infinity;

          parsedSnapPoints.forEach((sp, idx) => {
            const diff = Math.abs(currentSheetHeight - sp);
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = idx;
            }
          });

          runOnJS(snapTo)(closestIndex);
        } else {
          // Snap back to normal height
          const destHeight = dynamicHeight ? contentHeight : height;
          const maxH = dynamicHeight ? contentHeight : height;
          translateY.value = withSpring(maxH - destHeight, { damping: 15 });
        }
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        translateY.value,
        [0, maxHeightShared.value],
        [backdropOpacity, 0],
      ),
    }));

    if (!visible) return null;

    const renderContent = () => {
      const content = (
        <View style={[styles.contentWrapper, snapPoints && { flex: 1 }]}>{children}</View>
      );
      if (snapPoints) {
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={0}
          >
            {content}
          </KeyboardAvoidingView>
        );
      }
      return content;
    };

    return (
      <Modal transparent visible={visible} animationType="none" statusBarTranslucent onShow={handleShow}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            enabled={!snapPoints}
            style={styles.container}
          >
            {/* Backdrop */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: '#000' },
                backdropStyle,
              ]}
            >
              <Pressable
                style={{ flex: 1 }}
                onPress={() => {
                  if (closeOnBackdropPress) {
                    close();
                  }
                }}
              />
            </Animated.View>

            {/* Sheet */}
            <GestureDetector gesture={pan}>
              <Animated.View
                onLayout={e => {
                  if (dynamicHeight && !snapPoints) {
                    const h = e.nativeEvent.layout.height;
                    if (h > 0 && h !== contentHeight) {
                      console.log('h: ', h);
                      setContentHeight(h);
                      activeHeight.value = h;
                      translateY.value = 0;
                      maxHeightShared.value = h;
                    }
                  }
                }}
                style={[
                  styles.sheet,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    borderTopWidth: 1,
                    paddingBottom: Math.max(insets.bottom, 20),
                    height: snapPoints
                      ? parsedSnapPoints[parsedSnapPoints.length - 1]
                      : (dynamicHeight ? undefined : height),
                    maxHeight: SCREEN_HEIGHT * 0.9,
                  },
                  animatedStyle,
                ]}
              >
                {showHandle && (
                  <View style={[styles.handle,
                     { backgroundColor: theme.colors.border }
                    ]} />
                )}
                {renderContent()}
              </Animated.View>
            </GestureDetector>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
      </Modal>
    );
  },
);

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  contentWrapper: {
    flexShrink: 1,
  },
});