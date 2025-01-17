import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
} from "react-native";
import { auth, db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AntDesign from "@expo/vector-icons/AntDesign";

const ProfileScreen = () => {
  const [photos, setPhotos] = useState([]);
  const [userData, setUserData] = useState({ username: "...", profilePhoto: "" });
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userPhotos = userSnap.data().photos || [];

        // Fotoğrafları timestamp'e göre sıralıyoruz
        const sortedPhotos = userPhotos
          .map((photo) => ({
            ...photo,
            id: photo.id || `${photo.url}-${Math.random()}`, // Benzersiz bir ID ekliyoruz
            timestamp: photo.timestamp || 0, // Eksik timestamp varsa sıfır olarak işlenir
          }))
          .sort((a, b) => b.timestamp - a.timestamp); // Son yüklenen en üstte olacak şekilde sıralama

        setPhotos(sortedPhotos);
        setUserData(userSnap.data());
      }
    };

    fetchProfileData();
  }, []);

  const deletePhoto = async (photo) => {
    Alert.alert(
      "Silme Onayı",
      "Bu fotoğrafı silmek istediğinizden emin misiniz?",
      [
        {
          text: "Hayır",
          onPress: () => console.log("Fotoğraf silme işlemi iptal edildi"),
          style: "cancel",
        },
        {
          text: "Evet",
          onPress: async () => {
            try {
              const userId = auth.currentUser.uid;
              const userRef = doc(db, "users", userId);

              const updatedPhotos = photos.filter((item) => item.url !== photo.url);
              await updateDoc(userRef, { photos: updatedPhotos });

              setPhotos(updatedPhotos);
              Alert.alert("Başarılı", "Fotoğraf silindi.");
            } catch (error) {
              console.error("Fotoğraf silinirken hata oluştu:", error);
              Alert.alert("Hata", "Fotoğraf silinemedi. Tekrar deneyin.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const openInGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Hata", "Google Maps açılamadı.");
    });
  };

  const renderPhotoItem = ({ item }) => (
    <View style={styles.photoContainer}>
      <Image source={{ uri: item.url }} style={styles.photo} />
      <Text style={styles.photoDescription}>
        {item.description || "Açıklama yok"}
      </Text>
      {item.location ? (
        <Text style={styles.photoLocation}>
          Konuma Git: {item.location.latitude.toFixed(2)}, {item.location.longitude.toFixed(2)}
        </Text>
      ) : (
        <Text style={styles.photoLocation}>Konum bilgisi yok</Text>
      )}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => deletePhoto(item)}>
          <AntDesign name="delete" size={24} color="white" />
        </TouchableOpacity>
        {item.location && (
          <TouchableOpacity
            style={styles.mapIcon}
            onPress={() =>
              openInGoogleMaps(item.location.latitude, item.location.longitude)
            }
          >
            <MaterialCommunityIcons name="location-enter" size={24} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.navigate("UpdatePhotoScreen", { photo: item })}>
          <FontAwesome name="pencil-square-o" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate("Yorumlar", { userId: auth.currentUser.uid, photoId: item.id })}>
        <View style={{ marginTop: 15 }}>
          <FontAwesome6 name="comment-alt" size={20} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{
            uri: userData?.profilePhoto || "https://via.placeholder.com/150",
          }}
          style={styles.profilePhoto}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>
            {typeof userData?.username === "string" ? userData.username : "..."}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("editProfile")}>
            <View style={{ marginLeft: "25%", top: "-104%" }}>
              <FontAwesome name="pencil-square-o" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.navigationTabs}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Text style={styles.tab}>Profilim </Text>
        </TouchableOpacity>
        <View style={{ bottom: 3 }}>
          <Text style={{ color: "#fff", fontSize: 20 }}>|</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Explore")}>
          <Text style={styles.tab}>Keşfet</Text>
        </TouchableOpacity>
        <View style={{ bottom: 3 }}>
          <Text style={{ color: "#fff", fontSize: 20 }}>|</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Following", { userId: auth.currentUser.uid })}>
          <Text style={styles.tab}>Gezenler</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.photoList}
      />
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: "10%",
    backgroundColor: "#0C0F14"
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white"
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  navigationTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#1e1e1e",
  },
  tab: {
    fontSize: 16,
    color: "#fff",
  },
  photoList: {
    padding: 10,
  },
  photoContainer: {
    marginBottom: 20,
    backgroundColor: "#1e1e1e",
    padding: 10,
    borderRadius: 10,
  },
  photo: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
  },
  photoDescription: {
    fontSize: 14,
    color: "#f5f5f5",
    marginBottom: 5,
  },
  photoLocation: {
    fontSize: 12,
    color: "#f5f5f5",
    bottom:20,
    marginLeft:"52%"
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: "#DC3545",
    padding: 5,
    borderRadius: 5,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
  },
  mapIcon: {
    bottom: 50,
    left: "47%",
  },
  commentContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  commentText: {
    color: "#fff",
  },
  noCommentsText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
  },
});

export default ProfileScreen;