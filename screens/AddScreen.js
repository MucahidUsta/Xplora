import 'react-native-get-random-values'; // Polyfill for crypto.getRandomValues
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { auth, db } from "../firebase/config";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

const API_KEY = 'YOUR_CLOUD_API_KEY';
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/YOUR";
const UPLOAD_PRESET = "YOUR_PRESET_NAME";

const AddScreen = () => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [description, setDescription] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigation = useNavigation();
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        setLoading(false);
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    };

    fetchLocation();
  }, []);

  const searchPlaces = async (query) => {
    try {
      const response = await fetch(
        `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${query}&apiKey=${API_KEY}`
      );
      const data = await response.json();
      console.log(data); // API'den dönen yanıtı incelemek için konsola yazdırıyoruz
      return data.items;
    } catch (error) {
      console.error("Here API Search Error:", error);
      return [];
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const results = await searchPlaces(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://lookup.search.hereapi.com/v1/lookup?id=${placeId}&apiKey=${API_KEY}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Here API Lookup Error:", error);
      return null;
    }
  };

  const handlePlaceSelection = async (place) => {
    console.log(place); // Seçilen yeri konsola yazdırıyoruz

    // place.id kullanarak ayrıntılı konum bilgilerini alıyoruz
    const placeDetails = await getPlaceDetails(place.id);

    if (placeDetails && placeDetails.position) {
      const location = {
        latitude: placeDetails.position.lat,
        longitude: placeDetails.position.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMarkerLocation(location);
      setLocation(location);
      setSearchResults([]);
      setSearchQuery("");

      // Haritayı seçilen konuma yönlendiriyoruz
      mapRef.current.animateToRegion(location, 1000);
    } else {
      Alert.alert("Error", "Selected place does not have a valid location.");
    }
  };

  const handleMapPress = (e) => {
    const coordinate = e.nativeEvent.coordinate;
    setMarkerLocation(coordinate);

    // Haritayı tıklanan konuma yönlendiriyoruz
    mapRef.current.animateToRegion({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const handleImagePick = async () => {
    Alert.alert(
      "Choose an Option",
      "Would you like to use the Camera or pick from the Gallery?",
      [
        { text: "Camera", onPress: pickFromCamera },
        { text: "Gallery", onPress: pickFromGallery },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      type: "image/jpeg",
      name: "upload.jpg",
    });
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error("Failed to upload image");
    }
  };

  const handleUpload = async () => {
    if (!image || !markerLocation) {
      Alert.alert("Error", "No image or location selected");
      return;
    }
  
    setUploading(true);
  
    try {
      const downloadURL = await uploadToCloudinary(image);
      const userId = auth.currentUser.uid;
      const userRef = doc(db, "users", userId);
  
      const newPhoto = {
        url: downloadURL,
        location: markerLocation,
        description: description,
        timestamp: Date.now(), // Zaman damgası ekleniyor
      };
  
      await updateDoc(userRef, {
        photos: arrayUnion(newPhoto),
      });
  
      Alert.alert("Success", "Photo uploaded successfully.");
      navigation.navigate("Profile");
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      setModalVisible(false);
    }
  };
  

  const handleGoToMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location access is required.");
      return;
    }
    const currentLocation = await Location.getCurrentPositionAsync({});
    const location = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current.animateToRegion(location, 1000);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : location ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={location}
          showsUserLocation={true}
          onPress={handleMapPress}
        >
          {markerLocation && (
            <Marker
              coordinate={markerLocation}
              title="Selected Location"
              description="This is the selected location."
            />
          )}
        </MapView>
      ) : (
        <Text>Location not found</Text>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Search places..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handlePlaceSelection(item)}
              >
                <Text>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={{ color: "#888" }}>No image selected</Text>
        )}
        <TouchableOpacity onPress={handleImagePick}>
          <Ionicons name="image" size={50} color="white" style={{ marginBottom: 55 }} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.uploadButtonText}>Profile Yükle 💫</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            placeholder="Write a description..."
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleUpload}>
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Yükle</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.locationButton}
        onPress={handleGoToMyLocation}
      >
        <Ionicons name="locate" size={25} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0F14',
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    top: 20,
    left: 10,
    right: 10,
    zIndex: 1,
    marginTop: "10%",
  },
  textInput: {
    backgroundColor: "#dad7cd",
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
  },
  searchResultItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  imageContainer: {
    alignItems: "center",
    margin: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    margin: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 20,
    width: "80%",
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: "#28A745",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#DC3545",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  locationButton: {
    position: "absolute",
    bottom: "30%",
    right: 20,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
});

export default AddScreen;