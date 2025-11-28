import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './styles/App.css';
import './styles/Login.css';
import './styles/Home.css';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Login Component with Password Reset
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ageRanges = [
    { value: '', label: 'Select Age Range (Optional)' },
    { value: 'under_18', label: 'Under 18' },
    { value: '18_24', label: '18-24' },
    { value: '25_34', label: '25-34' },
    { value: '35_44', label: '35-44' },
    { value: '45_54', label: '45-54' },
    { value: '55_64', label: '55-64' },
    { value: '65_plus', label: '65+' }
  ];

  const handleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Prepare the final username
        const finalUsername = username.trim() || email.split('@')[0];

        console.log('=== SIGNUP STARTED ===');
        console.log('Email:', email);
        console.log('Username entered:', username);
        console.log('Final username:', finalUsername);
        console.log('Age range:', ageRange);

        // Sign up with metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: finalUsername,
              age_range: ageRange || null
            }
          }
        });
        
        if (authError) throw authError;

        console.log('Auth signup response:', authData);

        // Give the trigger time to run
        if (authData.user) {
          console.log('Waiting 2 seconds for trigger to complete...');
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check what's currently in the profile
          const { data: currentProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          console.log('Current profile before update:', currentProfile);
          console.log('Fetch error:', fetchError);

          // Force update the profile to make sure it's correct
          console.log('Attempting to update profile with:', {
            username: finalUsername,
            age_range: ageRange || null,
            user_id: authData.user.id
          });

          const { data: updateData, error: profileError } = await supabase
            .from('profiles')
            .update({ 
              username: finalUsername,
              age_range: ageRange || null
            })
            .eq('id', authData.user.id)
            .select();

          console.log('Update result:', { updateData, profileError });
          
          if (profileError) {
            console.error('Profile update error:', profileError);
            
            // Retry once more after another delay
            console.log('Retrying update after 1.5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const { data: retryData, error: retryError } = await supabase
              .from('profiles')
              .update({ 
                username: finalUsername,
                age_range: ageRange || null
              })
              .eq('id', authData.user.id)
              .select();
              
            console.log('Retry result:', { retryData, retryError });
            
            if (retryError) {
              console.error('Retry error:', retryError);
            }
          }

          // Final check - what's in the profile now?
          const { data: finalProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          console.log('Final profile after all updates:', finalProfile);
          console.log('=== SIGNUP COMPLETED ===');
        }
        
        setError('Check your email for confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      }
    } catch (err) {
      console.error('Error during auth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      setError('Password reset link sent! Check your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Reset Password</h1>
          <h2>Enter your email</h2>
          
          {error && (
            <div className={`message ${error.includes('sent') ? 'success' : 'error'}`}>
              {error}
            </div>
          )}
          
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordReset()}
            />
            <button onClick={handlePasswordReset} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button 
              className="secondary-btn"
              onClick={() => {
                setIsResetMode(false);
                setError('');
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Reaction Speed Tester</h1>
        <h2>{isSignUp ? 'Create Account' : 'Login'}</h2>
        
        {error && (
          <div className={`message ${error.includes('Check') || error.includes('created') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}
        
        <div>
          {isSignUp && (
            <input
              type="text"
              placeholder="Username (Optional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
          />
          {isSignUp && (
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
            >
              {ageRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          )}
          <button onClick={handleAuth} disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </div>

        {!isSignUp && (
          <div className="forgot-password">
            <button 
              className="forgot-password-link"
              onClick={() => {
                setIsResetMode(true);
                setError('');
              }}
            >
              Forgot Password?
            </button>
          </div>
        )}
        
        <p className="toggle-auth">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setUsername('');
            setAgeRange('');
          }}>
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

// Reset Password Component (for when user clicks email link)
const ResetPassword = ({ onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      setError('Password updated successfully!');
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Set New Password</h1>
        <h2>Choose a secure password</h2>
        
        {error && (
          <div className={`message ${error.includes('successfully') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}
        
        <div>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUpdatePassword()}
          />
          <button onClick={handleUpdatePassword} disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Home Component with Tabs
const Home = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Fetch user profile and stats
    const fetchUserData = async () => {
      if (user) {
        console.log('Fetching user data for:', user.id);
        
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          console.log('Profile data loaded:', profileData);
          setProfile(profileData);
        }

        // Fetch stats
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (statsError) {
          console.error('Error fetching stats:', statsError);
        } else {
          console.log('Stats data loaded:', statsData);
          setStats(statsData);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="tab-content">
            <h1>Welcome to React Speed{profile?.username ? `, ${profile.username}` : ''}!</h1>
            <p>Test your reaction time and compete with racers worldwide.</p>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Your Best Time</h3>
                <p className="stat-value">
                  {stats?.best_time ? `${stats.best_time} ms` : '--- ms'}
                </p>
              </div>
              <div className="stat-card">
                <h3>Tests Taken</h3>
                <p className="stat-value">{stats?.total_tests || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Average Time</h3>
                <p className="stat-value">
                  {stats?.average_time ? `${Math.round(stats.average_time)} ms` : '--- ms'}
                </p>
              </div>
            </div>
          </div>
        );
      case 'test':
        return (
          <div className="tab-content">
            <h2>Reaction Test</h2>
            <div className="test-area">
              <p>Click the button below to start the test</p>
              <button className="start-btn">Start Test</button>
            </div>
          </div>
        );
      case 'leaderboards':
        return (
          <div className="tab-content">
            <h2>Leaderboards</h2>
            <div className="leaderboard-table">
              <div className="leaderboard-header">
                <span>Rank</span>
                <span>Player</span>
                <span>Best Time</span>
              </div>
              <div className="leaderboard-row">
                <span>1</span>
                <span>Loading...</span>
                <span>--- ms</span>
              </div>
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="tab-content">
            <h2>Account Management</h2>
            <div className="account-info">
              <p><strong>Username:</strong> {profile?.username || 'Not set'}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Age Range:</strong> {profile?.age_range ? profile.age_range.replace('_', '-').replace('plus', '+') : 'Not set'}</p>
              <p><strong>Member Since:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
              <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <h1 className="logo">Reaction Speed Tester</h1>
        <div className="nav-tabs">
          {['home', 'test', 'leaderboards', 'account'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    // Check if user is on password reset page
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setIsResettingPassword(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      // Handle password recovery
      if (_event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handlePasswordResetComplete = () => {
    setIsResettingPassword(false);
    window.location.hash = '';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isResettingPassword) {
    return <ResetPassword onComplete={handlePasswordResetComplete} />;
  }

  return user ? (
    <Home user={user} onLogout={handleLogout} />
  ) : (
    <Login onLogin={() => {}} />
  );
}

export default App;