import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/Leaderboard.css';

const Leaderboard = ({ user }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('global');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    filterLeaderboard();
  }, [activeFilter, leaderboardData, userProfile]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('age_range')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all users with their stats and profiles
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          user_id,
          best_time,
          total_tests,
          profiles (
            username,
            profile_picture_url,
            age_range
          )
        `)
        .not('best_time', 'is', null)
        .order('best_time', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Format the data
      const formattedData = data.map((entry, index) => ({
        rank: index + 1,
        user_id: entry.user_id,
        username: entry.profiles?.username || 'Anonymous',
        profile_picture_url: entry.profiles?.profile_picture_url,
        age_range: entry.profiles?.age_range,
        best_time: entry.best_time,
        total_tests: entry.total_tests,
        isCurrentUser: entry.user_id === user.id
      }));

      setLeaderboardData(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeaderboard = () => {
    if (activeFilter === 'global') {
      setFilteredData(leaderboardData);
    } else if (activeFilter === 'age_range' && userProfile?.age_range) {
      const filtered = leaderboardData.filter(
        entry => entry.age_range === userProfile.age_range
      );
      // Re-rank after filtering
      const reranked = filtered.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
      setFilteredData(reranked);
    } else {
      setFilteredData(leaderboardData);
    }
  };

  const formatAgeRange = (range) => {
    if (!range) return 'N/A';
    return range.replace('_', '-').replace('plus', '+');
  };

  const getMedalClass = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  };

  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      <p className="leaderboard-subtitle">
        Compare your best time with other users!
      </p>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === 'global' ? 'active' : ''}`}
          onClick={() => setActiveFilter('global')}
        >
          Global
        </button>
        <button
          className={`filter-tab ${activeFilter === 'age_range' ? 'active' : ''}`}
          onClick={() => setActiveFilter('age_range')}
          disabled={!userProfile?.age_range}
        >
          My Age Group {userProfile?.age_range && `(${formatAgeRange(userProfile.age_range)})`}
        </button>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="no-data-state">
          <h3>No data available</h3>
          <p>Be the first to set a record!</p>
        </div>
      ) : (
        <div className="leaderboard-wrapper">
          <div className="leaderboard-header">
            <div className="header-rank">Rank</div>
            <div className="header-player">Player</div>
            <div className="header-age">Age Range</div>
            <div className="header-tests">Tests</div>
            <div className="header-time">Best Time</div>
          </div>

          <div className="leaderboard-body">
            {filteredData.map((entry) => (
              <div
                key={entry.user_id}
                className={`leaderboard-row ${entry.isCurrentUser ? 'current-user' : ''} ${getMedalClass(entry.rank)}`}
              >
                <div className="row-rank">
                  <span className="rank-number">{entry.rank}</span>
                </div>

                <div className="row-player">
                  <div className="player-avatar">
                    {entry.profile_picture_url ? (
                      <img src={entry.profile_picture_url} alt={entry.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="player-info">
                    <span className="player-name">
                      {entry.username}
                      {entry.isCurrentUser && <span className="you-badge">YOU</span>}
                    </span>
                  </div>
                </div>

                <div className="row-age">
                  {formatAgeRange(entry.age_range)}
                </div>

                <div className="row-tests">
                  {entry.total_tests}
                </div>

                <div className="row-time">
                  <span className="time-value">{entry.best_time}</span>
                  <span className="time-unit">ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;