"use client";

// Function to upload signature to Cloudinary using the same system as images
export async function uploadSignatureToCloudinary(signatureDataUrl: string): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, 'signature.png');
    formData.append('upload_preset', 'uznprz18'); // Use the same preset as images
    formData.append('folder', 'certificate-signatures');
    
    // Upload to Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary upload error:', errorText);
      throw new Error(`Failed to upload to Cloudinary: ${cloudinaryResponse.status}`);
    }
    
    const result = await cloudinaryResponse.json();
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading signature to Cloudinary:', error);
    throw error;
  }
}
