import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";

export interface PopupItem {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  items: PopupItem[];
}
const PopupMenu = ({
  visible,
  onClose,
  items,
}: Props) => {
  const { mode, theme } = useTheme();
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
    >
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.overlay}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <Animated.View
          entering={ZoomIn.duration(180)}
          exiting={ZoomOut.duration(120)}
          style={styles.menu}
        >
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              style={styles.item}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <View style={styles.icon}>
                {item.icon}
              </View>

              <Animated.Text
                style={[
                  styles.text,
                  item.danger && {
                    color: "#EF4444",
                  },
                ]}
              >
                {item.label}
              </Animated.Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default PopupMenu;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // backgroundColor: "rgba(0,0,0,.15)",
  },

  menu: {
    position: "absolute",
    top: 100,
    right: 15,

    width: 220,

    borderRadius: 8,

    backgroundColor:  "#fff",

    paddingVertical: 8,

    shadowColor: "#000",
    shadowOpacity: .15,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 15,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  icon: {
    width: 28,
  },

  text: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
});