import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { realtimeDb, db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const MessagesTab = ({ navigation }) => {
  const [messageSenders, setMessageSenders] = useState([]);
  const currentUser = getAuth().currentUser;

  useEffect(() => {
    const messagesRef = ref(realtimeDb, `chats/`);

    const unsubscribe = onValue(messagesRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const uniqueSenders = new Set();

      Object.values(data).forEach((chat) => {
        Object.values(chat).forEach((message) => {
          if (message.senderId !== currentUser.uid) {
            uniqueSenders.add(message.senderId);
          }
        });
      });

      const senderData = await Promise.all(
        Array.from(uniqueSenders).map(async (senderId) => {
          const userDoc = await getDoc(doc(db, 'users', senderId));
          return { id: senderId, username: userDoc.data()?.username || 'Unknown' };
        })
      );

      setMessageSenders(senderData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const navigateToChat = (senderId) => {
    navigation.navigate('Chat', { recipientId: senderId });
  };

  const renderSender = ({ item }) => (
    <TouchableOpacity onPress={() => navigateToChat(item.id)} style={styles.senderContainer}>
      <Text style={styles.senderText}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messageSenders}
        renderItem={renderSender}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  senderContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  senderText: {
    fontWeight: 'bold',
  },
});

export default MessagesTab;
