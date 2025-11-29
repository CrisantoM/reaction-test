import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles/App.css';
import './styles/Login.css';
import './styles/Home.css';
import AccountSettings from './components/AccountSettings';
import ReactionTest from './components/ReactionTest';

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
        <h1>Reaction Speed Test</h1>
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

// Performance Graph Component
const PerformanceGraph = ({ tests }) => {
  // Prepare data for chart (reverse to show oldest to newest)
  const chartData = tests
    .slice()
    .reverse()
    .map((test, index) => ({
      test: index + 1,
      time: test.reaction_time,
      date: new Date(test.taken_at).toLocaleDateString()
    }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="test" 
            stroke="#999"
            label={{ value: 'Test Number', position: 'insideBottom', offset: -5, fill: '#999' }}
          />
          <YAxis 
            stroke="#999"
            label={{ value: 'Reaction Time', angle: -90, position: 'insideLeft', fill: '#999' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1a1a', 
              border: '2px solid #e10600',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => [`${value} ms`, 'Reaction Time']}
            labelFormatter={(label) => `Test #${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="time" 
            stroke="#e10600" 
            strokeWidth={3}
            dot={{ fill: '#e10600', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Home Component with Tabs
const Home = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [ageRangeStats, setAgeRangeStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (user) {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch stats
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (statsError) throw statsError;
        setStats(statsData);

        // Fetch recent test results (last 10)
        const { data: testsData, error: testsError } = await supabase
          .from('test_results')
          .select('*')
          .eq('user_id', user.id)
          .order('taken_at', { ascending: false })
          .limit(10);
        
        if (testsError) throw testsError;
        setRecentTests(testsData || []);

        // Calculate age range percentile
        if (profileData.age_range) {
          await calculateAgeRangePercentile(profileData.age_range, statsData?.best_time);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const calculateAgeRangePercentile = async (ageRange, userBestTime) => {
    if (!userBestTime) {
      setAgeRangeStats(null);
      return;
    }

    try {
      // Get all users in the same age range with their best times
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_stats(best_time)')
        .eq('age_range', ageRange)
        .not('user_stats.best_time', 'is', null);

      if (error) throw error;

      // Extract best times and filter out nulls
      const bestTimes = data
        .map(u => u.user_stats?.[0]?.best_time)
        .filter(time => time !== null && time !== undefined);

      if (bestTimes.length === 0) {
        setAgeRangeStats(null);
        return;
      }

      // Calculate percentile (how many users you're faster than)
      const fasterThan = bestTimes.filter(time => time > userBestTime).length;
      const percentile = Math.round((fasterThan / bestTimes.length) * 100);

      // Calculate average for age range
      const avgTime = Math.round(bestTimes.reduce((a, b) => a + b, 0) / bestTimes.length);

      setAgeRangeStats({
        percentile,
        totalUsers: bestTimes.length,
        averageTime: avgTime,
        ageRange
      });
    } catch (error) {
      console.error('Error calculating percentile:', error);
      setAgeRangeStats(null);
    }
  };

  const formatAgeRange = (range) => {
    if (!range) return 'Not set';
    return range.replace('_', '-').replace('plus', '+');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="tab-content">
            <h1>Welcome{profile?.username ? `, ${profile.username}` : ''}!</h1>
            <p style={{ color: '#cccccc', fontSize: '1.1rem', marginBottom: '30px' }}>
              See your recent performance here. Head to the Test tab to improve your reaction time!
            </p>

            {loading ? (
              <div className="loading">Loading your stats...</div>
            ) : (
              <>
                {/* Stats Grid */}
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

                {/* Age Range Percentile */}
                {ageRangeStats && (
                  <div className="percentile-section">
                    <h2>Your Age Group Performance</h2>
                    <div className="percentile-card">
                      <div className="percentile-main">
                        <div className="percentile-number">{ageRangeStats.percentile}th</div>
                        <div className="percentile-label">Percentile</div>
                      </div>
                      <div className="percentile-details">
                        <p>
                          <strong>Age Range:</strong> {formatAgeRange(ageRangeStats.ageRange)}
                        </p>
                        <p>
                          You're faster than <strong>{ageRangeStats.percentile}%</strong> of users in your age group!
                        </p>
                        <p>
                          <strong>Age Group Average:</strong> {ageRangeStats.averageTime} ms
                        </p>
                        <p>
                          <strong>Your Best:</strong> {stats?.best_time} ms ({stats?.best_time < ageRangeStats.averageTime ? 'Above' : 'Below'} average by {Math.abs(stats?.best_time - ageRangeStats.averageTime)} ms)
                        </p>
                        <p className="sample-size">
                          Based on {ageRangeStats.totalUsers} users in your age range
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Graph */}
                {recentTests.length > 0 && (
                  <div className="graph-section">
                    <h2>Recent Performance</h2>
                    <div className="graph-container">
                      <PerformanceGraph tests={recentTests} />
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                {stats && stats.total_tests > 0 && (
                  <div className="quick-stats">
                    <h2>Useful Information</h2>
                    <div className="info-grid">
                      <div className="info-card">
                        <div className="info-icon">📊</div>
                        <div className="info-content">
                          <h3>Consistency</h3>
                          <p>
                            Your reaction times vary by{' '}
                            <strong>{stats.worst_time - stats.best_time} ms</strong> between best and worst.
                          </p>
                        </div>
                      </div>
                      <div className="info-card">
                        <div className="info-icon">🎯</div>
                        <div className="info-content">
                          <h3>Performance</h3>
                          <p>
                            {stats.best_time < 250 
                              ? 'Elite reflexes! You could compete professionally.'
                              : stats.best_time < 300
                              ? 'Excellent reflexes! Well above average.'
                              : stats.best_time < 400
                              ? 'Good reflexes! Keep practicing to improve.'
                              : 'Average reflexes. More practice will help!'}
                          </p>
                        </div>
                      </div>
                      <div className="info-card">
                        <div className="info-icon">⚡</div>
                        <div className="info-content">
                          <h3>Improvement</h3>
                          <p>
                            {stats.average_time > stats.best_time + 50
                              ? 'Focus on consistency - you can match your best more often!'
                              : 'Great consistency! Your average is close to your best.'}
                          </p>
                        </div>
                      </div>
                      <div className="info-card">
                        <div className="info-icon">🏆</div>
                        <div className="info-content">
                          <h3>Goal</h3>
                          <p>
                            {stats.best_time >= 300
                              ? 'Try to break 300ms for excellent reflexes!'
                              : stats.best_time >= 250
                              ? 'Try to break 250ms to reach elite status!'
                              : 'You\'re in elite territory - aim for sub-200ms!'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No data message */}
                {stats?.total_tests === 0 && (
                  <div className="no-data-message">
                    <h2>No test data yet!</h2>
                    <p>Head over to the Test tab to record your first reaction time.</p>
                  </div>
                )}
              </>
            )}
          </div>
        );
      case 'test':
        return <ReactionTest user={user} />;
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
        return <AccountSettings user={user} onLogout={onLogout} />;
      default:
        return (
          <div className="tab-content">
            <h1>Page Not Found</h1>
            <p>This tab doesn't exist.</p>
          </div>
        );
    }
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <h1 className="logo">Reaction Speed Test</h1>
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
          <button
            className="logout-nav-btn"
            onClick={onLogout}
          >
            Logout
          </button>
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