import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, KeyboardAvoidingView, Alert } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';

const AIChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [location, setLocation] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const HERE_API_KEY = 'YOUR_HERE_API_KEY';

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum izni reddedildi', 'Konum bilgisi alınamıyor.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  const geocodeLocation = async (locationName) => {
    try {
      const response = await axios.get('https://geocode.search.hereapi.com/v1/geocode', {
        params: {
          q: locationName,
          apiKey: HERE_API_KEY,
        },
      });

      const result = response.data.items[0];
      if (!result) {
        Alert.alert('Hata', `"${locationName}" için koordinat bulunamadı.`);
        return null;
      }

      return `${result.position.lat},${result.position.lng}`;
    } catch (error) {
      console.error('Konum çözümlenirken hata:', error.response?.data || error.message);
      Alert.alert('Hata', 'Konum çözümlenirken bir sorun oluştu.');
      return null;
    }
  };

  const findPlaces = async (query, userLocation = null) => {
    try {
      setIsRequesting(true);

      let locationQuery = '';
      if (!userLocation && location) {
        locationQuery = `${location.coords.latitude},${location.coords.longitude}`;
      } else if (userLocation) {
        const geocodedLocation = await geocodeLocation(userLocation);
        if (!geocodedLocation) return;
        locationQuery = geocodedLocation;
      } else {
        Alert.alert('Konum Alınamıyor', 'Lütfen konum iznini kontrol edin.');
        return;
      }

      const response = await axios.get('https://discover.search.hereapi.com/v1/discover', {
        params: {
          q: query,
          at: locationQuery,
          limit: 3,
          apiKey: HERE_API_KEY,
        },
      });

      const results = response.data.items || [];
      if (results.length === 0) {
        const aiMessage = {
          role: 'assistant',
          content: `Maalesef "${query}" ile ilgili bir yer bulunamadı.`,
        };
        setMessages((prev) => [...prev, aiMessage]);
        return;
      }

      const places = results.map((place) => `${place.title} - ${place.address.label}`);
      const aiMessage = {
        role: 'assistant',
        content: `"${query}" ile ilgili yerler:\n\n${places.join('\n')}`,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Yer aranırken hata:', error.response?.data || error.message);
      Alert.alert('Hata', 'API çağrısı başarısız oldu. Lütfen sorgunuzu kontrol edin.');
    } finally {
      setIsRequesting(false);
    }
  };

  const sendMessage = async () => {
    if (input.trim() === '' || isRequesting) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Sorguyu ayrıştır: "Kadıköy'de tatlıcılar" -> Yer: Kadıköy, Arama: tatlıcılar
    const locationRegex = /(?:in|at|near|de|da)\s*([^\s]+)\s*(.*)/i;
    const match = input.match(locationRegex);

    if (match) {
      const userLocation = match[1]; // Yer adı
      const query = match[2] || 'yerler'; // Arama terimi (default olarak 'yerler')
      await findPlaces(query, userLocation);
    } else {
      // Yer adı belirtilmemişse, mevcut konumu kullanarak ara
      await findPlaces(input);
    }

    setInput('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={item.role === 'user' ? styles.userMessage : styles.aiMessage}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          style={styles.input}
          placeholder="Mesajınızı yazın... (Örn: Napoli'de pizza)"
          placeholderTextColor="#ccc"
        />
        <Button title="Gönder" onPress={sendMessage} color="#1E90FF" disabled={isRequesting} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0F14' },
  messageList: { padding: 10 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#1E90FF', padding: 10, borderRadius: 10, marginVertical: 5 },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: '#1E2430', padding: 10, borderRadius: 10, marginVertical: 5 },
  messageText: { color: 'white' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#1E2430' },
  input: { flex: 1, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 10, color: 'white', marginRight: 10 },
});

export default AIChatComponent;
