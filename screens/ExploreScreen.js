import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth, db } from "../firebase/config";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import AntDesign from '@expo/vector-icons/AntDesign';

const ExploreScreen = ({navigation}) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Kullanıcıları Firebase'den çek
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userId = auth.currentUser.uid;
        setCurrentUser(userId);

        // Firebase'den tüm kullanıcıları çek
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Şu anki kullanıcının verilerini çek
        const currentUserDoc = querySnapshot.docs.find((doc) => doc.id === userId);
        const following = currentUserDoc?.data().following || [];

        // Takip edilen kullanıcıları hariç tut
        const filteredUsers = userList.filter(
          (user) => user.id !== userId && !following.includes(user.id)
        );

        setUsers(filteredUsers);
      } catch (error) {
        console.error("Kullanıcılar alınamadı:", error);
      }
    };

    fetchUsers();
  }, []);

  // Kullanıcıyı takip et ve listeden çıkar
  const followUser = async (userId) => {
    try {
      const currentUserRef = doc(db, "users", currentUser);

      // Firebase'de takip edilenlere ekle
      await updateDoc(currentUserRef, {
        following: arrayUnion(userId),
      });

      // Takip edilen kullanıcıyı listeden çıkar
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

      Alert.alert("Başarılı", "Kullanıcı takip edildi.");
    } catch (error) {
      console.error("Takip işlemi sırasında hata:", error);
      Alert.alert("Hata", "Kullanıcı takip edilemedi. Tekrar deneyin.");
    }
  };

  // Her bir kullanıcıyı render eden fonksiyon
  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <Text style={styles.username}>{item.username}</Text>
      <TouchableOpacity
        style={styles.followButton}
        onPress={() => followUser(item.id)}
      >
        <Text style={styles.followButtonText}>Birlikte Gez</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
        <View><TouchableOpacity onPress={() => navigation.goBack()}>
      <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity></View>
      <Text style={styles.header}>Gezenleri Keşfet</Text>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.userList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0F14',
    padding: 10,
    marginTop:"10%"
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color:"#fff"
  },
  userList: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: '#1E2430',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  username: {
    fontSize: 16,
    color: "#fff",
  },
  followButton: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 5,
  },
  followButtonText: {
    color: "#fff",
    fontSize: 14,
  },
});

export default ExploreScreen;
