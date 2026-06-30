import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from "react-native";

import { Formik } from "formik";
import * as Yup from "yup";

import {
    Camera,
    Mars,
    Venus,
    MessageCircleHeart,
    CircleUser,
} from "lucide-react-native";

import { launchImageLibrary } from "react-native-image-picker";

import { useTheme } from "../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const schema = Yup.object().shape({
    fullName: Yup.string().required("Full name is required"),
    email: Yup.string().email().required("Email is required"),
    password: Yup.string().required("Password is required").min(8, 'Min 8 characters'),
    phone: Yup.string().matches(/^[0-9]{10}$/).required("Phone is Required"),
    gender: Yup.string().required("Gneder is required"),
});

export default function SignUp() {
    const { theme, mode } = useTheme();

    const [photo, setPhoto] = useState<any>();

    const pickImage = async () => {
        const res = await launchImageLibrary({
            mediaType: "photo",
            quality: 0.8,
        });

        if (res.assets?.length) {
            setPhoto(res.assets[0].uri);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-secondaryDark">

            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

                <View className="px-6">

                    <MessageCircleHeart
                        size={70}
                        color={theme.colors.primary}
                        style={{
                            alignSelf: "center",
                            marginTop: 20,
                        }}
                    />

                    <Text className="mt-5 text-center text-3xl font-bold text-black dark:text-white">
                        Create Account
                    </Text>

                    <Text className="mt-2 text-center text-base text-gray-500 dark:text-gray-400">
                        Join millions of conversations. Fast, private and secure messaging.
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={pickImage}
                        className="mt-8 self-center"
                    >
                        <View>
                            {photo ? <Image
                                source={
                                    { uri: photo }

                                }
                                className="h-28 w-28 rounded-full"
                            /> : <CircleUser size={140} color={mode === 'dark' ? '#374151' : '#374151'} strokeWidth={1} />}

                            <View
                                className="absolute bottom-1 right-1 rounded-full p-2"
                                style={{
                                    backgroundColor: theme.colors.primary,
                                }}
                            >
                                <Camera
                                    size={18}
                                    color="white"
                                />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <Formik
                        initialValues={{
                            fullName: "",
                            email: "",
                            phone: "",
                            gender: "",
                            password: ''
                        }}
                        validationSchema={schema}
                        onSubmit={(values) => {
                            console.log(values);
                        }}
                    >
                        {({
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            values,
                            errors,
                            touched,
                            setFieldValue,
                            isValid,
                            isSubmitting,
                            dirty
                        }) => (
                            <>
                                <View className="mt-8">

                                    <TextInput
                                        placeholder="Full Name"
                                        placeholderTextColor="#999"
                                        className="rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4 text-black dark:text-white"
                                        value={values.fullName}
                                        onChangeText={handleChange("fullName")}
                                        onBlur={handleBlur("fullName")}
                                    />

                                    {touched.fullName && (
                                        <Text className="mt-1 text-red-500">
                                            {errors.fullName}
                                        </Text>
                                    )}

                                    <TextInput
                                        className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4 text-black dark:text-white"
                                        placeholder="Email Address"
                                        placeholderTextColor="#999"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={values.email}
                                        onChangeText={handleChange("email")}
                                        onBlur={handleBlur("email")}
                                    />

                                    {touched.email && (
                                        <Text className="mt-1 text-red-500">
                                            {errors.email}
                                        </Text>
                                    )}


                                    <TextInput
                                        className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4 text-black dark:text-white"
                                        placeholder="Password"
                                        placeholderTextColor="#999"
                                        keyboardType="default"
                                        autoCapitalize="none"
                                        value={values.password}
                                        onChangeText={handleChange("password")}
                                        onBlur={handleBlur("password")}
                                    />

                                    {touched.password && (
                                        <Text className="mt-1 text-red-500">
                                            {errors.password}
                                        </Text>
                                    )}

                                    <TextInput
                                        className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4 text-black dark:text-white"
                                        placeholder="Phone Number"
                                        placeholderTextColor="#999"
                                        keyboardType="number-pad"
                                        value={values.phone}
                                        onChangeText={handleChange("phone")}
                                        onBlur={handleBlur("phone")}
                                    />

                                    {touched.phone && (
                                        <Text className="mt-1 text-red-500">
                                            {errors.phone}
                                        </Text>
                                    )}

                                    <Text className="mt-6 mb-3 text-base font-semibold text-black dark:text-white">
                                        Gender
                                    </Text>

                                    <View className="flex-row gap-4">

                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() =>
                                                setFieldValue("gender", "male")
                                            }
                                            className={`flex-1 rounded-2xl border p-5 ${values.gender === "male"
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                                : "border-gray-100 dark:border-gray-700"
                                                }`}
                                        >
                                            <Mars
                                                size={35}
                                                color="#3B82F6"
                                                style={{ alignSelf: "center" }}
                                            />

                                            <Text className="mt-2 text-center text-black dark:text-white">
                                                Male
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() =>
                                                setFieldValue("gender", "female")
                                            }
                                            className={`flex-1 rounded-2xl border p-5 ${values.gender === "female"
                                                ? "border-pink-500 bg-pink-50 dark:bg-pink-900/30"
                                                : "border-gray-100 dark:border-gray-700"
                                                }`}
                                        >
                                            <Venus
                                                size={35}
                                                color="#EC4899"
                                                style={{ alignSelf: "center" }}
                                            />

                                            <Text className="mt-2 text-center text-black dark:text-white">
                                                Female
                                            </Text>
                                        </TouchableOpacity>

                                    </View>

                                    {touched.gender && (
                                        <Text className="mt-2 text-red-500">
                                            {errors.gender}
                                        </Text>
                                    )}

                                    <TouchableOpacity
                                        disabled={isSubmitting || !isValid || !dirty}
                                        activeOpacity={0.8}
                                        onPress={handleSubmit}
                                        className="mt-8 h-14 flex-row items-center justify-center rounded-2xl"
                                        style={{ backgroundColor: theme.colors.primary, opacity:  (!isValid || !dirty) ? 0.5 :1 }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <ActivityIndicator color="#FFF" size="small" />
                                                <Text className="ml-2 text-lg font-semibold text-white">
                                                    Submitting...
                                                </Text>
                                            </>
                                        ) : (
                                            <Text className="text-lg font-semibold text-white">
                                                Create Account
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                </View>
                            </>
                        )}
                    </Formik>

                </View>

            </ScrollView>

        </SafeAreaView>
    );
}