export const uploadToCloudinary = async (imageUri) => {
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
    console.error("Error uploading image: ", error);
    throw error;
  }
};


