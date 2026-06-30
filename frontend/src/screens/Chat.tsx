import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,

  StatusBar,
  Dimensions,
  Alert,
  Clipboard,
  Pressable,
  ToastAndroid
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CircleOff,
  Ellipsis,
  Phone,
  Video,
  Smile,
  Paperclip,
  Camera,
  Send,
  Mic,
  LoaderPinwheel,
  Copy
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import PopupMenu from '../component/common/PopUpMenu';
import { messages as initialMessages, messages } from '../data';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  senderId: string;
  text: string;
  type: string;
  createdAt?: string;
  time?: string;
  status: 'sent' | 'delivered' | 'seen';
}

const CHAT_AUTO_RESPONSES = [
  "Hey! That sounds amazing! Let's do it. 🚀",
  "Haha, I was just thinking the exact same thing! 😂",
  "Nice! Can you send me some designs when they are ready? 🎨",
  "Cool, let me check and get back to you in a bit. 👍",
  "I'm actually working on the backend setup right now! 💻",
  "Perfect! Let's catch up later tonight. See you!"
];

const Chat = () => {
  const navigation = useNavigation();
  const { user }: any = useRoute().params ?? {};
  const { theme, mode } = useTheme();

  const [visible, setVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [recipientStatus, setRecipientStatus] = useState<'Online' | 'Typing...' | 'Offline'>('Online');
  const [isSelected, setSelected] = useState({ is: false, value: '' })

  const flatListRef = useRef<FlatList>(null);
  const currentUserId = "1";

  // Load initial messages on mount
  useEffect(() => {
    // Map initial messages and ensure all have status fields
    const mapped = initialMessages.map((msg: any) => ({
      ...msg,
      status: msg.status || 'seen'
    }));
    setChatMessages(mapped);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  // Send Message Logic
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUserId,
      text: inputText,
      type: 'text',
      time: timestamp,
      status: 'sent',
    };

    setChatMessages(prev => [...prev, newMessage]);
    setInputText('');
    scrollToBottom(true);

    // Simulate Message Delivery States: Sent -> Delivered -> Seen
    const messageId = newMessage.id;

    // 1. Delivered after 800ms
    setTimeout(() => {
      setChatMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, status: 'delivered' } : msg)
      );
    }, 800);

    // 2. Seen after 1.5s
    setTimeout(() => {
      setChatMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, status: 'seen' } : msg)
      );
    }, 1500);

    // 3. Auto Reply Simulation: Typing... -> Reply received
    setTimeout(() => {
      setRecipientStatus('Typing...');
    }, 2200);

    setTimeout(() => {
      const randomReply = CHAT_AUTO_RESPONSES[Math.floor(Math.random() * CHAT_AUTO_RESPONSES.length)];
      const autoReply: Message = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: user.id || '100',
        text: randomReply,
        type: 'text',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'seen',
      };

      setChatMessages(prev => [...prev, autoReply]);
      setRecipientStatus('Online');
      scrollToBottom(true);
    }, 4200);
  };

  const renderItem = ({ item, index }: { item: Message, index: number }) => {
    const isMe = item.senderId === currentUserId;
    const messageTime = item.time || item.createdAt;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (isSelected.is) {
            setSelected({
              is: false,
              value: '',
            });
          }
        }}
        onLongPress={() => {
          setSelected({
            is: true,
            value: index.toString(),
          });
        }}

        className={` flex-row px-4 py-2 ${isMe ? "justify-end" : "justify-start"} ${isSelected.value === index.toString() && 'bg-blue-100  '}`}>
        {/* Receiver Profile Avatar */}
        {!isMe && (
          <Image
            source={{ uri: user.avatar }}
            className="mr-2 h-8 w-8 self-end rounded-full"
          />
        )}

        {/* Message Bubble container */}
        <View
          className={`max-w-[75%] px-4 py-2.5  ${isMe
            ? "rounded-2xl rounded-tr-sm bg-sent-bubble dark:bg-dark-sent-bubble"
            : "rounded-2xl rounded-tl-sm bg-received-bubble dark:bg-dark-received-bubble"
            }`}
        >
          <Text
            className={`text-[15px] leading-5 font-normal ${isMe ? "text-white" : "text-text dark:text-dark-text"
              }`}
          >
            {item.text}
          </Text>

          {/* Time & Tick Indicators */}
          <View className="mt-1 flex-row items-center justify-end">
            <Text
              className={`text-[10px] mr-1 ${isMe ? "text-white/70" : "text-text-secondary dark:text-dark-text-secondary"
                }`}
            >
              {messageTime}
            </Text>

            {isMe && (
              item.status === 'seen' ? (
                <CheckCheck size={14} color="white" />
              ) : item.status === 'delivered' ? (
                <CheckCheck size={14} color="white" />
              ) : (
                <LoaderPinwheel size={14} color="white" />
              )
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-dark-background">
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={mode === 'dark' ? theme.colors.card : '#FFF'}
      />

      {/* 1. FIXED PINNED HEADER (Stays static at the top) */}
      <View className="flex-row items-center justify-between px-3 py-2 border-b border-border dark:border-dark-border bg-background dark:bg-dark-card ">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            className="p-1"
          >
            <ArrowLeft size={24} color={mode === 'dark' ? '#FFF' : '#000'} />
          </TouchableOpacity>

          <Image source={{ uri: user.avatar }} className="h-10 w-10 rounded-full ml-1" />

          <View className="ml-2.5 justify-center flex-1">
            <Text className="font-bold text-[15px] text-text dark:text-dark-text" numberOfLines={1}>
              {user.name}
            </Text>
            <Text
              className={`text-xs font-semibold ${recipientStatus === 'Typing...' ? 'text-success' : 'text-text-secondary dark:text-dark-text-secondary'
                }`}
            >
              {recipientStatus}
            </Text>
          </View>
        </View>

        {/* Header Action Controls */}
        <View className="flex-row items-center gap-4 pr-1">
          <TouchableOpacity activeOpacity={0.7} className="p-1.5">
            <Video size={20} color={mode === 'dark' ? '#FFF' : '#111827'} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} className="p-1.5">
            <Phone size={19} color={mode === 'dark' ? '#FFF' : '#111827'} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setVisible(true)}
            className="p-1.5"
          >
            <Ellipsis size={20} color={mode === 'dark' ? '#FFF' : '#111827'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. CHAT MESSAGES LOG CONTAINER */}
      <Pressable style={{ flex: 1 }} onPress={() => {
        if (isSelected.is) {
          setSelected({
            is: false,
            value: '',
          });
        }
      }} className="bg-slate-50 dark:bg-slate-950">
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom(false)}
          onLayout={() => scrollToBottom(false)}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 mt-24">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10 dark:bg-dark-primary/10 mb-4">
                <Smile size={36} color={theme.colors.primary} />
              </View>
              <Text className="text-lg font-bold text-center text-text dark:text-dark-text">
                Say Hello!
              </Text>
              <Text className="mt-1 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
                Start your conversation with {user.name} by sending a message below.
              </Text>
            </View>
          }
        />
      </Pressable>

      {/* 3. KEYBOARD AVOIDING MESSAGE INPUT BAR */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View className="flex-row items-end justify-end px-2 py-2.5 bg-card dark:bg-dark-card border-t border-border dark:border-dark-border">
          {/* Main Input Text Box Area */}
          <View className="flex-1 flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-3xl px-3.5 mr-2 py-1 min-h-[40px] max-h-[100px]">
            <TouchableOpacity className="p-1">
              <Smile size={22} color="#6B7280" />
            </TouchableOpacity>

            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message"
              placeholderTextColor="#9CA3AF"
              multiline
              className="flex-1 text-[15px] text-text dark:text-dark-text px-2 py-1.5"
            />

            <TouchableOpacity className="p-1 mr-1">
              <Paperclip size={20} color="#6B7280" />
            </TouchableOpacity>

            {inputText.trim().length === 0 && (
              <TouchableOpacity className="p-1">
                <Camera size={21} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Send Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={inputText.trim() ? handleSendMessage : undefined}
            className="w-11 h-11 rounded-full items-center justify-center bg-primary dark:bg-dark-primary"
          >
            {inputText.trim() ? (
              <Send size={18} color="#FFF" className="ml-0.5" />
            ) : (
              <Mic size={19} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* PopUp Menu Settings overlay */}
      <PopupMenu
        visible={visible}
        onClose={() => setVisible(false)}
        items={[
          ...(isSelected.is
            ? [
              {
                label: 'Copy',
                icon: <Copy size={20} color={theme.colors.text} />,
                onPress: () => {
                  const message = messages[isSelected.value].text
                  Clipboard.setString(message);
                  setVisible(false);
                  setSelected({ is: false, value: '' });
                },
              },
            ]
            : []),

          {
            label: `Block ${user.name}`,
            danger: true,
            icon: <CircleOff color="red" size={20} />,
            onPress: () => {
              Alert.alert('Blocked', `You have blocked ${user.name}`);
            },
          },

        ]}
      />
    </SafeAreaView>
  );
};

export default Chat;