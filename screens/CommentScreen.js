import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Alert,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  where,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const CommentScreen = ({ route }) => {
  const { userId, photoId } = route.params || {};
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const currentUser = getAuth().currentUser;

  useEffect(() => {
    if (!photoId) {
      console.error("Geçersiz photoId:", photoId);
      Alert.alert("Hata", "Geçersiz fotoğraf ID'si. Lütfen geri dönün.");
      return;
    }

    const commentsRef = collection(db, "users", userId, "comments");
    const q = query(
      commentsRef,
      where("photoId", "==", photoId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(loadedComments);
    });

    return () => unsubscribe();
  }, [userId, photoId]);

  const handleAddComment = async () => {
    if (newComment.trim() === "") {
      Alert.alert("Hata", "Yorum boş olamaz.");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      let username = "Anonymous"; // Varsayılan kullanıcı adı
      if (userSnap.exists()) {
        username = userSnap.data()?.username || "Anonymous";
      }

      const commentsRef = collection(db, "users", userId, "comments");
      await addDoc(commentsRef, {
        text: newComment,
        createdAt: new Date(),
        userId: currentUser.uid,
        username, // Kullanıcı adı kaydediliyor
        photoId,
      });

      setNewComment(""); // Yorum alanını temizle
    } catch (error) {
      console.error("Yorum eklenirken hata:", error);
      Alert.alert("Hata", "Yorum eklenemedi.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const commentRef = doc(db, "users", userId, "comments", commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error("Yorum silinirken hata:", error);
      Alert.alert("Hata", "Yorum silinemedi.");
    }
  };

  const handleEditComment = async () => {
    if (editingCommentText.trim() === "") {
      Alert.alert("Hata", "Yorum boş olamaz.");
      return;
    }

    try {
      const commentRef = doc(db, "users", userId, "comments", editingCommentId);
      await updateDoc(commentRef, {
        text: editingCommentText,
      });

      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error) {
      console.error("Yorum düzenlenirken hata:", error);
      Alert.alert("Hata", "Yorum düzenlenemedi.");
    }
  };

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.usernameText}>{item.username || "Anonim"}</Text>
      {editingCommentId === item.id ? (
        <TextInput
          style={styles.input}
          value={editingCommentText}
          onChangeText={setEditingCommentText}
        />
      ) : (
        <Text style={styles.commentText}>{item.text}</Text>
      )}
      <Text style={styles.commentDate}>
        {item.createdAt?.toDate().toLocaleString() || "Tarih yok"}
      </Text>
      {item.userId === currentUser.uid && (
        <View style={styles.actionButtons}>
          {editingCommentId === item.id ? (
            <>
              <TouchableOpacity onPress={handleEditComment}>
                <Icon name="checkmark-circle" size={24} color="green" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditingCommentId(null);
                  setEditingCommentText("");
                }}
              >
                <Icon name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => {
                  setEditingCommentId(item.id);
                  setEditingCommentText(item.text);
                }}
              >
                <Icon name="create-outline" size={24} color="blue" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteComment(item.id)}
              >
                <Icon name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id}
        style={styles.commentList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Yorumunuzu yazın..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity onPress={handleAddComment}>
          <Icon name="send-outline" size={24} color="blue" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  commentList: {
    flex: 1,
    marginBottom: 16,
  },
  commentContainer: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 6,
    lineHeight: 22,
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});

export default CommentScreen;