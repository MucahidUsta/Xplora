import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { setRecipientId } from "../store/chatSlice";
import AntDesign from "@expo/vector-icons/AntDesign";

const GezenlerChatScreen = () => {
  const [following, setFollowing] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const navigation = useNavigation();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert("Hata", "Kullanıcı oturumu açık değil.");
          return;
        }

        const userId = currentUser.uid;
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userFollowing = userSnap.data().following || [];
          setFollowing(userFollowing);

          const userDetailsMap = {};
          for (const uid of userFollowing) {
            const followedUserRef = doc(db, "users", uid);
            const followedUserSnap = await getDoc(followedUserRef);

            if (followedUserSnap.exists()) {
              userDetailsMap[uid] = followedUserSnap.data();
            }
          }

          setUserDetails(userDetailsMap);
        }
      } catch (error) {
        console.error("Takip edilenler yüklenirken hata:", error);
        Alert.alert("Hata", "Takip edilenler yüklenemedi.");
      }
    };

    fetchFollowing();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        dispatch(setRecipientId(item)); // Redux'a recipientId'yi ata
        navigation.navigate("Chat", { recipientId: item });
      }}
    >
      <Image
        source={{
          uri: userDetails[item]?.profilePhoto || "https://via.placeholder.com/150",
        }}
        style={styles.profilePhoto}
      />
      <Text style={styles.username}>{userDetails[item]?.username || "..."}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Geri Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>

      {/* Başlık */}
      <Text style={styles.header}>Gezenler</Text>

      {/* Yapay Zeka Chat Butonu */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => navigation.navigate("AIChat")}
      >
        <Text style={styles.aiButtonText}>Xplora AI </Text>
      </TouchableOpacity>

      {/* Liste */}
      <FlatList
        data={following}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Hiçbir kullanıcı takip edilmiyor.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#121212",
    marginTop:"10%"
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
    marginVertical: 20,
  },
  aiButton: {
    backgroundColor: "#1E90FF",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  aiButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  list: {
    paddingVertical: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#1E2430",
    borderRadius: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#1E90FF",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
});

export default GezenlerChatScreen;
