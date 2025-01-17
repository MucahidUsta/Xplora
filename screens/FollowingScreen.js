import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const FollowingScreen = () => {
  const [following, setFollowing] = useState([]);
  const [userDetails, setUserDetails] = useState({}); // UID -> username eşleşmeleri için
  const navigation = useNavigation();

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const userId = auth.currentUser.uid;
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userFollowing = userSnap.data().following || [];
          setFollowing(userFollowing);

          // Kullanıcı adlarını çek
          const userDetailsMap = {};
          for (const uid of userFollowing) {
            const followedUserRef = doc(db, "users", uid);
            const followedUserSnap = await getDoc(followedUserRef);

            if (followedUserSnap.exists()) {
              userDetailsMap[uid] = followedUserSnap.data().username || "Bilinmeyen";
            }
          }

          setUserDetails(userDetailsMap);
        }
      } catch (error) {
        console.error("Takip edilenler yüklenirken hata:", error);
      }
    };

    fetchFollowing();
  }, []);

  const removeFollowing = async (uid) => {
    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, "users", userId);
      const updatedFollowing = following.filter((userUid) => userUid !== uid);

      await updateDoc(userRef, { following: updatedFollowing });
      setFollowing(updatedFollowing);

      // Kullanıcı adlarını da güncelle
      const updatedUserDetails = { ...userDetails };
      delete updatedUserDetails[uid];
      setUserDetails(updatedUserDetails);

      Alert.alert("Başarılı", `${userDetails[uid]} takipten çıkarıldı.`);
    } catch (error) {
      console.error("Takipten çıkarken hata oluştu:", error);
      Alert.alert("Hata", "Takipten çıkılamadı. Tekrar deneyin.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
     <TouchableOpacity
  onPress={() => navigation.navigate("GezenlerScreen", { userId: item })}
>
  <Text style={styles.username}>{userDetails[item] || "..."}</Text>
</TouchableOpacity>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFollowing(item)}
      >
        <Text style={styles.removeButtonText}>Birlikte Gezmeyi Bırak</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Beraber Gezdiklerim</Text>
      <FlatList
        data={following}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Hiçbir kullanıcıyı takip etmiyorsunuz.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10,  backgroundColor: '#0C0F14' },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10, textAlign: "center",color:"#fff" },
  list: { paddingVertical: 10 },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: '#1E2430',
    borderRadius: 5,
    marginBottom: 10,
    
  },
  username: { fontSize: 16, fontWeight: "bold", color:"#fff" },
  removeButton: { backgroundColor: "#DC3545", padding: 5, borderRadius: 5 },
  removeButtonText: { color: "#fff", fontSize: 14 },
  emptyText: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 20 },
});

export default FollowingScreen;
