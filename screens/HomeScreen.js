import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getDatabase, ref, push, onValue, remove, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import AntDesign from '@expo/vector-icons/AntDesign';

const HomeScreen = ({ navigation }) => {
  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(false);
  const [newNotifications, setNewNotifications] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user?.uid) {
      const db = getDatabase();
      const postsRef = ref(db, 'posts');

      onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const postsArray = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
          setPosts(postsArray.reverse());
        }
      });
    }
  }, [user]);

  const getUserName = async (user) => {
    try {
      if (!user || !user.uid) {
        console.warn('Kullanıcı bilgisi bulunamadı.');
        return 'Anonim Kullanıcı';
      }

      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data().username || 'Anonim Kullanıcı';
      } else {
        console.warn("Firestore'da kullanıcı bulunamadı.");
        return 'Anonim Kullanıcı';
      }
    } catch (error) {
      console.error('Kullanıcı adı alınırken hata:', error);
      return 'Anonim Kullanıcı';
    }
  };

  const handleJoinRequest = async (postId, content, authorId) => {
    try {
      const db = getDatabase();
      const joinRequestsRef = ref(db, `posts/${postId}/joinRequests/${user.uid}`);
      const joinRequestSnapshot = await get(joinRequestsRef);

      if (joinRequestSnapshot.exists()) {
        Alert.alert("Zaten bu gönderiye katılım talebi gönderdiniz.");
        return;
      }

      const senderName = await getUserName(user);

      const notificationsRef = ref(db, `users/${authorId}/notifications`);

      await push(notificationsRef, {
        senderId: user?.uid,
        postId,
        content,
        timestamp: Date.now(),
        message: `${senderName} sizinle "${content}" gezisine katılmak istiyor.`,
        read: false,
      });

      await set(joinRequestsRef, {
        joined: true,
        timestamp: Date.now()
      });

      Alert.alert("Gezi talebi gönderildi.");
    } catch (error) {
      console.error("Gezi talebi gönderilirken hata:", error);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
    setIsImagePickerVisible(false);
  };

  const uploadToCloudinary = async (imageUri) => {
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/YOUR";
    const UPLOAD_PRESET = "YOUR_PRESET_NAME";

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "upload.jpg",
    });
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Resim yükleme sırasında hata: ", error);
      throw error;
    }
  };

  const handlePost = async () => {
    if (postContent.trim() || selectedImage) {
      try {
        const db = getDatabase();
        const postsRef = ref(db, 'posts');
        const authorName = await getUserName(user);

        let imageUrl = null;
        if (selectedImage) {
          imageUrl = await uploadToCloudinary(selectedImage);
        }

        const newPost = {
          content: postContent,
          image: imageUrl,
          createdAt: Date.now(),
          author: authorName,
          uid: user?.uid,
        };

        await push(postsRef, newPost);
        setPostContent('');
        setSelectedImage(null);
      } catch (error) {
        console.error('Gönderi eklenirken hata:', error);
      }
    }
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      "Gönderiyi Sil",
      "Bu gönderiyi silmek istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          onPress: () => console.log("Silme işlemi iptal edildi"),
          style: "cancel"
        },
        {
          text: "Evet",
          onPress: () => {
            const db = getDatabase();
            const postRef = ref(db, `posts/${postId}`);
            remove(postRef);
          }
        }
      ],
      { cancelable: false }
    );
  };

  const navigateToNotifications = () => {
    setNewNotifications(false);
    navigation.navigate('Bildirimler', { notifications });
  };

  const navigateToChat = () => {
    setUnreadMessages(false);
    navigation.navigate('GezenlerChatScreen');
  };

  const cancelImageSelection = () => {
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/splash-icon.png')} style={styles.logo} />
        <TouchableOpacity style={styles.iconButton} onPress={navigateToNotifications}>
          <Ionicons name="notifications-outline" size={30} color={newNotifications ? '#FF4500' : 'white'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={navigateToChat}>
          <Ionicons name="chatbubbles" size={30} color={unreadMessages ? '#FF4500' : 'white'} />
        </TouchableOpacity>
      </View>
      <View style={styles.postContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Bugün gitmek istediğim yer"
            placeholderTextColor="gray"
            value={postContent}
            onChangeText={setPostContent}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handlePost}>
            <Ionicons name="send" size={20} color="white" style={{ marginRight: 5, marginBottom: 10 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setIsImagePickerVisible(!isImagePickerVisible)}>
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        </View>
        {isImagePickerVisible && (
          <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
            <Ionicons name="image" size={30} color="white" />
            <Text style={styles.imagePickerText}>Fotoğraf Seç</Text>
          </TouchableOpacity>
        )}
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.cancelButton} onPress={cancelImageSelection}>
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postItem}>
            <Text style={styles.postAuthor}>{item.author}</Text>
            <Text style={styles.postContent}>{item.content}</Text>
            {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinRequest(item.id, item.content, item.uid)}
            >
              <Text style={styles.joinButtonText}>Hadi Gezelim 💫</Text>
            </TouchableOpacity>
            {item.uid === user?.uid && (
              <TouchableOpacity onPress={() => handleDeletePost(item.id)}>
                <AntDesign name="delete" size={24} color="white" style={{ left: 165, marginTop: "5%" }} />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0F14',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10%',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  iconButton: {
    marginLeft: 15,
  },
  postContainer: {
    marginVertical: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: 'white',
    backgroundColor: '#1e1e1e',
  },
  sendButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  imagePickerText: {
    color: 'white',
    marginLeft: 10,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#FF4500',
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  postItem: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  postAuthor: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  postContent: {
    color: 'white',
    marginBottom: 5,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 5,
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#FF4500',
    padding: 10,
    borderRadius: 5,
  },
  joinButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default HomeScreen;
