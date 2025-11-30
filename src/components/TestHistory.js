import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/TestHistory.css';

const TestHistory = ({ user }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTestHistory();
  }, [user]);

  const fetchTestHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching test history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    setDeleting(true);
    try {
      // Delete the test
      const { error: deleteError } = await supabase
        .from('test_results')
        .delete()
        .eq('id', testId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Recalculate stats manually since we deleted a test
      const { data: remainingTests, error: fetchError } = await supabase
        .from('test_results')
        .select('reaction_time')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      if (remainingTests.length > 0) {
        const times = remainingTests.map(t => t.reaction_time);
        const best = Math.min(...times);
        const worst = Math.max(...times);
        const average = times.reduce((a, b) => a + b, 0) / times.length;

        // Update user_stats
        const { error: statsError } = await supabase
          .from('user_stats')
          .update({
            best_time: best,
            worst_time: worst,
            average_time: average,
            total_tests: remainingTests.length,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (statsError) throw statsError;
      } else {
        // No tests remaining, reset stats
        const { error: statsError } = await supabase
          .from('user_stats')
          .update({
            best_time: null,
            worst_time: null,
            average_time: null,
            total_tests: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (statsError) throw statsError;
      }

      // Refresh the list
      await fetchTestHistory();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPerformanceClass = (time, allTimes) => {
    const best = Math.min(...allTimes);
    const worst = Math.max(...allTimes);
    const range = worst - best;
    
    if (time === best) return 'best';
    if (time === worst) return 'worst';
    if (time < best + range * 0.33) return 'good';
    if (time > worst - range * 0.33) return 'poor';
    return 'average';
  };

  if (loading) {
    return (
      <div className="test-history">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading test history...</p>
        </div>
      </div>
    );
  }

  const allTimes = tests.map(t => t.reaction_time);

  return (
    <div className="test-history">
      <h2>Test History</h2>
      <p className="history-subtitle">
        View and manage all your reaction time tests
      </p>

      {tests.length === 0 ? (
        <div className="no-tests">
          <h3>No Tests Yet</h3>
          <p>Take your first test to see your history here!</p>
        </div>
      ) : (
        <>
          <div className="history-stats">
            <div className="stat-box">
              <span className="stat-label">Total Tests</span>
              <span className="stat-value">{tests.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Best Time</span>
              <span className="stat-value">{Math.min(...allTimes)} ms</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Worst Time</span>
              <span className="stat-value">{Math.max(...allTimes)} ms</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Average</span>
              <span className="stat-value">
                {Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)} ms
              </span>
            </div>
          </div>

          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date & Time</th>
                  <th>Reaction Time</th>
                  <th>Performance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test, index) => (
                  <tr key={test.id} className={getPerformanceClass(test.reaction_time, allTimes)}>
                    <td>{tests.length - index}</td>
                    <td>{formatDate(test.taken_at)}</td>
                    <td className="time-cell">
                      <span className="time-value">{test.reaction_time}</span>
                      <span className="time-unit">ms</span>
                    </td>
                    <td>
                      {test.reaction_time === Math.min(...allTimes) && (
                        <span className="badge best-badge">BEST</span>
                      )}
                      {test.reaction_time === Math.max(...allTimes) && tests.length > 1 && (
                        <span className="badge worst-badge">WORST</span>
                      )}
                      {test.reaction_time !== Math.min(...allTimes) && 
                       test.reaction_time !== Math.max(...allTimes) && (
                        <span className="badge normal-badge">-</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => setDeleteConfirm(test.id)}
                        disabled={deleting}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Test?</h3>
            <p>Are you sure you want to delete this test result? This action cannot be undone and will recalculate your statistics.</p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={() => handleDeleteTest(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestHistory;