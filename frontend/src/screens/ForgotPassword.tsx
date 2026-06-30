import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const emailSchema = Yup.object().shape({
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
});

const passwordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

export default function ForgotPassword() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [otpError, setOtpError] = useState("");
  const [otpResent, setOtpResent] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const otpInputRef = useRef<TextInput>(null);

  // Focus OTP hidden input when entering step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 200);
      setTimer(30);
      setOtpResent(false);
      setOtpError("");
    }
  }, [step]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== 2 || timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async (values: { email: string }) => {
    setEmail(values.email);
    // Simulating API call
    await delay(1500);
    setStep(2);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }
    setOtpVerifying(true);
    setOtpError("");
    // Simulating API verification delay
    await delay(1500);
    setOtpVerifying(false);
    
    // Accept any 6 digit input as valid for this UI demo
    if (otp.length === 6) {
      setStep(3);
    } else {
      setOtpError("Invalid verification code. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    setOtp("");
    setTimer(30);
    setOtpResent(true);
    setOtpError("");
    // Simulating resend delay
    await delay(1000);
    setTimeout(() => {
      setOtpResent(false);
    }, 4000);
  };

  const handleResetPassword = async (values: any) => {
    // Simulating password update API call
    await delay(1500);
    setStep(4);
  };

  const handleBackAction = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View className="flex-row justify-center items-center my-6 px-10">
        <View
          className={`h-8 w-8 rounded-full justify-center items-center ${
            step >= 1 ? "bg-primary dark:bg-primaryDark" : "bg-gray-200 dark:bg-gray-700"
          }`}
          style={step === 1 ? { backgroundColor: theme.colors.primary } : {}}
        >
          <Text className="text-white text-xs font-semibold">1</Text>
        </View>
        <View
          className={`h-[2px] flex-1 ${
            step >= 2 ? "bg-primary dark:bg-primaryDark" : "bg-gray-200 dark:bg-gray-700"
          }`}
          style={step >= 2 ? { backgroundColor: theme.colors.primary } : {}}
        />
        
        <View
          className={`h-8 w-8 rounded-full justify-center items-center ${
            step >= 2 ? "bg-primary dark:bg-primaryDark" : "bg-gray-200 dark:bg-gray-700"
          }`}
          style={step === 2 ? { backgroundColor: theme.colors.primary } : {}}
        >
          <Text className="text-white text-xs font-semibold">2</Text>
        </View>
        <View
          className={`h-[2px] flex-1 ${
            step >= 3 ? "bg-primary dark:bg-primaryDark" : "bg-gray-200 dark:bg-gray-700"
          }`}
          style={step >= 3 ? { backgroundColor: theme.colors.primary } : {}}
        />

        <View
          className={`h-8 w-8 rounded-full justify-center items-center ${
            step >= 3 ? "bg-primary dark:bg-primaryDark" : "bg-gray-200 dark:bg-gray-700"
          }`}
          style={step === 3 ? { backgroundColor: theme.colors.primary } : {}}
        >
          <Text className="text-white text-xs font-semibold">3</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-backgroundDark">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pb-12">
          {/* Header Back Button */}
          {step < 4 && (
            <TouchableOpacity
              className="mt-4 self-start"
              activeOpacity={0.8}
              onPress={handleBackAction}
            >
              <ArrowLeft color={theme.colors.text} size={24} />
            </TouchableOpacity>
          )}

          {/* Logo / Header Section */}
          {step < 4 && (
            <View className="items-center mt-6">
              {step === 1 && (
                <View className="h-16 w-16 bg-blue-50 dark:bg-surfaceDark rounded-full justify-center items-center mb-4">
                  <Mail size={32} color={theme.colors.primary} />
                </View>
              )}
              {step === 2 && (
                <View className="h-16 w-16 bg-blue-50 dark:bg-surfaceDark rounded-full justify-center items-center mb-4">
                  <KeyRound size={32} color={theme.colors.primary} />
                </View>
              )}
              {step === 3 && (
                <View className="h-16 w-16 bg-blue-50 dark:bg-surfaceDark rounded-full justify-center items-center mb-4">
                  <Lock size={32} color={theme.colors.primary} />
                </View>
              )}

              <Text className="text-center text-3xl font-bold text-black dark:text-white">
                {step === 1 && "Forgot Password"}
                {step === 2 && "Enter OTP Code"}
                {step === 3 && "Reset Password"}
              </Text>

              <Text className="mt-3 text-center text-base leading-6 text-gray-500 dark:text-text-secondaryDark">
                {step === 1 &&
                  "Don't worry! Enter your registered email address below and we'll send you a 6-digit OTP verification code."}
                {step === 2 &&
                  `We've sent a 6-digit verification code to your email ${email}. Please enter it below to verify your identity.`}
                {step === 3 &&
                  "Please create a new strong password. Make sure it is at least 8 characters long."}
              </Text>
            </View>
          )}

          {/* Step indicator */}
          {step < 4 && renderStepIndicator()}

          {/* Step 1: Email Form */}
          {step === 1 && (
            <Formik
              initialValues={{ email: email }}
              enableReinitialize
              validationSchema={emailSchema}
              onSubmit={handleSendOtp}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <View className="mt-4">
                  <TextInput
                    placeholder="Email Address"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="rounded-2xl border border-border dark:border-borderDark px-4 py-4 text-black dark:text-white bg-white dark:bg-cardDark"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                  />

                  {touched.email && errors.email && (
                    <Text className="mt-2 text-danger dark:text-dangerDark text-sm pl-1">
                      {errors.email}
                    </Text>
                  )}

                  <TouchableOpacity
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                    onPress={() => handleSubmit()}
                    className="mt-8 h-14 flex-row items-center justify-center rounded-2xl bg-primary dark:bg-primaryDark"
                    style={{
                      opacity: isSubmitting ? 0.55 : 1,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <ActivityIndicator color="#FFF" />
                        <Text className="ml-2 text-lg font-semibold text-white">
                          Sending OTP...
                        </Text>
                      </>
                    ) : (
                      <Text className="text-lg font-semibold text-white">
                        Send Verification Code
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="mt-6 items-center"
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                  >
                    <Text
                      className="font-semibold text-base"
                      style={{
                        color: theme.colors.primary,
                      }}
                    >
                      Back to Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          )}

          {/* Step 2: OTP Verification Form */}
          {step === 2 && (
            <View className="mt-4">
              {/* Hidden text input */}
              <TextInput
                ref={otpInputRef}
                value={otp}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  setOtp(cleaned);
                }}
                keyboardType="number-pad"
                maxLength={6}
                className="absolute h-0 w-0 opacity-0"
              />

              {/* Styled digits container */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => otpInputRef.current?.focus()}
                className="flex-row justify-between items-center my-6 px-1"
              >
                {Array.from({ length: 6 }).map((_, index) => {
                  const char = otp[index] || "";
                  const isFocused = otp.length === index;
                  return (
                    <View
                      key={index}
                      className={`w-[14%] h-14 border-2 rounded-xl justify-center items-center bg-white dark:bg-cardDark ${
                        isFocused
                          ? "border-primary dark:border-primaryDark"
                          : char
                          ? "border-primary/50 dark:border-primaryDark/50"
                          : "border-border dark:border-borderDark"
                      }`}
                    >
                      <Text className="text-xl font-bold text-black dark:text-white">
                        {char}
                      </Text>
                      {isFocused && (
                        <View className="absolute bottom-2 w-4 h-[2px] bg-primary dark:bg-primaryDark" />
                      )}
                    </View>
                  );
                })}
              </TouchableOpacity>

              {otpError ? (
                <Text className="text-danger dark:text-dangerDark text-sm text-center mb-2">
                  {otpError}
                </Text>
              ) : null}

              {otpResent ? (
                <Text className="text-success dark:text-success text-sm text-center mb-2 font-medium">
                  Verification code resent successfully!
                </Text>
              ) : null}

              <TouchableOpacity
                disabled={otp.length < 6 || otpVerifying}
                activeOpacity={0.8}
                onPress={handleVerifyOtp}
                className="mt-4 h-14 flex-row items-center justify-center rounded-2xl bg-primary dark:bg-primaryDark"
                style={{
                  opacity: otp.length < 6 || otpVerifying ? 0.55 : 1,
                }}
              >
                {otpVerifying ? (
                  <>
                    <ActivityIndicator color="#FFF" />
                    <Text className="ml-2 text-lg font-semibold text-white">
                      Verifying...
                    </Text>
                  </>
                ) : (
                  <Text className="text-lg font-semibold text-white">
                    Verify Code
                  </Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center items-center mt-8">
                <Text className="text-gray-500 dark:text-text-secondaryDark mr-1 text-sm">
                  Didn't receive the code?
                </Text>
                {timer > 0 ? (
                  <Text className="font-semibold text-primary dark:text-primaryDark text-sm">
                    Resend in {timer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text className="font-semibold text-primary dark:text-primaryDark text-sm underline">
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Step 3: New Password Form */}
          {step === 3 && (
            <Formik
              initialValues={{ password: "", confirmPassword: "" }}
              validationSchema={passwordSchema}
              onSubmit={handleResetPassword}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <View className="mt-4">
                  <View className="relative mt-2">
                    <TextInput
                      placeholder="New Password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      className="rounded-2xl border border-border dark:border-borderDark px-4 py-4 pr-12 text-black dark:text-white bg-white dark:bg-cardDark"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                    />
                    <TouchableOpacity
                      className="absolute right-4 top-4"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={22} color="#94A3B8" />
                      ) : (
                        <Eye size={22} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {touched.password && errors.password && (
                    <Text className="mt-2 text-danger dark:text-dangerDark text-sm pl-1">
                      {errors.password}
                    </Text>
                  )}

                  <View className="relative mt-5">
                    <TextInput
                      placeholder="Confirm Password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConfirmPassword}
                      className="rounded-2xl border border-border dark:border-borderDark px-4 py-4 pr-12 text-black dark:text-white bg-white dark:bg-cardDark"
                      value={values.confirmPassword}
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                    />
                    <TouchableOpacity
                      className="absolute right-4 top-4"
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={22} color="#94A3B8" />
                      ) : (
                        <Eye size={22} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {touched.confirmPassword && errors.confirmPassword && (
                    <Text className="mt-2 text-danger dark:text-dangerDark text-sm pl-1">
                      {errors.confirmPassword}
                    </Text>
                  )}

                  <TouchableOpacity
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                    onPress={() => handleSubmit()}
                    className="mt-8 h-14 flex-row items-center justify-center rounded-2xl bg-primary dark:bg-primaryDark"
                    style={{
                      opacity: isSubmitting ? 0.55 : 1,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <ActivityIndicator color="#FFF" />
                        <Text className="ml-2 text-lg font-semibold text-white">
                          Updating Password...
                        </Text>
                      </>
                    ) : (
                      <Text className="text-lg font-semibold text-white">
                        Reset Password
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          )}

          {/* Step 4: Success Screen */}
          {step === 4 && (
            <View className="items-center mt-12">
              <View className="h-24 w-24 bg-green-50 dark:bg-green-950/20 rounded-full justify-center items-center mb-6">
                <CheckCircle2 size={60} color="#22C55E" />
              </View>

              <Text className="text-2xl font-bold text-black dark:text-white text-center">
                Password Reset Successful!
              </Text>

              <Text className="mt-4 text-center text-base leading-6 text-gray-500 dark:text-text-secondaryDark px-4">
                Your password has been successfully reset. You can now log in using your new password.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("SignIn" as never)}
                className="mt-10 h-14 w-full flex-row items-center justify-center rounded-2xl bg-primary dark:bg-primaryDark"
              >
                <Text className="text-lg font-semibold text-white">Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}