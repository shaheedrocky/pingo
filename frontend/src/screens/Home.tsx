import { View, Text, TouchableOpacity, FlatList, Image, ScrollView } from 'react-native'
import React, { useCallback, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Camera, ChevronUpCircle, CircleDotDashed, Ellipsis, Search, Settings, Trash2, User } from 'lucide-react-native'
import { chatUsers, stories } from '../data/index'
import PopupMenu from '../component/common/PopUpMenu';
import { SafeAreaView } from 'react-native-safe-area-context';

const Home = () => {
    const { toggleTheme, mode } = useTheme();
    const navigation = useNavigation<any>();

    const flatListRef = useRef<FlatList>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [visible, setVisible] = useState(false);


    const onScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;

        // Show button after scrolling 300px
        setShowScrollTop(offsetY > 200);
    };

    const scrollToTop = () => {
        flatListRef.current?.scrollToOffset({
            offset: 0,
            animated: true,
        });
    };

    const Header = useCallback(() => {
        return (
            <View className='mx-4'>
                {/* Home - Header */}
                <View className=' flex-row items-center justify-between'>
                    <Text className='text-black dark:text-white font-bold text-xl'>Pingo</Text>
                    <View className='flex-row items-center gap-4'>
                        <TouchableOpacity activeOpacity={0.8} hitSlop={10} className=' bg-gray-100/50 dark:bg-white/10 p-3 rounded-full'>
                            <Search size={18} color={mode === 'dark' ? 'white' : 'black'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            hitSlop={10}
                            className='bg-gray-100/50 dark:bg-white/10  p-3 rounded-full'
                            onPress={() => navigation.navigate('CreatePost')}
                        >
                            <Camera size={18} color={mode === 'dark' ? 'white' : 'black'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=> setVisible(true)} activeOpacity={0.8} hitSlop={10} className='bg-gray-100/50 dark:bg-white/10  p-3 rounded-full'>
                            <Ellipsis size={18} color={mode === 'dark' ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Home - Stories */}
                <View className='flex-row items-center gap-4 my-4'>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        className='h-20 w-20 rounded-full border-primary border border-dashed justify-center items-center '
                        onPress={() => navigation.navigate('CreatePost')}
                    >
                        <Text className='text-5xl font-light text-primary'>+</Text>
                    </TouchableOpacity>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {
                            stories.map((item: any, index: number) => (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('StoryView', { story: item })}
                                >
                                    <Image source={{ uri: item.avatar }} className={`${index !== 0 && 'ml-4'} h-20 w-20 rounded-full ${!item.seen && 'border-2 border-primary'}`} />
                                </TouchableOpacity>
                            ))
                        }
                    </ScrollView>
                </View>
            </View>
        )
    }, [navigation, mode])

    const renderMessageItem = useCallback(({ item, index }: { item: any, index: number }) => {
        return (
            <TouchableOpacity onPress={()=>{
                navigation.navigate('Chat',{
                    user: item
                })
            }} hitSlop={10} key={index} className='flex-row items-center justify-between mx-4  mt-4'>
                <View className='flex-row items-center gap-2'>
                    <Image source={{ uri: item.avatar }} className='h-14 w-14 rounded-full ' />
                    <View>
                        <Text className='font-medium text-base text-black dark:text-white '>{item.name}</Text>
                        <Text className='font-normal text-sm text-text-secondary dark:text-surface '>{item.lastMessage}</Text>
                    </View>
                </View>

                <View className='gap-1'>
                    <Text className='font-medium text-xs text-black dark:text-white '>{item.time}</Text>
                    <View className='flex-row items-center gap-1 justify-center'>
                        {item.pinned && <CircleDotDashed size={18} color={mode === 'dark' ? 'white' : 'black'} />}

                        {item.unreadCount > 0 && <View className='bg-primary h-5 justify-center items-center w-5 rounded-full'>
                            <Text className='text-xs font-normal text-white'>{item.unreadCount}</Text>
                        </View>}
                    </View>
                </View>
            </TouchableOpacity>
        )
    }, [])

    return (
        <SafeAreaView className="flex-1  bg-background dark:bg-secondaryDark">
            <FlatList data={chatUsers} renderItem={renderMessageItem} ListHeaderComponent={<Header />} ItemSeparatorComponent={<View className='border-b pb-4 border-gray-100/20' />}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                ref={flatListRef}
            />
            {showScrollTop && (
                <TouchableOpacity
                    onPress={scrollToTop}
                    className="absolute bottom-10 right-6 h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg"
                >
                    <ChevronUpCircle color="white" size={24} />
                </TouchableOpacity>
            )}

            <PopupMenu
                visible={visible}
                onClose={() => setVisible(false)}
                items={[
                    {
                        label: "Profile",
                        icon: <User size={20} />,
                        onPress: () => { navigation.navigate("Profile")},
                    },
                 
                ]}
            />
        </SafeAreaView>
    )
}

export default Home