import { View, Text, Image, ImageBackground, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCheck } from 'lucide-react-native';


import {
    Moon,
    Image as ImageIcon,
    Bell,
    Shield,
    HardDrive,
    User,
    CircleHelp,
    LogOut,
    ChevronRight,
} from "lucide-react-native";
import { useTheme } from '../context/ThemeContext';



const Profile = () => {

    const { mode, theme, toggleTheme } = useTheme()

    const OPTIONS = [
        {
            section: "Account",
            items: [
                {
                    title: "Edit Profile",
                    icon: <User size={20} color="#3B82F6" />,
                    onPress: () => { },
                },
            ],
        },

        {
            section: "Appearance",
            items: [
                {
                    title: "Theme",
                    icon: <Moon size={20} color="#6366F1" />,
                    rightText: mode === "dark" ? "Dark" : "Light",
                    onPress: toggleTheme,
                },
                {
                    title: "Chat Wallpaper",
                    icon: <ImageIcon size={20} color="#22C55E" />,
                    onPress: () => { },
                },
            ],
        },

        {
            section: "Notifications",
            items: [
                {
                    title: "Notifications",
                    icon: <Bell size={20} color="#F59E0B" />,
                    onPress: () => { },
                },
            ],
        },

        {
            section: "Privacy",
            items: [
                {
                    title: "Blocked Users",
                    icon: <Shield size={20} color="#EF4444" />,
                    onPress: () => { },
                },
            ],
        },

        {
            section: "Storage",
            items: [
                {
                    title: "Storage",
                    icon: <HardDrive size={20} color="#06B6D4" />,
                    onPress: () => { },
                },
            ],
        },

        {
            section: "About",
            items: [
                {
                    title: "Help",
                    icon: <CircleHelp size={20} color="#A855F7" />,
                    onPress: () => { },
                },
            ],
        },

        {
            section: "",
            items: [
                {
                    title: "Logout",
                    icon: <LogOut size={20} color="#EF4444" />,
                    danger: true,
                    onPress: () => { },
                },
            ],
        },
    ];

    return (
        <View className="flex-1 bg-background dark:bg-secondaryDark">
            <ImageBackground
                source={{
                    uri: 'https://images.unsplash.com/photo-1665281601378-50826d227aa9?q=80&w=1227&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                }}
                className="h-72 w-full p-4 pt-16"
                resizeMode='cover'
            >
                <Text
                    className="text-black dark:text-white font-semibold text-lg mb-4
                "
                >
                    Account
                </Text>

                <View className="bg-white dark:bg-backgroundDark p-4 rounded-2xl flex-row items-center justify-between">
                    <View className='flex-row items-center gap-4 '>
                        <Image
                            source={{
                                uri: 'https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                            }}
                            className="h-12 w-12 rounded-full"
                        />
                        <View>
                            <View className='flex-row items-center gap-1'>
                                <Text
                                    className="text-black dark:text-white font-semibold text-base 
                "
                                >
                                    Shaheed Ahamed
                                </Text>
                                <Image source={require('../assets/image/checklist.png')} className='h-4 w-4' />
                            </View>
                            <Text
                                className="text-black dark:text-white font-light text-sm 
                "
                            >
                                shaheedsibil@gmail.com
                            </Text>
                        </View>

                    </View>
                    <TouchableOpacity activeOpacity={0.8} className='border border-gray-300 py-2 px-4 rounded-full'>
                        <Text className='text-black  dark:text-white text-sm font-normal '>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity activeOpacity={0.8}>
                    <ImageBackground
                        source={{
                            uri: 'https://images.unsplash.com/photo-1761437856297-e7d0191f9a42?q=80&w=1263&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                        }}

                        className="w-full mt-4 overflow-hidden rounded-2xl justify-center"
                    >
                        <View className="flex-row items-center p-2 gap-4">
                            <View className='bg-black h-12 w-12 justify-center items-center rounded-full'>
                                <BadgeCheck color={'#EFBF04'} size={30} />
                            </View>
                            <Text className="text-xl font-bold text-[#EFBF04]">
                                Premium Membership
                            </Text>
                        </View>
                    </ImageBackground>
                </TouchableOpacity>
            </ImageBackground>

            <ScrollView className="flex-1 my-4 ">
                {OPTIONS.map((section, index) => (
                    <View key={index} className="mt-6">

                        {!!section.section && (
                            <Text
                                className="px-5 pb-2 text-sm font-semibold uppercase"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                {section.section}
                            </Text>
                        )}

                        <View
                            className="mx-4 overflow-hidden rounded-2xl"
                            style={{ backgroundColor: theme.colors.card }}
                        >
                            {section.items.map((item, i) => (
                                <TouchableOpacity
                                    key={i}
                                    activeOpacity={0.7}
                                    onPress={item.onPress}
                                    className="flex-row items-center px-5 py-4"
                                    
                                >
                                    <View className="mr-4">
                                        {item.icon}
                                    </View>

                                    <Text
                                        className="flex-1 text-base font-medium text-black dark:text-white"
                                       
                                    >
                                        {item.title}
                                    </Text>

                            
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default Profile;
