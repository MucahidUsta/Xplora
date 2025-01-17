import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { auth, realtimeDb, db } from "../firebase/config";
import { ref, push, onValue } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { socket } from "../../App";
import AntDesign from "@expo/vector-icons/AntDesign";
import { setMessages, setCurrentUserId, setRecipientId } from "../store/chatSlice";

const ChatScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const recipientId = useSelector((state) => state.chat.recipientId);
  const currentUserId = useSelector((state) => state.chat.currentUserId);
  const messages = useSelector((state) => state.chat.messages);
  const [recipientDetails, setRecipientDetails] = useState(null);
  const [inputText, setInputText] = useState("");

  // FlatList referansı
  const flatListRef = useRef(null);

  useEffect(() => {
    if (auth.currentUser?.uid) {
      const userId = auth.currentUser.uid;
      socket.emit("register", userId);
      dispatch(setCurrentUserId(userId));
    }
  }, []);

  useEffect(() => {
    const fetchRecipientDetails = async () => {
      if (!recipientId) return;

      const recipientRef = doc(db, "users", recipientId);
      const recipientSnap = await getDoc(recipientRef);

      if (recipientSnap.exists()) {
        setRecipientDetails(recipientSnap.data());
      }
    };

    fetchRecipientDetails();
  }, [recipientId]);

  useEffect(() => {
    if (!recipientId || !currentUserId) return;

    const chatId =
      currentUserId < recipientId
        ? `${currentUserId}_${recipientId}`
        : `${recipientId}_${currentUserId}`;
    const chatRef = ref(realtimeDb, `chats/${chatId}`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const chatMessages = data ? Object.values(data) : [];
      dispatch(setMessages(chatMessages));

      // Listeyi en alt mesajlara kaydır
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [recipientId, currentUserId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const chatId =
      currentUserId < recipientId
        ? `${currentUserId}_${recipientId}`
        : `${recipientId}_${currentUserId}`;
    const chatRef = ref(realtimeDb, `chats/${chatId}`);

    const newMessage = {
      text: inputText,
      senderId: currentUserId,
      recipientId: recipientId,
      timestamp: Date.now(),
    };

    await push(chatRef, newMessage);

    socket.emit("sendNotification", {
      recipient: recipientId,
      title: "Gezenlerden Bir Yeni Mesaj",
      body: inputText,
    });

    setInputText("");

    // Mesaj gönderildikten sonra listeyi en alta kaydır
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      {recipientDetails && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Image
            source={{
              uri: recipientDetails.profilePhoto || "https://via.placeholder.com/150",
            }}
            style={styles.profilePhoto}
          />
          <Text style={styles.username}>{recipientDetails.username || "Kullanıcı"}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef} // FlatList referansı
        data={messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderId === currentUserId
                ? styles.sentMessage
                : styles.receivedMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        } // Mesajlar değiştiğinde kaydır
        onLayout={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        } // İlk yüklemede kaydır
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0C0F14" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#1E2430",
    marginTop: 45,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 10,
    marginRight: 10,
  },
  username: { fontSize: 20, fontWeight: "600", color: "#fff" },
  chatList: { padding: 10 },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: "75%",
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
    borderBottomRightRadius: 0,
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#2C3240",
    borderBottomLeftRadius: 0,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Roboto",
    lineHeight: 24,
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#1E2430",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#2C3240",
    borderRadius: 20,
    paddingHorizontal: 15,
    color: "#fff",
    fontSize: 16,
    fontFamily: "Roboto",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
