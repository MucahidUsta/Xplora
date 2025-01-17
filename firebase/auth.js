import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config'; // Firebase config dosyanız
import { setDoc, doc } from 'firebase/firestore';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Kullanıcı adı durumu
  const [isSignUp, setIsSignUp] = useState(true); // Kayıt olma veya giriş yapma modu

  const handleAuthAction = async () => {
    try {
      if (isSignUp) {
        // Kayıt olma
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Kullanıcı bilgilerini Firestore'a kaydet
        await setDoc(doc(db, 'users', user.uid), {
          name: name, // Kullanıcı adı
          email: user.email,
          photoURL: '', // Kullanıcı fotoğrafı (Varsayılan olarak boş)
        });
        Alert.alert('Başarılı!', `Kullanıcı oluşturuldu: ${user.email}`);
      } else {
        // Giriş yapma
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Başarılı!', `Hoş geldiniz: ${userCredential.user.email}`);
      }
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="İsim"
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isSignUp ? 'Kayıt Ol' : 'Giriş Yap'} onPress={handleAuthAction} />
      <Button
        title={`Modu Değiştir: ${isSignUp ? 'Giriş Yap' : 'Kayıt Ol'}`}
        onPress={() => setIsSignUp((prev) => !prev)}
        color="gray"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
   
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
});