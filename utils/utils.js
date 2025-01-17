export const deleteFromCloudinary = async (publicId) => {
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/dj1rlc1cm/image/destroy`;

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("invalidate", true);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": "Bearer your_cloudinary_api_key",
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting photo from Cloudinary:", error);
    throw error;
  }
};
