import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider
} from "firebase/auth";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as Linking from "expo-linking";
import * as AppleAuthentication from "expo-apple-authentication";
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:
      "552494983202-l4o7ah2djp6iq8abtpd149lv6ler4slj.apps.googleusercontent.com",
    redirectUri: Linking.createURL("/"),
  });

  useEffect(() => {
    const checkRememberedUser = async () => {
      const rememberedEmail = await AsyncStorage.getItem("rememberedEmail");
      const rememberedPassword = await AsyncStorage.getItem("rememberedPassword");
      if (rememberedEmail && rememberedPassword) {
        setEmail(rememberedEmail);
        setPassword(rememberedPassword);
        setRememberMe(true);
      }
    };
    checkRememberedUser();
  }, []);

  const handleLogin = async () => {
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) {
        await AsyncStorage.setItem("rememberedEmail", email);
        await AsyncStorage.setItem("rememberedPassword", password);
      } else {
        await AsyncStorage.removeItem("rememberedEmail");
        await AsyncStorage.removeItem("rememberedPassword");
      }
     
    } catch (error) {
      Alert.alert("Hata", error.message);
    }
  };


  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;

      const auth = getAuth();
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
      
        .catch((error) => {
          Alert.alert("Hata", error.message);
        });
    }
  }, [response]);

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
  
      const auth = getAuth();
      const provider = new OAuthProvider("apple.com");
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
      });
  
      await signInWithCredential(auth, firebaseCredential);
    } catch (error) {
      Alert.alert("Apple Girişi Başarısız", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.eyeIconContainer}
        >
          <AntDesign
            name={isPasswordVisible ? "eye" : "eyeo"}
            size={24}
            color="#ccc"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.rememberMeContainer}>
        <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.rememberMe}>
          <View style={rememberMe ? styles.checkboxChecked : styles.checkbox} />
          <Text style={styles.rememberMeText}>Beni Hatırla</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleLogin} style={styles.buttonPrimary}>
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        style={styles.buttonSecondary}
      >
        <Text style={styles.buttonText}>Hesabınız yok mu? Kayıt Ol</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => promptAsync()}
        style={styles.googleButton}
        disabled={!request}
      >
        <AntDesign name="google" size={25} color="white" style={styles.googleIcon} />
        <Text style={styles.googleText}>Google ile Giriş Yap</Text>
      </TouchableOpacity>
      <TouchableOpacity
  onPress={handleAppleLogin}
  style={styles.appleButton}
>
  <AntDesign name="apple1" size={25} color="white" style={styles.appleIcon} />
  <Text style={styles.appleText}>Apple ile Giriş Yap</Text>
</TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  passwordContainer: {
    position: "relative",
  },
  eyeIconContainer: {
    position: "absolute",
    right: 15,
    top: 12,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginRight: 10,
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    marginRight: 10,
  },
  rememberMeText: {
    fontSize: 16,
    color: "#333",
  },
  buttonPrimary: {
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonSecondary: {
    padding: 10,
    backgroundColor: "#28A745",
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
  googleButton: {
    padding: 10,
    backgroundColor: "#DB4437",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    marginRight: 10,
  },
  googleText: {
    color: "#fff",
    fontSize: 16,
  },
  appleButton: {
    padding: 10,
    backgroundColor: "#000",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  appleIcon: {
    marginRight: 10,
  },
  appleText: {
    color: "#fff",
    fontSize: 16,
  },
  
});

export default LoginScreen;
