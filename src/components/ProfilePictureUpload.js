import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ProfilePictureUpload = ({ userId, currentPictureUrl, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPictureUrl);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('File size must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onUploadSuccess(publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('id', userId);

      if (error) throw error;

      setPreviewUrl(null);
      onUploadSuccess(null);
    } catch (error) {
      console.error('Error removing picture:', error);
      alert('Error removing picture: ' + error.message);
    }
  };

  return (
    <div className="profile-picture-section">
      <div className="profile-picture-container">
        <div className="profile-picture-wrapper">
          {previewUrl ? (
            <img src={previewUrl} alt="Profile" className="profile-picture" />
          ) : (
            <div className="profile-picture-placeholder">
              <span>No Picture</span>
            </div>
          )}
        </div>

        <label className="upload-area" htmlFor="profile-upload">
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <div className="upload-text">
            {uploading ? 'Uploading...' : 'Click or drag to upload new profile picture'}
          </div>
        </label>

        {previewUrl && (
          <button className="remove-picture-btn" onClick={handleRemove}>
            Remove Profile Picture
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureUpload;