import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MessageCircleHeart } from 'lucide-react-native'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'
import { Formik } from "formik";
import * as Yup from "yup";



const schema = Yup.object().shape({
    email: Yup.string()
        .email("Enter a valid email")
        .required("Email is required"),

    password: Yup.string()
        .min(8, "Minimum 8 characters")
        .required("Password is required"),
});

const SignIn = () => {
    const { theme } = useTheme()
    const navigation = useNavigation()
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
                            marginTop: 30,
                        }}
                    />

                    <Text className="mt-5 text-center text-3xl font-bold text-black dark:text-white">
                        Welcome Back 👋
                    </Text>

                    <Text className="mt-2 text-center text-base text-gray-500 dark:text-gray-400 mb-4">
                        Sign in to continue chatting with your friends and family.
                    </Text>

                    <Formik
                        initialValues={{
                            email: "",
                            password: "",
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
                            isSubmitting,
                            isValid,
                            dirty,
                        }) => (
                            <>
                                <TextInput
                                    placeholder="Email Address"
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="mt-8 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4 text-black dark:text-white"
                                    value={values.email}
                                    onChangeText={handleChange("email")}
                                    onBlur={handleBlur("email")}
                                />

                                {touched.email && errors.email && (
                                    <Text className="mt-1 text-red-500">
                                        {errors.email}
                                    </Text>
                                )}

                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor="#999"
                                    secureTextEntry
                                    className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4 text-black dark:text-white"
                                    value={values.password}
                                    onChangeText={handleChange("password")}
                                    onBlur={handleBlur("password")}
                                />

                                {touched.password && errors.password && (
                                    <Text className="mt-1 text-red-500">
                                        {errors.password}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    className="mt-4 self-end"
                                    onPress={()=> navigation.navigate('ForgotPassword' as never)}
                                >
                                    <Text
                                        className="font-medium"
                                        style={{ color: theme.colors.primary }}
                                    >
                                        Forgot Password?
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    disabled={!dirty || !isValid || isSubmitting}
                                    activeOpacity={0.8}
                                    onPress={handleSubmit}
                                    className="mt-8 h-14 flex-row items-center justify-center rounded-2xl"
                                    style={{
                                        backgroundColor: theme.colors.primary,
                                        opacity: !dirty || !isValid ? 0.5 : 1,
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <ActivityIndicator color="#FFF" />
                                            <Text className="ml-2 text-lg font-semibold text-white">
                                                Signing In...
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-lg font-semibold text-white">
                                            Sign In
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                    </Formik>



                    <View className="mb-10 mt-8 flex-row justify-center">
                        <Text className="text-gray-500 dark:text-gray-400">
                            Don't have an account?
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate("SignUp" as never)}
                        >
                            <Text
                                className="ml-1 font-semibold"
                                style={{ color: theme.colors.primary }}
                            >
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>


                </View>

            </ScrollView>
        </SafeAreaView>
    )
}

export default SignIn