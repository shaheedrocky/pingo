import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  PanResponder,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Crop,
  Smile,
  Type,
  Pencil,
  Send,
  Trash2,
  RotateCw
} from 'lucide-react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import GalleryGrid from '../component/GalleryGrid';
import { useTheme } from '../context/ThemeContext';
import { requestGalleryPermission } from '../utils/permissions';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EMOJIS = ['😊', '😂', '😍', '👍', '🔥', '🎉', '❤️', '👀', '✨', '🙌', '💀', '😘', '😎', '💡', '💯', '👏', '🌟', '💔'];
const TEXT_COLORS = ['#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#000000'];

interface Overlay {
  id: string;
  type: 'text' | 'emoji';
  text: string;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  color?: string;
}

interface ImageEdit {
  rotation: number; // 0, 90, 180, 270
  filter: 'none' | 'grayscale' | 'sepia' | 'warm' | 'cool';
  overlays: Overlay[];
}

// ----------------------------------------------------
// Draggable Overlay Component using PanResponder
// ----------------------------------------------------
interface DraggableOverlayProps {
  overlay: Overlay;
  onUpdatePosition: (x: number, y: number) => void;
}

const DraggableOverlay: React.FC<DraggableOverlayProps> = ({ overlay, onUpdatePosition }) => {
  const [position, setPosition] = useState({ x: overlay.x, y: overlay.y });
  const startPos = useRef({ x: overlay.x, y: overlay.y });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPos.current = { x: position.x, y: position.y };
      },
      onPanResponderMove: (evt, gestureState) => {
        const deltaX = (gestureState.dx / SCREEN_WIDTH) * 100;
        const deltaY = (gestureState.dy / (SCREEN_HEIGHT * 0.72)) * 100;

        setPosition({
          x: Math.max(5, Math.min(90, startPos.current.x + deltaX)),
          y: Math.max(5, Math.min(90, startPos.current.y + deltaY))
        });
      },
      onPanResponderRelease: (evt, gestureState) => {
        const deltaX = (gestureState.dx / SCREEN_WIDTH) * 100;
        const deltaY = (gestureState.dy / (SCREEN_HEIGHT * 0.72)) * 100;
        const finalX = Math.max(5, Math.min(90, startPos.current.x + deltaX));
        const finalY = Math.max(5, Math.min(90, startPos.current.y + deltaY));
        onUpdatePosition(finalX, finalY);
      }
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: [{ translateX: -20 }, { translateY: -20 }],
        zIndex: 90,
      }}
      className="p-1.5"
    >
      <Text
        style={{
          color: overlay.color || '#FFF',
          textShadowColor: 'rgba(0, 0, 0, 0.85)',
          textShadowOffset: { width: 1.5, height: 1.5 },
          textShadowRadius: 4,
        }}
        className={`font-bold ${overlay.type === 'emoji' ? 'text-[44px]' : 'text-[22px]'}`}
      >
        {overlay.text}
      </Text>
    </View>
  );
};

// ----------------------------------------------------
// Main CreatePost Component
// ----------------------------------------------------
const CreatePost = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  // Selection state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Captions and edits dictionaries mapped by image URI
  const [captions, setCaptions] = useState<{ [uri: string]: string }>({});
  const [imageEdits, setImageEdits] = useState<{ [uri: string]: ImageEdit }>({});

  // Overlay builder modals
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'emoji' | 'filter'>('none');
  const [inputText, setInputText] = useState<string>('');
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#FFFFFF');
  const [viewOnce, setViewOnce] = useState<boolean>(false);

  // Toggle selection on Grid item tap
  const handleSelectPhoto = (uri: string) => {
    setSelectedImages(prev => {
      if (prev.includes(uri)) {
        return prev.filter(item => item !== uri);
      } else {
        return [...prev, uri];
      }
    });
  };

  // Switch active editor image
  const handleSelectActive = (uri: string) => {
    setActiveImage(uri);
  };

  // Launch Editor Mode
  const handleProceedToPreview = () => {
    if (selectedImages.length === 0) return;
    setActiveImage(selectedImages[0]);
    setIsPreviewMode(true);
  };

  // ----------------------------------------------------
  // Functional Image Editing Handlers
  // ----------------------------------------------------

  // 1. Rotation (Crop/Rotate button)
  const handleRotate = () => {
    if (!activeImage) return;
    setImageEdits(prev => {
      const current = prev[activeImage] || { rotation: 0, filter: 'none', overlays: [] };
      const nextRotation = (current.rotation + 90) % 360;
      return {
        ...prev,
        [activeImage]: { ...current, rotation: nextRotation }
      };
    });
  };

  // 2. Add Text Overlay
  const handleAddText = () => {
    if (!inputText.trim() || !activeImage) return;
    const newOverlay: Overlay = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      text: inputText,
      x: 50,
      y: 40 + Math.random() * 10,
      color: selectedTextColor,
    };
    setImageEdits(prev => {
      const current = prev[activeImage] || { rotation: 0, filter: 'none', overlays: [] };
      return {
        ...prev,
        [activeImage]: {
          ...current,
          overlays: [...current.overlays, newOverlay]
        }
      };
    });
    setInputText('');
    setActiveTool('none');
  };

  // 3. Add Emoji Overlay
  const handleAddEmoji = (emoji: string) => {
    if (!activeImage) return;
    const newOverlay: Overlay = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'emoji',
      text: emoji,
      x: 50,
      y: 50 + Math.random() * 10,
    };
    setImageEdits(prev => {
      const current = prev[activeImage] || { rotation: 0, filter: 'none', overlays: [] };
      return {
        ...prev,
        [activeImage]: {
          ...current,
          overlays: [...current.overlays, newOverlay]
        }
      };
    });
    setActiveTool('none');
  };

  // 4. Update Overlay Drag Coordinates
  const handleUpdateOverlayPosition = (overlayId: string, x: number, y: number) => {
    if (!activeImage) return;
    setImageEdits(prev => {
      const current = prev[activeImage];
      if (!current) return prev;
      return {
        ...prev,
        [activeImage]: {
          ...current,
          overlays: current.overlays.map(item =>
            item.id === overlayId ? { ...item, x, y } : item
          )
        }
      };
    });
  };

  // 5. Apply Color Grade Filter
  const handleApplyFilter = (filterType: 'none' | 'grayscale' | 'sepia' | 'warm' | 'cool') => {
    if (!activeImage) return;
    setImageEdits(prev => {
      const current = prev[activeImage] || { rotation: 0, filter: 'none', overlays: [] };
      return {
        ...prev,
        [activeImage]: { ...current, filter: filterType }
      };
    });
  };

  // Remove active image from selection list
  const handleRemoveActiveImage = () => {
    if (!activeImage) return;
    const remaining = selectedImages.filter(item => item !== activeImage);
    setSelectedImages(remaining);

    // Clear edits and captions
    const updatedEdits = { ...imageEdits };
    const updatedCaptions = { ...captions };
    delete updatedEdits[activeImage];
    delete updatedCaptions[activeImage];
    setImageEdits(updatedEdits);
    setCaptions(updatedCaptions);

    if (remaining.length === 0) {
      setIsPreviewMode(false);
      setActiveImage(null);
    } else {
      setActiveImage(remaining[0]);
    }
  };

  // Send Finalized Post Details
  const handleSendPost = () => {
    const postSummary = selectedImages.map((uri, idx) => {
      const edit = imageEdits[uri] || { rotation: 0, filter: 'none', overlays: [] };
      return `Image ${idx + 1}:\n- Caption: ${captions[uri] || 'None'}\n- Filter: ${edit.filter}\n- Rotation: ${edit.rotation}°\n- Overlays: ${edit.overlays.length} items`;
    }).join('\n\n');

    Alert.alert(
      'Post Shared!',
      `View Once: ${viewOnce ? 'Enabled' : 'Disabled'}\n\n${postSummary}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset state
            setSelectedImages([]);
            setIsPreviewMode(false);
            setActiveImage(null);
            setCaptions({});
            setImageEdits({});
            setViewOnce(false);
          },
        },
      ]
    );
  };

  // Render Horizontal Thumbnail bar (Shows ONLY selected photos)
  const renderCarouselItem = ({ item }: { item: string }) => {
    const isSelected = item === activeImage;
    const edit = imageEdits[item] || { rotation: 0, filter: 'none', overlays: [] };

    // Get filter tint styles
    let tintStyle: any = {};
    if (edit.filter === 'grayscale') tintStyle = { backgroundColor: 'rgba(0,0,0,0.2)' };
    else if (edit.filter === 'sepia') tintStyle = { backgroundColor: 'rgba(210, 105, 30, 0.15)' };
    else if (edit.filter === 'warm') tintStyle = { backgroundColor: 'rgba(255, 165, 0, 0.12)' };
    else if (edit.filter === 'cool') tintStyle = { backgroundColor: 'rgba(0, 0, 255, 0.08)' };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleSelectActive(item)}
        className={`w-11 h-11 rounded-md overflow-hidden bg-slate-800 border-2 ${isSelected ? 'border-primary dark:border-dark-primary' : 'border-transparent'
          }`}
      >
        <Image
          source={{ uri: item }}
          style={{ width: '100%', height: '100%', transform: [{ rotate: `${edit.rotation}deg` }] }}
        />
        {edit.filter !== 'none' && <View style={tintStyle} className="absolute top-0 left-0 right-0 bottom-0" />}
      </TouchableOpacity>
    );
  };

  // 1. Gallery Selection Grid Mode
  if (!isPreviewMode) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-secondaryDark">
        <StatusBar
          barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
          backgroundColor={theme.colors.background}
        />
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-border dark:border-dark-border">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              try {
                navigation.goBack();
              } catch (e) {
                console.log('No navigation stack found.');
              }
            }}
            className="p-1"
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text className="text-lg font-bold flex-1 text-center text-text dark:text-white">New Post</Text>
          <View className="w-10" />
        </View>

        {/* Gallery Grid (Multi-Select Enabled) */}
        <GalleryGrid onSelect={handleSelectPhoto} selectedUris={selectedImages} />

        {/* Floating Proceed Button (WhatsApp Style) */}
        {selectedImages.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleProceedToPreview}
            className="absolute bottom-6 right-6 w-[60px] h-[60px] rounded-full items-center justify-center shadow-lg bg-primary dark:bg-dark-primary shadow-black/30"
          >
            <Send size={24} color="#FFF" className="ml-0.5" />
            <View className="absolute -top-1 -right-1 bg-danger w-[22px] h-[22px] rounded-full items-center justify-center border-[1.5px] border-white">
              <Text className="text-white text-[11px] font-extrabold">{selectedImages.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // Active Image edits
  const currentEdit = (activeImage && imageEdits[activeImage]) || { rotation: 0, filter: 'none', overlays: [] };

  // Calculate filter tint styles for preview screen
  let activeTintStyle: any = {};
  if (currentEdit.filter === 'grayscale') activeTintStyle = { backgroundColor: 'rgba(0,0,0,0.22)' };
  else if (currentEdit.filter === 'sepia') activeTintStyle = { backgroundColor: 'rgba(210, 105, 30, 0.18)' };
  else if (currentEdit.filter === 'warm') activeTintStyle = { backgroundColor: 'rgba(255, 165, 0, 0.14)' };
  else if (currentEdit.filter === 'cool') activeTintStyle = { backgroundColor: 'rgba(0, 0, 255, 0.1)' };

  // 2. Fullscreen Editor/Preview Mode
  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top Floating Action Bar */}
      <View
        style={{ top: Platform.OS === 'ios' ? 50 : 20 }}
        className="absolute left-0 right-0 z-50 flex-row items-center justify-between px-4"
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsPreviewMode(false)}
          className="w-10 h-10 rounded-full bg-black/45 items-center justify-center"
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <TouchableOpacity activeOpacity={0.7} onPress={handleRotate} className="w-10 h-10 rounded-full bg-black/45 items-center justify-center">
            <RotateCw size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTool('emoji')} className="w-10 h-10 rounded-full bg-black/45 items-center justify-center">
            <Smile size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTool('text')} className="w-10 h-10 rounded-full bg-black/45 items-center justify-center">
            <Type size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTool('filter')} className="w-10 h-10 rounded-full bg-black/45 items-center justify-center">
            <Pencil size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={handleRemoveActiveImage} className="w-10 h-10 rounded-full bg-danger items-center justify-center">
            <Trash2 size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fullscreen Main Image Preview Container */}
      <View className="flex-1 justify-center items-center bg-black">
        {activeImage && (
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.72 }} className="relative overflow-hidden">
            <Image
              source={{ uri: activeImage }}
              style={{ width: '100%', height: '100%', transform: [{ rotate: `${currentEdit.rotation}deg` }] }}
              resizeMode="contain"
            />
            {/* Color grading filter overlays */}
            {currentEdit.filter !== 'none' && (
              <View style={activeTintStyle} className="absolute top-0 left-0 right-0 bottom-0" pointerEvents="none" />
            )}

            {/* Draggable Overlays (Text / Emojis) */}
            {currentEdit.overlays.map(item => (
              <DraggableOverlay
                key={item.id}
                overlay={item}
                onUpdatePosition={(x, y) => handleUpdateOverlayPosition(item.id, x, y)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Bottom Control Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ paddingBottom: Platform.OS === 'ios' ? 12 : 20 }}
        className="absolute bottom-0 left-0 right-0 z-50"
      >
        {/* Quick Gallery Carousel Preview (Shows ONLY selected items) */}
        {selectedImages.length > 1 && (
          <View className="h-[52px] mb-3">
            <FlatList
              horizontal
              data={selectedImages}
              renderItem={renderCarouselItem}
              keyExtractor={item => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
            />
          </View>
        )}

        {/* Caption and Action Row */}
        <SafeAreaView className="flex-row items-end px-3 gap-2.5 ">
          <View className="flex-1 flex-row items-center  bg-slate-800 rounded-full px-4 min-h-[58px] max-h-[120px]">
            <TextInput
              value={activeImage ? captions[activeImage] || '' : ''}
              onChangeText={(text) => {
                if (activeImage) {
                  setCaptions(prev => ({ ...prev, [activeImage]: text }));
                }
              }}
              placeholder="Add a caption..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-white text-[15px] py-2"
              multiline
              maxLength={200}
            />

            <View className='flex-row items-center gap-4'>
              {/* View Once Icon Toggle */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setViewOnce(prev => !prev)}
                className={`w-6 h-6 rounded-full border-[1.5px] items-center justify-center ml-2 ${viewOnce ? 'bg-success border-success' : 'border-gray-400'
                  }`}
              >
                <View className={`w-[18px] h-[18px] rounded-full items-center justify-center`}>
                  <Text className={`text-[11px] font-extrabold ${viewOnce ? 'text-white' : 'text-gray-400'}`}>1</Text>
                </View>
              </TouchableOpacity>
              {/* Floating Send Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendPost}
                className="w-10 h-10 rounded-full items-center justify-center mb-0.5 bg-primary dark:bg-dark-primary"
              >
                <Send size={18} color="#FFF" className="ml-0.5" />
              </TouchableOpacity>
            </View>
          </View>


        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ----------------------------------------------------
          Modal Dialogs: 1. Text Overlay Editor
          ---------------------------------------------------- */}
      <Modal
        visible={activeTool === 'text'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTool('none')}
      >
        <View className="flex-1 bg-black/65 justify-center items-center">
          <View style={{ width: SCREEN_WIDTH * 0.85 }} className="bg-slate-800 rounded-2xl p-5 items-center shadow-lg">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type something..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoFocus
              style={{ color: selectedTextColor }}
              className="w-full text-2xl font-bold text-center border-b-[1.5px] border-white py-2 mb-5"
            />

            {/* Color Palette Selector Row */}
            <View className="flex-row gap-2 mb-6">
              {TEXT_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  activeOpacity={0.8}
                  onPress={() => setSelectedTextColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full border-[1.5px] ${selectedTextColor === color ? 'border-white border-2' : 'border-transparent'
                    }`}
                />
              ))}
            </View>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => {
                  setInputText('');
                  setActiveTool('none');
                }}
                className="flex-1 h-11 rounded-lg items-center justify-center bg-slate-600"
              >
                <Text className="text-white text-base font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddText}
                className="flex-1 h-11 rounded-lg items-center justify-center bg-primary dark:bg-dark-primary"
              >
                <Text className="text-white text-base font-bold">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ----------------------------------------------------
          Modal Dialogs: 2. Emoji Sticker Selector
          ---------------------------------------------------- */}
      <Modal
        visible={activeTool === 'emoji'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveTool('none')}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActiveTool('none')}
          className="flex-1 bg-black/65 justify-center items-center"
        >
          <View
            style={{ height: SCREEN_HEIGHT * 0.4 }}
            className="w-full bg-slate-800 rounded-t-2xl p-4 absolute bottom-0"
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-white text-base font-bold mb-4 text-center">Stickers</Text>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, paddingBottom: 24 }}>
              {EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  activeOpacity={0.7}
                  onPress={() => handleAddEmoji(emoji)}
                  style={{ width: (SCREEN_WIDTH - 64) / 5 }}
                  className="h-[50px] items-center justify-center"
                >
                  <Text className="text-[34px]">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ----------------------------------------------------
          Modal Dialogs: 3. Color Filter Selector
          ---------------------------------------------------- */}
      <Modal
        visible={activeTool === 'filter'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveTool('none')}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActiveTool('none')}
          className="flex-1 bg-black/65 justify-center items-center"
        >
          <View
            className="w-full bg-slate-800 rounded-t-2xl p-5 absolute bottom-0 items-center"
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-white text-base font-bold mb-4 text-center">Filters</Text>
            <View className="flex-row gap-2.5 w-full justify-between mb-5">
              {(['none', 'grayscale', 'sepia', 'warm', 'cool'] as const).map(type => {
                const isSelected = currentEdit.filter === type;
                return (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.8}
                    onPress={() => handleApplyFilter(type)}
                    className={`flex-1 h-[60px] bg-slate-900 rounded-lg items-center justify-center border-2 ${isSelected ? 'border-primary dark:border-dark-primary' : 'border-transparent'
                      }`}
                  >
                    <Text className={`text-[10px] font-extrabold ${isSelected ? 'text-primary dark:text-dark-primary' : 'text-white'}`}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => setActiveTool('none')}
              className="w-full h-[46px] rounded-lg items-center justify-center mb-3 bg-primary dark:bg-dark-primary"
            >
              <Text className="text-white text-base font-bold">Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

export default CreatePost;
