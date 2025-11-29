import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProfilePictureUpload from './ProfilePictureUpload';
import '../styles/AccountSettings.css';

const AccountSettings = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Username state
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);

  // Email state
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setNewUsername(data.username || '');
      setNewEmail(user.email || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id, user.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const validateUsername = (username) => {
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleUpdateUsername = async () => {
    setUsernameError('');
    setSuccessMessage('');

    const error = validateUsername(newUsername);
    if (error) {
      setUsernameError(error);
      return;
    }

    setUpdatingUsername(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccessMessage('Username updated successfully!');
      setProfile({ ...profile, username: newUsername });
    } catch (error) {
      setUsernameError(error.message);
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailError('');
    setSuccessMessage('');

    const error = validateEmail(newEmail);
    if (error) {
      setEmailError(error);
      return;
    }

    setUpdatingEmail(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (updateError) throw updateError;

      setSuccessMessage('Email update initiated! Check your new email for confirmation.');
    } catch (error) {
      setEmailError(error.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    const error = validatePassword(newPassword);
    if (error) {
      setPasswordError(error);
      return;
    }

    setUpdatingPassword(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccessMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);

    try {
        // Call the database function to delete the user
        const { error } = await supabase.rpc('delete_user_account');

        if (error) throw error;

        // Sign out and redirect
        await supabase.auth.signOut();
        
        alert('Your account has been deleted successfully.');
        window.location.href = '/';
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Error deleting account: ' + error.message);
        setDeletingAccount(false);
        setShowDeleteConfirm(false);
    }
    };

  if (loading) {
    return <div className="loading">Loading account settings...</div>;
  }

  return (
    <div className="account-settings">
      <h1>Account Settings</h1>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <ProfilePictureUpload
        userId={user.id}
        currentPictureUrl={profile?.profile_picture_url}
        onUploadSuccess={(url) => setProfile({ ...profile, profile_picture_url: url })}
      />

      <div className="settings-grid">
        {/* Username Section */}
        <div className="settings-section">
          <h2>Username</h2>
          <div className="current-value">Current: {profile?.username}</div>
          <input
            type="text"
            placeholder="New username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="settings-input"
          />
          {usernameError && <div className="error-message">{usernameError}</div>}
          <button
            className="update-btn"
            onClick={handleUpdateUsername}
            disabled={updatingUsername || newUsername === profile?.username}
          >
            {updatingUsername ? 'Updating...' : 'Update Username'}
          </button>
        </div>

        {/* Password Section */}
        <div className="settings-section">
          <h2>Password</h2>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="settings-input"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="settings-input"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="settings-input"
          />
          {passwordError && <div className="error-message">{passwordError}</div>}
          <button
            className="update-btn"
            onClick={handleUpdatePassword}
            disabled={updatingPassword || !newPassword}
          >
            {updatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Email Section */}
        <div className="settings-section">
          <h2>Email</h2>
          <div className="current-value">Current: {user?.email}</div>
          <input
            type="email"
            placeholder="New email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="settings-input"
          />
          {emailError && <div className="error-message">{emailError}</div>}
          <button
            className="update-btn"
            onClick={handleUpdateEmail}
            disabled={updatingEmail || newEmail === user?.email}
          >
            {updatingEmail ? 'Updating...' : 'Update Email'}
          </button>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="danger-zone">
        <h2>⚠️ Danger Zone</h2>
        
        <div className="danger-actions">
          <div className="danger-item">
            <div className="danger-item-info">
              <h3>Logout</h3>
              <p>End your current session and return to the login page.</p>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>

          <div className="danger-item danger-delete">
            <div className="danger-item-info">
              <h3>Delete Account</h3>
              <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <button 
              className="delete-account-btn" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Delete Account?</h2>
            <p>This will permanently delete:</p>
            <ul>
              <li>Your profile and account information</li>
              <li>All your reaction test results</li>
              <li>Your statistics and rankings</li>
              <li>Your profile picture</li>
            </ul>
            <p className="warning-text">This action cannot be undone!</p>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn" 
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;